from __future__ import annotations

import hashlib
import json
import sys
import zipfile
from pathlib import Path

from docx import Document
from docx.oxml.ns import qn


def main() -> None:
    path = Path(sys.argv[1])
    document = Document(path)
    figures = []
    for index, paragraph in enumerate(document.paragraphs):
        drawings = paragraph._p.xpath('.//w:drawing')
        picts = paragraph._p.xpath('.//w:pict')
        if not drawings and not picts:
            continue
        rel_ids = []
        for blip in paragraph._p.xpath('.//a:blip'):
            rel_id = blip.get(qn('r:embed')) or blip.get(qn('r:link'))
            if rel_id:
                rel_ids.append(rel_id)
        nearby = [
            document.paragraphs[i].text
            for i in range(max(0, index - 2), min(len(document.paragraphs), index + 4))
        ]
        figures.append(
            {
                'paragraph': index,
                'style': paragraph.style.name,
                'rel_ids': rel_ids,
                'nearby': nearby,
            }
        )

    media = []
    with zipfile.ZipFile(path) as archive:
        for name in sorted(n for n in archive.namelist() if n.startswith('word/media/')):
            payload = archive.read(name)
            media.append(
                {
                    'name': name,
                    'bytes': len(payload),
                    'sha256': hashlib.sha256(payload).hexdigest(),
                }
            )

    print(json.dumps({'figures': figures, 'media': media}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
