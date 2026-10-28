# VEDU course covers, edition 2 — 2026-10-27

The 50 local WebP assets are original VEDU course illustrations.

- Courses 1, 2, 3, 55, 64–69: editorial still-life illustrations created with the built-in OpenAI ImageGen tool, reviewed against the course outline. They are AI-assisted illustrations, not documentary photographs, actual product screenshots or evidence of a university/vendor endorsement. No real people are depicted. Artwork illustrates the subject and does not replace the lesson materials.
- Forty introductory practice-course covers: original code-native editorial artwork showing web interfaces, relational tables, data charts, files and collaboration. Each course has a distinct composition and file. These covers do not claim advanced skills beyond the introductory material available in the corresponding courses.

WebP files are stored under `v2/`. The reviewed course mapping and captions are in `frontend/src/data/course-covers.json`. The original editable fallback artwork is in `frontend/src/services/courseArtwork.js`; the generator is `scripts/build-course-covers.mjs`. The full generation prompt set is saved in `docs/validation/course-cover-prompts.json`.

Teachers' deliberately supplied custom images take priority. Existing Pexels photographs elsewhere in the application retain their separate credits.
