# VEDU: Hệ thống khuyến nghị — hướng dẫn nghiên cứu và demo

Ngày cập nhật: 15/10/2026. Đây là tài liệu giải thích phần Học máy & HUSPM của STT 6, không tự quy đổi thành điểm hội đồng.

## 1. Chính xác hệ thống đã cài gì?

Bổ sung 15/10/2026: [nhiều phương án theo mục tiêu/trình độ/công việc, học liệu Office và replay Kaggle](LEARNING_CONTENT_AND_PATHS.md). Bộ lập kế hoạch có ràng buộc học thuật, không phải thêm một mô hình huấn luyện thứ ba; giải thích mặc định không phải LLM.

Hai mô hình chính **được huấn luyện**:

| Thành phần | Đầu vào | Cách học | Đầu ra / vai trò |
|---|---|---|---|
| BPR Matrix Factorization | Quan hệ học viên–nội dung trong train | Embedding học viên/nội dung, loss cặp ưu tiên `-log sigmoid(score(u,i)-score(u,j))`, regularization | Điểm phù hợp theo sở thích dài hạn |
| GRU next-item | Chuỗi nội dung đã học, tối đa 20 bước | Embedding → GRU → Linear, cross-entropy dự đoán nội dung kế tiếp | Điểm phù hợp theo thứ tự lịch sử |
| Item-KNN đối chứng bên ngoài | Ma trận nhị phân item–user chỉ từ train | `sklearn.neighbors.NearestNeighbors`, cosine, tối đa 30 hàng xóm khác item | Baseline thư viện độc lập để kiểm tra mô hình tự cài |
| HUSPM | Chuỗi item và utility của từng tương tác | Khai phá prefix projection, SWU pruning, maximum embedding | Mẫu thứ tự hữu ích và điểm từ mẫu |

“Mô hình bên ngoài” ở đây là thuật toán baseline từ scikit-learn **fitted trên cùng dữ liệu train**, không phải checkpoint pretrained của một tổ chức khác. Không gọi GRU tự cài là bản sao nguyên vẹn GRU4Rec: đó là một bộ dự đoán next-item thích nghi với dữ liệu giáo dục. HUSPM không phải mạng học sâu và không tính là một trong hai mô hình huấn luyện chính.

Code: `ml-core/engine.py` (adapter, khai phá, training, đánh giá, inference); `ml-core/server.py` (worker nội bộ); `backend/src/platform/recommendation.service.ts` (job, registry, mapping, gợi ý và lưu PostgreSQL). Worker không mở cổng ra Internet và có khóa `ML_INTERNAL_TOKEN`.

## 2. Hai bộ Kaggle phải dùng khác nhau

### A. Student Learning Interaction Logs

Nguồn nhóm cung cấp: [Student Learning Interaction Logs Dataset](https://www.kaggle.com/datasets/ziya07/student-learning-interaction-logs-dataset).

File thực tế trên máy: `student_learning_interaction_dataset.csv`: 9.000 dòng, 300 học viên, **5 module**. Lấy `student_id`, `module_id`, `timestamp`. Chuyển `time_spent_minutes × 60` thành giây; utility tính:

```text
utility(event) = 1 + min(time_spent_seconds, 3600)/600 + clip(quiz_score, 0, 100)/100
```

Utility là **điểm thiết kế, không có đơn vị**, không phải thời lượng hay xác suất. Duration cap giảm ảnh hưởng các lượt học cực dài; điểm quiz chỉ mô tả kết quả tại tương tác đã xảy ra. Công thức cần được GVHD duyệt và làm sensitivity analysis, không mặc nhiên là thước đo “học tốt”.

Không đưa `next_module_prediction`, `success_label`, `cumulative_quiz_score`, `learning_trend` vào features: nhãn có sẵn hoặc tổng hợp sai thời điểm có thể làm rò rỉ thông tin tương lai. **Nhãn GRU được tự xây từ item thật kế tiếp sau khi sắp thời gian**, không học theo cột dự đoán sẵn.

281/300 học viên đã thấy cả 5 module trong train của lần chạy seed 42. BPR tiêu chuẩn không lấy được item “chưa thấy” cho những người này. Vì vậy adapter bộ này dùng **cặp ưu tiên theo utility trung bình chỉ trong train**: module utility cao được ưu tiên hơn module utility thấp. Đây là biến thể pairwise-MF phải ghi rõ trong báo cáo, không trình bày như BPR implicit tiêu chuẩn. Bộ này thích hợp kiểm chứng pipeline/utility; không nên dùng làm bằng chứng mô hình gợi ý mạnh trên catalog lớn.

### B. E-learning Recommender System

Nguồn nhóm cung cấp: [E-learning Recommender System Dataset](https://www.kaggle.com/datasets/nhondangcode/e-learning-recommender-system-dataset).

File `implicit_ratings_en.csv`: 21.908 tương tác, 3.007 người dùng, 957 item ở toàn bộ file. Train của lần chạy seed 42 có 15.335 tương tác, 2.314 người dùng và 746 item. `created_at` là thứ tự thời gian; các lần xem lặp giữ lại cho GRU/HUSPM, nhưng ma trận KNN/BPR implicit dùng các cặp user–item duy nhất.

File chỉ có click, không có duration/điểm học tập: đặt utility **1 mỗi click**, không bịa thời gian/điểm để nâng kết quả HUSPM. Với utility đồng nhất, utility phản ánh cấu trúc/tần suất chuỗi, không chứng minh giá trị sư phạm. `items_en.csv` cung cấp tên/mô tả nội dung cho mapping; `explicit_ratings_en.csv` chưa dùng cho loss hiện tại, có thể làm thí nghiệm utility theo đánh giá trong phiên bản sau. Không dùng số `nb_views` tổng hợp toàn thời gian làm feature train.

Kaggle là nơi lưu trữ, **không tự chứng minh dữ liệu được thu thập từ học viên thật**. Nhóm cần lưu ZIP gốc, tác giả, version/ngày tải, giấy phép và mô tả nguồn thu thập. Bộ thứ nhất có thể là dữ liệu mô phỏng; chưa xác minh nên không gọi nó là log thực. Timestamp không có timezone được giả định UTC để xếp thứ tự; đây không phải xác nhận múi giờ gốc. Các dòng trùng timestamp có tie-break xác định, không chứng minh thứ tự ngoài thực tế.

## 3. HUSPM hoạt động thế nào?

Ví dụ chuỗi `A[1] → B[2] → A[8] → B[4]`. Mẫu `A → B` có nhiều lần khớp; utility trong chuỗi này là **max(1+2, 1+4, 8+4) = 12**, không cộng cả ba lần thành 20. Utility toàn dataset bằng tổng utility lớn nhất ở mỗi chuỗi chứa mẫu. Support bằng số chuỗi chứa mẫu / số chuỗi.

Thuật toán đang cài:

1. Mỗi lịch sử học viên là một chuỗi singleton-itemset; dùng tối đa 100 tương tác cuối **của train** cho HUSPM.
2. Mở rộng prefix bằng item tiếp theo; lưu mọi vị trí kết thúc khớp và utility tốt nhất của embedding kết thúc ở vị trí đó.
3. Loại ứng viên không đủ support hoặc có **Sequence Weighted Utility (SWU)** nhỏ hơn min utility. SWU cộng utility của những chuỗi chứa prefix nên là cận trên an toàn.
4. Tính utility thật bằng maximum embedding. Giữ mẫu đủ ngưỡng; mặc định độ dài tối đa 3.
5. Nếu vượt 200.000 ứng viên thì job **FAILED**, không nhận một phần kết quả rồi ghi thành công. Tăng ngưỡng hoặc giảm độ dài để chạy lại.

Mặc định min support 0,02; min utility tuyệt đối = 0,01 × tổng utility của tập chuỗi train. Không trộn tham số relative ratio với con số utility tuyệt đối trong báo cáo.

Tên đúng: **VEDU-PrefixProjection-HUSPM**, khai phá chính xác trong phạm vi singleton-itemset và độ dài được cấu hình. **Không tuyên bố đã cài HUSP-SP/USpan nguyên bản**, không hỗ trợ itemset nhiều sự kiện đồng thời. Script `python scripts/check-huspm.py` đối chiếu 14 mẫu với phép duyệt exhaustive, gồm item lặp và khoảng trống giữa bước; đây là kiểm tra toán học, không phải metric nghiên cứu từ dữ liệu thật.

## 4. Chia tập và đo chất lượng không rò rỉ

Chia **thời gian toàn cục 70% / 15% / 15%**. Chỉ train học embedding, ma trận KNN, utility/mẫu HUSPM. Validation chọn checkpoint BPR/GRU và trọng số blend. Test chỉ đo, không dùng chỉnh tham số. Catalog đánh giá là toàn bộ item của train, không lấy mẫu 99 negatives để làm kết quả dễ hơn.

Mỗi học viên trong từng split: lấy tương tác đầu tiên trong khoảng đó làm target, dùng lịch sử thực sự trước target làm context. Lịch sử validation có thể làm context khi test vì nó đã xảy ra trước target; **không dùng để cập nhật trọng số**. Review/item lặp được phép; đây là bài toán **next-item**, chưa phải “khóa chưa học đầu tiên”.

- Recall@K: target có trong K gợi ý đầu không?
- MRR@K: target càng đứng đầu thì điểm càng cao, `1/rank` nếu lọt top-K.
- NDCG@K với một target: `1/log2(rank+1)` nếu lọt top-K.
- Catalog coverage: tỷ lệ item xuất hiện trong các danh sách gợi ý; không phải tỷ lệ học viên được hỗ trợ.
- Khoảng tin cậy Recall 95% dùng Wilson; chưa chứng minh khác biệt có ý nghĩa thống kê giữa mô hình.

Báo cáo có **hai mẫu số**: `test` chỉ trên target thuộc catalog train và có lịch sử; `test_all_targets` tính target không hỗ trợ là miss. Bộ recommender có **42 target hợp lệ / 383 target toàn bộ**, 341 target thiếu item/lịch sử. Không chỉ trích metric trên 42 rồi quảng cáo là hiệu quả cho cả 3.007 người. Hai JSON seed 42 trong `docs/experiments/` đã được chạy lại, có đủ hai mẫu số và 7 nhánh so sánh.

Với 5 module, Recall@5 = 100% dù xếp thứ tự kém. Trình bày Recall@1/@3 và NDCG@3, không lấy Recall@5 làm thành tích. Hai dataset phải báo cáo riêng, **không cộng trung bình metric có ý nghĩa khác nhau**.

### Kết quả chạy thực tế seed 42, 8 epochs

Các giá trị dưới đây là trên tập test có lịch sử và target thuộc catalog train; NDCG không phải phần trăm độ chính xác.

| Nhánh | Logs: Recall@3 / NDCG@3 (298 target) | Recommender: Recall@3 / NDCG@3 (42 target) |
|---|---|---|
| BPR-MF | 0,6074 / 0,4428 | 0,1429 / 0,1222 |
| GRU next-item | 0,5604 / 0,4042 | 0,1190 / 0,0777 |
| Item-KNN ngoài | 0,6007 / 0,4291 | 0,0476 / 0,0388 |
| Popularity | 0,6107 / 0,4233 | 0,0238 / 0,0238 |
| HUSPM-only | 0,6040 / 0,4173 | 0,0238 / 0,0150 |
| BPR+GRU, bỏ HUSPM | 0,6074 / 0,4469 | 0,0952 / 0,0865 |
| Hybrid đủ ba nhánh | 0,5973 / 0,4312 | 0,0952 / 0,0865 |

Trên **toàn bộ 383 target** của Recommender, Recall@3 của BPR chỉ **0,0157**, hybrid **0,0104**. Đây là hạn chế coverage rất lớn, không được che bằng bảng 42 target. Logs không có cold target bị bỏ trong lần chạy này, nhưng chỉ có 5 module nên bài toán khác hẳn.

Kết luận nghiên cứu hiện tại: pipeline chạy thật, nhưng **chưa có bằng chứng hybrid/HUSPM cải thiện chất lượng**. Logs có Popularity đạt Recall@3 cao hơn hybrid; Recommender có BPR đứng trên hybrid. HUSPM-only yếu và hybrid bằng ablation trên Recommender. Khi bảo vệ, trình bày cả kết quả không thuận lợi và kế hoạch nhiều seeds, paired significance, utility sensitivity và dữ liệu VEDU thật; không chỉnh test để tạo bảng đẹp. Chi tiết số thập phân, CI, loss và hash nằm trong [Logs](experiments/kaggle_logs-seed42.json) và [Recommender](experiments/kaggle_recommender-seed42.json).

## 5. Pipeline tích hợp với ứng dụng

```text
CSV Kaggle / log REAL đã kiểm chứng
→ hash nguồn + làm sạch + split thời gian
→ BPR + GRU; KNN baseline; HUSPM train-only
→ validation chọn checkpoint/trọng số
→ test đo metric + lưu models.pt/report.json/knn.npy
→ experiment + model_registry + mining_run
→ lịch sử học viên → scoring → lọc khóa/bài hợp lệ → gợi ý PostgreSQL
→ UI lộ trình/phòng học → feedback → dữ liệu cho nghiên cứu tiếp theo
```

Score hybrid = `w_bpr × normalized(BPR) + w_gru × normalized(GRU) + w_huspm × normalized(HUSPM)`. Trọng số chọn trên validation trong một grid nhỏ; điểm 0–1 là **điểm xếp hạng, không phải xác suất**. Item-KNN không được trộn vào hybrid để giữ vai trò đối chứng. Baseline có thể thắng; hệ thống không mặc định tuyên bố hybrid tốt nhất.

Với người dùng ngoài dataset, BPR dùng fold-in: trung bình embedding các item trong lịch sử đã mapping. Đây là **heuristic cold-user**, không phải embedding user được huấn luyện hoặc fine-tune cho người đó.

Không lấy ID module/item Kaggle chia dư rồi gán vào lesson VEDU. Có hai cách dùng hợp lệ:

1. Huấn luyện `vedu_real` từ log VEDU đủ dữ liệu; item là lesson ID gốc. Chỉ nhận `REAL`, loại tài khoản test/khách, chỉ lấy event server-clock hoặc hoàn thành tài liệu do server ghi nhận. Tối thiểu 30 event, 3 người và 3 item, nhưng mức tối thiểu này **không đủ** để kết luận nghiên cứu tốt.
2. Khi chuyển miền Kaggle, admin duyệt mapping **cùng nội dung thật** giữa item gốc và lesson. `prepare-reference-course.py` tạo 10 bài Office 365 từ metadata gốc kèm nguồn và mapping đúng ID; không tạo học viên/log/điểm giả. Đây là demo chuyển miền, chưa phải đánh giá thực nghiệm trên VEDU. Nội dung lịch sử cần cập nhật/thẩm định và kiểm tra giấy phép trước khi xuất bản công khai.

Học viên mới không có lịch sử hoặc không có mapping phù hợp: **FALLBACK theo thứ tự bài học**, ghi rõ nguồn, không gắn nhãn AI. Phòng học tạo lại gợi ý khi mở bằng tài khoản thành viên; trang Lộ trình gợi ý cũng có nút tạo từ log mới nhất. Khi ML lỗi, không chặn việc học/lưu tiến độ. Gợi ý không vượt quyền thanh toán và không cấp quyền học. Khách không dùng pipeline cá nhân và không dùng log khách để huấn luyện.

## 6. Cách chạy và trình diễn

PowerShell tại thư mục dự án:

```powershell
Set-Location C:\Project\vedu-lms-capstone
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\import-ml-datasets.ps1
docker compose up --build -d
docker compose ps
```

Mở `http://localhost:8080/admin/login`, dùng tài khoản quản trị của nhóm (không công khai tài khoản/mật khẩu lên giao diện). Vào **HUSPM Mining** → chọn dataset → epochs 8 → Huấn luyện → chờ SUCCEEDED → Xem kết quả → Xuất JSON. Làm cả hai dataset. Đối chiếu source SHA256, thời gian cắt tập, số user/item, số target và metric.

Chạy qua terminal thay vì bấm UI:

```powershell
node .\scripts\run-ml-benchmarks.mjs
python .\scripts\prepare-reference-course.py
```

Script benchmark dùng tài khoản nội bộ mặc định của dữ liệu demo; nếu nhóm đổi mật khẩu, cấu hình `VEDU_ADMIN_USERNAME` và `VEDU_ADMIN_PASSWORD` trong terminal của mình, không gửi secret trong chat. Script reference cần tài khoản giảng viên và admin tương tự.

Demo suy luận: đăng ký **tài khoản thành viên**, mở khóa Office 365 tham chiếu → đọc một bài có mapping → chuyển sang bài khác hoặc mở lại phòng học → xem gợi ý MODEL; vào Lộ trình gợi ý → chọn khóa → Tạo gợi ý → Phù hợp/Bỏ qua. Khách bị chặn có chủ đích. Lần đầu chưa có lịch sử phải thấy FALLBACK; đây là hành vi đúng.

## 7. Gợi ý kế hoạch nâng chất lượng để bảo vệ đồ án

1. Xác minh nguồn/giấy phép, phát hiện trùng/sai timestamp, phân bố số lượt/user, mật độ user–item. Làm bảng chất lượng dữ liệu trước metric.
2. Chốt với GVHD mục tiêu: dự đoán bài kế tiếp hay cải thiện kết quả học tập. Next-item offline không chứng minh tăng điểm/giảm bỏ học.
3. Thực nghiệm 3–5 seeds (42, 43, 44…), mean ± std; giữ test cố định. Làm paired bootstrap trên cùng target để so mô hình. Tuning chỉ trên validation, không đổi dataset sau khi xem test rồi chọn kết quả đẹp.
4. Ablation: BPR; GRU; KNN; Popularity; HUSPM-only; BPR+GRU không HUSPM; hybrid đủ ba nhánh. JSON đã có cả 7 nhánh; trọng số ablation chọn riêng trên validation. Bổ sung paired bootstrap để kiểm tra đóng góp HUSPM có ý nghĩa thống kê hay không.
5. Phân tích cold-start/coverage toàn bộ target; bổ sung curriculum-order bên cạnh Popularity đã cài để tránh xem mô hình phức tạp là mặc nhiên tốt hơn.
6. Thử utility có/không quiz-score, các cap thời lượng và min utility/support. Với dataset click-only phải công bố hạn chế utility=1.
7. Thu log của học viên thật đã đồng ý tham gia, không dùng tài khoản test/khách. Đánh giá lại chuyển miền; có thể fine-tune GRU và fold-in/tái huấn luyện BPR trên VEDU.
8. Nếu đề cương bắt buộc **HUSP-SP**, bổ sung bản thư viện SPMF tương ứng và benchmark với implementation hiện tại; không đổi nhãn thuật toán để đáp ứng trên giấy.

## 8. Tài liệu nền tảng

- BPR: [Rendle và cộng sự, BPR: Bayesian Personalized Ranking](https://arxiv.org/abs/1205.2618).
- GRU cho recommendation: [Session-based Recommendations with Recurrent Neural Networks](https://arxiv.org/abs/1511.06939).
- HUSPM tham chiếu: [SPMF — USpan và định dạng utility sequences](https://www.philippe-fournier-viger.com/spmf/USpan.php).
- Đối chứng: [scikit-learn NearestNeighbors](https://scikit-learn.org/stable/modules/generated/sklearn.neighbors.NearestNeighbors.html).

Đọc các bài gốc để viết STT 5 và phần kiến thức trong báo cáo; code, dữ liệu, giao thức đánh giá và kết quả phải khớp với phần STT 6 đã chạy.
