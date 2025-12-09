from fastapi import APIRouter, UploadFile, File, HTTPException, Body
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
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
    rotationX: float = 0.0
    rotationY: float = 0.0
    rotationZ: float = 0.0

class IsolineLabel(BaseModel):
    x: float
    y: float
    text: str

class IsolineLevelResult(BaseModel):
    value: float
    color: str
    paths: List[List[List[float]]] 
    labels: List[IsolineLabel]

class ComputeResponse(BaseModel):
    units: str
    illuminanceUnits: str
    mountingHeight: float
    calcPlaneHeight: float
    radius: float
    extents: Dict[str, float]
    scaleBar: Dict[str, Any]
    levels: List[IsolineLevelResult]

class ExportOptions(BaseModel):
    format: str = "pdf"
    includeScaleBar: bool = True
    includeLabels: bool = True
    includeDisclaimer: bool = True
    includeGrid: bool = False
    gridSpacing: Optional[float] = None
    scaleBarLength: float = 50.0
    fileName: Optional[str] = None

class ExportPdfRequest(BaseModel):
    isolineData: ComputeResponse
    options: ExportOptions

class ExportPngRequest(BaseModel):
    isolineData: ComputeResponse
    options: ExportOptions

def parse_ies(content: str):
    lines = content.split('\n')
    lines = [l.strip() for l in lines if l.strip()]
    
    # Find TILT
    start_idx = 0
    for i, line in enumerate(lines):
        if line.startswith("TILT="):
            start_idx = i
            break
            
    if start_idx == 0 and not lines[0].startswith("IESNA"):
        # Fallback if IESNA header is missing but TILT is there
        pass
        
    # After TILT line, read data
    # 1. Lamp info
    # 2. Ballast factor, etc.
    # 3. Angle counts
    
    # This is a simplified parser
    # We need to robustly consume numbers across newlines
    
    data_lines = lines[start_idx+1:]
    all_values = []
    for line in data_lines:
        parts = line.split()
        for p in parts:
            try:
                all_values.append(float(p))
            except:
                pass
                
    # Now map values
    # pointer
    p = 0
    
    # Line 1: #Lamps, Lumens/Lamp, Multiplier, VerticalAngles, HorizontalAngles, PhotometricType, UnitType, Width, Length, Height
    num_lamps = int(all_values[p]); p+=1
    lumens_per_lamp = all_values[p]; p+=1
    multiplier = all_values[p]; p+=1
    num_v_angles = int(all_values[p]); p+=1
    num_h_angles = int(all_values[p]); p+=1
    photometric_type = int(all_values[p]); p+=1
    unit_type = int(all_values[p]); p+=1
    width = all_values[p]; p+=1
    length = all_values[p]; p+=1
    height = all_values[p]; p+=1
    
    # Ballast factor, etc. (3 values)
    p += 3
    
    # Vertical Angles
    vert_angles = np.array(all_values[p : p+num_v_angles])
    p += num_v_angles
    
    # Horizontal Angles
    horiz_angles = np.array(all_values[p : p+num_h_angles])
    p += num_h_angles
    
    # Candela Values
    # Order: For each Horizontal Angle, list all Vertical Angles
    candela_list = all_values[p:]
    
    # Expected size
    expected = num_v_angles * num_h_angles
    candela_list = candela_list[:expected]
    
    # Reshape
    # IES format: For first horizontal angle, read all vertical angles. Then second H, etc.
    # So we have (num_h, num_v)
    candela_matrix = np.array(candela_list).reshape((num_h_angles, num_v_angles))
    
    # Apply multiplier
    candela_matrix *= multiplier
    
    return {
        "vert_angles": vert_angles,
        "horiz_angles": horiz_angles,
        "candela_matrix": candela_matrix
    }

def rotation_matrix_x(angle_deg):
    rad = np.radians(angle_deg)
    c, s = np.cos(rad), np.sin(rad)
    return np.array([
        [1, 0, 0],
        [0, c, -s],
        [0, s, c]
    ])

def rotation_matrix_y(angle_deg):
    rad = np.radians(angle_deg)
    c, s = np.cos(rad), np.sin(rad)
    return np.array([
        [c, 0, s],
        [0, 1, 0],
        [-s, 0, c]
    ])

def rotation_matrix_z(angle_deg):
    rad = np.radians(angle_deg)
    c, s = np.cos(rad), np.sin(rad)
    return np.array([
        [c, -s, 0],
        [s, c, 0],
        [0, 0, 1]
    ])

def compute_grid(ies_data, mh, calc_plane, radius, detail_level, llf, rot_x=0.0, rot_y=0.0, rot_z=0.0):
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
    
    # Calculate vector from luminaire (0,0,mh) to grid points (xx, yy, calc_plane)
    # v = P_grid - P_lum
    # P_grid = (xx, yy, calc_plane)
    # P_lum = (0, 0, mh)
    # v = (xx, yy, calc_plane - mh)
    # v = (xx, yy, -dz)
    
    dz = mh - calc_plane
    if dz <= 0:
        return xx, yy, np.zeros_like(xx)
        
    # Vectors in global frame
    # We flatten for matrix multiplication
    num_pts = xx.size
    vx = xx.flatten()
    vy = yy.flatten()
    vz = np.full(num_pts, -dz)
    
    # Stack array for rotation (3, N)
    v_global = np.vstack((vx, vy, vz))
    
    # Calculate Rotation Matrix R = Rz * Ry * Rx
    # We want to transform Global to Local, so we apply inverse rotation.
    # v_local = R_inv * v_global
    # R_inv = (Rz * Ry * Rx)^-1 = Rx^-1 * Ry^-1 * Rz^-1
    # Note: Rotation by -angle gives inverse.
    
    rx_inv = rotation_matrix_x(-rot_x)
    ry_inv = rotation_matrix_y(-rot_y)
    rz_inv = rotation_matrix_z(-rot_z)
    
    # Combined inverse rotation matrix
    # Order matters: first undo Z, then Y, then X for "intrinsic" rotations? 
    # Or if we assume rot = rot_z(rot_y(rot_x(v))), then inverse is inv_x(inv_y(inv_z(v)))
    # Let's assume standard Euler (Z-Y-X or similar). 
    # Let's apply in reverse order of application.
    # Typically: Rotate X (Tilt), then Y (Roll), then Z (Orientation).
    # So v_global = Rz * Ry * Rx * v_local
    # v_local = Rx' * Ry' * Rz' * v_global
    
    r_comb_inv = rx_inv @ (ry_inv @ rz_inv)
    
    # Apply rotation
    v_local = r_comb_inv @ v_global
    
    # Extract local components
    lx = v_local[0, :]
    ly = v_local[1, :]
    lz = v_local[2, :]
    
    # Calculate spherical coordinates in local frame
    d2 = lx**2 + ly**2 + lz**2
    d = np.sqrt(d2)
    
    # Avoid div by zero
    d[d == 0] = 1e-9
    
    # Vertical angle (from nadir)
    # in local frame, nadir is -Z axis (0, 0, -1)
    # theta = arccos( dot(v, nadir) / |v| )
    # v . nadir = -lz
    # But Type C vertical angles:
    # 0 is down (-Z in standard, or is it?)
    # Usually in IES, 0 is nadir, 90 is horizontal, 180 is zenith.
    # So we want angle between vector and (0,0,-1).
    # cos(theta) = -lz / d
    # Wait, if lz is negative (down), -lz is positive. cos(0)=1. Correct.
    
    # Clip for arccos stability
    cos_theta = np.clip(-lz / d, -1.0, 1.0)
    v_angles = np.degrees(np.arccos(cos_theta))
    
    # Horizontal angle
    # In Type C, 0 degrees horizontal plane.
    # Usually defines plane containing the beam?
    # Standard: 0 is +X axis ?
    # atan2(y, x)
    h_angles = np.degrees(np.arctan2(ly, lx))
    h_angles = (h_angles + 360) % 360
    
    # Original distance (from source to point) is 'd' (magnitude remains same after rotation)
    # Used for inverse square law: E = I * cos(incidence) / d^2
    # Incidence angle is angle between light ray and normal to surface.
    # Surface normal is (0,0,1) in global frame.
    # Light ray vector is v_global = (vx, vy, vz). vz is -dz.
    # cos(incidence) = dot(-v_global, normal) / d
    # -v_global = (-vx, -vy, dz)
    # normal = (0, 0, 1)
    # dot = dz
    # So cos(incidence) = dz / d
    # This remains dz / d regardless of luminaire rotation!
    # Because surface didn't rotate.
    
    # BUT 'd' is calculated from grid point to luminaire, which is same.
    # So we use Global d and Global dz for illuminance calculation.
    # We use Local angles for Intensity lookup.
    
    # For d calculation, I can use the d derived from local vector (magnitude invariant).
    # For dz, I use the original dz (mh - calc_plane).
    
    # Reshape for interpolation
    # ...

    
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
    
    d = d.reshape(xx.shape)
    
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
            req.llf,
            req.rotationX,
            req.rotationY,
            req.rotationZ
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

from fastapi import Form

@router.post("/export-pdf")
async def export_pdf(body: str = Form(...)):
    import traceback
    try:
        req = ExportPdfRequest.parse_raw(body)
        buffer = BytesIO()
        
        # Create PDF
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
            c.setStrokeColorRGB(0.5, 0.5, 0.5) # Darker gray (#808080)
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

        buffer.seek(0)
        from fastapi.responses import StreamingResponse
        
        # Determine filename
        download_name = "isolines.pdf"
        if req.options.fileName:
            # Sanitize filename: allow alphanumeric, spaces, dashes, underscores, dots
            safe_name = re.sub(r'[^\w\s\-\.]', '', req.options.fileName).strip()
            if safe_name:
                download_name = f"{safe_name}.pdf"
                
        return StreamingResponse(buffer, media_type="application/octet-stream", headers={"Content-Disposition": f"attachment; filename={download_name}"})
        
    except Exception as e:
        print(f"PDF Export Error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"PDF Export Error: {str(e)}")

@router.post("/export-png")
async def export_png(body: str = Form(...)):
    import traceback
    try:
        req = ExportPngRequest.parse_raw(body)
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
                ax.vlines(x_lines, extents["minY"], extents["maxY"], colors='#808080', linestyles=':', linewidth=0.5)
                
            # Horizontal lines
            start_y = (int(extents["minY"] / spacing)) * spacing
            y_lines = []
            y = start_y
            while y <= extents["maxY"]:
                if y >= extents["minY"]:
                    y_lines.append(y)
                y += spacing
                

            if y_lines:
                ax.hlines(y_lines, extents["minX"], extents["maxX"], colors='#808080', linestyles=':', linewidth=0.5)

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
        sb_y = extents["minY"] + (extents["maxY"] - extents["minY"]) * 0.05
        ax.plot([sb_x, sb_x + sb_len], [sb_y, sb_y], 'k-', linewidth=2)
        ax.text(sb_x, sb_y + 1, f"{sb_len} {req.isolineData.units}", color='black')
        
        # Disclaimer
        if req.options.includeDisclaimer:
            ax.text(extents["minX"], extents["minY"], "For preliminary layout only", fontsize=8)
        
        buffer = BytesIO()
        plt.savefig(buffer, format='png', transparent=True, dpi=300, bbox_inches='tight', pad_inches=0)
        plt.close(fig)
        
        buffer.seek(0)

        buffer.seek(0)
        from fastapi.responses import StreamingResponse
        
        # Determine filename
        download_name = "isolines.png"
        if req.options.fileName:
            # Sanitize filename
            safe_name = re.sub(r'[^\w\s\-\.]', '', req.options.fileName).strip()
            if safe_name:
                download_name = f"{safe_name}.png"
                
        return StreamingResponse(buffer, media_type="application/octet-stream", headers={"Content-Disposition": f"attachment; filename={download_name}"})
        
    except Exception as e:
        print(f"PNG Export Error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"PNG Export Error: {str(e)}")


