"""Pixel checks: palette (k-means in Lab), logo (multi-scale template match) and text contrast
(k-means with k=2 inside each text box, then the WCAG ratio).

The OpenCV random seed is fixed before every k-means, so the same poster always gives the same
result. Thresholds are applied by the rules (rules/brand.py, rules/access.py), not here.
"""

import cv2
import numpy as np
from PIL import Image

from app.models import ContrastReading, PaletteCluster, PosterReading, VisualReport
from pipeline.boxes import to_pixels

PALETTE_K = 6
PALETTE_IGNORE_BELOW = 0.05  # clusters under 5% of the area are ignored
PALETTE_WIDTH = 200          # the palette is computed on a downscaled copy
LOGO_SIZES = np.geomspace(0.05, 0.35, 16)  # logo width as a fraction of the poster width
LOGO_SEARCH_WIDTH = 720      # the logo search runs on a copy this wide
KMEANS_CRITERIA = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.5)
SEED = 20261107


def _kmeans(samples: np.ndarray, k: int) -> tuple[np.ndarray, np.ndarray]:
    cv2.setRNGSeed(SEED)
    _, labels, centers = cv2.kmeans(samples.astype(np.float32), k, None, KMEANS_CRITERIA, 3, cv2.KMEANS_PP_CENTERS)
    return labels.ravel(), centers


def hex_to_rgb(value: str) -> tuple[int, int, int]:
    value = value.lstrip("#")
    return int(value[0:2], 16), int(value[2:4], 16), int(value[4:6], 16)


def rgb_to_hex(rgb) -> str:
    return "#{:02X}{:02X}{:02X}".format(*(int(round(c)) for c in rgb))


def rgb_to_lab(rgb: np.ndarray) -> np.ndarray:
    """N x 3 RGB (0-255) to CIE Lab (L 0-100, a and b roughly -128..127)."""
    pixels = (np.asarray(rgb, dtype=np.float32) / 255).reshape(-1, 1, 3)
    return cv2.cvtColor(pixels, cv2.COLOR_RGB2Lab).reshape(-1, 3)


def lab_to_rgb(lab: np.ndarray) -> np.ndarray:
    rgb = cv2.cvtColor(np.asarray(lab, dtype=np.float32).reshape(-1, 1, 3), cv2.COLOR_Lab2RGB)
    return np.clip(rgb.reshape(-1, 3) * 255, 0, 255)


def palette(img: np.ndarray, brand_hex: list[str]) -> list[PaletteCluster]:
    height, width = img.shape[:2]
    small = cv2.resize(img, (PALETTE_WIDTH, max(1, round(height * PALETTE_WIDTH / width))), interpolation=cv2.INTER_AREA)
    lab = rgb_to_lab(small.reshape(-1, 3))
    labels, centers = _kmeans(lab, PALETTE_K)
    shares = np.bincount(labels, minlength=PALETTE_K) / len(labels)
    brand_lab = rgb_to_lab(np.array([hex_to_rgb(h) for h in brand_hex])) if brand_hex else np.empty((0, 3))
    clusters = []
    for center, share in zip(centers, shares):
        if share < PALETTE_IGNORE_BELOW:
            continue
        delta_e = float(np.min(np.linalg.norm(brand_lab - center, axis=1))) if len(brand_lab) else 100.0
        clusters.append(PaletteCluster(hex=rgb_to_hex(lab_to_rgb(center)[0]), share=round(float(share), 3),
                                       delta_e=round(delta_e, 1)))
    return sorted(clusters, key=lambda c: c.share, reverse=True)


def logo_score(img: np.ndarray, logo: np.ndarray) -> float:
    """Best normalised correlation of the logo over a range of sizes (1.0 is a perfect match)."""
    gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
    if gray.shape[1] > LOGO_SEARCH_WIDTH:
        scale = LOGO_SEARCH_WIDTH / gray.shape[1]
        gray = cv2.resize(gray, (LOGO_SEARCH_WIDTH, round(gray.shape[0] * scale)), interpolation=cv2.INTER_AREA)
    template = cv2.cvtColor(logo, cv2.COLOR_RGB2GRAY)
    best = 0.0
    for fraction in LOGO_SIZES:
        tw = int(gray.shape[1] * fraction)
        th = int(tw * template.shape[0] / template.shape[1])
        if tw < 16 or th >= gray.shape[0] or tw >= gray.shape[1]:
            continue
        resized = cv2.resize(template, (tw, th), interpolation=cv2.INTER_AREA)
        best = max(best, float(cv2.matchTemplate(gray, resized, cv2.TM_CCOEFF_NORMED).max()))
    return round(best, 3)


def _luminance(rgb) -> float:
    def channel(c: float) -> float:
        c = c / 255
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    r, g, b = (channel(float(c)) for c in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast_ratio(a, b) -> float:
    la, lb = sorted((_luminance(a), _luminance(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def block_contrast(img: np.ndarray, box_2d: list[int]) -> tuple[float, str, str] | None:
    """k-means with k=2 on the pixels in a text box: the larger cluster is the background."""
    left, top, right, bottom = to_pixels(box_2d, img.shape[1], img.shape[0])
    crop = img[top:bottom, left:right]
    if crop.shape[0] < 4 or crop.shape[1] < 4:
        return None
    labels, centers = _kmeans(crop.reshape(-1, 3), 2)
    counts = np.bincount(labels, minlength=2)
    bg, fg = (centers[0], centers[1]) if counts[0] >= counts[1] else (centers[1], centers[0])
    return round(contrast_ratio(fg, bg), 2), rgb_to_hex(fg), rgb_to_hex(bg)


def analyse(image: Image.Image, reading: PosterReading, brand_palette: list[str],
            logo: Image.Image | None) -> VisualReport:
    img = np.array(image.convert("RGB"))
    contrast = []
    for index, block in enumerate(reading.text_blocks):
        measured = block_contrast(img, block.box_2d)
        if measured:
            ratio, fg, bg = measured
            contrast.append(ContrastReading(block_index=index, ratio=ratio, fg=fg, bg=bg))
    return VisualReport(
        width=image.width,
        height=image.height,
        palette=palette(img, brand_palette),
        logo_score=logo_score(img, np.array(logo.convert("RGB"))) if logo is not None else None,
        contrast=contrast,
    )
