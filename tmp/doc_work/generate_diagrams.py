from __future__ import annotations

import math
from pathlib import Path
from textwrap import wrap

from PIL import Image, ImageDraw, ImageFont


OUT = Path(__file__).parent / "new_media"
OUT.mkdir(parents=True, exist_ok=True)

FONT = Path(r"C:\Windows\Fonts\arial.ttf")
FONT_BOLD = Path(r"C:\Windows\Fonts\arialbd.ttf")


def font(size: int, bold: bool = False):
    return ImageFont.truetype(str(FONT_BOLD if bold else FONT), size)


def canvas(width: int, height: int):
    return Image.new("RGB", (width, height), "white"), ImageDraw.Draw(Image.new("RGB", (1, 1)))


def draw_text_center(draw, xy, text, size=26, bold=False, fill="#172033", spacing=5):
    x, y = xy
    f = font(size, bold)
    box = draw.multiline_textbbox((0, 0), text, font=f, align="center", spacing=spacing)
    draw.multiline_text((x - (box[2] - box[0]) / 2, y - (box[3] - box[1]) / 2), text,
                        font=f, fill=fill, align="center", spacing=spacing)


def rounded(draw, box, title, lines=(), fill="#F7F9FC", outline="#64748B", title_fill=None,
            title_size=25, text_size=20, radius=18, width=3):
    x1, y1, x2, y2 = box
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)
    if title_fill:
        draw.rounded_rectangle((x1, y1, x2, min(y2, y1 + 48)), radius=radius, fill=title_fill, outline=outline, width=width)
        draw.rectangle((x1, y1 + 27, x2, y1 + 48), fill=title_fill)
    f = font(title_size, True)
    draw.text((x1 + 14, y1 + 10), title, font=f, fill="#111827")
    if lines:
        body = "\n".join(lines)
        draw.multiline_text((x1 + 14, y1 + 60), body, font=font(text_size), fill="#243044", spacing=5)


def ellipse(draw, box, text, fill="#F8FAFC", outline="#64748B", size=22, width=2):
    draw.ellipse(box, fill=fill, outline=outline, width=width)
    draw_text_center(draw, ((box[0] + box[2]) / 2, (box[1] + box[3]) / 2), text, size=size)


def arrow(draw, start, end, fill="#64748B", width=3, dash=False):
    x1, y1 = start
    x2, y2 = end
    if dash:
        dx, dy = x2 - x1, y2 - y1
        length = max(1, math.hypot(dx, dy))
        ux, uy = dx / length, dy / length
        pos = 0
        while pos < length - 16:
            s = pos
            e = min(pos + 14, length - 16)
            draw.line((x1 + ux * s, y1 + uy * s, x1 + ux * e, y1 + uy * e), fill=fill, width=width)
            pos += 24
    else:
        draw.line((x1, y1, x2, y2), fill=fill, width=width)
    angle = math.atan2(y2 - y1, x2 - x1)
    length = 16
    spread = 0.55
    p1 = (x2 - length * math.cos(angle - spread), y2 - length * math.sin(angle - spread))
    p2 = (x2 - length * math.cos(angle + spread), y2 - length * math.sin(angle + spread))
    draw.polygon([end, p1, p2], fill=fill)


def actor(draw, x, y, label, side="left"):
    draw.ellipse((x - 13, y - 65, x + 13, y - 39), outline="#334155", width=3)
    draw.line((x, y - 39, x, y + 10), fill="#334155", width=3)
    draw.line((x - 28, y - 20, x + 28, y - 20), fill="#334155", width=3)
    draw.line((x, y + 10, x - 25, y + 48), fill="#334155", width=3)
    draw.line((x, y + 10, x + 25, y + 48), fill="#334155", width=3)
    tx = x - 88 if side == "left" else x + 88
    draw_text_center(draw, (tx, y + 85), label, size=22, bold=True)


def use_case_overall():
    im = Image.new("RGB", (1600, 1080), "white")
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((175, 35, 1425, 1040), radius=18, outline="#334155", width=3)
    draw_text_center(d, (800, 68), "VEDU Learning Management System", 30, True)
    actor(d, 85, 500, "Học viên", "right")
    actor(d, 1510, 300, "Giảng viên", "left")
    actor(d, 1510, 760, "Quản trị viên", "left")
    student = [
        ((235, 135, 690, 220), "Đăng ký, đăng nhập, đổi mật khẩu"),
        ((235, 280, 690, 365), "Tìm kiếm, ghi danh, checkout"),
        ((235, 425, 690, 510), "Học video/PDF và lưu tiến độ"),
        ((235, 570, 690, 655), "Làm quiz và nhận chứng nhận"),
        ((235, 715, 690, 800), "Sinh và chọn 2–4 lộ trình"),
        ((235, 860, 690, 945), "Q&A, ticket và phản hồi"),
    ]
    staff = [
        ((900, 140, 1360, 225), "Quản lý khóa, bài và học liệu"),
        ((900, 270, 1360, 355), "Quản lý quiz, sổ điểm, Q&A"),
        ((900, 400, 1360, 485), "Xem học viên và báo cáo khóa"),
        ((900, 600, 1360, 685), "Quản lý user, role và session"),
        ((900, 730, 1360, 815), "Phân công, thanh toán, ticket"),
        ((900, 860, 1360, 945), "Huấn luyện, HUSPM và mapping"),
    ]
    for box, text in student + staff:
        ellipse(d, box, text, size=21)
    for _, box in enumerate(student):
        cy = (box[0][1] + box[0][3]) / 2
        arrow(d, (145, 500), (235, cy), width=2)
    for box, _ in staff[:3]:
        cy = (box[1] + box[3]) / 2
        arrow(d, (1450, 300), (1360, cy), width=2)
    for box, _ in staff[3:]:
        cy = (box[1] + box[3]) / 2
        arrow(d, (1450, 760), (1360, cy), width=2)
    ellipse(d, (700, 405, 875, 495), "Kiểm tra\nquyền", fill="#EEF2FF", outline="#6366F1", size=19)
    ellipse(d, (700, 555, 875, 645), "Ghi log\nserver-clock", fill="#ECFDF5", outline="#10B981", size=18)
    ellipse(d, (700, 705, 875, 795), "Xếp hạng\nML + HUSPM", fill="#FFF7ED", outline="#F97316", size=18)
    arrow(d, (690, 322), (700, 450), dash=True, width=2)
    arrow(d, (690, 468), (700, 600), dash=True, width=2)
    arrow(d, (690, 758), (700, 750), dash=True, width=2)
    im.save(OUT / "image2.png", quality=95)


def use_case_student():
    im = Image.new("RGB", (1600, 1000), "white")
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((175, 35, 1425, 960), radius=18, outline="#334155", width=3)
    draw_text_center(d, (800, 68), "Phân hệ Học viên", 30, True)
    actor(d, 80, 470, "Học viên", "right")
    cases = [
        ((245, 125, 710, 215), "Xác thực tài khoản"),
        ((245, 285, 710, 375), "Khám phá và ghi danh khóa học"),
        ((245, 445, 710, 535), "Học bài và theo dõi tiến độ"),
        ((245, 605, 710, 695), "Thi quiz và nhận chứng nhận"),
        ((245, 765, 710, 855), "Tạo, chọn và đánh giá lộ trình"),
    ]
    for box, text in cases:
        ellipse(d, box, text, size=22)
        arrow(d, (145, 470), (245, (box[1] + box[3]) / 2), width=2)
    ext = [
        ((925, 125, 1350, 215), "Quên mật khẩu bằng PIN email"),
        ((925, 285, 1350, 375), "Thanh toán MoMo cho khóa có phí"),
        ((925, 445, 1350, 535), "Video/PDF, thời gian xem thực"),
        ((925, 605, 1350, 695), "Draft, deadline, PDF chứng nhận"),
        ((925, 765, 1350, 855), "2–4 phương án và feedback"),
    ]
    for (box, text), (src, _) in zip(ext, cases):
        ellipse(d, box, text, fill="#F8FAFC", size=20)
        arrow(d, (925, (box[1] + box[3]) / 2), (710, (src[1] + src[3]) / 2), dash=True, width=2)
    draw_text_center(d, (820, 115), "«extend/include»", 17)
    draw_text_center(d, (820, 275), "«extend/include»", 17)
    draw_text_center(d, (820, 435), "«include»", 17)
    draw_text_center(d, (820, 595), "«include»", 17)
    draw_text_center(d, (820, 755), "«include»", 17)
    ellipse(d, (570, 880, 1030, 945), "Q&A và ticket hỗ trợ", fill="#F1F5F9", size=20)
    arrow(d, (145, 470), (570, 912), width=2)
    im.save(OUT / "image3.png", quality=95)


def use_case_staff():
    im = Image.new("RGB", (1600, 1160), "white")
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((190, 35, 1435, 1120), radius=18, outline="#334155", width=3)
    draw_text_center(d, (810, 70), "Phân hệ Giảng viên và Quản trị viên", 30, True)
    actor(d, 85, 335, "Giảng viên", "right")
    actor(d, 85, 840, "Quản trị viên", "right")
    teacher = [
        ((265, 120, 800, 205), "Quản lý khóa, chương, bài và học liệu"),
        ((265, 245, 800, 330), "Quản lý quiz, sổ điểm và chứng nhận"),
        ((265, 370, 800, 455), "Xem roster, tiến độ và báo cáo khóa"),
        ((265, 495, 800, 580), "Khai báo độ khó, tiên quyết, đầu ra"),
    ]
    admin = [
        ((265, 665, 800, 750), "Quản lý người dùng, vai trò và phiên"),
        ((265, 790, 800, 875), "Phân công giảng viên và xử lý ticket"),
        ((265, 915, 800, 1000), "Theo dõi thanh toán và báo cáo hệ thống"),
    ]
    for box, text in teacher:
        ellipse(d, box, text, size=21)
        arrow(d, (150, 335), (265, (box[1] + box[3]) / 2), width=2)
    for box, text in admin:
        ellipse(d, box, text, size=21)
        arrow(d, (150, 840), (265, (box[1] + box[3]) / 2), width=2)
    ext = [
        ((955, 150, 1360, 245), "Upload MP4/PDF và kiểm tra quyền"),
        ((955, 315, 1360, 410), "Q&A theo khóa và phản hồi học viên"),
        ((955, 615, 1360, 710), "Chạy BPR, GRU, KNN và HUSPM"),
        ((955, 780, 1360, 875), "Duyệt mapping và replay Kaggle"),
        ((955, 945, 1360, 1040), "Xuất báo cáo CSV có bộ lọc"),
    ]
    for box, text in ext:
        ellipse(d, box, text, fill="#F8FAFC", size=19)
    arrow(d, (800, 162), (955, 197), dash=True, width=2)
    arrow(d, (800, 412), (955, 362), dash=True, width=2)
    arrow(d, (800, 832), (955, 662), dash=True, width=2)
    arrow(d, (800, 832), (955, 827), dash=True, width=2)
    arrow(d, (800, 958), (955, 992), dash=True, width=2)
    im.save(OUT / "image4.png", quality=95)


def analysis_class():
    im = Image.new("RGB", (900, 2300), "white")
    d = ImageDraw.Draw(im)
    draw_text_center(d, (450, 45), "Sơ đồ lớp mức phân tích VEDU", 32, True)
    boxes = {
        "user": (180, 95, 720, 300),
        "enroll": (180, 390, 720, 590),
        "course": (180, 680, 720, 900),
        "lesson": (180, 990, 720, 1220),
        "assessment": (55, 1340, 430, 1590),
        "state": (470, 1340, 845, 1590),
        "model": (55, 1720, 430, 1970),
        "path": (470, 1720, 845, 1970),
        "support": (180, 2070, 720, 2250),
    }
    rounded(d, boxes["user"], "User", ["userId, username, role", "đăng nhập, quản lý phiên"], title_fill="#E0F2FE", text_size=22)
    rounded(d, boxes["enroll"], "Enrollment", ["student, course, status", "kiểm tra quyền học/thanh toán"], title_fill="#EDE9FE", text_size=22)
    rounded(d, boxes["course"], "Course", ["courseId, teacher, topic, price", "gồm chương, bài, học liệu"], title_fill="#DCFCE7", text_size=22)
    rounded(d, boxes["lesson"], "Lesson", ["lessonId, order, content", "pedagogy, prerequisites, resources"], title_fill="#DCFCE7", text_size=22)
    rounded(d, boxes["assessment"], "Assessment", ["quiz, question, answer", "attempt, draft, certificate"], title_fill="#FCE7F3", text_size=20)
    rounded(d, boxes["state"], "LearningState", ["event log, progress", "video state, actual seconds"], title_fill="#CCFBF1", text_size=20)
    rounded(d, boxes["model"], "ModelExperiment", ["BPR, GRU, Item-KNN", "HUSPM patterns, mapping"], title_fill="#FFEDD5", text_size=20)
    rounded(d, boxes["path"], "LearningPath", ["recommendation, path set", "selection, explanation, feedback"], title_fill="#F3E8FF", text_size=20)
    rounded(d, boxes["support"], "Interaction", ["course Q&A, teacher assignment, support ticket"], title_fill="#F1F5F9", text_size=21)
    for a, b in [("user", "enroll"), ("enroll", "course"), ("course", "lesson")]:
        arrow(d, ((boxes[a][0] + boxes[a][2]) / 2, boxes[a][3]), ((boxes[b][0] + boxes[b][2]) / 2, boxes[b][1]))
    arrow(d, (400, boxes["lesson"][3]), (260, boxes["assessment"][1]))
    arrow(d, (500, boxes["lesson"][3]), (655, boxes["state"][1]))
    arrow(d, (650, boxes["state"][3]), (655, boxes["path"][1]))
    arrow(d, (250, boxes["model"][1]), (250, boxes["model"][1] - 75), dash=True)
    arrow(d, (430, 1840), (470, 1840), dash=True)
    arrow(d, (450, boxes["path"][3]), (450, boxes["support"][1]))
    im.save(OUT / "image5.png", quality=95)


def architecture():
    im = Image.new("RGB", (2200, 1050), "white")
    d = ImageDraw.Draw(im)
    draw_text_center(d, (1100, 45), "Kiến trúc triển khai VEDU", 34, True)
    rounded(d, (45, 155, 360, 330), "Người dùng", ["Student", "Teacher", "Admin"], fill="#EFF6FF", outline="#2563EB", title_fill="#DBEAFE", title_size=27, text_size=22)
    rounded(d, (450, 120, 820, 365), "Frontend React", ["Vite + Router", "UI theo vai trò", "YouTube IFrame API"], fill="#ECFDF5", outline="#16A34A", title_fill="#DCFCE7", title_size=27, text_size=21)
    rounded(d, (910, 120, 1300, 365), "Backend NestJS", ["JWT + session + RBAC", "LMS, quiz, payment", "reports, Q&A, tickets"], fill="#FFF7ED", outline="#EA580C", title_fill="#FFEDD5", title_size=27, text_size=21)
    rounded(d, (1435, 95, 1800, 390), "PostgreSQL 16", ["8 schema, 42 bảng", "giao dịch + ràng buộc", "log, tiến độ, mô hình"], fill="#ECFEFF", outline="#0891B2", title_fill="#CFFAFE", title_size=27, text_size=21)
    rounded(d, (730, 570, 1160, 840), "ML Worker Python", ["PyTorch BPR + GRU", "scikit-learn Item-KNN", "VEDU HUSPM + inference"], fill="#EEF2FF", outline="#4F46E5", title_fill="#E0E7FF", title_size=27, text_size=21)
    rounded(d, (1280, 570, 1690, 840), "Model artifacts", ["models.pt", "knn.npy", "report.json + hashes"], fill="#F5F3FF", outline="#7C3AED", title_fill="#EDE9FE", title_size=27, text_size=21)
    rounded(d, (1845, 570, 2155, 785), "Dịch vụ ngoài", ["MoMo Sandbox", "SMTP", "YouTube"], fill="#FFF1F2", outline="#E11D48", title_fill="#FFE4E6", title_size=26, text_size=21)
    arrow(d, (360, 245), (450, 245)); draw_text_center(d, (405, 220), "HTTPS", 17)
    arrow(d, (820, 245), (910, 245)); draw_text_center(d, (865, 220), "/api", 17)
    arrow(d, (1300, 245), (1435, 245)); draw_text_center(d, (1368, 220), "SQL", 17)
    arrow(d, (1080, 365), (950, 570)); draw_text_center(d, (1045, 475), "token nội bộ", 17)
    arrow(d, (1160, 705), (1280, 705)); draw_text_center(d, (1220, 675), "đọc/ghi", 17)
    arrow(d, (1450, 570), (1570, 390)); draw_text_center(d, (1550, 485), "registry/jobs", 17)
    arrow(d, (1300, 330), (1845, 650), dash=True); draw_text_center(d, (1640, 465), "adapter có cấu hình", 17)
    d.rounded_rectangle((400, 70, 1825, 910), radius=26, outline="#94A3B8", width=3)
    draw_text_center(d, (1110, 955), "Docker Compose: frontend/nginx, backend, PostgreSQL và ML worker; secrets chỉ truyền qua biến môi trường", 23)
    im.save(OUT / "image6.png", quality=95)


def design_class():
    im = Image.new("RGB", (2300, 950), "white")
    d = ImageDraw.Draw(im)
    draw_text_center(d, (1150, 40), "Sơ đồ lớp mức thiết kế VEDU", 34, True)
    rounded(d, (40, 120, 360, 360), "React views", ["AuthModal", "Classroom", "QuizView", "LearningPaths", "Operations"], title_fill="#DBEAFE", text_size=20)
    rounded(d, (430, 120, 760, 360), "Controllers", ["AuthController", "PlatformController", "CoursesController", "AssessmentController"], title_fill="#E0E7FF", text_size=20)
    rounded(d, (835, 85, 1245, 410), "Core services", ["AuthService", "AccessService", "CoursesService", "LearningService", "ExamService", "PlatformService"], title_fill="#DCFCE7", text_size=20)
    rounded(d, (1320, 85, 1745, 410), "AI and paths", ["RecommendationService", "LearningPathService", "PathPlanner", "MomoService", "External explain adapter"], title_fill="#FFEDD5", text_size=20)
    rounded(d, (1820, 120, 2250, 360), "Data and workers", ["TypeORM/DataSource", "PostgreSQL", "Python ML worker", "model artifacts"], title_fill="#CFFAFE", text_size=20)
    rounded(d, (430, 550, 760, 820), "Guards", ["JwtAuthGuard", "ApiPolicyGuard", "AuthRateGuard", "Roles metadata"], title_fill="#FCE7F3", text_size=20)
    rounded(d, (835, 550, 1245, 820), "Domain checks", ["ownership", "enrollment/payment gate", "quiz deadline/attempt", "signed media tickets"], title_fill="#F1F5F9", text_size=20)
    rounded(d, (1320, 550, 1745, 820), "ML contract", ["train/replay/predict", "dataset hash", "BPR/GRU components", "fallback CURRICULUM"], title_fill="#F3E8FF", text_size=20)
    arrow(d, (360, 240), (430, 240)); arrow(d, (760, 240), (835, 240)); arrow(d, (1245, 240), (1320, 240)); arrow(d, (1745, 240), (1820, 240))
    arrow(d, (595, 360), (595, 550), dash=True); arrow(d, (1040, 410), (1040, 550), dash=True); arrow(d, (1535, 410), (1535, 550), dash=True)
    im.save(OUT / "image7.png", quality=95)


def erd_domains():
    im = Image.new("RGB", (2400, 1550), "white")
    d = ImageDraw.Draw(im)
    draw_text_center(d, (1200, 45), "ERD mức miền dữ liệu VEDU", 38, True, fill="#0F4C81")
    draw_text_center(d, (1200, 92), "8 schema - 42 bảng triển khai trên PostgreSQL", 24, fill="#475569")
    groups = [
        ((40, 140, 600, 440), "AUTH", ["users", "user_sessions", "password_reset_tokens", "request_limits"], "#E0F2FE", "#38BDF8"),
        ((640, 140, 1310, 520), "LMS", ["courses", "course_sections", "course_teachers", "lessons", "lesson_resources", "lesson_pedagogy", "certificates", "course_questions", "course_messages"], "#DCFCE7", "#22C55E"),
        ((1350, 140, 1820, 370), "ENROLLMENT", ["enrollments"], "#EDE9FE", "#8B5CF6"),
        ((1860, 140, 2360, 410), "PAYMENT", ["orders", "payments", "momo_requests"], "#FFEDD5", "#F97316"),
        ((40, 590, 730, 980), "ASSESSMENT", ["quizzes", "questions", "answers", "quiz_attempts", "quiz_attempt_answers", "attempt_drafts"], "#FCE7F3", "#EC4899"),
        ((770, 590, 1770, 1260), "LEARNING", ["learning_sequence_logs", "lesson_progress", "video_state", "watch_sessions", "watch_receipts", "dataset_mappings", "experiments", "mining_runs", "high_utility_patterns", "pattern_steps", "model_registry", "learning_path_recommendations", "recommendation_feedback", "path_sets", "path_feedback"], "#CCFBF1", "#14B8A6"),
        ((1810, 590, 2360, 860), "SUPPORT", ["tickets", "ticket_messages"], "#EDE9FE", "#7C3AED"),
        ((1810, 970, 2360, 1240), "SYSTEM_CONFIG", ["settings", "audit_logs"], "#DBEAFE", "#2563EB"),
    ]
    for box, title, lines, fill, outline in groups:
        rounded(d, box, title, lines, fill=fill, outline=outline, title_fill=fill, title_size=29, text_size=22)
    arrow(d, (600, 290), (640, 290)); arrow(d, (1310, 300), (1350, 255)); arrow(d, (1820, 255), (1860, 255))
    arrow(d, (975, 520), (975, 590)); arrow(d, (375, 440), (375, 590)); arrow(d, (2110, 410), (2110, 590))
    arrow(d, (1770, 760), (1810, 725)); arrow(d, (1770, 1110), (1810, 1105))
    draw_text_center(d, (1200, 1370), "Quan hệ trung tâm: users → enrollments → courses → lessons → quiz/progress/log → recommendation/path", 25)
    draw_text_center(d, (1200, 1420), "Các bảng sự kiện, thanh toán và kết quả mô hình lưu lịch sử; nội dung LMS dùng trạng thái xuất bản và soft delete", 23, fill="#475569")
    im.save(OUT / "image8.png", quality=95)


def ml_pipeline():
    im = Image.new("RGB", (2300, 1000), "white")
    d = ImageDraw.Draw(im)
    draw_text_center(d, (1150, 42), "Pipeline huấn luyện, HUSPM và sinh lộ trình", 34, True)
    top = [
        ((45, 130, 365, 315), "1. Nguồn dữ liệu", ["Kaggle có nguồn/hash", "VEDU REAL có đồng ý"], "#DBEAFE"),
        ((430, 130, 750, 315), "2. Chuẩn hóa", ["validate, UTC, utility", "chia thời gian 70/15/15"], "#F1F5F9"),
        ((815, 130, 1135, 315), "3. Huấn luyện", ["BPR-MF", "GRU next-item"], "#DCFCE7"),
        ((1200, 130, 1520, 315), "4. Đối chứng", ["Item-KNN, Popularity", "ablation"], "#FFEDD5"),
        ((1585, 130, 1905, 315), "5. HUSPM", ["prefix projection", "SWU + max embedding"], "#FCE7F3"),
        ((1970, 130, 2255, 315), "6. Artifact", ["models.pt, knn.npy", "report.json"], "#EDE9FE"),
    ]
    for box, title, lines, color in top:
        rounded(d, box, title, lines, fill=color, outline="#64748B", title_fill=color, title_size=24, text_size=19)
    for i in range(len(top) - 1):
        arrow(d, (top[i][0][2], 220), (top[i + 1][0][0], 220))
    bottom = [
        ((210, 555, 570, 770), "7. Registry", ["experiment + version", "metrics + hashes"], "#E0E7FF"),
        ((690, 555, 1050, 770), "8. Inference", ["mapping cùng nội dung", "BPR/GRU/HUSPM score"], "#CFFAFE"),
        ((1170, 555, 1530, 770), "9. Path planner", ["mục tiêu + trình độ", "tiên quyết + ngân sách"], "#DCFCE7"),
        ((1650, 555, 2010, 770), "10. Ứng dụng", ["2–4 lộ trình", "chọn, học, feedback"], "#DBEAFE"),
    ]
    for box, title, lines, color in bottom:
        rounded(d, box, title, lines, fill=color, outline="#64748B", title_fill=color, title_size=25, text_size=20)
    arrow(d, (2110, 315), (390, 555));
    for i in range(len(bottom) - 1):
        arrow(d, (bottom[i][0][2], 662), (bottom[i + 1][0][0], 662))
    arrow(d, (1830, 770), (840, 870), dash=True)
    draw_text_center(d, (1200, 895), "Feedback và log đủ điều kiện quay lại tập dữ liệu REAL; khách và tài khoản kiểm thử bị loại", 24)
    draw_text_center(d, (1200, 940), "Khi không có lịch sử hoặc mapping hợp lệ, hệ thống dùng CURRICULUM và hiển thị rõ nguồn", 22, fill="#475569")
    im.save(OUT / "image9.png", quality=95)


if __name__ == "__main__":
    use_case_overall()
    use_case_student()
    use_case_staff()
    analysis_class()
    architecture()
    design_class()
    erd_domains()
    ml_pipeline()
    print(OUT)
