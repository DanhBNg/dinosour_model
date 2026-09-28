# Quy trình dựng model, rig và animation bằng code

Cập nhật: 28/09/2026.

Tài liệu làm việc chung cho AI khi tạo hoặc sửa animation: nhân vật, động vật, sinh vật giả tưởng và đồ vật có cơ cấu chuyển động. Không yêu cầu Blender. Có thể dùng rig nhập sẵn, rig tạo bằng code, keyframe, IK hoặc mô phỏng có giới hạn tùy bài toán.

Mục tiêu là chuyển động có chủ ý, phù hợp hình thể, có trọng lượng, phối hợp các bộ phận và hoạt động ổn định trong ứng dụng. Không có công thức bảo đảm mọi animation đều đẹp: phải kết hợp kiểm tra kỹ thuật với đánh giá trên mesh thực tế.

**Cách sử dụng:** đọc phần 1–3 trước khi làm; thực hiện phần 4–10; nghiệm thu theo phần 11; bổ sung bài học vào phần 12. Ví dụ đặt cuối tài liệu, không lấy thông số của ví dụ làm mặc định cho model khác. Đây là hướng dẫn làm việc, không tự động chạy hay tự áp dụng trong mọi phiên.

## 1. Nguyên tắc chung

1. **Có mục đích trước, chuyển động sau.** Xác định đang làm gì, nhìn đâu, tác động lên cái gì và người xem phải nhận ra điều gì.
2. **Root không thay thế khớp.** Root định vị/đổi hướng; cơ thể thể hiện cách tạo lực và phản ứng. Ngoại lệ hợp lý là vật rắn không có khớp hoặc chuyển động thụ động có chủ ý.
3. **Toàn thân có vai trò, không phải toàn thân cùng rung.** Phân biệt phần tạo lực, truyền lực, giữ ổn định và theo đà. Một phần gần như đứng yên có thể đang ổn định chủ động.
4. **Mượt không đồng nghĩa với chậm.** Phải có nhịp và gia tốc phù hợp. Không dùng tốc độ đều cho mọi pha hoặc tăng playback speed để che lỗi.
5. **Chuyển động phụ có nguyên nhân.** Độ trễ đến từ đổi hướng, tăng tốc, tiếp xúc hoặc hãm; không thêm sóng sin vào mọi xương để giả sự mềm mại.
6. **Giữ hình thể và cấu trúc.** Không kéo dài xương, bóp mesh hoặc xoắn khớp để ép đạt mục tiêu ngoài khả năng rig. Phóng đại phải phù hợp phong cách đã chọn.
7. **Mỗi model có cấu hình riêng.** Có thể dùng chung solver, không mặc định dùng chung góc, độ dài bước, hướng gập hoặc độ mềm.
8. **Không che lỗi bằng camera.** Góc đẹp chỉ là một góc kiểm tra; phải xem cả phần bị khuất.
9. **Test đạt không đồng nghĩa animation đẹp.** Không lỗi số học, không xuyên sàn và có đủ nút điều khiển chưa chứng minh được trọng lượng hay diễn xuất.
10. **Báo cáo đúng mức kiểm chứng.** Phân biệt đã viết, build, test, xem ảnh, xem chuyển động và được người dùng chấp nhận. Không gọi là hoàn hảo khi chỉ kiểm tra vài pose.

## 2. Chốt đầu vào và phạm vi

| Nội dung | Cần ghi nhận |
| --- | --- |
| Project | Demo/game, source, file build, repo; tránh sửa nhầm bản sao |
| Model | Asset, phiên bản, tỉ lệ, hướng trước, mesh, rig, clip có sẵn |
| Action | Mục đích, hướng lực, tư thế đầu/cuối, có tương tác mục tiêu không |
| Phong cách | Tự nhiên/cách điệu, mức phóng đại, mạnh/nhẹ |
| Ràng buộc | Dùng clip gốc, retarget hay độc lập hoàn toàn |
| Runtime | Tốc độ mặc định, loop/one-shot/giữ pose, pause/replay, đổi action |
| Thiết bị | Desktop/mobile, ngân sách frame, số model đồng thời |
| Tiêu chí | Dấu hiệu nhìn thấy được; không chỉ ghi “mượt, đẹp” |

Tham chiếu có thể là video, clip trong asset hoặc mô tả. Phải phân biệt xem để học nhịp, lấy pose mẫu, retarget clip và tạo độc lập. Không nói “tự tạo hoàn toàn” nếu vẫn lấy idle/run làm nền mà không thông báo.

Nếu thiếu tham chiếu, chọn phương án hợp lý và ghi giả định. Không hứa chính xác sinh học/cơ học khi chưa có bằng chứng; đặc biệt tách chuyển động minh họa loài tuyệt chủng khỏi khẳng định khoa học.

## 3. Chẩn đoán đúng lớp lỗi

| Dấu hiệu | Kiểm tra trước | Hướng sửa |
| --- | --- | --- |
| Joint đúng nhưng da móp/rách | Topology, weights, bind matrices | Sửa mesh/weights hoặc biên độ |
| Gối/cánh gập ngược | Trục khớp, pole vector, mapping | Sửa rig/solver |
| Chân trượt | Root speed, bước chân, contact | Đồng bộ quãng đường và bước |
| Thân đến đầu xoay như một khối | Root và góc tương đối các đốt | Phân phối lực và độ trễ |
| Toàn thân lắc vẫn vô hồn | Dao động chung, thiếu điểm tựa | Bỏ rung thừa, dựng lại phần chính |
| Đuôi như thanh cứng | Weights, đoạn có ảnh hưởng, độ cong | Phân bố uốn và timing từng đoạn |
| Mượt nhưng thiếu lực | Khoảng cách pose, tăng tốc, hãm | Sửa nhịp, không chỉ tốc độ phát |
| Đứng khom/chân lệch | Pose nhập, hông, chân | Dựng lại pose trung tính |
| Replay/đổi action bị lệch | Pose lưu, mixer, offset tích lũy | Sửa vòng đời controller |

Không mặc định lỗi do prompt. AI phải kiểm tra rig, pose nền, thuật toán và cách tự đánh giá của mình.

## 4. Chuẩn bị model và rig

### 4.1. Khảo sát cấu trúc

- Liệt kê mesh, armature, xương điều khiển/biến dạng/phụ, socket và clip.
- Xác định trục lên/trước, đơn vị, scale root/visual/armature, transform âm hoặc không đều.
- Kiểm tra xương trùng tên; không mặc định xương đầu tiên tìm theo tên là đúng. Xác nhận hierarchy và vertex chịu ảnh hưởng.
- Phân biệt bind pose, rest pose, pose lưu trong asset và frame đầu animation. `skeleton.pose()` không phải cách sửa chung cho mọi asset nhập phức tạp.
- Thử từng khớp trên mesh để xác định chiều quay thực tế.

### 4.2. Khi tự tạo hoặc sửa rig

- Đặt pivot ở khớp/cơ cấu thực, không ở tâm bounding box cho tiện.
- Chọn số đoạn theo vùng cần uốn. Thêm xương chỉ hữu ích nếu topology và weights cho phép mesh biến dạng tại đó.
- Weights chuyển tiếp đủ mềm, không kéo nhầm vùng xa; chuẩn hóa theo giới hạn engine.
- Xác định giới hạn gập/xoắn và hướng ưu tiên. IK cần hướng gập ổn định, không chỉ tìm điểm cuối đúng.
- Kiểm tra vai, hông, cổ, hàm, gốc đuôi/cánh ở biên độ dự kiến trước khi dựng toàn clip.
- Đồ vật cứng dùng bản lề/trượt và chi tiết cứng; không áp biến dạng mềm của sinh vật.
- Chuỗi dài cần số đoạn, vị trí joint và weights phù hợp chiều dài. Xương cuối không có xương con vẫn có thể tác động qua weights, nhưng không được giả định luôn tạo được đoạn uốn nhìn thấy rõ.

### 4.3. Pose trung tính

Dựng pose đứng/nghỉ phù hợp: điểm tựa chạm mặt hỗ trợ, khớp không khóa thẳng hoặc gập sâu quá mức, đầu/cổ không cúi do pose nhập ban đầu. Với sinh vật bay/bơi, dùng pose cân bằng tương ứng, không ép chân chạm sàn.

So sánh trước/sau cùng camera. Lưu pose nền ổn định, không lấy pose đã bị action cũ biến đổi làm nền cho lần tiếp theo.

**Điều kiện chuyển bước:** rig tạo được các pose chính mà không hỏng hình thể nghiêm trọng. Nếu chưa đạt, sửa hoặc ghi rõ hạn chế trước khi thêm chi tiết chuyển động.

## 5. Thiết kế action và lịch phối hợp

Chia thành pha phù hợp; không ép mọi clip phải có đủ các pha dưới đây:

| Pha | Câu hỏi cần trả lời |
| --- | --- |
| Chuẩn bị | Dáng ban đầu, hướng nhìn, điểm tựa? |
| Lấy đà | Bộ phận nào dịch/xoắn trước, trọng lượng chuyển đâu? |
| Phát lực | Bộ phận dẫn động, hướng tác động, lúc nhanh nhất? |
| Theo đà | Phần nào trễ, phần nào giữ ổn định? |
| Hãm/tiếp xúc | Phần nào dừng trước, phần nào đi tiếp, ai đón lực? |
| Hồi phục | Pose đích, bước chân cần thiết, loop hay giữ pose? |

Lập bảng vai trò cho root, chân/điểm tựa, hông/thân, ngực, cổ/đầu, tay/cánh/vây, đuôi/phần mềm. Với mỗi nhóm ghi thời điểm bắt đầu, đỉnh, kết thúc, biên độ và vai trò: dẫn động, truyền lực, ổn định hoặc theo đà.

Không quy định hông luôn dẫn: nhìn có thể bắt đầu từ mắt/đầu; với tay từ vai; cơ cấu máy từ bộ truyền động. Chuỗi dẫn động phụ thuộc hành động.

Dựng pose chính trước, kiểm tra silhouette và quan hệ các phần. Chỉ nội suy khi pose chính đọc được. Pose đẹp riêng lẻ không thay thế đường chuyển tiếp hợp lý.

## 6. Chuyển động chính, tiếp xúc và trọng lượng

### 6.1. Root và trọng tâm

- Tách quỹ đạo, hướng root và biến dạng khớp.
- Tăng tốc/hãm/quay cần chuyển tải và nghiêng thân phù hợp, không chỉ đổi tọa độ.
- Hông chỉ là proxy đơn giản, không phải trọng tâm chính xác toàn mesh; ghi rõ khi dùng proxy.
- Đứng chậm cần cân bằng với vùng hỗ trợ. Chạy/nhảy có pha động; không bắt trọng tâm luôn nằm trên chân trụ.
- Tránh quay quanh pivot sai làm cơ thể chạy vòng ngoài chủ ý.

### 6.2. Chân và IK

- Chốt lịch trụ, nhấc, vung, đặt, nhận tải; giữ mục tiêu chân trong hệ tọa độ phù hợp mặt hỗ trợ.
- Thay đổi thân trước, giải contact sau. Giữ hướng bàn chân và vùng tiếp xúc, không chỉ điểm mắt cá.
- Pole vector và hướng gập phải ổn định; không chấp nhận gối xoắn ngang chỉ vì đầu mút tới đúng chỗ.
- Ngoài tầm với: điều chỉnh hông/bước/quỹ đạo; không kéo dài xương hay bỏ qua sai số.
- Kiểm tra da/ngón/móng: joint ở trên sàn không chứng minh mesh không xuyên sàn.
- Khi quay, chân phải đổi trụ hợp lý; không giữ hai chân cố định trong khi thân xoắn quá mức.

### 6.3. Yêu cầu theo nhóm hành động

| Nhóm | Kiểm tra riêng |
| --- | --- |
| Đi/chạy | Root khớp chiều dài bước; vung khác chịu lực; nhịp thân hợp lý |
| Nhảy/đáp | Đạp, bay, chuẩn bị đáp, nén, phục hồi; đáp lệch chân phải có lý do |
| Ngã | Mất hỗ trợ, tiếp xúc, trượt/lăn/hãm; không chỉ xoay model |
| Bay | Vai, khuỷu, cổ tay phối hợp; nghiêng khi đổi hướng; không rách màng cánh |
| Bơi | Sóng thân/đuôi hoặc lực vây hợp hình thể, liên hệ với tốc độ tiến |
| Nhìn/gầm/thở | Mức tham gia thân tùy biên độ; không kéo cả người cho mọi cái nhìn nhỏ |
| Hai model tương tác | Tiếp cận, hướng/vị trí contact, bám và thả đồng bộ; không giật khi gắn socket |
| Cơ cấu đồ vật | Giới hạn bản lề/trượt, không xuyên hoặc kéo méo chi tiết cứng |

Có trọng lực/giảm chấn chưa đồng nghĩa mô phỏng vật lý đầy đủ. Chỉ gọi là ragdoll/contact physics khi thật sự có solver tương ứng.

## 7. Phối hợp toàn thân và chuyển động phụ

### 7.1. Tránh xoay nguyên khối

Xem góc tương đối các đoạn thân, không chỉ góc so với thế giới. Ngực, cổ, đầu cần phản ứng riêng khi action đòi hỏi: trễ, bù hướng nhìn, theo đà hoặc hãm. Phân bố góc qua nhiều khớp có giới hạn; không bù toàn bộ root vào một đốt cổ.

Các phần không trực tiếp tạo lực vẫn được xem xét: tay theo quán tính, đầu giữ mục tiêu, phần sau cân bằng. Không bắt tất cả phải dao động liên tục. Độ mềm đến từ phối hợp và timing, không từ số xương đang rung.

### 7.2. Chuỗi uốn: đuôi, vòi, cổ dài, phần mềm

- Phân bố độ cong theo chiều dài và cấu trúc; không cộng góc giống nhau cho mọi xương.
- Cú quất thường có cong ngược lấy đà, gốc đi trước, phần xa trễ, độ cong truyền đi rồi hồi phục. Không giữ một hình cong cố định suốt clip.
- “Gốc chắc, ngọn mềm” là cấu hình thường hữu ích, không phải luật cho mọi loài/vật liệu.
- Tăng độ cong giữa chuỗi không được tạo khúc gãy tại một joint. Kiểm tra mesh và hướng tiếp tuyến, không chỉ tổng góc.
- Phần nhanh nhất có thể đang duỗi ra; không cố cong tối đa ở mọi frame.
- Giới hạn độ vượt và số lần dao động khi hãm; tránh lò xo/cao su ngoài chủ ý.
- Xem từ trên, ngang, chéo; một góc có thể che việc đuôi vẫn cứng.

### 7.3. Timing và độ trễ

Cho mỗi nhóm độ trễ có nguyên nhân. Quá trễ tạo cảm giác rời rạc, quá ít thành một khối. Bất đối xứng cần liên hệ chân trụ/hướng lực, không lệch ngẫu nhiên chỉ để bớt máy móc.

Hoàn thiện lực của phần chính trước khi thêm hơi thở, rung nhỏ hoặc ngón tay. Nếu bỏ chi tiết phụ mà action không đọc được, sửa phần chính.

## 8. Quy định triển khai bằng code

- Tách dữ liệu rig, cấu hình model, lịch pha và controller; tái sử dụng solver khi phù hợp.
- Action lấy mẫu theo thời gian phải cho cùng pose tại cùng thời điểm dù thứ tự gọi khác nhau; không cộng offset lên frame trước.
- Mô phỏng có trạng thái cần bước thời gian cố định, reset và tái dựng khi seek; không giả vờ là hàm stateless.
- Phân biệt local/world, đơn vị; không gọi scene unit là mét khi asset chưa chuẩn hóa.
- Lưu/khôi phục position, quaternion, scale nếu đã sửa; tránh mixer và procedural layer tranh nhau ghi xương.
- Quy định thứ tự: pose nền → root → thân → phối hợp chuỗi → contact → cập nhật skeleton/mesh. Lặp solver khi ràng buộc liên kết đòi hỏi.
- Nội suy góc phù hợp, chuẩn hóa quaternion khi cần; kiểm tra biên ±π và hướng quay dài ngoài ý muốn.
- Đường cong liên tục ở các pha cần mềm; không đưa vận tốc về 0 tại mọi key giữa cú vung, cũng không làm mượt mất cú đánh.
- Không bắt mọi offset cuối clip về 0: one-shot có thể giữ pose mới; loop cần khớp pose và vận tốc theo thiết kế.
- Quy định root motion hoặc in-place; không nhân đôi quãng đường bằng cả clip và code.
- Xử lý pause, replay, tốc độ, hủy action, đổi model và dispose. Không để offset cũ hoặc pose nền biến dạng.
- Kiểm tra contact khi crossfade; blend thân đẹp vẫn có thể làm chân trượt. Fade không sửa được reset sai.
- Giữ vòng render nhẹ, tái sử dụng đối tượng khi cần, tránh duyệt toàn bộ vertex nhiều lần mỗi frame. Đo trên thiết bị mục tiêu trước khi tối ưu sâu.
- Build đúng source vào đúng HTML; bản riêng và bản đầy đủ phải đồng bộ.

## 9. Kiểm tra kỹ thuật

Chọn test theo rủi ro. Test chỉ lặp lại bảng thông số không chứng minh chất lượng chuyển động.

- Pose hữu hạn, độ dài xương không đổi ngoài thiết kế, quaternion hợp lệ.
- Contact và xuyên sàn trong ngưỡng phù hợp kích thước model, không dùng một ngưỡng tuyệt đối cho mọi asset.
- Lấy mẫu lặp lại, seek/reset, loop và chuyển action ổn định.
- Đặc tính có ý nghĩa: ngực nâng, chuỗi thay đổi độ cong, phần phụ trễ, cú đánh nhanh hơn hồi phục khi thiết kế yêu cầu.
- Cô lập clip nguồn nếu action phải độc lập.
- Kiểm tra bước thời gian/tốc độ/frame rate khác nhau; máy chậm không được đổi quỹ đạo hoặc bỏ qua contact quan trọng.
- Kiểm tra browser, asset, cảnh báo binding và các nút điều khiển.

Test skeleton không chứng minh mesh không tự xuyên, không chứng minh cân bằng vật lý hoặc animation đẹp. Ghi rõ giới hạn của bằng chứng.

## 10. Kiểm tra trực quan và vòng chỉnh sửa

1. Giữ bản trước để đối chiếu cùng model, ánh sáng, camera và tốc độ.
2. Xem toàn clip ở 1× và tốc độ mặc định; xem chậm vùng nghi ngờ. Ảnh pose không thay cho xem nhịp liên tục.
3. Xem ngang, trước/sau, chéo; thêm góc trên khi uốn/quay. Không cắt mất chân, đầu hoặc ngọn đuôi ở pha cực đại.
4. Xem mesh có vật liệu, bóng, mặt hỗ trợ; skeleton/wireframe dùng bổ sung để chẩn đoán.
5. Tập trung bắt đầu, chuyển pha, contact, hãm, đường nối loop; không chỉ pose đỉnh.
6. So tham chiếu về mục đích/timing/lực; không ép hai hình thể khác nhau cùng biên độ.
7. Sửa lỗi lớn nhất trước: hình thể/pose → contact/quỹ đạo → timing/lực → phối hợp → chi tiết.
8. Nếu chỉ xem được ảnh và số liệu, phải ghi rõ chưa kiểm chứng playback; không đánh dấu nhịp điệu đã nghiệm thu.

AI phải tự rà toàn thân theo vai trò ở phần 5, không chờ người dùng chỉ từng chỗ cứng.

## 11. Checklist bàn giao

- [ ] Đúng project/model/action và phạm vi.
- [ ] Pose nền hợp lý; mesh giữ hình thể ở biên độ sử dụng.
- [ ] Nhận ra hành động và hướng lực từ hình thể tổng quát.
- [ ] Contact, đổi trụ và hướng gập hợp lý.
- [ ] Nhịp phù hợp; không chậm đều hoặc khựng ở mọi key.
- [ ] Các nhóm phối hợp, không vô tình xoay nguyên khối.
- [ ] Chuyển động phụ có nguyên nhân, không rung thừa/cao su.
- [ ] Chuỗi dài uốn và trễ phù hợp, không chỉ đổi hướng nguyên chuỗi.
- [ ] Đầu/cuối, loop/giữ pose đúng thiết kế; đổi action sạch.
- [ ] Test, nhiều góc và playback đã kiểm tra; phần chưa kiểm tra ghi rõ.
- [ ] Build đúng demo, không đổi phần ngoài phạm vi.
- [ ] Báo cáo file cần mở, tên action, bằng chứng và hạn chế.

Trạng thái nên dùng: **bản dựng → đã kiểm tra kỹ thuật → đã rà trực quan → người dùng chấp nhận**. Không gộp thành “hoàn hảo”. Push/deploy theo yêu cầu phiên làm việc, không tự coi sửa animation là yêu cầu xuất bản.

## 12. Bài học từ các vòng sửa trước

| Thiếu sót | Bài học áp dụng về sau |
| --- | --- |
| Chỉ nâng/hạ/xoay model | Dựng cách khớp tạo và đón lực, không chỉ root |
| Rig đứng ổn được coi là rig tốt | Thử pose cực hạn trên mesh thực |
| Pose asset nhấc chân được lấy làm nền | Dựng lại pose trung tính |
| Hạ hông lâu để trông nặng | Chỉ nén ở pha cần; trọng lượng còn ở contact/timing/chuyển tải |
| Thân trên theo root nguyên khối | Phân vai giữ hướng, dẫn động và theo đà |
| Gầm lớn chỉ ngửa cổ | Phân phối sang thân/ngực và cân bằng phần sau |
| Quét đuôi bằng xoay người chậm | Lấy đà, tăng tốc, hãm và chuyển động riêng của đuôi |
| Tăng góc đuôi đồng đều | Độ cong và timing riêng từng đoạn; kiểm tra từ trên |
| IK đúng điểm nhưng gối xoắn | Hướng gập/giới hạn là bắt buộc, đầu mút đúng chưa đủ |
| Retarget chung một clip cho nhiều loài | Hiệu chỉnh từng hình thể và dáng đi, chỉ dùng chung phần phù hợp |
| Chụp vài pose rồi kết luận đẹp | Xem chuyển động liên tục và đường nối |
| Test pass được coi là tự nhiên | Tách bằng chứng kỹ thuật khỏi đánh giá thị giác |
| Thêm nhiều action khi nền còn lỗi | Hoàn thiện một action đại diện trước |
| Sao chép ngưỡng/góc từ một model | Chuẩn hóa và hiệu chỉnh, không bê nguyên số |
| Chỉ sửa đúng chỗ người dùng nhắc | Chủ động rà toàn bộ chuỗi lực và phần liên quan |
| Gọi procedural là vật lý/chính xác | Mô tả đúng kỹ thuật và mức giả định |

Sau phản hồi mới, bổ sung bài học tái sử dụng ở đây. Thông số riêng để ở tài liệu action/ví dụ, không biến thành luật chung.

## 13. Mẫu ghi chú cho action tiếp theo

```text
Project / source / file build:
Model và phiên bản rig:
Action / mục đích / phong cách:
Tham chiếu và cách sử dụng:
Pose đầu / cuối / loop hoặc one-shot:
Các pha và mốc thời gian:
Nhóm dẫn động / truyền lực / ổn định / theo đà:
Contact / lịch đổi trụ / quỹ đạo root:
Giới hạn rig, mesh và giả định:
Test kỹ thuật:
Góc nhìn và playback cần kiểm tra:
Đã kiểm chứng / chưa kiểm chứng:
Lỗi còn lại / bài học mới:
```

## 14. Ví dụ: T-Rex ngửa mặt gầm rồi quét đuôi

Đây là ví dụ của demo hiện tại, không phải công thức chung hoặc tái dựng sinh cơ học đã xác nhận của T-Rex.

**Phạm vi:** code trên rig có sẵn, không Blender, không lấy clip gốc làm nền. Có xem `TailWhip` của Stego để học nhịp lấy đà–quất–hãm, không retarget clip đó.

**Các lỗi từng gặp:** khom lâu; quét như xoay đều; IK gối xoắn; thân trên cứng; gầm tập trung ở cổ; đuôi như thanh xoay ngang. Đây là bài học dẫn đến các quy định chung phía trên.

**Gầm:** đứng vững, điều chỉnh hông, nâng thân trước/ngực rồi cổ–đầu theo sau; đuôi hạ nhẹ với độ trễ. Phân bố góc ngửa qua thân và cổ. Giữ chân tiếp đất; các phần trở về lệch nhịp có kiểm soát.

**Quét:** chuyển tải về chân trụ, lấy đà ngược; hông dẫn, ngực/đầu giữ hướng có giới hạn rồi theo sau. Chân đổi trụ; tay/cổ tay phản ứng nhẹ. Đuôi cong ngược, gốc đi trước khi phần xa còn trễ; độ cong truyền ra ngọn rồi hãm. Gốc tương đối chắc, phần giữa uốn rõ hơn theo mesh, không tăng góc đồng loạt.

**Bằng chứng hiện có:** test cô lập clip, pose hữu hạn, contact joint, tư thế đứng, phối hợp khớp, nâng ngực/hạ đuôi, độ trễ đuôi, reset và tương phản tốc độ; ảnh nhiều góc và kiểm tra chuyển action trong browser. Không suy từ đó rằng đã ngang animation gốc hoặc không tự xuyên mesh ở mọi frame.

**File tham khảo:** `src/demos/trex/roar-sweep.js`, `tests/trex-roar-sweep.test.mjs`, `scripts/check-roar-sweep.mjs`; ảnh tại `artifacts/roar-sweep/`. Mọi góc và mốc thời gian trong module là cấu hình riêng của action này.
