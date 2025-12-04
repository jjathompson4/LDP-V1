from fastapi import APIRouter, UploadFile, File, HTTPException, Body
from pydantic import BaseModel
from typing import List, Optional, Dict
import numpy as np
from scipy.interpolate import RegularGridInterpolator
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.tri as tri
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
import tempfile
import os
import re

router = APIRouter(prefix="/isoline", tags=["isoline"])

# --- Data Models ---

class IsolineLevel(BaseModel):
    value: float
    color: str

class ComputeRequest(BaseModel):
    units: str = "ft"
    mountingHeight: float
    calcPlaneHeight: float = 0.0
    radiusFactor: float = 10.0
    detailLevel: str = "medium"
    llf: float = 1.0
    isoLevels: List[IsolineLevel]
    illuminanceUnits: str = "fc"

class IsolinePath(BaseModel):
    path: List[List[float]] # [[x1, y1], [x2, y2], ...]

class IsolineLabel(BaseModel):
    x: float
    y: float
    text: str

class IsolineLevelResult(BaseModel):
    value: float
    color: str
    paths: List[List[List[float]]] # List of paths, each path is list of points
    labels: List[IsolineLabel]

class ComputeResponse(BaseModel):
    units: str
    illuminanceUnits: str
    mountingHeight: float
    calcPlaneHeight: float
    radius: float
    extents: Dict[str, float]
    scaleBar: Dict[str, object]
    levels: List[IsolineLevelResult]

class ExportOptions(BaseModel):
    format: str = "pdf"
    includeScaleBar: bool = True
    includeLabels: bool = True
    includeDisclaimer: bool = True
    includeGrid: bool = False
    scaleBarLength: float = 50.0
    gridSpacing: Optional[float] = None

class ExportPdfRequest(BaseModel):
    isolineData: ComputeResponse
    options: ExportOptions

class ExportPngRequest(BaseModel):
    isolineData: ComputeResponse
    options: ExportOptions
    widthPx: int = 2000

# --- Helper Functions ---

def parse_ies(content: str):
    """
    Basic IES parser for Type C photometry.
    Returns a dictionary with candela matrix and angles.
    """
    lines = content.strip().splitlines()
    # Skip header lines until TILT=...
    
    # This is a very simplified parser. Real IES files are messy.
    # We will look for TILT=...
    
    tilt_line_idx = -1
    for i, line in enumerate(lines):
        if line.strip().upper().startswith("TILT="):
            tilt_line_idx = i
            break
            
    if tilt_line_idx == -1:
        raise ValueError("Invalid IES file: TILT line not found.")
        
    tilt_val = lines[tilt_line_idx].split("=")[1].strip()
    if tilt_val.upper() != "NONE":
        raise ValueError(f"Unsupported TILT={tilt_val}. Only TILT=NONE is supported.")
        
    # After TILT=NONE, next lines are usually:
    # <# lamps> <lumens/lamp> <multiplier> <# vert angles> <# horiz angles> <photo type> <units type> <width> <length> <height>
    # <ballast factor> <ballast lamp factor> <input watts>
    
    # We need to find the line with the data. It's often a few lines down.
    # We can try to skip lines that look like keywords or empty.
    
    # Let's collect all numbers after TILT line
    data_numbers = []
    for line in lines[tilt_line_idx+1:]:
        # Remove comments if any? IES doesn't really have standard comments in data block
        parts = line.split()
        for p in parts:
            try:
                val = float(p)
                data_numbers.append(val)
            except ValueError:
                pass
                
    if len(data_numbers) < 13:
        raise ValueError("IES file seems truncated or invalid.")
        
    num_lamps = int(data_numbers[0])
    lumens_per_lamp = data_numbers[1]
    multiplier = data_numbers[2]
    num_vert_angles = int(data_numbers[3])
    num_horiz_angles = int(data_numbers[4])
    photo_type = int(data_numbers[5])
    units_type = int(data_numbers[6])
    # ... dimensions ...
    
    if photo_type != 1: # 1 = Type C
        raise ValueError(f"Unsupported Photometric Type {photo_type}. Only Type C (1) is supported.")
        
    # Data starts after the 13 header numbers + vert angles + horiz angles
    # The structure is:
    # [Vert Angles]
    # [Horiz Angles]
    # [Candela Values]
    
    # Index of start of angles
    idx = 13
    
    vert_angles = data_numbers[idx : idx + num_vert_angles]
    idx += num_vert_angles
    
    horiz_angles = data_numbers[idx : idx + num_horiz_angles]
    idx += num_horiz_angles
    
    candela_values = data_numbers[idx:]
    
    # Candela values are usually listed as:
    # For 1st horiz angle, all vert angles
    # For 2nd horiz angle, all vert angles
    # ...
    
    expected_candela_count = num_vert_angles * num_horiz_angles
    if len(candela_values) < expected_candela_count:
        # Sometimes there are extra numbers or we missed something. 
        # But if we have enough, we proceed.
        raise ValueError(f"Insufficient candela values. Expected {expected_candela_count}, found {len(candela_values)}")
        
    candela_matrix = np.array(candela_values[:expected_candela_count]).reshape((num_horiz_angles, num_vert_angles))
    
    # Apply multiplier
    candela_matrix *= multiplier
    
    return {
        "vert_angles": np.array(vert_angles),
        "horiz_angles": np.array(horiz_angles),
        "candela_matrix": candela_matrix,
        "total_lumens": float(lumens_per_lamp) * num_lamps if float(lumens_per_lamp) > 0 else 0 # Approximate
    }

def get_candela(ies_data, v_angle, h_angle):
    """
    Interpolate candela value for given vertical and horizontal angles.
    """
    # Create interpolator
    # RegularGridInterpolator expects (x, y) points.
    # Our data is (horiz, vert)
    
    # Handle symmetry if needed?
    # Type C usually 0-90, 0-180, 0-360.
    # We assume the IES file covers the needed range or we might need to mirror.
    # For simplicity, we assume the IES covers what we need or we clamp/wrap.
    # But strictly, we should handle symmetry.
    
    # Let's assume standard 0-360 or symmetric.
    # If 0-90 or 0-180, we need to map input h_angle to that range.
    
    h_angles = ies_data["horiz_angles"]
    v_angles = ies_data["vert_angles"]
    matrix = ies_data["candela_matrix"]
    
    # Wrap h_angle to 0-360
    h_angle = h_angle % 360.0
    
    # Simple symmetry handling
    max_h = h_angles[-1]
    if max_h == 90:
        # Quadrilateral symmetry
        if h_angle > 90 and h_angle <= 180:
            h_angle = 180 - h_angle
        elif h_angle > 180 and h_angle <= 270:
            h_angle = h_angle - 180
        elif h_angle > 270:
            h_angle = 360 - h_angle
    elif max_h == 180:
        # Bilateral symmetry
        if h_angle > 180:
            h_angle = 360 - h_angle
            
    # Clamp v_angle
    v_angle = np.clip(v_angle, v_angles[0], v_angles[-1])
    
    # We can use scipy RegularGridInterpolator
    # But we need to recreate it every time? No, create once.
    # For vectorization, we can pass arrays.
    
    interp = RegularGridInterpolator((h_angles, v_angles), matrix, bounds_error=False, fill_value=None)
    return interp((h_angle, v_angle))

def compute_grid(ies_data, mh, calc_plane, radius, detail_level, llf):
    # Determine grid spacing
    if detail_level == "low":
        spacing = 2.0
    elif detail_level == "high":
        spacing = 0.5
    else: # medium
        spacing = 1.0
        
    # Grid extents
    min_x, max_x = -radius, radius
    min_y, max_y = -radius, radius
    
    x = np.arange(min_x, max_x + spacing, spacing)
    y = np.arange(min_y, max_y + spacing, spacing)
    
    xx, yy = np.meshgrid(x, y)
    
    # Calculate geometry
    # Luminaire at (0, 0, mh)
    # Point at (x, y, calc_plane)
    dz = mh - calc_plane
    if dz <= 0:
        return xx, yy, np.zeros_like(xx)
        
    d2 = xx**2 + yy**2 + dz**2
    d = np.sqrt(d2)
    
    # Vertical angle: acos(dz / d) * 180 / pi
    # But wait, Type C vertical angle is 0 at nadir (down).
    # So angle is angle from nadir.
    # cos(theta) = dz / d
    # theta = acos(dz/d)
    v_angles = np.degrees(np.arccos(dz / d))
    
    # Horizontal angle
    # atan2(y, x)
    # Type C: 0 degrees is usually along X axis? Or Y?
    # Usually 0 is along the photometric axis. Let's assume +X is 0.
    h_angles = np.degrees(np.arctan2(yy, xx))
    h_angles = (h_angles + 360) % 360
    
    # Interpolate candela
    # We need to flatten to pass to interpolator
    h_flat = h_angles.flatten()
    v_flat = v_angles.flatten()
    
    # Setup interpolator
    interp = RegularGridInterpolator(
        (ies_data["horiz_angles"], ies_data["vert_angles"]), 
        ies_data["candela_matrix"], 
        bounds_error=False, 
        fill_value=0 # If out of bounds (shouldn't be for v), assume 0
    )
    
    # Handle symmetry for interpolation inputs
    # (This logic duplicates get_candela but vectorized)
    max_h = ies_data["horiz_angles"][-1]
    
    h_input = h_flat.copy()
    if max_h == 90:
        # Quadrilateral
        mask1 = (h_input > 90) & (h_input <= 180)
        h_input[mask1] = 180 - h_input[mask1]
        mask2 = (h_input > 180) & (h_input <= 270)
        h_input[mask2] = h_input[mask2] - 180
        mask3 = (h_input > 270)
        h_input[mask3] = 360 - h_input[mask3]
    elif max_h == 180:
        # Bilateral
        mask = h_input > 180
        h_input[mask] = 360 - h_input[mask]
        
    pts = np.column_stack((h_input, v_flat))
    cd_values = interp(pts)
    cd_values = cd_values.reshape(xx.shape)
    
    # Calculate illuminance
    # E = (I * cos(theta)) / d^2
    # cos(theta) = dz / d
    # E = (I * dz) / d^3
    
    illuminance = (cd_values * dz) / (d**3)
    illuminance *= llf
    
    return xx, yy, illuminance

# --- Endpoints ---

@router.post("/compute", response_model=ComputeResponse)
async def compute_isolines(
    file: UploadFile = File(...),
    params: str = Body(...) # JSON string
):
    import json
    import traceback
    
    try:
        params_dict = json.loads(params)
        req = ComputeRequest(**params_dict)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid parameters: {e}")
        
    # Read and parse IES
    try:
        content = (await file.read()).decode("utf-8", errors="ignore")
        ies_data = parse_ies(content)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"IES Parsing Error: {str(e)}")
    except Exception as e:
        print(f"Unexpected IES parsing error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Unexpected IES parsing error: {str(e)}")
        
    try:
        # Compute Grid
        radius = req.radiusFactor * req.mountingHeight
        
        # Check grid size to prevent OOM
        if req.detailLevel == "low":
            spacing = 2.0
        elif req.detailLevel == "high":
            spacing = 0.5
        else: # medium
            spacing = 1.0
            
        grid_dim = int((2 * radius) / spacing)
        num_points = grid_dim * grid_dim
        
        if num_points > 5000000: # Limit to ~5 million points
            raise HTTPException(status_code=400, detail=f"Grid too large ({num_points} points). Please reduce Radius or Detail Level.")
            
        xx, yy, illuminance = compute_grid(
            ies_data, 
            req.mountingHeight, 
            req.calcPlaneHeight, 
            radius, 
            req.detailLevel, 
            req.llf
        )
        
        # Sanitize NaNs
        illuminance = np.nan_to_num(illuminance, nan=0.0)
        
        # Convert units if needed
        grid_units = "fc" if req.units == "ft" else "lux"
        
        if grid_units == "fc" and req.illuminanceUnits == "lux":
            illuminance *= 10.7639
        elif grid_units == "lux" and req.illuminanceUnits == "fc":
            illuminance /= 10.7639
            
        # Generate Isolines
        levels = []
        for iso in req.isoLevels:
            # Use matplotlib to find contours
            fig = plt.figure()
            ax = fig.add_subplot(111)
            cs = ax.contour(xx, yy, illuminance, levels=[iso.value])
            
            paths = []
            labels = []
            
            # Use allsegs to get paths. cs.allsegs is a list of levels.
            # We requested 1 level, so we take index 0.
            if len(cs.allsegs) > 0:
                for v in cs.allsegs[0]:
                    # v is a numpy array of vertices (N, 2)
                    if len(v) == 0:
                        continue
                        
                    paths.append(v.tolist())
                    
                    # Generate sparse labels
                    last_pt = v[0]
                    accum_dist = 0
                    label_interval = 40.0 if req.units == "ft" else 12.0
                    
                    for i in range(1, len(v)):
                        pt = v[i]
                        dist = np.linalg.norm(pt - last_pt)
                        accum_dist += dist
                        if accum_dist > label_interval:
                            labels.append({
                                "x": float(pt[0]), 
                                "y": float(pt[1]), 
                                "text": f"{iso.value} {req.illuminanceUnits}"
                            })
                            accum_dist = 0
                        last_pt = pt
                        
            plt.close(fig)
            
            levels.append(IsolineLevelResult(
                value=iso.value,
                color=iso.color,
                paths=paths,
                labels=labels
            ))
            
        return ComputeResponse(
            units=req.units,
            illuminanceUnits=req.illuminanceUnits,
            mountingHeight=req.mountingHeight,
            calcPlaneHeight=req.calcPlaneHeight,
            radius=radius,
            extents={"minX": -radius, "maxX": radius, "minY": -radius, "maxY": radius},
            scaleBar={"length": 50 if req.units == "ft" else 15, "label": "50'" if req.units == "ft" else "15m"},
            levels=levels
        )
    except Exception as e:
        print(f"Computation Error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Computation Error: {str(e)}")

@router.post("/export-pdf")
async def export_pdf(req: ExportPdfRequest):
    import traceback
    try:
        buffer = BytesIO()
        
        # Create PDF
        # Page size
        # Page size
        page_w, page_h = 36*inch, 24*inch
            
        c = canvas.Canvas(buffer, pagesize=(page_w, page_h))
        
        # Setup coordinate system
        # We want (0,0) of grid to be center of page
        c.translate(page_w/2, page_h/2)
        
        # Scale: Map real units to points
        # Let's say 1 inch = 10 ft (1:120 scale) or fit to page?
        # "Fit to page" is safer for "visual reference".
        
        extents = req.isolineData.extents
        data_w = extents["maxX"] - extents["minX"]
        data_h = extents["maxY"] - extents["minY"]
        
        # Margin
        margin = 2 * inch
        avail_w = page_w - 2*margin
        avail_h = page_h - 2*margin
        
        scale_x = avail_w / data_w
        scale_y = avail_h / data_h
        scale = min(scale_x, scale_y)
        
        c.scale(scale, scale)
        
        # Draw Grid if requested
        if req.options.includeGrid and req.options.gridSpacing:
            c.setStrokeColorRGB(0.8, 0.8, 0.8) # Light gray
            c.setLineWidth(0.5 / scale) # Thin line
            c.setDash([1 / scale, 2 / scale]) # Dotted
            
            spacing = req.options.gridSpacing
            min_x, max_x = extents["minX"], extents["maxX"]
            min_y, max_y = extents["minY"], extents["maxY"]
            
            # Vertical lines
            start_x = (int(min_x / spacing)) * spacing
            x = start_x
            while x <= max_x:
                if x >= min_x:
                    c.line(x, min_y, x, max_y)
                x += spacing
                
            # Horizontal lines
            start_y = (int(min_y / spacing)) * spacing
            y = start_y
            while y <= max_y:
                if y >= min_y:
                    c.line(min_x, y, max_x, y)
                y += spacing
                
            c.setDash([]) # Reset dash

        # Draw Isolines
        c.setLineWidth(1.0/scale) # Constant width in points regardless of scale
        
        for level in req.isolineData.levels:
            c.setStrokeColor(HexColor(level.color))
            for path in level.paths:
                if not path or len(path) < 2:
                    continue
                p = c.beginPath()
                p.moveTo(path[0][0], path[0][1])
                for pt in path[1:]:
                    p.lineTo(pt[0], pt[1])
                c.drawPath(p)
                
            # Labels
            if req.options.includeLabels:
                c.setFillColor(HexColor(level.color))
                # Text size needs to be readable. e.g. 10pt
                # Since we scaled the canvas, we need to unscale font size
                font_size = 10.0 / scale
                c.setFont("Helvetica", font_size)
                
                for label in level.labels:
                    c.drawString(label.x, label.y, label.text)
                    
        # Draw Crosshair
        c.setStrokeColor(HexColor("#000000"))
        c.setLineWidth(1.0/scale)
        ch_size = (5.0 if req.isolineData.units == "ft" else 1.5) # 5ft or 1.5m
        c.line(-ch_size, 0, ch_size, 0)
        c.line(0, -ch_size, 0, ch_size)
        
        # Draw MH Tag
        mh_text = f"MH={req.isolineData.mountingHeight}{req.isolineData.units}"
        c.setFont("Helvetica", 12.0/scale)
        c.setFillColor(HexColor("#000000"))
        c.drawString(ch_size * 1.2, -ch_size * 1.2, mh_text)
        
        # Draw Scale Bar (bottom left of data area)
        sb_len = req.options.scaleBarLength
        sb_x = extents["minX"] + (data_w * 0.05)
        sb_y = extents["minY"] + (data_h * 0.05)
        
        c.setStrokeColor(HexColor("#000000"))
        c.setLineWidth(2.0/scale)
        c.line(sb_x, sb_y, sb_x + sb_len, sb_y)
        
        # Scale Bar Label
        font_size = 12.0 / scale
        c.setFont("Helvetica", font_size)
        c.setFillColor(HexColor("#000000"))
        c.drawString(sb_x, sb_y + (2.0/scale), f"{sb_len} {req.isolineData.units}")
        
        # Disclaimer
        if req.options.includeDisclaimer:
            disclaimer = "For preliminary layout and visual reference only."
            c.drawString(extents["minX"], extents["minY"] - (data_h * 0.05), disclaimer)
            
        c.showPage()
        c.save()
        
        buffer.seek(0)
        from fastapi.responses import StreamingResponse
        return StreamingResponse(buffer, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=isolines.pdf"})
    except Exception as e:
        print(f"PDF Export Error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"PDF Export Error: {str(e)}")

@router.post("/export-png")
async def export_png(req: ExportPngRequest):
    import traceback
    try:
        # Use matplotlib to render to PNG
        # We can reuse the logic from compute but this time we plot properly
        
        fig, ax = plt.subplots(figsize=(10, 10)) # Arbitrary size, we will set DPI
        
        extents = req.isolineData.extents
        
        # We don't have the grid data here, only paths.
        # So we just plot paths.
        
        # Draw Grid if requested
        if req.options.includeGrid and req.options.gridSpacing:
            spacing = req.options.gridSpacing
            
            # Vertical lines
            start_x = (int(extents["minX"] / spacing)) * spacing
            x_lines = []
            x = start_x
            while x <= extents["maxX"]:
                if x >= extents["minX"]:
                    x_lines.append(x)
                x += spacing
                
            if x_lines:
                ax.vlines(x_lines, extents["minY"], extents["maxY"], colors='#cccccc', linestyles=':', linewidth=0.5)
                
            # Horizontal lines
            start_y = (int(extents["minY"] / spacing)) * spacing
            y_lines = []
            y = start_y
            while y <= extents["maxY"]:
                if y >= extents["minY"]:
                    y_lines.append(y)
                y += spacing
                
            if y_lines:
                ax.hlines(y_lines, extents["minX"], extents["maxX"], colors='#cccccc', linestyles=':', linewidth=0.5)

        for level in req.isolineData.levels:
            color = level.color
            for path in level.paths:
                if not path or len(path) < 2:
                    continue
                pts = np.array(path)
                ax.plot(pts[:, 0], pts[:, 1], color=color, linewidth=1.5)
                
            if req.options.includeLabels:
                for label in level.labels:
                    ax.text(label.x, label.y, label.text, color=color, fontsize=8)
                    
        # Set limits
        ax.set_xlim(extents["minX"], extents["maxX"])
        ax.set_ylim(extents["minY"], extents["maxY"])
        ax.set_aspect('equal')
        ax.axis('off') # Turn off axis
        
        # Crosshair
        ax.plot([-5, 5], [0, 0], 'k-', linewidth=1)
        ax.plot([0, 0], [-5, 5], 'k-', linewidth=1)
        
        # MH Tag
        mh_text = f"MH={req.isolineData.mountingHeight}{req.isolineData.units}"
        ax.text(6, -6, mh_text, color='black', fontsize=10)
        
        # Scale Bar
        sb_len = req.options.scaleBarLength
        sb_x = extents["minX"] + (extents["maxX"] - extents["minX"]) * 0.1
        sb_y = extents["minY"] + (extents["maxY"] - extents["minY"]) * 0.1
        ax.plot([sb_x, sb_x + sb_len], [sb_y, sb_y], 'k-', linewidth=2)
        ax.text(sb_x, sb_y + 1, f"{sb_len} {req.isolineData.units}", color='black')
        
        # Disclaimer
        if req.options.includeDisclaimer:
            ax.text(extents["minX"], extents["minY"], "For preliminary layout only", fontsize=8)
        
        buffer = BytesIO()
        plt.savefig(buffer, format='png', transparent=True, dpi=300, bbox_inches='tight', pad_inches=0)
        plt.close(fig)
        
        buffer.seek(0)
        from fastapi.responses import StreamingResponse
        return StreamingResponse(buffer, media_type="image/png")
    except Exception as e:
        print(f"PNG Export Error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"PNG Export Error: {str(e)}")
