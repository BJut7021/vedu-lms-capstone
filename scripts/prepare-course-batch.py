"""Inspect/extract supplied learning archives without executing archive contents."""
import json, pathlib, shutil, subprocess, zipfile
ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCE = pathlib.Path(r'C:\2025-2026_Dai_Hoc\hk1-2026-namcuoi\CNTT_KLCN_260_EDU')
OUT = ROOT / '.work/course-batch-20261101'
OUT.mkdir(parents=True, exist_ok=True)
for index, archive in enumerate(sorted(SOURCE.glob('VEDU*.zip'))):
    folder = OUT / str(index)
    folder.mkdir(exist_ok=True)
    if zipfile.is_zipfile(archive):
        with zipfile.ZipFile(archive) as z:
            for name in z.namelist():
                target = (folder / name).resolve()
                if not target.is_relative_to(folder.resolve()):
                    raise ValueError('Unsafe archive member')
            z.extractall(folder)
    else:
        local = OUT / f'archive-{index}.rar'
        shutil.copyfile(archive, local)
        listing = subprocess.check_output(['tar', '-tf', str(local)], encoding='utf-8')
        for name in listing.splitlines():
            if '..' in pathlib.PurePosixPath(name).parts or name.startswith('/'):
                raise ValueError('Unsafe archive member')
        subprocess.run(['tar', '-xf', str(local), '-C', str(folder)], check=True)
    (folder / 'archive-origin.json').write_text(json.dumps({'archive': archive.name}, ensure_ascii=False), encoding='utf-8')
    print(index, archive.name, len(list(folder.rglob('*'))))
    for p in folder.rglob('*.json'):
        if p.name in ('course_student.json', 'course.json', 'De_cuoi_mon.json'):
            obj=json.loads(p.read_text(encoding='utf-8-sig'))
            print(p.relative_to(folder), str(obj)[:800])
