from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from pydantic import BaseModel
from typing import List, Optional, Set, Dict, Any
import fitz  # PyMuPDF
import re
import base64
import numpy as np
import logging
from io import BytesIO
from enum import Enum

router = APIRouter(prefix="/api/change-narrative", tags=["change-narrative"])

# --- Models ---

class SheetStatus(str, Enum):
    NEW = "NEW"
    REMOVED = "REMOVED"
    REVISED = "REVISED"
    UNCHANGED = "UNCHANGED"

class SheetKind(str, Enum):
    LIGHTING_PLAN = "lighting_plan"
    LIGHTING_SCHEDULES = "lighting_schedules"
    SYMBOLS_LEGEND = "symbols_legend"
    OTHER = "other"
class ChangeItem(BaseModel):
    text: str
    type: str # "ADDED" | "REMOVED"
    location_context: Optional[str] = None # e.g. "WOMENS 122"

class SheetData(BaseModel):
    sheetId: str
    sheetNumber: str
    sheetTitle: str
    status: SheetStatus
    sheetKind: SheetKind
    diffScore: Optional[float] = None
    previousPreviewBase64: Optional[str] = None
    currentPreviewBase64: Optional[str] = None
    warningsForSheet: List[str] = []
    changes: List[ChangeItem] = []

class TagConsistencyReport(BaseModel):
    # Keeping empty structure for compatibility if frontend still expects specific fields
    # though we stripped logic.
    warnings: List[str]

class ComparisonResponse(BaseModel):
    sheets: List[SheetData]
    tagConsistency: TagConsistencyReport

def clean_text(text: str) -> str:
    return " ".join(text.split())

def calc_dist(p1, p2):
    return ((p1[0]-p2[0])**2 + (p1[1]-p2[1])**2)**0.5

def find_nearest_room_label(target_rect, text_blocks):
    """
    Finds the nearest text block that looks like a Room Name/Number.
    Heuristics:
    - Uppercase
    - Often contains digits
    - Not too long
    - Closest Euclidean distance to target_rect center
    """
    if not target_rect or not text_blocks:
        return None
        
    tx, ty = (target_rect[0] + target_rect[2])/2, (target_rect[1] + target_rect[3])/2
    
    candidates = []
    
    for block in text_blocks:
        text = block['text'].strip()
        if not text: continue
        if len(text) < 3: continue # Too short
        
        # Check if it looks like a room label
        # Heuristic: mostly uppercase, maybe digits. 
        # Exclude common notes phrases if possible.
        if not text.isupper() and not any(c.isdigit() for c in text):    
            # Allow Title Case rooms if they look like "Office 101"
             if not re.search(r'\d', text):
                 continue

        # FILTER: Exclude Circuit/Relay Tags (e.g. 71/R13, M1, P-1)
        # These are usually short and contain forward slashes or are just fixture types
        if re.search(r'\d+/[A-Z0-9]+', text): continue # Circuit/Relay (71/R13)
        if re.match(r'^[A-Z][A-Z0-9]{0,3}$', text): continue # Fixture Types (A, F1)
        if "NOTE" in text.upper(): continue # General Notes


        # Get center of block
        bx, by = (block['bbox'][0] + block['bbox'][2])/2, (block['bbox'][1] + block['bbox'][3])/2
        dist = calc_dist((tx, ty), (bx, by))
        
        # Filter mostly by distance first, say within 200 pts (approx 3 inches)
        if dist < 300: 
            candidates.append((dist, text))
            
    if not candidates:
        return "General"
        
    # Sort by distance
    candidates.sort(key=lambda x: x[0])
    return candidates[0][1]

def extract_sheet_info_spatial(page, page_index: int) -> Dict[str, Any]:
    """
    Extracts sheet info AND spatial text blocks.
    Returns dict with sheetNumber, sheetTitle, textBlocks (list of dicts with text/bbox), kind.
    """
    # Get structured text
    # "dict" -> blocks -> lines -> spans
    data = page.get_text("dict")
    
    text_blocks = []
    full_text_lines = []
    
    for block in data.get("blocks", []):
        if block.get("type", 0) == 0: # valid text
            block_text_parts = []
            for line in block.get("lines", []):
                for span in line.get("spans", []):
                    t = span["text"].strip()
                    if t:
                        block_text_parts.append(t)
            
            if block_text_parts:
                full_str = " ".join(block_text_parts)
                text_blocks.append({
                    "text": full_str,
                    "bbox": block["bbox"] # (x0, y0, x1, y1)
                })
                full_text_lines.append(full_str)
                
    full_text = "\n".join(full_text_lines)
    
    # --- SPATIAL EXTRACTION ---
    # We want to find the Sheet Number (e.g. E-101) in the bottom-right corner
    # And the Sheet Title immediately ABOVE it.
    
    page_w = page.rect.width
    page_h = page.rect.height
    
    # Region of Interest: Bottom-Right Quadrant (generous padding)
    # Most title blocks are in the bottom right using roughly 1/4 of page, 
    # but we use 0.4 to be safe against wide titles or centering.
    roi_x0 = page_w * 0.4
    roi_y0 = page_h * 0.4
    
    # Filter blocks in ROI
    roi_blocks = []
    for b in text_blocks:
        bx0, by0, bx1, by1 = b["bbox"]
        # check center point
        cx, cy = (bx0+bx1)/2, (by0+by1)/2
        if cx > roi_x0 and cy > roi_y0:
            roi_blocks.append(b)
            
    # Sort blocks by Y (ascending, top to bottom) for iterating relative positions (Title above Number)
    roi_blocks.sort(key=lambda x: x["bbox"][1]) 
    
    sheet_num = None
    sheet_title = None
    
    # --- STRATEGY 1: LABEL-BASED EXTRACTION (Golden Path) ---
    # User confirms explicitly that "Sheet Name" and "Sheet Number" labels exist.
    # We find these labels and grab the nearest text block.
    
    label_name_block = None
    label_num_block = None
    
    for b in roi_blocks:
        # Normalize: Remove colon, UPPERCASE, normalize internal whitespace
        raw = b['text'].replace(":", "")
        txt = clean_text(raw).upper()
        
        if txt in ["SHEET NAME", "SHEET TITLE", "DRAWING NAME", "DRAWING TITLE"]:
            label_name_block = b
        elif txt in ["SHEET NUMBER", "SHEET NO", "SHEET NO.", "DWG NO", "DWG NO."]:
            label_num_block = b
            
    # If "Sheet Name" label found, find nearest text block (Title)
    if label_name_block:
        # distinct candidates (exclude the label itself)
        candidates = []
        for b in roi_blocks:
            if b is label_name_block: continue
            
            # FILTER CANDIDATES FOR TITLE
            # 1. Must be decent length (avoid "A" artifact)
            btxt = b['text'].strip()
            if len(btxt) < 4: continue # "A", "N/A" might be skipped. Titles are usually "LIGHTING PLAN" (long)
            
            # 2. Skip dates
            if re.search(r'\d+/\d+/\d+', btxt): continue
            
            # 3. Skip meta words
            skip_words = ["ISSUE", "RELEASE", "DATE", "CONSTRUCTION", "DOCUMENT", "PROJECT", "NUMBER", "SCALE", "DRAWN", "CHECKED", "COPYRIGHT", "OF"]
            if any(sw in btxt.upper() for sw in skip_words): continue

            # Add to candidates
            candidates.append(b)
            
        if candidates:
            # Sort by distance to the label block
            lx, ly = (label_name_block['bbox'][0] + label_name_block['bbox'][2])/2, (label_name_block['bbox'][1] + label_name_block['bbox'][3])/2
            
            def get_dist(blk):
                bx, by = (blk['bbox'][0] + blk['bbox'][2])/2, (blk['bbox'][1] + blk['bbox'][3])/2
                return ((lx-bx)**2 + (ly-by)**2)**0.5
                
            candidates.sort(key=get_dist)
            # Pick closest VALID candidate
            sheet_title = candidates[0]['text'].strip()
            
    # If "Sheet Number" label found, find nearest text block
    if label_num_block:
        candidates = []
        for b in roi_blocks:
            if b is label_num_block: continue
            btxt = b['text'].strip()
            # Sheet numbers can be short "E1", but usually > 2 chars? "A" is unlikely a sheet number in this context unless map.
            if len(btxt) < 2: continue 
            
            candidates.append(b)
            
        if candidates:
            lx, ly = (label_num_block['bbox'][0] + label_num_block['bbox'][2])/2, (label_num_block['bbox'][1] + label_num_block['bbox'][3])/2
            def get_dist(blk):
                bx, by = (blk['bbox'][0] + blk['bbox'][2])/2, (blk['bbox'][1] + blk['bbox'][3])/2
                return ((lx-bx)**2 + (ly-by)**2)**0.5
            candidates.sort(key=get_dist)
            sheet_num = candidates[0]['text'].strip()


    # --- STRATEGY 2: SPATIAL HEURISTIC (Fallback) ---
    if not sheet_num:
        # Regex: Allow optional space (e.g. E- 101 or E 101)
        sheet_num_pattern = re.compile(r'\b[A-Z]{1,2}\s*-?\s*[\d\.]{3,}\b') 
        
        # 1. Find the Sheet Number Block (Anchor)
        candidates = []
        for i, b in enumerate(roi_blocks):
            txt = b['text'].strip()
            if len(txt) > 20: continue 
            
            if sheet_num_pattern.search(txt) and any(c.isdigit() for c in txt):
                 bx0, by0, bx1, by1 = b["bbox"]
                 cx, cy = (bx0+bx1)/2, (by0+by1)/2
                 dist = ((page_w - cx)**2 + (page_h - cy)**2)**0.5
                 candidates.append({'index': i, 'text': txt, 'dist': dist, 'bbox': b['bbox']})
                 
        anchor_index = -1
        if candidates:
            candidates.sort(key=lambda x: x['dist'])
            best = candidates[0]
            match = sheet_num_pattern.search(best['text'])
            sheet_num = match.group(0) if match else best['text']
            anchor_index = best['index']
                
        # If spatial fail, fallback to global regex
        if not sheet_num:
            fallback_matches = sheet_num_pattern.findall(full_text)
            sheet_num = fallback_matches[-1] if fallback_matches else f"P{page_index + 1}"

        # 2. Find Sheet Title (Above the Anchor) if not already found by label
        if not sheet_title and anchor_index > 0:
            skip_words = ["ISSUE", "RELEASE", "DATE", "CONSTRUCTION", "DOCUMENT", "PROJECT", "NUMBER", "SCALE", "DRAWN", "CHECKED", "COPYRIGHT", "OF"]
            
            # Look at blocks spatially *above* the anchor? 
            # Note: roi_blocks is sorted by Y. If we found anchor at index X.
            # Using index is risky if we sorted by DISTANCE in Strategy 2? 
            # Wait, `candidates` in strat 2 was just a finder. `roi_blocks` list is still sorted by Y from earlier?
            # Yes, `roi_blocks.sort(key=lambda x: x["bbox"][1])`
            # So `anchor_index` refers to the Y-sorted list.
            
            for i in range(anchor_index - 1, -1, -1):
                cand_block = roi_blocks[i]
                cand_text = cand_block['text'].strip()
                cand_upper = cand_text.upper()
                if len(cand_text) < 3: continue
                if any(sw in cand_upper for sw in skip_words): continue
                if re.search(r'\d+/\d+/\d+', cand_text): continue

                sheet_title = cand_text
                break
            
    if not sheet_title:
        # Fallback Keywords
        upper = full_text.upper()
        if "ELECTRICAL LIGHTING PLAN" in upper: sheet_title = "ELECTRICAL LIGHTING PLAN"
        elif "LIGHTING PLAN" in upper: sheet_title = "LIGHTING PLAN"
        elif "ELECTRICAL SYMBOLS" in upper: sheet_title = "ELECTRICAL SYMBOLS AND ABBREVIATIONS"
        elif "SCHEDULE" in upper: sheet_title = "LIGHTING SCHEDULES"
        else: sheet_title = "Unknown Sheet"

    # Kind classification
    kind = SheetKind.OTHER
    upper_title = sheet_title.upper()
    if "LIGHTING PLAN" in upper_title: kind = SheetKind.LIGHTING_PLAN
    elif "SCHEDULE" in upper_title: kind = SheetKind.LIGHTING_SCHEDULES
    elif "SYMBOL" in upper_title: kind = SheetKind.SYMBOLS_LEGEND

    return {
        "sheetNumber": sheet_num,
        "sheetTitle": sheet_title,
        "textBlocks": text_blocks,
        "kind": kind
    }

def render_page_base64(page, zoom=1.0) -> str:
    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat)
    # Convert to PNG in memory
    img_data = pix.tobytes("png")
    return base64.b64encode(img_data).decode('utf-8')

def compute_diff_score(page1, page2) -> float:
    # Render both at higher res for accurate text diffing (2.0 = ~144dpi)
    pix1 = page1.get_pixmap(matrix=fitz.Matrix(2.0, 2.0))
    pix2 = page2.get_pixmap(matrix=fitz.Matrix(2.0, 2.0))
    
    # Simple check: dimensions
    if pix1.width != pix2.width or pix1.height != pix2.height:
        return 1.0 # different dimensions = changed
    
    # Convert to numpy arrays for pixel diff
    # pix.samples is bytes
    # This is a crude pixel diff.
    # Ideally use PIL or OpenCV, but we want minimal deps if possible.
    # We can use pure python loop if small, or just comparing bytes.
    
    if pix1.samples == pix2.samples:
        return 0.0
    
    # If different, we can calculate a % difference
    # But for now, any difference returns 1.0 (REVISED)
    # To be more robust against minor artifacting, we'd need pixel comparison.
    # Since we have numpy in env:
    try:
        arr1 = np.frombuffer(pix1.samples, dtype=np.uint8)
        arr2 = np.frombuffer(pix2.samples, dtype=np.uint8)
        
        diff = np.abs(arr1.astype(int) - arr2.astype(int))
        mean_diff = np.mean(diff)
        return float(mean_diff)
    except:
        return 1.0

def compute_spatial_diff(prev_blocks, curr_blocks) -> List[ChangeItem]:
    """
    Compares text blocks to find added/removed content.
    Attaches spatial context (nearest room) to changes.
    """
    # Temporary list to store (y, x, item) for sorting
    raw_changes = [] 
    
    # simplify to set of text strings for equality check
    # But we need to map back to BBox for context.
    
    # Map: text -> List[bbox] (word could appear multiple times)
    prev_map = {}
    for b in prev_blocks:
        t = b['text']
        if t not in prev_map: prev_map[t] = []
        prev_map[t].append(b['bbox'])
        
    curr_map = {}
    for b in curr_blocks:
        t = b['text']
        if t not in curr_map: curr_map[t] = []
        curr_map[t].append(b['bbox'])
        
    # Added
    for t, boxes in curr_map.items():
        if t not in prev_map:
            for bbox in boxes:
                ctx = find_nearest_room_label(bbox, curr_blocks)
                item = ChangeItem(text=t, type="ADDED", location_context=ctx)
                # Use y (bbox[1]) then x (bbox[0]) for sort order
                raw_changes.append((bbox[1], bbox[0], item))
            
    # Removed
    for t, boxes in prev_map.items():
        if t not in curr_map:
            for bbox in boxes:
                ctx = find_nearest_room_label(bbox, prev_blocks)
                item = ChangeItem(text=t, type="REMOVED", location_context=ctx)
                raw_changes.append((bbox[1], bbox[0], item))
                
    # Sort by Y (top to bottom), then X (left to right)
    raw_changes.sort(key=lambda x: (x[0], x[1]))
    
    return [item for _, _, item in raw_changes]

# --- Endpoint ---

@router.post("/compare", response_model=ComparisonResponse)
async def compare_pdfs(
    previousPdf: UploadFile = File(...),
    currentPdf: UploadFile = File(...)
):
    # ... (File loading same as before) ...
    try:
        prev_bytes = await previousPdf.read()
        curr_bytes = await currentPdf.read()
        doc_prev = fitz.open(stream=BytesIO(prev_bytes), filetype="pdf")
        doc_curr = fitz.open(stream=BytesIO(curr_bytes), filetype="pdf")
        
        prev_sheets = {}
        for i, page in enumerate(doc_prev):
            info = extract_sheet_info_spatial(page, i)
            prev_sheets[info['sheetNumber']] = {'page': page, 'info': info}
            
        curr_sheets = {}
        for i, page in enumerate(doc_curr):
            info = extract_sheet_info_spatial(page, i)
            curr_sheets[info['sheetNumber']] = {'page': page, 'info': info}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    all_nums = set(prev_sheets.keys()) | set(curr_sheets.keys())
    sheet_results = []
    
    for num in sorted(all_nums):
        prev = prev_sheets.get(num)
        curr = curr_sheets.get(num)
        
        status = SheetStatus.UNCHANGED
        diff_score = 0.0
        prev_b64 = None
        curr_b64 = None
        sheet_changes = []
        
        kind = SheetKind.OTHER
        sheet_title = ""

        if prev and curr:
            kind = curr['info']['kind']
            sheet_title = curr['info']['sheetTitle']
            
            diff_score = compute_diff_score(prev['page'], curr['page'])
            
            # Spatial Diff
            sheet_changes = compute_spatial_diff(prev['info']['textBlocks'], curr['info']['textBlocks'])
            
            # Revised if visual diff OR text diff found
            if diff_score > 0.001 or len(sheet_changes) > 0:
                status = SheetStatus.REVISED
                prev_b64 = render_page_base64(prev['page'], 0.5)
                curr_b64 = render_page_base64(curr['page'], 0.5)
                
        elif prev and not curr:
            status = SheetStatus.REMOVED
            kind = prev['info']['kind']
            sheet_title = prev['info']['sheetTitle']
            prev_b64 = render_page_base64(prev['page'], 0.5)
            
        elif not prev and curr:
            status = SheetStatus.NEW
            kind = curr['info']['kind']
            sheet_title = curr['info']['sheetTitle']
            curr_b64 = render_page_base64(curr['page'], 0.5)
            # For new sheets, all text is "Added"
            # Maybe too noisy? Let's skip detailed text diff for NEW sheets for now, 
            # or treat all blocks as added.
            pass
            
        sheet_results.append(SheetData(
            sheetId=f"{num}-{status}",
            sheetNumber=num,
            sheetTitle=sheet_title,
            status=status,
            sheetKind=kind,
            diffScore=diff_score if status == SheetStatus.REVISED else None,
            previousPreviewBase64=prev_b64,
            currentPreviewBase64=curr_b64,
            warningsForSheet=[],
            changes=sheet_changes
        ))
        
    return ComparisonResponse(
        sheets=sheet_results,
        tagConsistency=TagConsistencyReport(warnings=[])
    )
