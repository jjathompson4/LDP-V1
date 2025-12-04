import matplotlib
matplotlib.use('Agg')
from fastapi import FastAPI, UploadFile, File, HTTPException, Body, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional
import uvicorn
import numpy as np

from .processing import (
    load_hdr_image, tone_map, false_color_image, encode_png, luminance_stats,
    pixel_luminance, roi_mean_luminance, luminance_histogram, build_colorbar
)
from .image_store import image_store
from .routers import dashboard, isoline

app = FastAPI()

app.include_router(dashboard.router)
app.include_router(isoline.router)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:4173",
        "http://localhost:3000",
        "https://ldp-frontend.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UploadResponse(BaseModel):
    sessionId: str
    filename: str
    width: int
    height: int
    stats: Dict[str, float]
    scaleFactor: float = 1.0

class RenderRequest(BaseModel):
    sessionId: str
    exposure: float = 0.0
    gamma: float = 2.2
    useSrgb: bool = True
    falseColor: bool = False
    colormap: str = "jet"
    falsecolorMin: float = 0.0
    falsecolorMax: float = 1000.0

class RenderResponse(BaseModel):
    image: str
    colorbar: Optional[str] = None

class PixelRequest(BaseModel):
    sessionId: str
    x: int
    y: int

class PixelResponse(BaseModel):
    luminance: float

class RoiRequest(BaseModel):
    sessionId: str
    x0: int
    y0: int
    x1: int
    y1: int

class RoiResponse(BaseModel):
    mean: float

class CalibrateRequest(BaseModel):
    sessionId: str
    x: int
    y: int
    knownValue: float

class CalibrateResponse(BaseModel):
    scaleFactor: float
    stats: Dict[str, float]

class HistogramResponse(BaseModel):
    bins: List[float]
    counts: List[int]

@app.get("/")
async def root():
    return {"message": "LDP Backend is running"}

@app.post("/upload", response_model=UploadResponse)
async def upload_image(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(('.hdr', '.exr')):
        raise HTTPException(status_code=400, detail="Invalid file type. Only .hdr and .exr are supported.")

    try:
        contents = await file.read()
        hdr_image = load_hdr_image(contents, file.filename)
        session_id = image_store.add_session(hdr_image, file.filename)
        
        h, w, _ = hdr_image.shape
        stats = luminance_stats(hdr_image)
        
        return UploadResponse(
            sessionId=session_id,
            filename=file.filename,
            width=w,
            height=h,
            stats=stats,
            scaleFactor=1.0
        )
        
    except Exception as e:
        print(f"Error processing image: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/render", response_model=RenderResponse)
async def render_image(req: RenderRequest):
    session = image_store.get_session(req.sessionId)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    try:
        calibrated_hdr = session.get_calibrated_image()
        
        if req.falseColor:
            img_data = false_color_image(
                calibrated_hdr, 
                colormap=req.colormap, 
                lum_min=req.falsecolorMin, 
                lum_max=req.falsecolorMax
            )
            colorbar = build_colorbar(
                colormap=req.colormap, 
                lum_min=req.falsecolorMin, 
                lum_max=req.falsecolorMax
            )
        else:
            img_data = tone_map(
                calibrated_hdr, 
                ev=req.exposure, 
                gamma=req.gamma, 
                use_srgb=req.useSrgb
            )
            colorbar = None

        return RenderResponse(
            image=encode_png(img_data),
            colorbar=colorbar
        )
    except Exception as e:
        print(f"Error rendering image: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/pixel", response_model=PixelResponse)
async def get_pixel_luminance(req: PixelRequest):
    session = image_store.get_session(req.sessionId)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        calibrated_hdr = session.get_calibrated_image()
        lum = pixel_luminance(calibrated_hdr, req.x, req.y)
        return PixelResponse(luminance=lum)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/roi", response_model=RoiResponse)
async def get_roi_luminance(req: RoiRequest):
    session = image_store.get_session(req.sessionId)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        calibrated_hdr = session.get_calibrated_image()
        mean_lum = roi_mean_luminance(calibrated_hdr, req.x0, req.y0, req.x1, req.y1)
        return RoiResponse(mean=mean_lum)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/calibrate", response_model=CalibrateResponse)
async def calibrate_image(req: CalibrateRequest):
    session = image_store.get_session(req.sessionId)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        # Get raw pixel value (uncalibrated)
        raw_lum = pixel_luminance(session.hdr_image, req.x, req.y)
        if raw_lum <= 0:
            raise ValueError("Cannot calibrate on zero or negative luminance")
        
        # Calculate new scale factor
        new_scale = req.knownValue / raw_lum
        session.calibration_factor = new_scale
        
        # Recalculate stats
        stats = luminance_stats(session.get_calibrated_image())
        
        return CalibrateResponse(scaleFactor=new_scale, stats=stats)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/histogram", response_model=HistogramResponse)
async def get_histogram(sessionId: str):
    session = image_store.get_session(sessionId)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        calibrated_hdr = session.get_calibrated_image()
        bins, counts = luminance_histogram(calibrated_hdr)
        return HistogramResponse(bins=bins, counts=counts)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from fastapi import Form
from io import BytesIO

@app.post("/download-proxy")
async def download_proxy(filename: str = Form(...), content_type: str = Form(...), base64_data: str = Form(...)):
    import base64
    from fastapi.responses import StreamingResponse
    try:
        data = base64.b64decode(base64_data)
        buffer = BytesIO(data)
        return StreamingResponse(buffer, media_type="application/octet-stream", headers={"Content-Disposition": f"attachment; filename={filename}"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Download Proxy Error: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
