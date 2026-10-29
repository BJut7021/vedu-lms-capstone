# Kế hoạch hoàn thiện VEDU đến ngày 08 tháng 11 năm 2026

Lập ngày 22/10/2026. Còn 17 ngày đến hạn 08/11, hoặc 18 ngày tính cả hai đầu. Mục tiêu bàn giao: ứng dụng chạy được trên máy khác, thực nghiệm có thể tái lập, báo cáo đủ 5 chương, slide khớp kết quả và demo có bằng chứng cho từng yêu cầu STT 6.

Không nên mở thêm nhiều hướng lớn như chatbot tổng quát, app mobile hoặc thêm hàng trăm khóa. Công việc có giá trị nhất hiện nay là hoàn thiện các luồng đã có và đo phần khuyến nghị một cách trung thực. Nhiều tính năng nâng cao trong tài liệu audit là hướng phát triển; không phải mỗi mục đều bắt buộc để đạt chức năng căn bản trong đề cương. Hỏi GVHD chốt phạm vi nghiệm thu ngay buổi 23/10.

## 1. Mốc thời gian và sản phẩm cần chốt

| Ngày | Công việc ưu tiên | Sản phẩm hoặc điều kiện hoàn thành |
|---|---|---|
| 22/10 | Chuẩn bị demo 15 phút, backup; tập 2 lượt | Bộ tài khoản/khóa nhỏ; app healthy; mở được report/replay; có video dự phòng |
| 23/10 | Demo GVHD và ghi phản hồi | Danh sách góp ý chia P0/P1/P2; xác nhận tên thuật toán, phạm vi Chương 5 và mẫu nộp |
| 24–25/10 | Sửa lỗi demo; duyệt 4 khóa Office; cấu hình SMTP; xin MoMo Sandbox | Không lỗi luồng chính; PIN nhận qua email thật; hồ sơ yêu cầu MoMo đã gửi hoặc blocker ghi rõ |
| 26–28/10 | Thực nghiệm nhiều seed, baseline, ablation, sensitivity | CSV/JSON kết quả; source/hash/config; biểu đồ có thể tái tạo; báo cáo cold-start |
| 29–30/10 | Kiểm thử nghiệp vụ có ma trận; bảo mật/quyền; triển khai thử HTTPS nếu chốt phạm vi | Test case có expected/actual/evidence; lỗi P0=0; smoke HTTPS; kiểm tra restore vào môi trường riêng |
| 31/10–01/11 | Hoàn thiện Chương 5; đồng bộ Chương 1–4 với release | Bản Word/PDF đầy đủ; kết quả có nguồn; ảnh cùng phiên bản; mục lục/caption/tham khảo đúng |
| 02–03/11 | Làm slide và tập nói, viết README bàn giao | PPTX/PDF dự kiến 12–15 slide; phân vai và thời gian; kịch bản demo cuối |
| 04–05/11 | Đóng gói source + images + dữ liệu demo + media + model; chạy máy khác | Một thành viên chưa cấu hình trước vẫn chạy theo README; restore thật được kiểm chứng |
| 06/11 | Đóng băng chức năng, diễn tập full | Gắn tag release; app/report/slide thống nhất; quay video demo release |
| 07/11 | Dự phòng sửa lỗi chặn, kiểm tra đúng mẫu nộp | ZIP mở được; checksum; mật khẩu/secret riêng; đủ file và bản in nếu được yêu cầu |
| 08/11 | Nộp trước giờ đóng cổng | Có biên nhận/xác nhận nộp; không để build/huấn luyện cuối cùng vào ngày này |

Chạy các nhánh việc song song theo người; không đợi người làm báo cáo xong mới thu thập kết quả. Đề xuất ba nhóm trách nhiệm, chưa gán tên vì nhóm cần tự chốt năng lực/lịch:

| Người phụ trách | Trách nhiệm chính | Người khác cần kiểm tra chéo |
|---|---|---|
| Thành viên A | Backend, Docker, quyền, SMTP/MoMo, backup/restore | C chạy bộ bàn giao trên máy khác |
| Thành viên B | Dataset, mô hình, HUSPM, thống kê, bảng/biểu đồ Chương 5 | A kiểm tra protocol/API/model artifact |
| Thành viên C | Frontend/học liệu, ảnh, ghép báo cáo/slide và video demo | B kiểm tra số liệu, A kiểm tra mô tả triển khai |

## 2. Thứ tự ưu tiên theo mức ảnh hưởng

### P0 — ảnh hưởng trực tiếp việc demo và nộp

1. Một lệnh khởi động được; frontend gọi API và DB; model artifact được tìm thấy. Xử lý job bị ngắt khi worker restart và đồng bộ trạng thái để nút train không bị khóa bởi job cũ.
2. Không truy cập chéo role/user/khóa; không học khóa trả phí trước PAID; không lộ answer key/token/PIN trên bản dùng thật; thu hồi phiên có hiệu lực.
3. Một khóa nhỏ chạy trọn ghi danh → bài/video/tài liệu → quiz → PDF chứng nhận → xác minh. Dữ liệu/tiến độ vẫn còn sau restart.
4. Một minh chứng đủ pipeline mô hình: CSV có nguồn → experiment → weights/hash → inference → MODEL_CONSTRAINED trên mapping hợp lệ → chọn/lưu/feedback. Có nguồn CURRICULUM cho cold-start và nhận diện rõ.
5. Chương 5 có số đo thật cùng protocol; chỉ ra trường hợp Hybrid không thắng và đánh giá ảnh hưởng của HUSPM.
6. Bộ nộp có media/model/snapshot hoặc demo seed đủ dùng. Chỉ ZIP source và file vedu_v6.sql không mang theo toàn bộ dữ liệu demo hiện tại.

### P1 — hoàn thiện tiêu chí và độ tin cậy

- SMTP thật, PIN hết hạn/giới hạn thử đã kiểm tra. Sau cấu hình đặt PASSWORD_RESET_DEMO_MODE=false, thử hộp thư riêng; không để demo PIN làm phương thức xác minh bản nộp.
- MoMo Sandbox/IPN HTTPS: có keys, kiểm tra chữ ký, amount/order/request, callback lặp, chờ IPN, không tin redirect; ghi bằng chứng gateway. Chưa được cấp tài khoản thì báo GVHD sớm, không đợi 07/11.
- Duyệt 4 khóa Office: nguồn/link đúng, video phù hợp, thời lượng đúng trong lớp, tiên quyết/độ khó/đầu ra hợp lý; dọn khóa seed mỏng khỏi nội dung giới thiệu bản nộp bằng workflow quản trị, không xóa lịch sử học.
- Hoàn thiện các màn hình sửa nội dung/quản trị cần thiết theo góp ý GVHD; test công bố lại và phạm vi teacher được phân công.
- Test suite và HTTPS là tiêu chí trước đây nhóm hoãn; hiện cần xếp lịch để hoàn tất trước nộp nếu GVHD yêu cầu. Tài liệu này chỉ đề xuất kế hoạch, chưa thực hiện các thay đổi triển khai đó.

### P2 — có thời gian mới làm

Chat realtime, thông báo push, giám sát thi, SLA/CSAT, LLM ngoài, nộp/chấm dự án phức tạp, refund vận hành đầy đủ hoặc app mobile. Không lấy những phần này làm điều kiện trì hoãn release nếu GVHD chỉ yêu cầu luồng cơ bản.

## 3. Công việc nghiên cứu mô hình cần làm thêm

### Có phải huấn luyện trên Kaggle không

Không có yêu cầu trong STT 6 bắt buộc huấn luyện ở một nền tảng cụ thể. Chạy local/Docker hoặc Kaggle đều được nếu lưu đầy đủ mã, dữ liệu, protocol và kết quả tái lập. Kaggle hữu ích khi cần notebook chia sẻ hoặc tài nguyên tính toán; chuyển notebook lên Kaggle tự nó không làm mô hình tốt hơn.

Nhóm đã có hai mô hình chính BPR-MF và GRU; Item-KNN từ scikit-learn là baseline huấn luyện/fitted trên cùng train, không phải checkpoint pretrained. HUSPM là thuật toán khai phá riêng. Cần hỏi GVHD liệu cách hiểu “mô hình ngoài” là baseline thư viện có đáp ứng mong đợi hay phải dùng một implementation công bố khác; không tự đổi khái niệm trong báo cáo.

### Thiết kế thực nghiệm tối thiểu đề xuất

1. Mỗi dataset giữ riêng. Ghi version, tác giả, nguồn thu thập, giấy phép, ngày tải, SHA256, số dòng/user/item và quy tắc làm sạch. Được lưu trên Kaggle không tự chứng minh đó là log học viên thật.
2. Giữ split thời gian train/validation/test 70/15/15 và danh sách target cố định. Chỉ train học mô hình/pattern; validation chọn checkpoint/tham số/trọng số; test chỉ báo cáo sau khi chốt. Log người học VEDU và fixture kiểm thử không trộn với Kaggle như một nguồn REAL.
3. Đánh giá 7 nhánh đang có: Popularity, Item-KNN, BPR-MF, GRU, HUSPM-only, BPR+GRU không HUSPM và hybrid đầy đủ. So sánh cùng catalog, cùng user/target, cùng chính sách item lặp.
4. Chạy 5 seed ví dụ 7/21/42/84/2026, báo mean ± std. UI và script `run-ml-benchmarks.mjs` hiện cố định seed42; cần bổ sung runner nhận danh sách seed và không ghi đè report. Không có tham số CLI `--seed` trong engine.py hiện tại, không dùng một lệnh giả định chưa cài.
5. Báo Recall@1/3, NDCG@3, MRR@3, coverage; với catalog lớn thêm @5/10. Bộ chỉ có 5 module không dùng Recall@5=1 làm bằng chứng chất lượng. Nêu biến thể pairwise-MF theo utility do bộ 5 module bị bão hòa.
6. Báo hai bảng: test trên target đủ history/catalog và test_all_targets, ghi số target bị cold. Recommender seed42 hiện chỉ 42/383 target đủ điều kiện; không che 341 target còn lại.
7. Đo tính nhạy utility/HUSPM ở số cấu hình nhỏ có lý do: min_support, utility_ratio, max_length; đừng vét nhiều rồi chọn theo test. Ghi số mẫu, thời gian khai phá giây, bộ nhớ nếu có đo thật; hiện trường runtime_ms trong DB là mili giây cần đổi /1000 khi đưa vào bảng giây.
8. Kiểm tra ablation cùng lượt/target. Nếu làm paired bootstrap, phải lưu metric/hit/rank trên từng target; JSON hiện chủ yếu lưu metric tổng hợp, chưa đủ để tính paired significance đúng. Khoảng tin cậy Recall hiện có không tự động là paired bootstrap so sánh hai mô hình.
9. Chỉ nhận HUSPM cải thiện khi dữ liệu cho thấy, kèm độ bất định. Nếu không: kết luận đóng góp nằm ở pipeline, khả năng truy vết và minh bạch điều kiện, nêu hạn chế rồi bàn hướng cải thiện.

Không huấn luyện lại hàng ngày chỉ để tăng số lượt. Sau khi chốt protocol, chạy các seed/cấu hình đã định và lưu kết quả cả tốt lẫn xấu. Nếu tìm lỗi leakage phải sửa protocol rồi chạy lại các nhánh bị ảnh hưởng; không ghép kết quả trước/sau sửa.

### Nếu chọn Kaggle Notebook

1. Tạo notebook riêng tư; thêm hai dataset gốc và mã engine/replay cùng phiên bản đã chốt. Không upload .env, tokens, dữ liệu cá nhân hay raw log VEDU có danh tính.
2. Ghi phiên bản Python/torch/sklearn và hash mã. Có thể CPU; GPU không bắt buộc với hai bộ hiện tại. Kiểm tra đường dẫn input/output của notebook thay cho đường dẫn Windows.
3. Dùng cùng hàm `train` và config, split, utility, target như local; mỗi dataset/seed là một thư mục output riêng. Chạy smoke một seed trước khi chạy toàn bộ.
4. Lưu notebook version, log, report.json, models.pt, knn.npy và biểu đồ. Không chỉ tải ảnh bảng điểm. Sự khác phiên bản thư viện/phần cứng có thể tạo sai khác, phải ghi trong manifest.
5. Muốn tích hợp trọng số Kaggle vào app cần bước import/đăng ký artifact đúng contract và kiểm tra worker đọc được; hiện app không có luồng import notebook/Kaggle checkpoint hoàn chỉnh qua UI. Không chép đè model tùy tiện hoặc coi có file là đã tích hợp.

Tài liệu notebook/CLI chính thức: https://github.com/Kaggle/kaggle-cli/blob/main/docs/kernels.md

### Có cần người học thật trong 17 ngày

Nếu GVHD đồng ý và có người tham gia tự nguyện, làm pilot nhỏ để kiểm tra tính dùng được: đầu vào → học theo kế hoạch → đầu ra/quiz và phản hồi. Quy định ẩn danh/đồng ý và tách log khỏi tài khoản test. Mẫu nhỏ chỉ hỗ trợ mô tả tính khả thi; không đủ để kết luận nhân quả “AI làm tăng kết quả học tập”. Không tạo người dùng/lượt xem giả để thay pilot.

## 4. Khung Chương 5 đề xuất

Tên: **Thực nghiệm đánh giá và kết luận**. Nếu khoa yêu cầu tên khác, dùng tên theo mẫu GVHD duyệt. Báo cáo hiện đã có Chương 4 mô tả cài đặt; Chương 5 nên tập trung đo lường và kết luận, tránh chép lại mô tả công nghệ.

| Mục | Nội dung cần viết | Bằng chứng đầu vào |
|---|---|---|
| 5.1 Mục tiêu/câu hỏi | RQ1 model next-item; RQ2 HUSPM/ablation; RQ3 lộ trình giữ ràng buộc và phù hợp nhu cầu; RQ4 luồng LMS/quyền/triển khai | Tiêu chí thành công xác định trước |
| 5.2 Dữ liệu/môi trường | Nguồn, license, thống kê, tiền xử lý, utility, split, phiên bản, seed, CPU/GPU | Manifest và hash; bảng dataset |
| 5.3 Phương pháp | BPR/GRU/KNN/Popularity/HUSPM/hybrid; fairness; metric; cold targets | Config/runner; không dùng test chọn tham số |
| 5.4 Kết quả offline | Bảng mean±std, coverage, độ nhạy utility, ablation, runtime | JSON/CSV đủ seed; plot sinh từ số liệu |
| 5.5 Đánh giá tích hợp | Mapping, MODEL/CURRICULUM, 2–4 phương án, lưu/chọn/feedback, tiên quyết/ngân sách | Case study có input/output và log; replay chỉ là minh họa |
| 5.6 Kiểm thử/triển khai | Ma trận STT6, quyền/negative cases, tiến độ/quiz/payment, máy khác/HTTPS/restore | Expected/actual, ảnh/log, phiên bản và ngày chạy |
| 5.7 Thảo luận/hạn chế | Ít dữ liệu VEDU, cold targets, utility thiết kế, fold-in BPR, HUSPM giới hạn, thiếu/đã có SMTP/MoMo | Kết quả quan sát thật; không hứa hiệu quả chưa đo |
| 5.8 Kết luận/hướng phát triển | Đã giải quyết gì so mục tiêu; phần chưa đạt; công việc tiếp theo | Liên kết RQ, tiêu chí STT6 và kết quả |

Hình/bảng nên có: thống kê dataset; pipeline thực nghiệm dùng lại thiết kế đã có nếu phù hợp; biểu đồ metric; bảng ablation/sensitivity; bảng test; ảnh kết quả lộ trình và chứng nhận; cấu hình triển khai. Mỗi hình có chú thích/nguồn/ngày phiên bản; không thêm sơ đồ chỉ để tăng số trang.

Các claim phải nhất quán cả 5 chương: Python ML worker thực tế, BPR/GRU/KNN đúng vai trò, HUSPM cài đặt đúng tên, thời lượng dùng giây, nguồn CURRICULUM không gắn nhãn ML và không gọi giải thích mẫu là LLM. Kiểm tra thứ tự mục 3.7.1/3.7.2: bản 4 chương có thứ tự heading cần rà lại. Cập nhật mục lục/danh mục hình-bảng bằng Word sau lần ghép cuối.

## 5. Slide cho bảo vệ

Chưa tạo PPTX trong công việc này; đây là bố cục để nhóm chốt sau phản hồi GVHD. Chuẩn bị 12–15 slide, rồi điều chỉnh theo thời gian trường quy định. Nếu chỉ 15 phút gồm demo, dành 4–5 phút slide và 8–9 phút demo, còn lại kết luận; không lặp nguyên kịch bản demo GVHD 15 phút cộng thêm 15 slide.

1. Đề tài, nhóm, GVHD.
2. Vấn đề: quá tải nội dung, tiến độ chưa đủ để gợi ý bước tiếp theo.
3. Mục tiêu và phạm vi đã nghiệm thu theo STT6.
4. Kiến trúc và vai trò, một hình từ báo cáo.
5. Học liệu và dữ liệu tương tác; tách Kaggle/REAL/fixture.
6. BPR và GRU: đầu vào, đầu ra, vai trò.
7. HUSPM: một ví dụ maximum embedding + utility/support, không nhồi công thức.
8. Tích hợp hybrid → ràng buộc → 2–4 lộ trình và giải thích.
9. Protocol và tránh leakage/cold-start.
10. Kết quả so sánh có mean/std và ablation; nhận xét cả chỗ thua baseline.
11. Kịch bản live ngắn: xem bài → lộ trình → quiz/chứng nhận → staff/report.
12. Kiểm thử, triển khai, bộ bàn giao.
13. Kết luận và giới hạn/hướng phát triển.
14–15. Dự phòng: công thức/utility, payment callback, nguồn dữ liệu hoặc trả lời hội đồng.

Mỗi slide một luận điểm chính. Biểu đồ trích đúng bảng Chương 5, chữ lớn, ảnh đúng bản release; không đưa username/password/secret. Có video demo release 3–5 phút dự phòng, trình bày rõ khi phát video thay live.

## 6. Đóng gói đủ để chạy trên máy khác

| Thành phần bàn giao | Nội dung tối thiểu |
|---|---|
| Source | frontend, backend, ml-core, data/learning, scripts, package lock, Dockerfile/Compose; gắn commit/tag |
| Database | SQL schema + migration + demo seed; snapshot demo đã xử lý thông tin cá nhân và hướng dẫn restore riêng |
| Media | MP4/PDF nội bộ và metadata nhất quán; link ngoài có nguồn, quyền sử dụng; không tự tải/rehost YouTube |
| Models | Trọng số models.pt, knn.npy, report/manifest, job metadata đúng ID, hash/checkpoint; không chỉ file JSON tổng hợp |
| Nghiên cứu | Notebook/runner, CSV bảng kết quả, seed/config, split/hash, chart source; dataset chỉ phân phối khi giấy phép cho phép |
| Hướng dẫn | START_HERE/README: yêu cầu máy, .env.example, lệnh chạy, khôi phục demo, tài khoản bàn giao riêng, xử lý lỗi |
| Báo cáo | Word và PDF đủ 5 chương, phụ lục/tài liệu tham khảo |
| Trình bày | PPTX và PDF slide, video demo, kịch bản theo role |
| Xác minh | Test results theo release, checksum, danh sách giới hạn, license/third-party notices |

Source ZIP không tự chứa Docker named volume. `docker save` cũng chỉ lưu image, không lưu database/media/model trong volume. Hướng dẫn cần phân biệt **khởi tạo mới bằng seed** và **khôi phục snapshot demo**; snapshot/model/media phải cùng một lần chốt để experiment ID và artifact không lệch.

### Sao lưu database cá nhân trước thay đổi

Đoạn sau tạo backup có timestamp, không sửa/xóa database. Backup này chứa dữ liệu local; chỉ dùng riêng nhóm. Bộ nộp công khai cần snapshot demo không chứa thông tin cá nhân, PIN, session/token; không phát tán bản backup cá nhân này.

```powershell
Set-Location C:\Project\vedu-lms-capstone
New-Item -ItemType Directory -Force -Path .\backups | Out-Null
$veduBackupStamp = Get-Date -Format yyyyMMdd-HHmmss
docker compose exec -T db sh -lc 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc -f /tmp/vedu-before-release.dump'
if ($LASTEXITCODE -ne 0) { throw 'pg_dump failed' }
docker compose cp db:/tmp/vedu-before-release.dump ".\backups\vedu-$veduBackupStamp.dump"
if ($LASTEXITCODE -ne 0) { throw 'Copy backup failed' }
Get-FileHash -Algorithm SHA256 -LiteralPath ".\backups\vedu-$veduBackupStamp.dump"
```

Backup custom format khôi phục bằng pg_restore. Trước khi nộp phải diễn tập trên database/volume riêng; không thử restore đè database đang demo. Database backup không chứa file media và trọng số ML nên cần export hai volume đó riêng theo runbook release. Phần export/import volume và tạo snapshot đã làm sạch cần được triển khai/kiểm chứng trong giai đoạn đóng gói; chưa có một script release toàn bộ đã nghiệm thu ở hiện trạng này.

Nguồn chính thức: [pg_dump PostgreSQL 16](https://www.postgresql.org/docs/16/app-pgdump.html), [Docker volumes](https://docs.docker.com/engine/storage/volumes/).

### Điều kiện nghiệm thu bộ nộp

- Một máy khác chạy app theo README và mở được cả ba vai trò.
- Khóa demo mở đủ media và quiz, cấp/verify chứng nhận đúng điều kiện.
- Experiment SUCCEEDED có artifact thật; replay/predict trả điểm; lộ trình lưu sau reload/restart.
- Không cần copy .env cá nhân từ máy tác giả để khởi động phần core. Keys SMTP/MoMo được điền riêng, trạng thái chưa cấu hình có thông báo rõ.
- Không đưa node_modules, .venv, cache, raw session hoặc secret vào ZIP source. Giữ lockfile/dependency và bản image nếu cần chạy offline.
- Nếu cần demo không Internet: chuẩn bị images đã tải, media được phép dùng nội bộ, model artifact và video demo; các link YouTube/tài liệu ngoài vẫn phụ thuộc Internet.
- Có SHA256 của archive cuối, version/commit trên README và bản lưu dự phòng.

## 7. Checklist câu hỏi chốt với GVHD ngày 23/10

1. Phạm vi cơ bản cho thi/chứng nhận, hỗ trợ và thanh toán có yêu cầu nghiệp vụ nâng cao nào bắt buộc không?
2. KNN thư viện làm mô hình đối chứng có đáp ứng “mô hình ngoài” không; tên HUSPM prefix projection và phạm vi singleton/max_length đã phù hợp không?
3. Chương 5 dùng hai Kaggle, nhiều seed và case study tích hợp có đủ không; pilot VEDU nếu mẫu nhỏ cần trình bày ra sao?
4. Nếu MoMo Sandbox chưa được cấp trước hạn, GVHD yêu cầu dạng minh chứng/thay thế nào? Chỉ mock callback không chứng minh đã tích hợp gateway.
5. Trường yêu cầu bản public HTTPS hay Docker local; quy cách ZIP/thư mục, bản in, Word/PDF/PPT và giờ khóa cổng cụ thể?

Sau buổi gặp, chốt danh sách phải làm trước 08/11 bằng điều kiện nghiệm thu cụ thể, thay vì tiếp tục thêm tính năng không giới hạn.
