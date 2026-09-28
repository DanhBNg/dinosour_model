import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {addCreatureMotions} from './creature-motion.js';
export async function createImportedCreature(bytes,id){
 const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const source=gltf.scene,root=new T.Group(),visual=new T.Group();root.name=id;root.add(visual);visual.add(source);
 const remove=[];source.traverse(o=>{if(o.isCamera||o.isLight)remove.push(o);});remove.forEach(o=>o.removeFromParent());
 const meshes={},nodes={};let triangles=0;
 source.traverse(o=>{if(o.isBone)nodes[o.name]=o;if(o.isMesh){meshes[o.uuid]=o;o.castShadow=o.receiveShadow=true;o.frustumCulled=false;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}});
 // Frame the opening animated pose, while retaining every original clip and track.
 const mixer=new T.AnimationMixer(source);if(gltf.animations[0]){mixer.clipAction(gltf.animations[0]).play();mixer.update(.001);}
 source.updateMatrixWorld(true);Object.values(meshes).forEach(m=>m.skeleton?.update());
 const box=new T.Box3().setFromObject(source,true),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3()),scale=7/Math.max(size.x,size.y,size.z);
 visual.scale.setScalar(scale);visual.position.set(-center.x*scale,-box.min.y*scale+(id==='mosa'?1.1:0),-center.z*scale);
 root.updateMatrixWorld(true);const framed=new T.Box3().setFromObject(root,true),head=new T.Object3D();head.position.copy(framed.getCenter(new T.Vector3()));head.userData.viewCenter=head.position.toArray();root.add(head);
 mixer.stopAllAction();mixer.uncacheRoot(source);
 const labels={Observe:'Đứng quan sát',Stalk:'Đi rình tại chỗ',Pounce:'Lấy đà bật nhảy','Threat display':'Cảnh giác · vung tay'};
 const definitions={},animations={};gltf.animations.forEach((clip,i)=>{clip.name=clip.name||`Animation ${i+1}`;const key=`original-${i}`;animations[key]=clip;definitions['clip'+i]=[key,labels[clip.name]||clip.name,`${id==='deino'?'Chuyển động tự tạo':'Clip gốc đầy đủ'} · ${clip.duration.toFixed(2)} giây.`,true];});
 if(!gltf.animations.length){const clip=new T.AnimationClip('rest',1,[]);animations.rest=clip;definitions.rest=['rest','Tư thế gốc','Model không có animation.',true];}
 root.userData.sculptRuntime={source,meshes,nodes,sockets:{head},animations,stats:{triangles},provenance:{route:'imported-glb',notes:['All original clips retained.']}};
 if(id==='mosa')addCreatureMotions(root,source,nodes,gltf.animations[0],animations,definitions,id);
 return {model:root,definitions};
}
