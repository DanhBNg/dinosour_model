# Quy trình tạo animation bằng code

Áp dụng cho demo khủng long và động vật. Mục tiêu là chuyển động có chủ ý, có trọng lượng và phối hợp toàn thân. Không yêu cầu Blender; animation có thể được dựng bằng code trên rig hiện có.

## 1. Nguyên tắc bắt buộc

- **Không coi việc xoay hay dịch chuyển model là một động tác hoàn chỉnh.** Root chỉ định vị và đổi hướng; các khớp phải thể hiện việc cơ thể tạo lực, truyền lực và đón lực.
- **Toàn thân phải có vai trò.** Với cú quét đuôi, chân, hông, ngực, cổ, đầu và tay đều cần được xem xét. Một bộ phận có thể ổn định chủ động thay vì chuyển động rõ; không bắt buộc mọi xương phải rung.
- **Không để thân giữa đến đầu trở thành một khối cứng.** Ngực theo hông với độ trễ; cổ và đầu có thể giữ hướng nhìn rồi bắt kịp. Khi hãm, các phần không đồng loạt dừng.
- **Chuyển động phụ phải có nguyên nhân.** Độ trễ xuất phát từ bước chân, tăng tốc, đổi hướng hoặc hãm. Không thêm sóng sin liên tục vào tất cả xương để giả sự mềm mại.
- **Chân trụ phải chắc.** Chân chịu lực giữ điểm tiếp xúc; chân đổi trụ có nhấc, đặt và nhận trọng lượng. Không sửa xuyên sàn bằng cách nâng cả model ở mỗi frame.
- **Giữ tư thế bình thường ngoài các pha cần hạ người.** Lấy đà không đồng nghĩa với khom người suốt clip. Kiểm tra dáng đứng trước khi thêm hành động.
- **Không dùng một công thức cho mọi loài.** Tỉ lệ cơ thể, hướng gập khớp, độ dài đuôi và cách di chuyển quyết định cách dựng riêng.
- **Mượt không đồng nghĩa với chậm.** Phải có tương phản giữa lấy đà, phát lực và hồi phục. Cú đánh cần tăng tốc rõ, không chỉ quay đều.
- **Không tuyên bố đẹp dựa trên test số liệu.** Test phát hiện lỗi kỹ thuật; đánh giá hình thể và nhịp điệu cần xem chuyển động thực tế.

## 2. Khảo sát model và rig

1. Xác định xương điều khiển và xương biến dạng; chú ý xương trùng tên, xương phụ và các nhóm scale.
2. Kiểm tra hướng trước, trục quay, độ dài từng đoạn chân, giới hạn gập và hướng đầu gối.
3. Thử các tư thế cực hạn trên mesh: vai, hông, cổ, hàm, gốc đuôi. Ghi rõ lỗi thuộc skin weights, rig hay animation.
4. Dựng tư thế trung tính có hai chân tiếp đất và trọng lượng hợp lý. Không mặc định frame đầu của asset là dáng đứng chuẩn.
5. Nếu action phải độc lập, thử khi đã xóa toàn bộ clip nguồn. Có thể xem clip khác để học nhịp, nhưng phải ghi rõ có sao chép/retarget hay không.

## 3. Thiết kế động tác trước khi code

Viết ngắn gọn: mục đích, hướng lực, thời lượng, điểm tiếp xúc, tư thế đầu/cuối và hành vi khi phát lặp hoặc đổi action.

Chia thành các pha:

| Pha | Cần xác định |
| --- | --- |
| Chuẩn bị | Dáng đứng, hướng nhìn, chân nào chịu lực |
| Lấy đà | Chuyển trọng lượng, xoắn ngược, vị trí bộ phận chính |
| Phát lực | Chân đẩy, hông dẫn, tốc độ cực đại và hướng tác động |
| Theo đà | Ngực, cổ, đầu, tay và đuôi phản ứng theo thứ tự |
| Hãm | Chân đón lực, thân cân bằng, các phần vượt nhẹ rồi dừng |
| Hồi phục | Trở về dáng đứng bằng bước chân và chuyển trọng lượng hợp lý |

Ghi mốc thời gian cho từng phần, không dùng chung một hệ số nội suy cho toàn bộ cơ thể.

## 4. Dựng từ chuyển động chính đến chuyển động phụ

1. **Chân và trọng tâm:** chốt lịch chân trụ/chân bước; dịch hông có giới hạn về phía hỗ trợ. IK chỉ giải vị trí khớp, không tự bảo đảm cơ thể có trọng lượng.
2. **Hông và thân:** hông dẫn phát lực; ngực có xoắn tương đối và nghiêng vừa đủ. Tránh xoay root rồi coi phần thân đã hoàn thành.
3. **Cổ và đầu:** phân bố góc qua nhiều đốt; giữ hướng nhìn có giới hạn rồi theo chuyển động. Không bù toàn bộ góc root vào một đốt cổ.
4. **Đuôi:** lực truyền từ gốc ra ngọn; độ trễ tăng dần và biên độ phù hợp từng đoạn. Tránh gập một khớp quá mạnh hoặc đuôi tự xuyên thân.
5. **Tay, cổ tay, hàm:** phản ứng nhỏ theo gia tốc/hãm. Hai bên không nhất thiết giống hệt nhau khi thân đang xoay hoặc chịu lực lệch.
6. **Hồi phục:** giảm chuyển động phụ về không một cách liên tục. Không cắt pose, kéo ngược toàn bộ clip hoặc reset đột ngột để tạo vòng lặp.

Ưu tiên sửa tư thế và thời điểm trước khi thêm chi tiết. Nếu bỏ chuyển động phụ mà action chính chưa thuyết phục thì chưa chuyển sang bước đánh bóng.

## 5. Quy định triển khai bằng code

- Tách action thành module riêng; lưu và khôi phục pose rõ ràng.
- Lấy mẫu cùng thời điểm phải cho cùng kết quả, kể cả tua ngược. Nếu dùng mô phỏng có trạng thái, cần reset và bước thời gian cố định.
- Không cộng góc lên pose frame trước gây trôi. Tính từ pose nền đã lưu.
- Phân biệt tọa độ local/world; không làm dài xương để đạt mục tiêu IK ngoài tầm với.
- Dùng đường cong thời gian liên tục. Không ép tốc độ về không tại mọi key trung gian của cùng một cú vung.
- Giới hạn góc xoắn, nghiêng và độ bù hướng nhìn. Chuyển động phải phù hợp mesh, không chỉ phù hợp sơ đồ xương.
- Tính IK chân sau các thay đổi hông/thân; giữ hướng bàn chân và mặt tiếp xúc.
- Chuyển động phụ lấy từ nhịp hoặc độ trễ của động tác chính, có envelope về không ở hai đầu.
- Không tăng tốc toàn clip để che lỗi. Kiểm tra ở 1× và tốc độ mặc định của demo.

## 6. Vòng kiểm tra bắt buộc

1. Xem toàn clip ở tốc độ thật, không chỉ ảnh chụp các tư thế đẹp.
2. Xem chậm để phát hiện khớp bật, chân trượt, đuôi xuyên và thay đổi vận tốc đột ngột.
3. Xem ít nhất góc ngang, trước và chéo; kiểm tra cả vùng bị che ở góc chính.
4. Quan sát bóng và sàn để đánh giá tiếp xúc; kiểm tra mesh bên cạnh skeleton.
5. So sánh trực tiếp với bản cũ hoặc tham chiếu, cùng tốc độ và góc camera khi phù hợp.
6. Kiểm tra pause, replay, loop, đổi action giữa cú đánh và đổi model.
7. Ghi kết quả: đã cải thiện gì, còn lỗi gì, ảnh/video minh chứng ở đâu. Nếu chưa đạt thì nói rõ, không gọi là hoàn hảo.

## 7. Tiêu chí nghiệm thu

- [ ] Nhìn silhouette nhận ra hành động và hướng lực.
- [ ] Tư thế đứng tự nhiên; không khom kéo dài ngoài chủ ý.
- [ ] Có lấy đà, phát lực và hãm khác nhau rõ về nhịp.
- [ ] Chân đổi trụ hợp lý, gối gập đúng hướng, không trượt vô cớ.
- [ ] Hông, ngực, cổ và đầu có chuyển động tương đối, không xoay thành một khối.
- [ ] Bộ phận phụ phản ứng có lý do, không rung đồng loạt.
- [ ] Mesh giữ hình thể; không gãy cổ, xoắn chân hoặc gập đuôi bất thường.
- [ ] Nhịp vẫn thuyết phục khi xem ở tốc độ mặc định.
- [ ] Các pha nối liên tục, loop và đổi action không để sót biến đổi.
- [ ] Test kỹ thuật và kiểm tra trực quan đều được ghi nhận riêng.

## Áp dụng cho T-Rex gầm rồi quét đuôi

Giữ tư thế đứng cao đã sửa. Khi lấy đà, dồn nhẹ về chân trụ, hông xoay trước trong khi ngực và đầu còn giữ hướng. Khi quất, ngực, cổ và đầu bắt kịp theo các độ trễ khác nhau; tay phản ứng nhỏ. Khi hãm, thêm độ vượt và nghiêng cân bằng có giới hạn rồi giảm về không. Giữ cú vung nhanh, hồi phục chậm hơn; không trở lại dáng khom và nhịp xoay đều của bản đầu.

**Pha gầm cũng phải là chuyển động toàn thân:** chân chịu lực, hông điều chỉnh, thân trước và ngực nâng lên trước khi cổ–đầu ngửa theo. Đuôi hạ nhẹ để cân bằng, từ gốc đến ngọn có độ trễ. Phân bố góc nâng giữa thân và các đốt cổ, không bẻ riêng cổ hoặc xoay cả model. Khi kết thúc, ngực, cổ, hàm và đuôi trở về lệch nhịp có kiểm soát; chân vẫn tiếp đất. Mức hạ đuôi cần được kiểm tra trên mesh để tránh chạm sàn.

Đây là chuyển động biểu diễn cho demo, không phải mô phỏng sinh cơ học đã được kiểm chứng của loài tuyệt chủng.
