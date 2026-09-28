# Mosasaurus — Vọt lên · nghiêng mình lặn

Action `breachDive`, clip 8 giây, trong demo Creature Lab. Sửa tên bị mất dấu thành Unicode UTF-8 đúng. Không thay các action khác.

## Cách dựng

- Dùng một pose tham chiếu cố định từ clip gốc; không tuyên bố độc lập hoàn toàn với clip nguồn.
- Xác định hướng trước từ vị trí xương đầu và gốc thay vì mặc định trục +Z của asset.
- Bone006–009 là thân, có cả các nhánh vây; không coi toàn bộ chuỗi này là đuôi.
- Bone010, 011, 014, 015, 016 là chuỗi đuôi được điều khiển riêng.
- Pha lấy đà → nâng thân/vọt lên → nghiêng lặn → thu hồi về tư thế bơi. Cổ bù nhẹ góc thân; thân sau và đuôi có pha trễ. Cặp vây sau theo muộn và nhỏ hơn cặp trước; khớp ngoài vây cũng phản ứng.
- Tất cả offset trở về không ở hai đầu clip để phù hợp chế độ loop hiện tại. Đây là động tác bơi biểu diễn tại chỗ, không phải mô phỏng thủy động lực hoặc đường bơi liên tục trong thế giới.

## Kiểm chứng và giới hạn

Test `tests/mosa-breach.test.mjs`: nhãn tiếng Việt, offset hữu hạn, hai đầu vòng lặp, các nhóm khớp tham gia. Đã chạy cùng 6 test T-Rex để kiểm tra hồi quy.

Script `scripts/check-mosa-breach.mjs` chụp các thời điểm 0, 1.2, 2.6, 4.2, 6 và 7.99 giây trong browser. Ảnh ở `artifacts/mosa-breach/`. Đã kiểm tra ảnh các pha vọt lên và nghiêng lặn; chưa coi ảnh tĩnh là bằng chứng đầy đủ về chất lượng nhịp playback hay va chạm mesh mọi frame.

Source: `src/demos/trex/mosa-breach.js`, tích hợp qua `creature-motion.js`. Bản build: `Creature-Lab-Demo.html` và `Dinosaur-Demo.html`.
