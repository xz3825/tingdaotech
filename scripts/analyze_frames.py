from PIL import Image

files = {
    "brainwave": "assets/_preview-brainwave.png",
    "phase": "assets/_preview-phase.png",
    "openclosed": "assets/_preview-openclosed.png",
}

for name, path in files.items():
    im = Image.open(path).convert("RGB")
    w, h = im.size
    px = im.load()
    row_ink = []
    for y in range(h):
        ink = 0
        for x in range(0, w, 4):
            r, g, b = px[x, y]
            if r < 245 or g < 245 or b < 245:
                ink += 1
        row_ink.append(ink / (w / 4))

    bands = []
    in_band = False
    start = 0
    for i, v in enumerate(row_ink):
        if v > 0.01 and not in_band:
            in_band = True
            start = i
        elif v <= 0.01 and in_band:
            in_band = False
            bands.append((start, i - 1, i - start))
    if in_band:
        bands.append((start, h - 1, h - start))

    print(name, "size", (w, h))
    for b in bands:
        if b[2] > 8:
            print(" ", b)
