import * as T from 'three';
export async function createTrexModel({data,diffuse,normal}){
 const source=new T.ObjectLoader().parse(data),root=new T.Group();root.name='trex';root.userData.modelType='rigged-character';
 const visual=new T.Group();visual.name='trex-visual';visual.add(source);root.add(visual);
 const loader=new T.TextureLoader();const [colorMap,normalMap]=await Promise.all([loader.loadAsync(diffuse),loader.loadAsync(normal)]);colorMap.colorSpace=T.SRGBColorSpace;normalMap.colorSpace=T.NoColorSpace;colorMap.anisotropy=4;normalMap.anisotropy=4;
 const material=new T.MeshStandardMaterial({map:colorMap,normalMap,normalScale:new T.Vector2(.65,.65),roughness:.78,metalness:0});const meshes={},nodes={root,visual};let triangles=0;
 source.traverse(o=>{if(o.isMesh){o.material=material;o.castShadow=o.receiveShadow=true;o.frustumCulled=false;meshes[o.name]=o;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}if(o.isBone&&!nodes[o.name])nodes[o.name]=o;});
 source.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(source),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());const scale=8/Math.max(size.x,size.y,size.z);visual.scale.setScalar(scale);visual.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);
 const sockets={};for(const [id,boneName]of Object.entries({head:'jt_Head_C',mouth:'jt_Jaw_C',tail:'jt_Tail6_C'})){const socket=new T.Object3D();socket.name=`trex-${id}-socket`;nodes[boneName]?.add(socket);sockets[id]=socket;}
 root.userData.sculptRuntime={source,nodes,meshes,sockets,colliders:{main:{type:'box',size:size.clone().multiplyScalar(scale).toArray(),offset:[0,size.y*scale/2,0]}},assemblies:{},animations:Object.fromEntries(source.animations.map(a=>[a.name,a])),provenance:{route:'imported-fbx',source:'T-Rex.fbx',notes:['User-supplied third-party asset. Authorship/license not supplied.','FBXLoader ignores additional animation layers; selected clips visually checked.','Skin weights normalized after Three.js four-influence conversion.']},stats:{triangles,bones:Object.keys(nodes).length-2}};
 root.userData.learningObject={id:'trex',labels:{vi:'Khủng long bạo chúa',en:'Tyrannosaurus rex'},gameplayTags:['creature','predator']};return root;
}
