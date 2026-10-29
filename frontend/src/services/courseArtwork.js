// Original editable editorial graphics for introductory courses and future courses without an uploaded cover.
// The artwork illustrates the subject area; skill labels for curated courses live in the reviewed manifest.
const escape = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[c],
  );
export function courseIdentity(course) {
  return String(course.title || course.courseName || "Khóa học")
    .normalize("NFC")
    .trim()
    .toLocaleLowerCase("vi-VN");
}
export function courseFamily(course) {
  const title = courseIdentity(course),
    topic = String(course.topic || "");
  if (/database|postgres|cơ sở dữ liệu/i.test(title + " " + topic))
    return "database";
  if (
    /\bai\b|huspm|khai phá|dữ liệu chuỗi|khoa học dữ liệu/i.test(
      title + " " + topic,
    )
  )
    return "data";
  if (/digital|kỹ năng số|office 365/i.test(title + " " + topic))
    return "digital";
  if (/rời rạc|logic|toán/i.test(title + " " + topic)) return "math";
  if (/mạng|network/i.test(title + " " + topic)) return "network";
  if (/excel/i.test(title)) return "spreadsheet";
  if (/word/i.test(title)) return "document";
  if (/powerpoint/i.test(title)) return "presentation";
  return "web";
}
const palettes = {
  web: ["#eaf1ff", "#153363", "#4977d2", "#99c6c8"],
  database: ["#f4eddf", "#263d55", "#b38542", "#79a5a8"],
  data: ["#efedf8", "#443058", "#9f6080", "#8aadc1"],
  digital: ["#e7f2eb", "#1c4c49", "#54978b", "#d1a86b"],
  math: ["#fbf1db", "#453b58", "#b68442", "#729ab0"],
  network: ["#e7f2f2", "#163e52", "#4296a1", "#e3bd68"],
  spreadsheet: ["#e7f3e9", "#14533d", "#489d70", "#b0c289"],
  document: ["#eaf0fb", "#26466d", "#4d81d2", "#b8c9dd"],
  presentation: ["#fbede2", "#653a30", "#cb7a53", "#e5b67a"],
};
function card(x, y, w, h, body, fill = "#fff", angle = 0) {
  return `<g transform="rotate(${angle} ${x + w / 2} ${y + h / 2})"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="15" fill="${fill}" filter="url(#shadow)"/>${body}</g>`;
}
const line = (x, y, w, color = "#c3cfdb", sw = 5) =>
  `<path d="M${x} ${y}h${w}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>`;
const txt = (x, y, t, size = 16, color = "#3d5368", weight = 500) =>
  `<text x="${x}" y="${y}" font-family="Arial,sans-serif" font-size="${size}" fill="${color}" font-weight="${weight}">${escape(t)}</text>`;
function windowPanel(x, y, w, h, accent, index) {
  let content = `<rect x="${x}" y="${y}" width="${w}" height="30" rx="12" fill="#edf1f5"/><rect x="${x}" y="${y + 18}" width="${w}" height="12" fill="#edf1f5"/>`;
  for (let i = 0; i < 3; i++)
    content += `<circle cx="${x + 15 + i * 13}" cy="${y + 15}" r="3" fill="${i === 0 ? "#d28f83" : i === 1 ? "#d5b96f" : "#80a696"}"/>`;
  if (index % 4 === 0) {
    content +=
      `<rect x="${x + 15}" y="${y + 48}" width="${w - 30}" height="${h * 0.3}" rx="7" fill="${accent}" opacity=".12"/>` +
      line(x + 30, y + 70, w * 0.36, accent, 8);
    for (let i = 0; i < 3; i++)
      content += `<rect x="${x + 15 + (i * (w - 35)) / 3}" y="${y + h * 0.58}" width="${(w - 55) / 3}" height="${h * 0.3}" rx="6" fill="${i % 2 ? "#edf1f4" : accent}" opacity="${i % 2 ? 1 : 0.18}"/>`;
  } else if (index % 4 === 1) {
    content += `<rect x="${x + 12}" y="${y + 44}" width="${w * 0.22}" height="${h - 60}" rx="5" fill="${accent}" opacity=".16"/>`;
    for (let i = 0; i < 4; i++)
      content += line(
        x + w * 0.32,
        y + 55 + i * 26,
        w * (0.5 - i * 0.06),
        i === 0 ? accent : "#bdcbd8",
        i === 0 ? 9 : 4,
      );
  } else if (index % 4 === 2) {
    content += `<rect x="${x + 16}" y="${y + 48}" width="${w * 0.36}" height="${h - 66}" rx="8" fill="${accent}" opacity=".15"/>`;
    for (let i = 0; i < 3; i++)
      content += line(
        x + w * 0.48,
        y + 58 + i * 24,
        w * 0.4,
        i === 0 ? accent : "#c5cfda",
        i === 0 ? 8 : 5,
      );
    content += `<rect x="${x + w * 0.48}" y="${y + h - 47}" width="${w * 0.27}" height="21" rx="6" fill="${accent}"/>`;
  } else {
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 2; j++)
        content += `<rect x="${x + 14 + j * (w / 2 - 5)}" y="${y + 44 + (i * (h - 54)) / 3}" width="${w / 2 - 22}" height="${(h - 75) / 3}" rx="6" fill="${i === index % 3 ? accent : "#e5edf3"}" opacity="${i === index % 3 ? 0.25 : 1}"/>`;
  }
  return card(x, y, w, h, content);
}
function codePanel(x, y, w, h, accent, index) {
  let body = txt(x + 19, y + 30, "< / >", 19, accent, 700);
  for (let i = 0; i < 6; i++) {
    const indent = ((i + index) % 3) * 12;
    body +=
      txt(x + 14, y + 57 + i * 19, String(i + 1), 9, "#9da8b6") +
      line(
        x + 40 + indent,
        y + 53 + i * 19,
        Math.min(w - 70 - indent, 45 + ((i * 37 + index * 19) % 95)),
        i % 3 === 0 ? accent : i % 3 === 1 ? "#789b96" : "#bdc8d3",
        4,
      );
  }
  return card(x, y, w, h, body, "#fff", index % 2 ? -5 : 4);
}
function tablePanel(x, y, w, h, accent, index) {
  const names = [
    "learner",
    "course",
    "enrollment",
    "lesson",
    "activity",
    "result",
    "resource",
    "teacher",
    "session",
    "record",
  ];
  let b =
    `<rect x="${x}" y="${y}" width="${w}" height="31" rx="12" fill="${accent}"/><rect x="${x}" y="${y + 18}" width="${w}" height="13" fill="${accent}"/>` +
    txt(x + 14, y + 21, names[index % names.length], 13, "#fff", 700);
  for (let i = 0; i < 3; i++)
    b +=
      `<circle cx="${x + 17}" cy="${y + 50 + i * 24}" r="3" fill="${i === 0 ? "#c8994c" : "#aebcca"}"/>` +
      line(
        x + 30,
        y + 50 + i * 24,
        w - 46 - i * 9,
        i === 0 ? "#8396a8" : "#cbd4dd",
        4,
      );
  return card(x, y, w, h, b);
}
function dataPanel(x, y, w, h, accent, index) {
  let b = txt(
    x + 18,
    y + 29,
    "DATA / " + String(index + 1).padStart(2, "0"),
    12,
    accent,
    700,
  );
  if (index % 3 === 0) {
    b += line(x + 30, y + h - 28, w - 52, "#d3dce3", 2);
    for (let i = 0; i < 5; i++) {
      const bh = 35 + ((i * 31 + index * 17) % 95);
      b += `<rect x="${x + 32 + (i * (w - 60)) / 5}" y="${y + h - 29 - bh}" width="${(w - 75) / 6}" height="${bh}" rx="4" fill="${i === 3 ? accent : "#c5d3df"}"/>`;
    }
  } else if (index % 3 === 1) {
    for (let i = 0; i < 24; i++)
      b += `<circle cx="${x + 30 + ((i * 43 + index * 5) % (w - 55))}" cy="${y + 50 + ((i * 29 + i * i) % (h - 78))}" r="${i % 5 === 0 ? 6 : 3}" fill="${i % 3 === 0 ? accent : "#91afbb"}" opacity=".8"/>`;
  } else {
    const points = Array.from({ length: 7 }, (_, i) => [
      x + 25 + (i * (w - 50)) / 6,
      y + h - 28 - ((i * 37 + index * 13) % (h - 85)),
    ]);
    b += `<path d="M${points.map((p) => p.join(",")).join(" L")}" stroke="${accent}" stroke-width="4" fill="none"/>`;
    b += points
      .map(
        (p) =>
          `<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="#fff" stroke="${accent}" stroke-width="3"/>`,
      )
      .join("");
  }
  return card(x, y, w, h, b);
}
function folderPanel(x, y, w, h, accent, index) {
  let b = `<path d="M${x + 12} ${y + 47}v-21q0-10 10-10h${w * 0.32}l14 15h${w * 0.44}q10 0 10 10v${h - 55}q0 12-12 12H${x + 24}q-12 0-12-12Z" fill="${accent}" opacity=".23"/><path d="M${x + 17} ${y + 48}h${w - 34}l-10 ${h - 64}H${x + 28}Z" fill="${accent}" opacity=".68"/>`;
  if (index % 3 === 0)
    b += `<path d="m${x + w * 0.36} ${y + h * 0.57} 20 16 36-36" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  if (index % 3 === 1)
    b += `<rect x="${x + w * 0.32}" y="${y + h * 0.45}" width="${w * 0.4}" height="${h * 0.32}" rx="7" fill="#fff"/><path d="m${x + w * 0.33} ${y + h * 0.47} ${w * 0.18} ${h * 0.14} ${w * 0.18}-${h * 0.14}" stroke="${accent}" stroke-width="3" fill="none"/>`;
  if (index % 3 === 2)
    b += `<rect x="${x + w * 0.41}" y="${y + h * 0.56}" width="${w * 0.23}" height="${h * 0.24}" rx="5" fill="#fff"/><path d="M${x + w * 0.45} ${y + h * 0.57}v-13a13 13 0 0 1 26 0v13" stroke="#fff" stroke-width="5" fill="none"/>`;
  return `<g transform="rotate(${index % 2 ? -6 : 5} ${x + w / 2} ${y + h / 2})">${b}</g>`;
}
export function createCourseArtwork(course) {
  const title = course.title || course.courseName || "Khóa học",
    id = course.id || course.courseId || title;
  const hash = [...`${id}:${title}`].reduce(
    (a, c) => (a * 31 + c.charCodeAt(0)) >>> 0,
    0,
  );
  const family = courseFamily(course),
    [paper, ink, primary, muted] = palettes[family];
  const number = Number(title.match(/(\d+)$/)?.[1] || (hash % 10) + 1),
    v = (number - 1) % 10;
  const accents = [primary, muted, "#8394ad", "#b28e6e", "#7d9f90"];
  const accent = accents[v % accents.length];
  let scene;
  // Ten arrangements per family: distinct framing, panel proportions and content graphics, not only recoloring.
  const x = 420 + (v % 3) * 20 + ((hash >>> 7) % 11),
    y = 85 + (v % 2) * 24 + ((hash >>> 12) % 9),
    w = 350 - (v % 3) * 22,
    h = 230 + (v % 3) * 24;
  if (family === "web") {
    if (v % 2 === 0)
      scene =
        windowPanel(x, y, w, h, accent, v) +
        codePanel(x + 235, y + 155, 195, 185, primary, v) +
        `<rect x="${x + 32}" y="${y + h + 25}" width="155" height="10" rx="5" fill="${muted}" opacity=".4"/>`;
    else
      scene =
        codePanel(x, y, 260, 245, primary, v) +
        windowPanel(x + 170, y + 135, 230, 190, accent, v) +
        windowPanel(x + 285, y + 7, 95, 135, muted, v);
  } else if (family === "database") {
    const a = [x, y, 170, 139],
      b = [x + 235, y + 70, 165, 139],
      c = [x + 55 + (v % 3) * 35, y + 210, 170, 135];
    scene =
      `<path d="M${a[0] + a[2]} ${a[1] + 80}H${b[0] - 30}V${b[1] + 65}H${b[0]}M${b[0] + 45} ${b[1] + b[3]}v44H${c[0] + 100}v${c[1] - b[1] - b[3] - 44}" stroke="${muted}" stroke-width="3" fill="none"/>` +
      tablePanel(...a, primary, v) +
      tablePanel(...b, accent, v + 2) +
      tablePanel(...c, muted, v + 4);
  } else if (family === "data") {
    scene =
      dataPanel(x, y, w, h, primary, v) +
      dataPanel(x + 200, y + 160, 200, 180, muted, v + 1);
    const dots = Array.from(
      { length: 4 },
      (_, i) =>
        `<circle cx="${x + 22 + i * 43}" cy="${y + h + 57}" r="13" fill="${i === v % 4 ? accent : muted}"/><path d="M${x + 37 + i * 43} ${y + h + 57}h12" stroke="${primary}" stroke-width="2"/>`,
    ).join("");
    scene += dots;
  } else if (family === "math") {
    const points = [
      [x + 45, y + 55],
      [x + 220, y + 30],
      [x + 340, y + 145],
      [x + 190, y + 280],
      [x + 20, y + 220],
    ];
    scene = `<path d="M${points.map((p) => p.join(",")).join(" L")} Z M${points[0]} L${points[3]} M${points[1]} L${points[4]}" fill="none" stroke="${muted}" stroke-width="5"/>`;
    scene += points
      .map(
        (p, i) =>
          `<circle cx="${p[0]}" cy="${p[1]}" r="24" fill="${i % 2 ? primary : accent}"/>${txt(p[0] - 6, p[1] + 6, String.fromCharCode(65 + i), 17, "white", 700)}`,
      )
      .join("");
    scene += card(
      x + 220,
      y + 255,
      150,
      90,
      `<circle cx="${x + 275}" cy="${y + 300}" r="24" fill="${primary}" opacity=".25"/><circle cx="${x + 310}" cy="${y + 300}" r="24" fill="${muted}" opacity=".5"/>`,
    );
  } else if (family === "network") {
    scene =
      `<path d="M${x + 90} ${y + 115}V${y + 170}H${x + 305}V${y + 115}M${x + 195} ${y + 170}v125" stroke="${accent}" stroke-width="5" fill="none"/>` +
      windowPanel(x, y, 165, 115, primary, v) +
      windowPanel(x + 235, y, 165, 115, muted, v + 1);
    scene +=
      card(
        x + 75,
        y + 160,
        245,
        65,
        Array.from(
          { length: 7 },
          (_, i) =>
            `<rect x="${x + 95 + i * 28}" y="${y + 181}" width="18" height="17" rx="2" fill="${primary}"/>`,
        ).join(""),
      ) + windowPanel(x + 105, y + 290, 185, 105, accent, v + 2);
  } else if (family === "spreadsheet") {
    let cells = "";
    for (let r = 0; r < 6; r++)
      for (let col = 0; col < 4; col++)
        cells += `<rect x="${x + 20 + col * 77}" y="${y + 48 + r * 30}" width="76" height="29" fill="${r === 0 || col === 0 ? primary : "#f4f8f5"}" opacity="${r === 0 || col === 0 ? 0.7 : 1}" stroke="#d3e2d9"/>`;
    scene =
      card(
        x,
        y,
        350,
        260,
        txt(x + 20, y + 28, "= SUM(B2:B6)", 15, primary, 700) + cells,
      ) + dataPanel(x + 205, y + 210, 195, 160, primary, v);
  } else if (family === "document") {
    let page = txt(x + 32, y + 45, "PROJECT REPORT", 18, primary, 700);
    for (let i = 0; i < 8; i++)
      page += line(
        x + 32,
        y + 80 + i * 26,
        130 + (i % 3) * 30,
        i === 3 ? primary : "#c2cdd8",
        i === 3 ? 7 : 4,
      );
    scene =
      card(x, y, 265, 330, page, "#fff", -4) +
      card(
        x + 190,
        y + 165,
        180,
        205,
        txt(x + 210, y + 207, "CONTENTS", 13, primary, 700) +
          Array.from({ length: 5 }, (_, i) =>
            line(x + 210, y + 233 + i * 25, 134 - i * 6, muted, 3),
          ).join(""),
        "#fff",
        5,
      );
  } else if (family === "presentation") {
    scene =
      card(
        x,
        y,
        340,
        220,
        txt(x + 25, y + 51, "YOUR NEXT IDEA", 23, primary, 700) +
          line(x + 25, y + 78, 170, muted, 5) +
          `<rect x="${x + 25}" y="${y + 113}" width="120" height="70" rx="8" fill="${accent}" opacity=".25"/><circle cx="${x + 240}" cy="${y + 145}" r="40" fill="${primary}" opacity=".6"/>`,
      ) + dataPanel(x + 160, y + 185, 230, 170, accent, v);
  } else {
    scene =
      windowPanel(x + 55, y, w - 10, h, primary, v) +
      folderPanel(x - 35, y + 145, 205, 175, accent, v) +
      card(
        x + 245,
        y + 195,
        135,
        130,
        txt(x + 265, y + 234, "01  /  02", 14, primary, 700) +
          line(x + 264, y + 255, 90, muted, 4) +
          line(x + 264, y + 271, 63, muted, 4),
        "#fff",
        6 - v,
      );
  }
  const grid = Array.from(
    { length: 18 },
    (_, i) =>
      `<path d="M${410 + i * 30} 45v440" stroke="${ink}" stroke-opacity=".035"/>`,
  ).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540"><defs><filter id="shadow" x="-30%" y="-30%" width="170%" height="180%"><feDropShadow dx="0" dy="10" stdDeviation="13" flood-color="${ink}" flood-opacity=".12"/></filter><linearGradient id="wash"><stop stop-color="${paper}"/><stop offset="1" stop-color="#fff" stop-opacity=".55"/></linearGradient></defs><rect width="960" height="540" fill="${paper}"/><path d="M390 0h570v540H${480 + v * 17}Z" fill="url(#wash)"/>${grid}<ellipse cx="${710 - v * 9}" cy="440" rx="230" ry="35" fill="${ink}" opacity=".04"/>${scene}<path d="M${780 + v * 7} 36v24m-12-12h24" stroke="${muted}" stroke-width="2"/><rect x="394" y="435" width="96" height="5" rx="2.5" fill="${primary}" opacity=".3"/>${txt(855, 500, String(number).padStart(2, "0"), 33, primary, 700)}<circle cx="820" cy="492" r="4" fill="${primary}"/><text x="65" y="490" fill="${ink}" opacity=".08" font-family="Arial,sans-serif" font-size="92" font-weight="700">${escape(family.toUpperCase())}</text></svg>`;
}
export function fallbackCourseCover(course) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(createCourseArtwork(course))}`;
}
