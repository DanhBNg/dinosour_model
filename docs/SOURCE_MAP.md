# Đường đi từ source tới demo

## Build và runtime

`scripts/build.mjs` đọc template, bundle `viewer.js` bằng esbuild, nạp các asset dưới đây và sinh `dist/index.html`. MP4 được copy sang `dist/previews/`. Không chạy script chuyển đổi FBX, không cần asset ở Downloads/Desktop.

| Model | Đầu vào chính | Factory |
| --- | --- | --- |
| T-Rex | `model3d/trex-demo/model.json` + JPEG | `model.js` |
| Stegosaurus | `model3d/stegosaurus-demo/model.glb` | `imported-creature.js` |
| Triceratops | `model3d/triceratops-demo/model.glb` | `imported-creature.js` |
| Mosasaurus | `model3d/mosasaurus-demo/model-1024.glb` | `imported-creature.js` |
| Deinonychus | `model3d/deinonychus-demo/Deinonychus-Rigged.glb` | `imported-creature.js` |
| Pterosaur | `model3d/pterosaur-demo/Pteradactal-1024.glb` | `pterosaur.js` |
| 6 động vật | `model3d/animal-demo/animals.json` + PNG | `animal-rig.js` |

Các factory/module trong bảng nằm ở `src/demos/trex/`. Geometry nhập từ asset và dữ liệu motion JSON được giữ riêng; scene/UI ở `viewer.js`.

## Sửa animation ở đâu?

- T-Rex: `actions.js` chọn clip/controller; `authored-motion.js` tạo động tác bổ sung, `roar-sweep.js` điều khiển gầm/quét đuôi, `hunt.js` điều phối đuổi bắt.
- Mosasaurus và các GLB khác: `creature-motion.js` tạo clip bổ sung. `mosa-breach.js` chứa pose cho động tác cuối của Mosasaurus.
- Pterosaur: `pteranodon-retarget.js` chuyển motion tham khảo từ các JSON đi kèm; động tác bổ sung cũng đi qua `creature-motion.js`.
- Động vật: `animal-rig.js` tạo skeleton/weight, `animal-motion-profiles.js` điều chỉnh từng loài, `animal-authored.js` tạo pose theo thời gian. `dog-retarget.js` và JSON giữ lại để tham khảo.
- Thông tin loài: `species-data.js`, `prehistoric-dossiers.js`; bảng hiển thị ở `species-panel.js`. Chưa kết nối ModelDB.

## Phạm vi áp dụng img2threejs

Repo dùng contract factory/runtime để quản lý model và animation. Đây không phải đầu ra procedural reconstruction đầy đủ: không có sculpt spec từ ảnh, không tuyên bố vượt các quality gate của skill. Không tạo hồ sơ gate giả cho asset import. Xem `provenance` trong từng factory và tài liệu quy trình animation trước khi chỉnh rig.

## Khi thêm model

Thêm đầu vào trong `model3d/`, bọc bằng factory với runtime và provenance, đăng ký ở viewer/catalog, thêm dữ liệu loài, poster và MP4, bổ sung build manifest và smoke test. Kiểm tra scale, hướng trục, pose nghỉ, chân tiếp đất và giới hạn khớp riêng cho loài trước khi dùng animation chung. Hiện đăng ký model chưa được gom về một manifest duy nhất; cần cập nhật các điểm này đồng bộ.
