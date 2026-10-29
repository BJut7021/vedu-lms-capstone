// Editable subject illustrations. These are diagrams of learning tasks, not app screenshots or official logos.
const text = (x, y, value, size = 20, color = "#31465f", weight = 600) =>
  `<text x="${x}" y="${y}" font-family="Arial,sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}">${value}</text>`;
const rect = (x, y, w, h, fill, rx = 14) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"/>`;
const line = (x, y, w, color = "#cbd5e1", sw = 6) =>
  `<path d="M${x} ${y}h${w}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>`;
const badge = (x, y, letter, color) =>
  `<g filter="url(#soft)">${rect(x, y, 104, 104, color, 22)}${text(x + 52, y + 71, letter, 54, "white", 700).replace("<text ", '<text text-anchor="middle" ')}</g>`;
const arrow = (d, color = "#788da9") =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="4" marker-end="url(#arrow)"/>`;
const panel = (title, accent, body) =>
  `<g filter="url(#soft)">${rect(450, 82, 684, 498, "white", 22)}${rect(450, 82, 684, 62, accent, 22)}${rect(450, 116, 684, 28, accent, 0)}${text(480, 122, title, 22, "white", 700)}<circle cx="1100" cy="113" r="5" fill="white" opacity=".7"/>${body}</g>`;
export function subjectCoverInfo(course) {
  const name = String(
    course.title || course.courseName || "",
  ).toLocaleLowerCase("vi-VN");
  if (name.includes("word"))
    return {
      kind: "word",
      headline: "Word thực hành",
      subtitle: "Styles · Mục lục · Báo cáo",
      ink: "#174a94",
    };
  if (name.includes("excel"))
    return {
      kind: "excel",
      headline: "Excel thực hành",
      subtitle: "Công thức · Bảng tính · Báo cáo",
      ink: "#146345",
    };
  if (name.includes("powerpoint"))
    return {
      kind: "powerpoint",
      headline: "PowerPoint",
      subtitle: "Bố cục · Slide · Thuyết trình",
      ink: "#a2442a",
    };
  if (/office 365|microsoft 365/.test(name))
    return {
      kind: "office",
      headline: "Microsoft 365",
      subtitle: "Tệp · Chia sẻ · Cộng tác",
      ink: "#3e4696",
    };
  if (name === "lập trình hướng đối tượng")
    return {
      kind: "oop",
      headline: "OOP với C#",
      subtitle: "C# · Kế thừa · Đa hình",
      ink: "#563795",
    };
  if (name === "phân tích thiết kế hệ thống")
    return {
      kind: "systems",
      headline: "Thiết kế hệ thống",
      subtitle: "Yêu cầu · UML · Thiết kế",
      ink: "#1b5a78",
    };
  return null;
}
export function createSubjectArtwork(course) {
  const info = subjectCoverInfo(course);
  if (!info) return null;
  let art;
  if (info.kind === "word") {
    art =
      panel(
        "Word  /  BÁO CÁO DỰ ÁN",
        "#2464ba",
        `${rect(475, 164, 172, 387, "#edf3fc", 8)}${text(492, 192, "STYLES", 14, "#215fae")}${rect(489, 211, 143, 47, "white", 6)}${text(501, 241, "Heading 1", 20, "#205cb1")}${text(501, 290, "Heading 2", 17)}${text(501, 337, "Normal", 17)}${line(492, 378, 130)}${line(492, 407, 105)}${rect(668, 165, 433, 386, "#f6f8fb", 8)}${rect(700, 184, 365, 347, "white", 2)}${text(727, 224, "BÁO CÁO DỰ ÁN", 23, "#194e94", 700)}${line(727, 244, 296, "#75a6df", 3)}${text(727, 279, "1. Tổng quan", 18, "#2464ba")}${line(727, 305, 287)}${line(727, 325, 256)}${line(727, 345, 287)}${text(727, 383, "2. Kết quả thực hiện", 18, "#2464ba")}${rect(727, 400, 285, 72, "#e9f1fb", 4)}${line(746, 420, 246, "#8caee0", 3)}${line(746, 442, 213, "#8caee0", 3)}${text(1018, 510, "01", 13, "#7b91aa")}`,
      ) + badge(394, 383, "W", "#205cb3");
  } else if (info.kind === "excel") {
    let cells = "";
    const values = [
      ["Hạng mục", "Dự toán", "Thực chi"],
      ["Tài liệu", "250.000", "220.000"],
      ["Thiết bị", "600.000", "580.000"],
      ["In ấn", "150.000", "120.000"],
      ["Tổng", "1.000.000", "920.000"],
    ];
    for (let y = 0; y < 5; y++)
      for (let x = 0; x < 3; x++)
        cells +=
          rect(
            478 + x * 195,
            245 + y * 44,
            193,
            42,
            y === 0 ? "#e0f1e8" : y === 4 ? "#ecf6ef" : "#fff",
            0,
          ) +
          text(
            490 + x * 195,
            273 + y * 44,
            values[y][x],
            16,
            y === 0 || y === 4 ? "#146345" : "#3c5361",
            y === 0 || y === 4 ? 700 : 400,
          );
    art =
      panel(
        "Excel  /  QUẢN LÝ CHI PHÍ",
        "#177546",
        `${rect(474, 161, 624, 57, "#f0f7f2", 7)}${text(489, 196, "fx", 23, "#147044")}${text(541, 195, "=SUM(C2:C4)", 23, "#345848", 500)}${cells}${rect(478, 477, 590, 52, "#f0f8f3", 7)}${text(495, 510, "Dự toán", 15)}${rect(594, 491, 176, 13, "#8acaaa", 3)}${text(801, 510, "Thực chi", 15)}${rect(891, 491, 148, 13, "#20945e", 3)}<rect x="868" y="420" width="196" height="44" fill="none" stroke="#218956" stroke-width="3"/><rect x="1058" y="458" width="8" height="8" fill="#218956"/>`,
      ) + badge(394, 378, "X", "#16824c");
  } else if (info.kind === "powerpoint") {
    art =
      panel(
        "PowerPoint  /  THUYẾT TRÌNH DỰ ÁN",
        "#c25a38",
        `${rect(474, 165, 122, 387, "#fcf0e9", 8)}${rect(489, 183, 92, 58, "white", 4)}${rect(489, 260, 92, 58, "#f5c5a9", 4)}${rect(489, 337, 92, 58, "white", 4)}${rect(489, 414, 92, 58, "white", 4)}${rect(612, 165, 496, 302, "#fbecdf", 9)}${text(642, 210, "DỰ ÁN NHÓM", 16, "#b65437")}${text(642, 257, "Ý tưởng rõ ràng.", 28, "#683c32", 700)}${text(642, 296, "Trình bày thuyết phục.", 25, "#683c32", 700)}${line(642, 330, 235, "#cb9a7e", 5)}${line(642, 350, 192, "#cb9a7e", 5)}${rect(946, 318, 27, 90, "#d07b57", 4)}${rect(985, 283, 27, 125, "#e7ac85", 4)}${rect(1024, 242, 27, 166, "#9c4f39", 4)}${line(938, 412, 133, "#986b56", 3)}${rect(613, 488, 492, 60, "#fff6ef", 8)}${text(635, 523, "01   Mở đầu     02   Nội dung     03   Kết luận", 16, "#8c503d")}`,
      ) + badge(395, 382, "P", "#c65d38");
  } else if (info.kind === "office") {
    art = `<g filter="url(#soft)">${rect(516, 187, 515, 311, "white", 24)}${text(552, 233, "Microsoft 365", 31, "#3c4386", 700)}${text(552, 266, "HỌC TẬP &amp; CỘNG TÁC", 16, "#66718b")}<path d="M710 332c0-24 20-42 44-40 19-31 67-29 85 2 43-6 63 54 25 70H733c-19 0-28-13-23-32" fill="#dae7ff"/>${text(742, 345, "TỆP NHÓM", 16, "#385cb3")}${rect(552, 402, 439, 57, "#f0f3fc", 9)}${text(572, 437, "Chia sẻ · Phân quyền · Đồng bộ", 20, "#4e5995")}</g>${arrow("M542 165L650 210")}${arrow("M1060 206L1018 282")}${arrow("M1040 509L980 460")}${badge(447, 85, "W", "#2464ba")}${badge(1020, 130, "X", "#218554")}${badge(1000, 477, "P", "#c65c3c")}${rect(489, 469, 118, 75, "#6a64b9", 17)}${text(509, 517, "MAIL", 27, "white", 700)}`;
  } else if (info.kind === "oop") {
    art =
      panel(
        "C#  /  OBJECT ORIENTED PROGRAMMING",
        "#6550a5",
        `${rect(477, 166, 624, 153, "#f4f1fb", 9)}${text(500, 200, "abstract class Hinh", 24, "#6846a1")}${text(500, 239, "{", 23, "#7791a2")}${text(529, 273, "public abstract double DienTich();", 22, "#344e75", 400)}${text(500, 303, "}", 23, "#7791a2")}${rect(705, 344, 190, 67, "#e6def6", 9)}${text(765, 386, "Hinh", 25, "#563795")}${arrow("M656 451V428H755V413")}${arrow("M1010 451V428H850V413")}${rect(515, 455, 278, 76, "#eff4fb", 9)}${text(567, 500, "HinhVuong", 23, "#335c8c")}${rect(865, 455, 230, 76, "#eff7f3", 9)}${text(916, 500, "HinhTron", 23, "#2b6b58")}`,
      ) + badge(393, 377, "C#", "#7053af");
  } else {
    art = panel(
      "UML  /  TỪ YÊU CẦU ĐẾN THIẾT KẾ",
      "#236b86",
      `${text(481, 182, "USE CASE", 14, "#52788e")}<circle cx="507" cy="233" r="15" fill="#c3dce7" stroke="#49798d" stroke-width="3"/><path d="M507 250v50m-25-30h50m-25 30l-24 30m24-30l24 30" fill="none" stroke="#49798d" stroke-width="4"/><path d="M535 270h45" stroke="#7e9eac" stroke-width="3"/><ellipse cx="698" cy="262" rx="112" ry="48" fill="#e3f1f5" stroke="#5899ad" stroke-width="3"/>${text(639, 268, "Nộp bài tập", 20, "#285970")}${rect(867, 188, 217, 145, "#f0f5fb", 10)}${text(891, 225, "Submission", 23, "#365b7b")}${line(882, 241, 186, "#a8bfce", 2)}${text(887, 269, "studentId", 17, "#526b7d", 400)}${text(887, 303, "submit()", 17, "#526b7d", 400)}${text(484, 382, "PHÂN TÍCH → THIẾT KẾ", 16, "#52788e")}${rect(483, 407, 166, 113, "#e1eff4", 10)}${text(504, 450, "Yêu cầu", 22, "#295c73")}${text(504, 487, "FR / NFR", 16, "#5d8291")}${arrow("M657 464h43")}${rect(712, 407, 167, 113, "#ece8f6", 10)}${text(740, 450, "Mô hình", 22, "#69518c")}${text(740, 487, "UML", 16, "#84719d")}${arrow("M886 464h34")}${rect(933, 407, 168, 113, "#e4f2e9", 10)}${text(949, 450, "Hiện thực", 21, "#38664d")}${text(949, 487, "Service / Data", 15, "#63806c")}`,
    );
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675"><defs><linearGradient id="bg"><stop stop-color="#f7f9ff"/><stop offset="1" stop-color="${info.kind === "excel" ? "#d8ede1" : info.kind === "powerpoint" ? "#f6dfcf" : info.kind === "word" ? "#dce9fc" : "#e0e6f5"}"/></linearGradient><filter id="soft" x="-30%" y="-40%" width="170%" height="190%"><feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="${info.ink}" flood-opacity=".15"/></filter><marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="none" stroke="#788da9" stroke-width="1.5"/></marker></defs><rect width="1200" height="675" fill="url(#bg)"/><circle cx="1100" cy="65" r="254" fill="white" opacity=".35"/><circle cx="608" cy="661" r="202" fill="white" opacity=".45"/><path d="M408 60h600M400 614h690" stroke="${info.ink}" opacity=".08" stroke-width="2"/>${art}</svg>`;
}
