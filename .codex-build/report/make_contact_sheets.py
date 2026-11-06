from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

src = Path(r"C:\Project\vedu-lms-capstone\tmp\report-render")
dst = Path(r"C:\Project\vedu-lms-capstone\tmp\report-contact")
dst.mkdir(parents=True, exist_ok=True)
files = sorted(src.glob("page-*.jpg"))
thumb_w, thumb_h = 220, 311
cols, rows = 4, 3
gap, label_h = 14, 24
font = ImageFont.load_default()

for sheet_idx in range(0, len(files), cols * rows):
    batch = files[sheet_idx:sheet_idx + cols * rows]
    canvas = Image.new("RGB", (cols * (thumb_w + gap) + gap, rows * (thumb_h + label_h + gap) + gap), "#d9dde4")
    draw = ImageDraw.Draw(canvas)
    for idx, path in enumerate(batch):
        im = Image.open(path).convert("RGB")
        im.thumbnail((thumb_w, thumb_h))
        x = gap + (idx % cols) * (thumb_w + gap)
        y = gap + (idx // cols) * (thumb_h + label_h + gap)
        canvas.paste(im, (x + (thumb_w - im.width)//2, y))
        page_no = sheet_idx + idx + 1
        draw.text((x + 4, y + thumb_h + 4), f"Trang {page_no}", fill="#111827", font=font)
    out = dst / f"contact-{sheet_idx//(cols*rows)+1:02d}.jpg"
    canvas.save(out, quality=88)
    print(out)
