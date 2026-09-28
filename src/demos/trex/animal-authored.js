import * as T from 'three';

// Poses authored for these six source meshes. No dog clips or donor transforms.
// Angles are deliberately small: the source meshes are already posed, not neutral rigs.
export const ANIMAL_ACTION_PROFILES={
 wolf:{labels:['Nghỉ và thở','Quan sát hai bên','Ngửi không khí'],period:5.6,breath:.008,neck:.14,head:.24,tilt:-.14,tail:.018,shift:.012},
 fox:{labels:['Đứng nghỉ','Nghiêng đầu nghe','Cúi đầu đánh hơi'],period:4.8,breath:.007,neck:.09,head:.2,tilt:.19,tail:.032,shift:.009},
 bear:{labels:['Thở chậm','Ngoái đầu','Ngửi phía trước'],period:7.2,breath:.009,neck:.07,head:.12,tilt:.11,tail:.004,shift:.012},
 boar:{labels:['Đứng nghỉ','Đánh hơi hai bên','Dò mõm'],period:5.8,breath:.006,neck:.055,head:.12,tilt:.15,tail:.014,shift:.008},
 hyena:{labels:['Nghỉ ở tư thế thấp','Nghe ngóng','Ngửi dò hướng'],period:5.3,breath:.006,neck:.09,head:.17,tilt:.12,tail:.019,shift:.008},
 lion:{labels:['Giữ thế rình','Quan sát con mồi','Chuyển trọng tâm'],period:6.4,breath:.005,neck:.065,head:.16,tilt:.08,tail:.028,shift:.016},
};
const smooth=x=>x*x*x*(x*(x*6-15)+10);
const keys=(t,points)=>{let i=0;while(i<points.length-2&&t>points[i+1][0])i++;const [a,v]=points[i],[b,w]=points[i+1];return T.MathUtils.lerp(v,w,smooth(T.MathUtils.clamp((t-a)/(b-a),0,1)));};
export function createAnimalAuthored(rig,id){
 const config=ANIMAL_ACTION_PROFILES[id];
 function pose(action,phase){
  rig.reset();const t=phase%1,cycle=Math.PI*2*t,n=rig.nodes;
  const breath=(1-Math.cos(cycle))*config.breath;
  n.chest.rotation.x=-breath;n.neck.rotation.x=breath*.6;n.head.rotation.x=breath*.4;
  let tailMotion=.3,shift=0;
  if(action==='observe'){
   const scan=keys(t,[[0,0],[.16,.8],[.32,.8],[.55,-1],[.72,-1],[1,0]]);
   n.neck.rotation.y=config.neck*scan;n.head.rotation.y=config.head*scan;
   n.head.rotation.z=id==='fox'?keys(t,[[0,0],[.2,.13],[.4,.13],[.65,-.09],[.8,-.09],[1,0]]):scan*.018;
   n.spine.rotation.y=-scan*.012;n.chest.rotation.y=scan*.016;
   tailMotion=.55;
  }else if(action==='detail'){
   const intent=keys(t,[[0,0],[.22,1],[.58,1],[.82,.25],[1,0]]);
   const sniff=intent*Math.sin(cycle*3)*.012;
   n.neck.rotation.x+=config.tilt*intent;n.head.rotation.x+=config.tilt*.4*intent+sniff;
   n.head.rotation.y=intent*Math.sin(cycle*2)*(id==='boar'?.065:.035);
   if(id==='wolf'){n.head.rotation.x-=.04*intent;n.neck.rotation.y=.04*intent;}
   if(id==='bear')n.chest.rotation.x+=.012*intent;
   if(id==='lion'){n.neck.rotation.x=breath*.6;n.head.rotation.x=-.035*intent;shift=config.shift*Math.sin(cycle);}
   tailMotion=id==='lion'?1:.6;
  }
  // Weight transfer only where required. Other clips leave the existing paw transforms intact.
  n.hips.position.x+=shift;rig.mesh.updateMatrixWorld(true);
  for(const chain of rig.chains)rig.ik(chain,rig.points[chain.names[3]].clone());
  rig.tailNames.forEach((name,i)=>{
   const taper=.3+.7*i/(rig.tailNames.length-1),lag=i*.38;
   n[name].rotation.y=config.tail*tailMotion*taper*(Math.sin(cycle-lag)-Math.sin(-lag));
   n[name].rotation.x=config.tail*.18*tailMotion*taper*(Math.cos(cycle-lag)-Math.cos(-lag));
  });
  rig.mesh.updateMatrixWorld(true);rig.mesh.skeleton.update();
 }
 function bake(action){const count=121,duration=config.period*(action==='observe'?1.4:action==='detail'?1.2:1),times=[],samples=rig.bones.map(()=>({p:[],q:[]}));
  for(let i=0;i<count;i++){times.push(i/(count-1)*duration);pose(action,i/(count-1));rig.bones.forEach((b,j)=>{samples[j].p.push(...b.position.toArray());samples[j].q.push(...b.quaternion.toArray());});}
  const tracks=[];rig.bones.forEach((b,j)=>tracks.push(new T.VectorKeyframeTrack(b.name+'.position',times,samples[j].p),new T.QuaternionKeyframeTrack(b.name+'.quaternion',times,samples[j].q)));rig.reset();return new T.AnimationClip('authored-'+action,duration,tracks);
 }
 return {pose,bake,config};
}
