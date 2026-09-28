# Creature Lab — dinosaur & animal demo

Source phát triển của `DanhBNg/dinosour_model`: 6 model khủng long/bò sát cổ đại và 6 động vật, animation, video xem trước và bảng thông tin loài. Không phải project `dinosour_game`.

## Chạy local

Cài Node.js 22 trở lên:

```sh
git clone https://github.com/DanhBNg/dinosour_model.git
cd dinosour_model
npm ci --omit=optional
npm run dev
```

Mở **http://localhost:4176**. `dev` build một lần rồi chạy server. Sau khi sửa source, chạy lại `npm run build` và refresh trang. `npm start` chỉ phục vụ bản đã build; đổi cổng bằng biến `PORT`.

## Cấu trúc source

```text
src/demos/trex/   Source chung Creature Lab (giữ tên cũ để ổn định import)
  viewer.js      Scene, camera, UI và chọn model
  model.js       Factory T-Rex và sculptRuntime
  imported-creature.js / pterosaur.js / animal-rig.js
                 Factory GLB, rig và metadata của từng nhóm
  actions.js / authored-motion.js / creature-motion.js
                 Controller và các chuyển động
  roar-sweep.js / mosa-breach.js / hunt.js
                 Animation riêng và tương tác giữa model
  species-data.js / prehistoric-dossiers.js
                 Thông tin loài, kèm nguồn
  index.html / style.css / layout.css
                 Template và giao diện
  previews/      Poster PNG
model3d/         Geometry, rig, clip và texture đầu vào đã chuẩn bị
previews/        36 MP4, 3 video/model
scripts/         Build, server, smoke test, tạo video
tests/           Kiểm thử chuyển động T-Rex và Mosasaurus
docs/            Contract model và quy trình tạo animation
dist/            Kết quả build, không commit
```

Chỉnh animation trong **source JS**, không chỉnh `dist/index.html`. Build hiện vẫn đóng model/texture/JS vào HTML để giữ cơ chế tải hiện tại; file khoảng 82 MiB, chưa tối ưu tải từng asset theo yêu cầu. Repo có đủ đầu vào build, không phụ thuộc thư mục cha hay đường dẫn máy tác giả.

## Kiến trúc model

Áp dụng phần contract runtime của hướng `img2threejs`: factory trả về `THREE.Group`, `userData.sculptRuntime`, node/mesh/socket, metadata và controller animation tách khỏi UI. Xem [chuẩn cấu trúc](docs/model-structure-standard.md) và [quy trình animation](docs/QUY_TRINH_TAO_ANIMATION.md).

Mesh là **asset import**, có animation gốc và animation viết bằng code; không phải tất cả dựng procedural từ ảnh. `model3d/` chứa đầu vào đã chuyển đổi đủ để build/chỉnh animation, không phải bộ FBX/ZIP gốc hay pipeline tái tạo từ asset gốc. Quyền sử dụng asset do người cung cấp quản lý; repo không cấp thêm giấy phép cho model bên thứ ba.

## Kiểm tra

```sh
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

Đặt `CHROME_PATH` để dùng Chrome đã cài nếu muốn. Smoke test tải đủ 12 model, kiểm tra runtime, tên action và lỗi JavaScript. Unit test kiểm tra một số bất biến chuyển động; không thay thế việc xem animation thực tế nhiều góc.

## Tạo lại video

Video có sẵn; không cần FFmpeg để build/deploy. Để tạo lại:

```sh
npm ci
npx playwright install chromium
npm run build
npm run previews -- trex mosa
npm run build
```

Tạo video cần optional dependency `ffmpeg-static`. Bỏ tên model để tạo cả 12. Frame ở `artifacts/`, MP4 ở `previews/`; commit MP4 đã kiểm tra.

## Vercel

Import repo, chọn framework **Other**, Root Directory để mặc định. `vercel.json` cấu hình:

- Install: `npm ci --omit=optional`
- Build: `npm run build`
- Output: `dist`

Nếu project Vercel cũ đang override build/output trong dashboard, xóa override hoặc đổi về các giá trị trên. Push `main` sẽ kích hoạt build khi đã kết nối repo. Không cần database, biến môi trường hay Git LFS để chạy demo.

## Cập nhật

Sửa source → `npm test` → `npm run build` → kiểm tra trình duyệt và chuyển động → commit source/asset thay đổi → push. HTML xuất cũ ở root và `source-reference/` đã được thay bằng source chính thức; bản cũ vẫn có trong lịch sử Git.
