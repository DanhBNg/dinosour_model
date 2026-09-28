import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {addCreatureMotions} from './creature-motion.js';
import {addPteranodonFlight} from './pteranodon-retarget.js';
export async function createPterosaurModel(bytes){
 const gltf=await new GLTFLoader().parseAsync(bytes.buffer,'');const source=gltf.scene,root=new T.Group(),visual=new T.Group();root.name='pterosaur';root.add(visual);visual.add(source);
 const meshes={},nodes={};let triangles=0;source.traverse(o=>{if(o.isBone)nodes[o.name]=o;if(o.isMesh){meshes[o.name||o.uuid]=o;o.castShadow=o.receiveShadow=true;o.frustumCulled=false;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}});
 source.updateMatrixWorld(true);const box=new T.Box3().setFromObject(source),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3()),scale=7/Math.max(size.x,size.y,size.z);visual.scale.setScalar(scale);visual.position.set(-center.x*scale,-box.min.y*scale+.7,-center.z*scale);
 const head=new T.Object3D();const headBone=Object.values(nodes).find(b=>/head/i.test(b.name));if(headBone)headBone.add(head);else{head.position.set(0,3,0);root.add(head);}
 root.userData.sculptRuntime={source,nodes,meshes,sockets:{head},animations:Object.fromEntries(gltf.animations.map(c=>[c.name,c])),assemblies:{},colliders:{main:{type:'box',size:size.multiplyScalar(scale).toArray()}},stats:{triangles},provenance:{route:'imported-glb',source:'Pteradactal.glb',notes:['Embedded PBR materials and original animation retained.']}};
 // Sample the original opening pose so camera framing uses animated bounds, not the bind pose.
 const preview=new T.AnimationMixer(source);if(gltf.animations[0]){preview.clipAction(gltf.animations[0]).play();preview.update(.01);root.updateMatrixWorld(true);for(const m of Object.values(meshes))m.skeleton?.update();const animatedBounds=new T.Box3().setFromObject(root,true);head.userData.viewCenter=animatedBounds.getCenter(new T.Vector3()).toArray();preview.stopAllAction();preview.uncacheRoot(source);}
 const definitions=Object.fromEntries(gltf.animations.map((c,i)=>['clip'+i,[c.name,'Bay · chuyển động gốc',`Animation gốc: ${c.name}. Không thêm chuyển động tự tạo.`,true]]));
 const original=gltf.animations[0];if(original){
  const tracks=original.tracks.map(t=>t.clone()),times=[0,1,2.5,4,5.5,7,8];
  // Extra bank and shallow curved flight path on a separate pivot; source flapping remains intact.
  const bank=new T.Group();bank.name='flight-bank';root.remove(visual);root.add(bank);bank.add(visual);
  tracks.push(new T.QuaternionKeyframeTrack('flight-bank.quaternion',times,[0,0,.32,.12,-.32,-.12,0].flatMap(a=>new T.Quaternion().setFromEuler(new T.Euler(0,a*.35,a)).toArray())));
  tracks.push(new T.VectorKeyframeTrack('flight-bank.position',times,[0,0,0,.15,.08,0,.7,.18,.2,.4,.06,.35,-.6,.14,.15,-.3,.06,0,0,0,0]));
  for(const [name,bone]of Object.entries(nodes)){if(!/^[LR]upperArm/.test(name))continue;const track=tracks.find(t=>t.name===bone.name+'.quaternion');if(!track)continue;const sign=name.startsWith('L')?1:-1;for(let i=0;i<track.times.length;i++){const bankAngle=.1*Math.sin(track.times[i]/8*Math.PI*2)*sign;const q=new T.Quaternion().fromArray(track.values,i*4).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),bankAngle));q.toArray(track.values,i*4);}}
  const glide=new T.AnimationClip('authored-glide',8,tracks);root.userData.sculptRuntime.animations[glide.name]=glide;
  // Mixer root must encompass the added flight pivot as well as the imported rig.
  root.userData.sculptRuntime.source=root;
  definitions.glide=[glide.name,'Chao cánh lượn','Lượn trái–phải, nghiêng thân và điều chỉnh cánh trên nhịp bay gốc.',true];
 }
 addCreatureMotions(root,root,nodes,gltf.animations[0],root.userData.sculptRuntime.animations,definitions,'ptero');
 if(original)addPteranodonFlight(root,nodes,original,root.userData.sculptRuntime.animations,definitions);
 return {model:root,definitions};
}
