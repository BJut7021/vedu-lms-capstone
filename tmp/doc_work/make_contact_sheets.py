from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


SOURCE = Path(r"C:\Project\vedu-lms-capstone\tmp\doc_work\render_final")
OUTPUT = Path(r"C:\Project\vedu-lms-capstone\tmp\doc_work\contact_sheets")
OUTPUT.mkdir(parents=True, exist_ok=True)

pages = sorted(SOURCE.glob("page-*.png"), key=lambda path: int(path.stem.split("-")[-1]))
font = ImageFont.truetype("arial.ttf", 28)

for group_index in range(0, len(pages), 4):
    group = pages[group_index:group_index + 4]
    previews = []
    for path in group:
        with Image.open(path) as page:
            page = page.convert("RGB")
            page.thumbnail((900, 1275), Image.Resampling.LANCZOS)
            previews.append((path, page.copy()))

    canvas = Image.new("RGB", (1880, 2670), "#d7dbe2")
    draw = ImageDraw.Draw(canvas)
    for index, (path, preview) in enumerate(previews):
        col = index % 2
        row = index // 2
        x = 20 + col * 930
        y = 50 + row * 1320
        canvas.paste(preview, (x, y))
        page_number = int(path.stem.split("-")[-1])
        draw.text((x, 10 + row * 1320), f"Trang vật lý {page_number}", fill="#111827", font=font)

    first = group_index + 1
    last = group_index + len(group)
    canvas.save(OUTPUT / f"pages_{first:02d}_{last:02d}.jpg", quality=90, optimize=True)

print(len(list(OUTPUT.glob("*.jpg"))))
