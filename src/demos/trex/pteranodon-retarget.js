import * as T from 'three';
import flight from './pteranodon-flight.json' with {type:'json'};
import sit from './pteranodon-sit.json' with {type:'json'};
import roar from './pteranodon-roar.json' with {type:'json'};
export function addPteranodonFlight(root,nodes,original,animations,definitions){
 for(const [id,data] of [['pteranodonFly',flight],['pteranodonSit',sit],['pteranodonRoar',roar]])bake(root,nodes,original,animations,definitions,id,data);
}
function bake(root,nodes,original,animations,definitions,id,data){
 const grounded=id!=='pteranodonFly';
 const objects=[];root.traverse(o=>objects.push(o));const rest=objects.map(o=>({p:o.position.clone(),q:o.quaternion.clone(),s:o.scale.clone()}));
 const mixer=new T.AnimationMixer(root);mixer.clipAction(original).play();mixer.setTime(.35);root.updateMatrixWorld(true);
 const base=objects.map(o=>({p:o.position.clone(),q:o.quaternion.clone(),s:o.scale.clone()}));
 const mapped=objects.filter(o=>data.frames[0][o.name]);
 if(mapped.length!==Object.keys(data.frames[0]).length)throw Error('Pteranodon retarget bone mapping incomplete');
 const orientations=new Map(mapped.map(o=>[o,o.getWorldQuaternion(new T.Quaternion())]));
 mixer.stopAllAction();mixer.uncacheRoot(root);
 const times=[],samples=objects.map(()=>({p:[],q:[],s:[]}));
 for(let i=0;i<=data.frames.length;i++){
  times.push(i/data.frames.length*data.duration);objects.forEach((o,k)=>{o.position.copy(base[k].p);o.quaternion.copy(base[k].q);o.scale.copy(base[k].s);});
  for(const o of mapped){const sum=[0,0,0,0],ref=new T.Quaternion().fromArray(data.frames[i%data.frames.length][o.name]);
   for(let j=-2;j<=2;j++){const a=data.frames[(i+j+data.frames.length)%data.frames.length][o.name],q=new T.Quaternion().fromArray(a),w=[1,2,3,2,1][j+2]/9*(q.dot(ref)<0?-1:1);a.forEach((v,k)=>sum[k]+=v*w);}
   const delta=new T.Quaternion().slerp(new T.Quaternion().fromArray(sum).normalize(),grounded?(o.name==='jaw16'?.7:.75):(/Arm|wrist|wing/.test(o.name)?.85:.45));
   root.updateMatrixWorld(true);o.quaternion.copy(o.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(delta).multiply(orientations.get(o)));
  }
  if(grounded){const pivot=root.getObjectByName('flight-bank');pivot.rotation.x=-.85;root.updateMatrixWorld(true);root.traverse(o=>o.skeleton?.update());const bounds=new T.Box3().setFromObject(root,true);const bank=root.getObjectByName('flight-bank');bank.position.y-=bounds.min.y;const center=bounds.getCenter(new T.Vector3());bank.position.x-=center.x;bank.position.z-=center.z;root.updateMatrixWorld(true);}
  objects.forEach((o,k)=>{samples[k].p.push(...o.position.toArray());samples[k].q.push(...o.quaternion.toArray());samples[k].s.push(...o.scale.toArray());});
 }
 const tracks=[];objects.forEach((o,k)=>{tracks.push(new T.VectorKeyframeTrack(o.uuid+'.position',times,samples[k].p),new T.QuaternionKeyframeTrack(o.uuid+'.quaternion',times,samples[k].q),new T.VectorKeyframeTrack(o.uuid+'.scale',times,samples[k].s));o.position.copy(rest[k].p);o.quaternion.copy(rest[k].q);o.scale.copy(rest[k].s);});root.updateMatrixWorld(true);
 const clip=new T.AnimationClip(id==='pteranodonFly'?'Pteranodon Flight Retarget':id,data.duration,tracks);animations[clip.name]=clip;definitions[id]=[clip.name,{pteranodonFly:'Bay · Pteranodon',pteranodonSit:'Ngồi nghỉ',pteranodonRoar:'Gầm gọi'}[id]||id,grounded?'Experimental grounded retarget':'Flight retarget',true];
}
