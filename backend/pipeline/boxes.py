"""Gemini gives box_2d as [ymin, xmin, ymax, xmax], each 0-1000. This is the one place it becomes pixels."""


def to_pixels(box_2d: list[int], width: int, height: int, pad: float = 0.0) -> tuple[int, int, int, int]:
    """(left, top, right, bottom) in pixels, optionally padded by a fraction of the box size,
    clamped to the image."""
    ymin, xmin, ymax, xmax = box_2d
    left, right = xmin * width / 1000, xmax * width / 1000
    top, bottom = ymin * height / 1000, ymax * height / 1000
    dx, dy = (right - left) * pad, (bottom - top) * pad
    return (
        max(0, int(left - dx)),
        max(0, int(top - dy)),
        min(width, int(round(right + dx))),
        min(height, int(round(bottom + dy))),
    )


def from_pixels(left: float, top: float, right: float, bottom: float, width: int, height: int) -> list[int]:
    return [
        round(top * 1000 / height), round(left * 1000 / width),
        round(bottom * 1000 / height), round(right * 1000 / width),
    ]
