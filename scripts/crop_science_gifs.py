"""Crop burned-in titles from science GIFs and re-export GIF + MP4."""
from __future__ import annotations

import os
from PIL import Image

try:
    import imageio.v2 as imageio
except ImportError:
    import imageio

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "assets")


def load_gif_frames(path: str):
    im = Image.open(path)
    frames = []
    durations = []
    for i in range(getattr(im, "n_frames", 1)):
        im.seek(i)
        frames.append(im.convert("RGB"))
        durations.append(im.info.get("duration", 40))
    return frames, durations


def crop_box(im: Image.Image, box):
    return im.crop(box)


def crop_open_closed(im: Image.Image) -> Image.Image:
    # Keep panel titles + wave animations; drop only the top slide title.
    return im.crop((60, 200, 1860, 1000))


def save_gif(frames, durations, path):
    # Pillow GIF save
    frames[0].save(
        path,
        save_all=True,
        append_images=frames[1:],
        duration=durations,
        loop=0,
        optimize=False,
    )


def save_mp4(frames, durations, path, fps=None):
    if fps is None:
        avg = sum(durations) / max(len(durations), 1)
        fps = max(8, min(30, round(1000 / max(avg, 1))))
    writer = imageio.get_writer(
        path,
        fps=fps,
        codec="libx264",
        quality=7,
        pixelformat="yuv420p",
        macro_block_size=None,
    )
    try:
        for frame in frames:
            # ensure even dimensions for yuv420p
            w, h = frame.size
            nw, nh = w - (w % 2), h - (h % 2)
            if (nw, nh) != (w, h):
                frame = frame.crop((0, 0, nw, nh))
            writer.append_data(__import__("numpy").asarray(frame))
    finally:
        writer.close()


def process(name, transform):
    src = os.path.join(ASSETS, f"{name}.gif")
    print(f"Processing {name} ...")
    frames, durations = load_gif_frames(src)
    out_frames = [transform(f) for f in frames]
    # preview first frame
    preview = os.path.join(ASSETS, f"_preview-cropped-{name}.png")
    out_frames[0].save(preview)
    gif_out = os.path.join(ASSETS, f"{name}.gif")
    mp4_out = os.path.join(ASSETS, f"{name}.mp4")
    save_gif(out_frames, durations, gif_out)
    save_mp4(out_frames, durations, mp4_out)
    print(f"  -> {gif_out} ({out_frames[0].size}, {len(out_frames)} frames)")
    print(f"  -> {mp4_out}")


def main():
    process(
        "tech-brainwave-phase",
        lambda im: crop_box(im, (60, 340, 1860, 1020)),
    )
    process(
        "tech-phase-response",
        lambda im: crop_box(im, (80, 290, 1840, 1040)),
    )
    process("tech-open-closed-loop", crop_open_closed)
    print("Done.")


if __name__ == "__main__":
    # Only reprocess open/closed by default when run directly for this fix.
    process("tech-open-closed-loop", crop_open_closed)
    print("Done.")
