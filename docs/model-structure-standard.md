# Chuẩn cấu trúc model 3D cho dự án

Tài liệu này ghi lại cách tổ chức một model 3D theo hướng học từ `img2threejs`: model không chỉ là mesh để nhìn, mà là một `THREE.Group` có cấu trúc runtime rõ ràng để chọn, học từ vựng, gắn UI, chạy gameplay, animate và tối ưu sau này.

Mục tiêu của dự án mình không phải sao chép toàn bộ pipeline/gate của `img2threejs`. Mục tiêu là lấy phần kiến trúc hữu ích: factory sinh model, các node có tên ổn định, sockets để gắn tương tác, collider đơn giản, metadata học tập và controller tách khỏi geometry.

## 1. Nguyên tắc chung

Mỗi model nên được tạo qua một factory:

```js
export function createBookModel(options = {}) {
  const root = new THREE.Group();
  root.name = 'book';
  root.userData.modelType = 'learning-prop';
  root.userData.sculptRuntime = { nodes, meshes, sockets, colliders, assemblies, animations, provenance };
  root.userData.learningObject = { id, labels, examples, gameplayTags };
  return root;
}
```

Không nên để model là một mesh rời không có metadata. Kể cả model import từ GLB cũng nên được bọc trong một factory wrapper để app có cùng một cách thao tác.

Một model tốt cần trả lời được các câu hỏi sau mà không phải đọc toàn bộ code dựng hình:

- ID ổn định của nó là gì?
- Người chơi click vào đâu?
- Thẻ từ vựng/label nên neo vào điểm nào?
- Collider gameplay đơn giản nằm ở đâu?
- Có phần nào chuyển động được?
- Có animation/pose nào dùng được?
- Đây là model procedural, GLB import, hay GLB được đo/mã hóa lại?

## 2. Cây object chuẩn

Cấu trúc nên dùng:

```text
root: THREE.Group
  componentPivot: THREE.Group
    visualMesh: THREE.Mesh | THREE.SkinnedMesh
    socket: THREE.Object3D
  helper/collider/proxy
```

`root` là node lớn nhất. App dùng nó để thêm/xóa model khỏi scene, scale toàn bộ, bật/tắt visibility và đọc metadata.

`componentPivot` là group xoay/di chuyển của từng phần lớn. Với đồ vật có thể tháo hoặc animate, pivot rất quan trọng. Ví dụ máy ảnh có `lens`, `back`, `shutter`; hộp bút có `body`, `lid`, `pencils`; cửa có `door_leaf`; nhân vật có thể có `headTarget`, `leftHandSocket`, `rightHandSocket`.

`visualMesh` là mesh hiển thị. Không nên để gameplay điều khiển thẳng vào mesh nếu phần đó cần pivot riêng.

`socket` là điểm neo vô hình. Dùng để đặt nhãn, thẻ học, hiệu ứng, vật cầm tay, điểm nhìn camera hoặc điểm phát thoại.

`collider/proxy` là hình đơn giản phục vụ raycast, va chạm hoặc tìm đồ vật. Không nhất thiết trùng 100% với mesh thật.

## 3. `root.userData.sculptRuntime`

Mọi model nên có `root.userData.sculptRuntime`. Đây là contract runtime chính:

```js
root.userData.sculptRuntime = {
  nodes: {
    root,
    body,
    lid,
    labelAnchor
  },
  meshes: {
    bodyMesh,
    lidMesh
  },
  sockets: {
    label: labelSocket,
    inspect: inspectSocket,
    pickup: pickupSocket,
    talk: talkSocket
  },
  colliders: {
    main: {
      type: 'box',
      size: [0.8, 0.3, 0.5],
      offset: [0, 0.15, 0]
    }
  },
  assemblies: {
    lid: {
      node: lid,
      role: 'hinged-part'
    }
  },
  animations: {
    idle: null
  },
  provenance: {
    route: 'procedural',
    source: null,
    notes: []
  }
};
```

Tên key trong `nodes`, `meshes`, `sockets` phải ổn định. Gameplay nên gọi `runtime.sockets.label` hoặc `runtime.nodes.lid`, không đi tìm mesh theo tên sâu bên trong.

`provenance.route` nên dùng một trong các giá trị:

| Route | Dùng khi nào |
|---|---|
| `procedural` | Model dựng hoàn toàn bằng code Three.js |
| `imported-glb-static` | GLB được load/bọc lại, không có rig hoặc không dùng rig |
| `imported-glb-rigged` | GLB có skeleton/animation và chạy trực tiếp |
| `measured-glb-code` | GLB được đo rồi mã hóa thành JS/TS, không fetch GLB runtime |
| `hybrid` | Một phần đo/import, một phần procedural |

## 4. Metadata học tiếng

Mỗi object có thể học được nên có `root.userData.learningObject`:

```js
root.userData.learningObject = {
  id: 'pencil_case',
  type: 'object',
  category: 'classroom',
  labels: {
    vi: 'hộp bút',
    en: 'pencil case',
    ja: '筆箱',
    zh: '铅笔盒'
  },
  pronunciation: {
    en: '/ˈpen.səl keɪs/'
  },
  examples: {
    en: 'My pencil case is on the desk.',
    vi: 'Hộp bút của tôi ở trên bàn.'
  },
  gameplayTags: [
    'explore-discover',
    'find-object',
    'listen-find',
    'put-in-place'
  ],
  difficulty: 1,
  socket: 'label'
};
```

Giao diện, hướng dẫn và mô tả sản phẩm vẫn là tiếng Việt. Chỉ phần cần học mới dùng tiếng Anh/Nhật/Trung.

Với nhân vật, dùng thêm `characterObject`:

```js
root.userData.characterObject = {
  id: 'teacher',
  displayName: 'Cô Mai',
  role: 'teacher',
  dialogueSocket: 'talk',
  faceSocket: 'face',
  handSockets: ['leftHand', 'rightHand'],
  supportedActions: ['idle', 'wave', 'nod', 'point-board']
};
```

## 5. Các loại model trong dự án

### Đồ vật procedural

Phù hợp với vật nhỏ, rõ hình, cần tương tác: sách, bút, tẩy, hộp bút, cốc, đèn, cửa, bảng.

Nên có:

- factory riêng trong `src/product/models/` hoặc `src/demos/<demo-id>/`
- `nodes`, `meshes`, `sockets`, `colliders`
- controller riêng nếu có chuyển động
- test logic nếu có state phức tạp như mở/đóng, tháo/lắp, đặt đồ

Ví dụ tốt hiện tại: `src/demos/atelier-camera/createAtelierCameraModel.js`.

### GLB tĩnh

Phù hợp với đồ có hình dáng phức tạp nhưng không cần chuyển động riêng.

Không nên dùng GLB trực tiếp rải trong scene. Nên bọc:

```js
export async function createStaticGlbModel({ url, id, learningObject }) {
  const root = new THREE.Group();
  const glb = await loader.loadAsync(url);
  root.add(glb.scene);
  root.userData.sculptRuntime = createRuntimeFromBounds(root, id);
  root.userData.learningObject = learningObject;
  return root;
}
```

GLB một khối vẫn có thể dùng tốt cho:

- NPC đứng trong lớp
- object học từ vựng
- silhouette/reference để dựng lại model code
- collider và label anchor tự động theo bounding box

Nhưng GLB một khối không điều khiển được tay/chân riêng nếu không có skeleton hoặc node tách sẵn.

### GLB rigged

Phù hợp với nhân vật giáo viên/học sinh.

Nếu GLB có skeleton và animation, nên giữ nó như một nhân vật liền khối thay vì cố tách thành đầu/tay/chân riêng. Contract nên expose skeleton/animations và sockets:

```js
root.userData.sculptRuntime = {
  nodes: { root, modelRoot },
  meshes: { body: skinnedMesh },
  sockets: { face, talk, leftHand, rightHand },
  colliders: { body: capsuleCollider },
  animations: {
    idle: clip,
    walk: clip,
    wave: customPose
  },
  rig: {
    skeleton,
    bonesByName,
    boneAliases
  },
  provenance: {
    route: 'imported-glb-rigged',
    source: 'model3d/...'
  }
};
```

Với nhân vật giáo viên, các animation nhẹ nên ưu tiên:

- `idle`: thở nhẹ, đứng yên
- `wave`: vẫy tay chào
- `nod`: gật đầu
- `point-board`: chỉ bảng
- `hold-book`: cầm sách
- `look-at-student`: xoay đầu/ngực nhẹ về phía người học

Nếu animation gốc chỉ có `Walking` hoặc `Running`, có thể dùng skeleton để tạo pose nhẹ bằng code, nhưng phải kiểm tra tên bone thực tế. Không nên tuyên bố là rig hoàn chỉnh nếu chỉ xoay vài bone thủ công.

### Model đo từ GLB rồi mã hóa thành code

Đây là hướng gần với `img2threejs` hơn cả. GLB được dùng như thước đo, rồi xuất dữ liệu bề mặt/cross-section thành module JS/TS. Runtime không fetch GLB.

Ưu điểm:

- Giữ dáng gần với model do Meshy/Tripo tạo
- Không phụ thuộc file GLB lúc chạy demo
- Có thể kiểm soát LOD và metadata theo chuẩn dự án

Nhược điểm:

- Tốn công build codec/encoder
- File JS có thể nặng
- Không tự có rig nếu source GLB không có skeleton/weights tốt

Chỉ nên dùng khi một model rất quan trọng, cần giống reference hơn procedural tự dựng.

## 6. Controller tách khỏi model

Model factory chỉ nên dựng hình và metadata. Logic thao tác nên nằm trong controller:

```js
export function createTeacherActions(root) {
  const runtime = root.userData.sculptRuntime;
  return {
    playIdle() {},
    wave() {},
    nod() {},
    pointBoard() {},
    update(dt) {},
    dispose() {}
  };
}
```

Lý do:

- Dễ test state mà không cần renderer
- Một model có thể dùng trong nhiều màn
- Gameplay không phụ thuộc cách mesh được dựng bên trong

Camera demo hiện đã đi theo hướng này với `createCameraActions(model)`.

## 7. Picking và label

Mọi object học được nên có:

- `userData.pickId` hoặc `learningObject.id`
- một collider đơn giản để raycast
- `sockets.label` để đặt nhãn/thẻ học
- `sockets.inspect` để camera focus vào

Quy tắc UI:

- Label không nên gắn theo vị trí màn hình hard-code.
- Thẻ học nên lấy vị trí từ socket hoặc anchor đã khai báo.
- Nếu socket bị khuất hoặc gần mép màn hình, UI được quyền đổi vị trí nhưng vẫn phải tránh che vật đang học.

## 8. Chuẩn thư mục đề xuất

Khi dự án lớn hơn, nên tách model như sau:

```text
src/product/models/
  book/
    createBookModel.js
    bookActions.js
    metadata.js
  pencil-case/
    createPencilCaseModel.js
    pencilCaseActions.js
    metadata.js
  teacher/
    createTeacherModel.js
    teacherActions.js
    teacherRig.js

model3d/
  raw/
  processed/
  references/
```

Với demo độc lập:

```text
src/demos/<demo-id>/
  index.html
  style.css
  viewer.js
  create<Model>Name.js
  actions.js
```

Các file GLB gốc nên nằm trong `model3d/raw` hoặc một thư mục rõ nguồn. File đã tối ưu/nén/đổi trục nên nằm trong `model3d/processed`.

## 9. Hiệu năng

Mục tiêu thực tế cho mobile:

- Object nhỏ: dưới 5k-20k triangles mỗi object
- Nhân vật chính: khoảng 20k-60k triangles nếu chỉ có một vài NPC trong scene
- Toàn scene classroom: ưu tiên dưới 150k-250k triangles cho bản demo mobile
- Texture: ưu tiên 1K hoặc thấp hơn cho demo; tránh nhiều texture 4K
- Raycast: dùng collider/proxy, không raycast toàn bộ mesh nặng nếu không cần

GLB từ Meshy/Tripo cần kiểm tra:

- số mesh
- số material
- số texture
- số triangle
- có skeleton không
- có animation clip không
- tên bone có đọc được không
- file có cần Draco/KTX2 không

## 10. Kiểm tra tối thiểu cho một model

Trước khi coi một model là dùng được:

- Factory tạo được `THREE.Group`
- `root.userData.sculptRuntime` có đủ `nodes`, `sockets`, `colliders`
- Nếu là object học từ vựng, có `learningObject`
- Raycast chọn đúng object
- Label/thẻ học neo đúng socket trên desktop và mobile
- Animation/controller không cộng dồn transform sai theo frame
- `dispose()` giải phóng geometry/material/texture nếu model bị tháo khỏi scene
- Render kiểm tra ít nhất 3 góc: trước, nghiêng, sau

Với GLB rigged:

- load được bằng `GLTFLoader`
- tìm được `SkinnedMesh`
- tìm được `Skeleton`
- liệt kê được clips
- chạy clip không lỗi
- pose thủ công reset được về rest pose
- không mất texture/material khi build demo

## 11. Áp dụng cho dự án hiện tại

Các phần đang có:

- Classroom hiện dùng `pickId` và `anchor`; nên nâng dần thành `learningObject` + `sculptRuntime.sockets`.
- Pencil case đã có `parts` và `sockets`; có thể chuyển sang contract chung.
- Camera demo đã gần chuẩn `img2threejs`: có factory, nodes, pivots, sockets, assemblies và controller riêng.
- Model GLB giáo viên một khối có thể giữ làm reference hoặc NPC tĩnh.
- Model GLB giáo viên rigged có thể làm demo NPC riêng trước, sau đó mới quyết định đưa vào classroom.

Hướng nên đi:

1. Dùng camera demo làm mẫu chuẩn cho object phức tạp.
2. Viết wrapper chuẩn cho GLB tĩnh và GLB rigged.
3. Chuyển classroom object quan trọng sang `learningObject` + sockets.
4. Chỉ khi một model thật sự quan trọng mới làm hướng đo/mã hóa GLB thành code.

## 12. Quy tắc đặt tên

ID dùng snake_case:

```text
teacher
student_01
teacher_desk
pencil_case
whiteboard
classroom_door
```

Socket dùng tên theo chức năng:

```text
label
inspect
pickup
placeTarget
talk
face
leftHand
rightHand
boardPoint
```

Animation dùng động từ ngắn:

```text
idle
wave
nod
point_board
hold_book
walk
turn_head
```

Không nên đặt tên theo vị trí code như `mesh001`, `group2`, `boxA` nếu gameplay cần gọi đến.
