import base64
import io
import os
import tempfile
from typing import Dict, List, Tuple

import cv2
import numpy as np
from matplotlib import cm
from PIL import Image, ImageDraw, ImageFont


LUMINANCE_WEIGHTS = np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
DEFAULT_FALSECOLOR_RANGE = (0.0, 1000.0)
DEFAULT_COLORMAP = "jet"


def load_hdr_image(file_bytes: bytes, filename: str) -> np.ndarray:
    """Load HDR/EXR image data as float32 RGB array."""
    suffix = os.path.splitext(filename)[1].lower()
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name
    try:
        hdr = cv2.imread(tmp_path, cv2.IMREAD_ANYDEPTH | cv2.IMREAD_COLOR)
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

    if hdr is None:
        raise ValueError("Failed to decode HDR image")

    hdr = cv2.cvtColor(hdr, cv2.COLOR_BGR2RGB)
    return hdr.astype(np.float32)


def compute_luminance(rgb_image: np.ndarray) -> np.ndarray:
    return np.tensordot(rgb_image, LUMINANCE_WEIGHTS, axes=([-1], [0])).astype(np.float32)


def exposure_scale(ev: float) -> float:
    return 2.0 ** (-ev)


def apply_srgb_gamma(rgb: np.ndarray) -> np.ndarray:
    return np.where(
        rgb <= 0.0031308,
        12.92 * rgb,
        1.055 * np.power(np.clip(rgb, 0, None), 1 / 2.4) - 0.055,
    )


def tone_map(hdr: np.ndarray, ev: float = 0.0, gamma: float = 2.2, use_srgb: bool = True) -> np.ndarray:
    scaled = hdr * exposure_scale(ev)
    tone_mapped = scaled / (1.0 + scaled)
    tone_mapped = np.clip(tone_mapped, 0.0, 1.0)
    if use_srgb:
        display = apply_srgb_gamma(tone_mapped)
    else:
        display = np.power(tone_mapped, 1.0 / max(gamma, 1e-3))
    display = np.clip(display, 0.0, 1.0)
    return (display * 255).astype(np.uint8)


def false_color_image(hdr: np.ndarray, colormap: str = DEFAULT_COLORMAP, lum_min: float = 0.0, lum_max: float = 1000.0) -> np.ndarray:
    luminance = compute_luminance(hdr)
    lum_min = float(lum_min)
    lum_max = float(lum_max)
    if lum_max <= lum_min:
        lum_max = lum_min + 1e-3
    norm = np.clip((luminance - lum_min) / (lum_max - lum_min), 0.0, 1.0)
    
    # Matplotlib's colormaps return RGBA, we only need RGB
    cmap = cm.get_cmap(colormap)
    colored = cmap(norm)[..., :3]
    colored = np.clip(colored, 0.0, 1.0)
    return (colored * 255).astype(np.uint8)


def encode_png(image: np.ndarray) -> str:
    """Encode an RGB uint8 array as base64 PNG string."""
    pil_img = Image.fromarray(image)
    buffer = io.BytesIO()
    pil_img.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
    return f"data:image/png;base64,{encoded}"


def luminance_stats(hdr: np.ndarray) -> Dict[str, float]:
    luminance = compute_luminance(hdr)
    return {
        "min": float(np.min(luminance)),
        "max": float(np.max(luminance)),
        "avg": float(np.mean(luminance)),
    }

def luminance_histogram(hdr: np.ndarray, bins: int = 256) -> Tuple[List[float], List[int]]:
    luminance = compute_luminance(hdr)
    luminance = luminance[np.isfinite(luminance)]
    luminance = luminance[luminance > 0]
    if luminance.size == 0:
        return [1.0, 10.0], [0]
    min_val = float(np.min(luminance))
    max_val = float(np.max(luminance))
    if min_val <= 0:
        min_val = min(filter(lambda x: x > 0, luminance.flatten()), default=1e-3)
    if np.isclose(min_val, max_val):
        min_val = max_val * 0.5
    edges = np.logspace(np.log10(min_val), np.log10(max_val), bins)
    counts, _ = np.histogram(luminance, bins=edges)
    return edges[:-1].tolist(), counts.tolist()


def crop_region(hdr: np.ndarray, x0: int, y0: int, x1: int, y1: int) -> np.ndarray:
    h, w, _ = hdr.shape
    xmin, xmax = sorted((int(x0), int(x1)))
    ymin, ymax = sorted((int(y0), int(y1)))
    xmin = max(0, xmin)
    ymin = max(0, ymin)
    xmax = min(w, xmax)
    ymax = min(h, ymax)
    if xmin == xmax or ymin == ymax:
        return np.empty((0, 0, 3), dtype=hdr.dtype)
    return hdr[ymin:ymax, xmin:xmax]


def build_colorbar(colormap: str, lum_min: float, lum_max: float, width: int = 2000, height: int = 120, theme: str = "light") -> str:
    gradient = np.linspace(0, 1, width, dtype=np.float32)
    cmap = cm.get_cmap(colormap)
    color_row = (cmap(gradient)[..., :3] * 255).astype(np.uint8)

    # Fully transparent background to respect frontend theme
    background = np.zeros((height, width, 4), dtype=np.uint8)

    # Determine Text/Line Color based on theme
    if theme == "dark":
        text_color = (255, 255, 255, 255) # White
        line_color = (255, 255, 255, 255) # White
    else:
        text_color = (0, 0, 0, 255) # Black
        line_color = (0, 0, 0, 255) # Black

    bar_height = 40
    padding = 80
    
    # Draw gradient bar
    active_width = width - 2 * padding
    if active_width < 1: active_width = 1
    
    gradient_active = np.linspace(0, 1, active_width, dtype=np.float32)
    color_row_active = (cmap(gradient_active)[..., :3] * 255).astype(np.uint8)
    
    track_top = 20
    track_bottom = track_top + bar_height

    for y in range(track_top, track_bottom):
        background[y, padding:padding+active_width, :3] = color_row_active
        background[y, padding:padding+active_width, 3] = 255

    img = Image.fromarray(background, mode='RGBA')
    draw = ImageDraw.Draw(img)
    
    # Try multiple fonts to find a decent one
    font = None
    font_candidates = [
        ("Arial.ttf", 24),
        ("DejaVuSans.ttf", 24),
        ("LiberationSans-Regular.ttf", 24),
        ("FreeSans.ttf", 24),
        ("arial.ttf", 24)
    ]
    
    for font_name, size in font_candidates:
        try:
            font = ImageFont.truetype(font_name, size)
            break
        except IOError:
            continue
            
    if font is None:
        try:
            # Fallback to default but it will be small
            font = ImageFont.load_default()
        except:
            pass

    # Tick positions
    tick_positions = np.linspace(padding, width - padding, 5)
    tick_values = np.linspace(lum_min, lum_max, 5)

    for pos, value in zip(tick_positions, tick_values):
        x = int(pos)
        # Draw tick mark
        draw.line([(x, track_bottom), (x, track_bottom + 10)], fill=line_color, width=3)
        
        label = f"{value:.1f}"
        
        # Calculate text position
        text_x = x
        text_y = track_bottom + 15
        
        if font:
            bbox = draw.textbbox((0, 0), label, font=font)
            text_width = bbox[2] - bbox[0]
            text_x = x - text_width // 2
            
            # Draw text
            draw.text((text_x, text_y), label, fill=text_color, font=font)

    return encode_png(np.array(img))


def pixel_luminance(hdr: np.ndarray, x: int, y: int) -> float:
    h, w, _ = hdr.shape
    if not (0 <= x < w and 0 <= y < h):
        raise ValueError("Pixel coordinates out of range")
    return float(np.dot(hdr[y, x], LUMINANCE_WEIGHTS))


def roi_mean_luminance(hdr: np.ndarray, x0: int, y0: int, x1: int, y1: int) -> float:
    region = crop_region(hdr, x0, y0, x1, y1)
    if region.size == 0:
        raise ValueError("ROI has no pixels")
    return float(np.mean(compute_luminance(region)))
