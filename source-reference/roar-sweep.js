import {Vector3,Quaternion,MathUtils} from 'three';

export const ROAR_SWEEP_DURATION=6.4;
const V=()=>new Vector3(),Q=()=>new Quaternion(),UP=new Vector3(0,1,0);
const ease=x=>{x=MathUtils.clamp(x,0,1);return x*x*x*(10+x*(-15+6*x));};
const ramp=(a,b,t)=>ease((t-a)/(b-a));
const pulse=(a,b,c,d,t)=>ramp(a,b,t)*(1-ramp(c,d,t));
// Monotone Hermite timing carries velocity through a turn instead of stopping at every pose.
function curve(keys,t){
 const slope=i=>{if(i===0||i===keys.length-1)return 0;const a=(keys[i][1]-keys[i-1][1])/(keys[i][0]-keys[i-1][0]),b=(keys[i+1][1]-keys[i][1])/(keys[i+1][0]-keys[i][0]);return a*b<=0?0:2*a*b/(a+b);};
 for(let i=1;i<keys.length;i++)if(t<=keys[i][0]){const[a,x]=keys[i-1],[b,y]=keys[i],d=b-a,u=MathUtils.clamp((t-a)/d,0,1);return (2*u**3-3*u*u+1)*x+(u**3-2*u*u+u)*d*slope(i-1)+(-2*u**3+3*u*u)*y+(u**3-u*u)*d*slope(i);}
 return keys.at(-1)[1];
}
const turns=[[0,0],[2.6,0],[3.15,-.32],[3.32,.05],[3.57,1.40],[3.76,1.65],[4.2,1.65],[4.8,1.05],[5.35,.45],[5.9,0],[6.4,0]];
// Each foot travels only during its own swing interval. The other remains planted.
const steps={L:[[2.7,3.15,-.28],[3.5,3.88,1.65],[4.8,5.32,.45],[5.86,6.3,0]],R:[[3.16,3.49,1.4],[4.24,4.78,1.05],[5.34,5.84,0]]};

export function createRoarSweep(root){
 const bones={};root.traverse(b=>{if(b.isBone&&!bones[b.name])bones[b.name]=b;});
 // Static asset transforms only: never access an AnimationClip or mixer here.
 const snapshot=()=>{const p=[];root.traverse(b=>{if(b.isBone)p.push([b,b.position.clone(),b.quaternion.clone()]);});return p;};
 const raw=snapshot();let base=null,saved=null,origin,rotation,pivot,forward,lateral,feet={};
 const restorePose=p=>{for(const[b,v,q]of p){b.position.copy(v);b.quaternion.copy(q);}root.updateMatrixWorld(true);};
 function rotate(name,axis,angle){const b=bones[name];if(!b||!angle)return;b.updateWorldMatrix(true,false);const parent=b.parent.getWorldQuaternion(Q());b.quaternion.premultiply(parent.clone().invert().multiply(Q().setFromAxisAngle(axis,angle)).multiply(parent));b.updateWorldMatrix(false,true);}
 function moveWorld(b,offset){const p=b.getWorldPosition(V()).add(offset);b.position.copy(b.parent.worldToLocal(p));b.updateWorldMatrix(false,true);}
 function pin(side,target,orientation,facing=forward){
  const end=bones['jt_Foot_'+side],ankle=bones['jt_Ankle_'+side],knee=bones['jt_Knee_'+side],hip=bones['jt_Thigh_'+side];
  const h=hip.getWorldPosition(V()),k=knee.getWorldPosition(V()),a=ankle.getWorldPosition(V()),f=end.getWorldPosition(V());
  const upper=h.distanceTo(k),lower=k.distanceTo(a),metatarsal=a.distanceTo(f);
  const ankleTarget=target.clone().add(UP.clone().multiplyScalar(.98).addScaledVector(facing,-.2).normalize().multiplyScalar(metatarsal));
  const axis=ankleTarget.clone().sub(h),distance=MathUtils.clamp(axis.length(),.001,upper+lower-.00001);axis.normalize();
  const along=(upper*upper-lower*lower+distance*distance)/(2*distance);
  const pole=facing.clone().addScaledVector(axis,-facing.dot(axis)).normalize();
  const kneeTarget=h.clone().addScaledVector(axis,along).addScaledVector(pole,Math.sqrt(Math.max(0,upper*upper-along*along)));
  function aim(joint,child,point){const p=joint.getWorldPosition(V()),from=child.getWorldPosition(V()).sub(p).normalize(),to=point.clone().sub(p).normalize(),parent=joint.parent.getWorldQuaternion(Q());joint.quaternion.premultiply(parent.clone().invert().multiply(Q().setFromUnitVectors(from,to)).multiply(parent));joint.updateWorldMatrix(false,true);}
  aim(hip,knee,kneeTarget);aim(knee,ankle,ankleTarget);aim(ankle,end,target);
  end.quaternion.copy(end.parent.getWorldQuaternion(Q()).invert().multiply(orientation));end.updateWorldMatrix(false,true);
 }
 function start(){
  saved=snapshot();origin=root.position.clone();rotation=root.quaternion.clone();restorePose(raw);
  forward=bones.jt_Head_C.getWorldPosition(V()).sub(bones.jt_Tail1_C.getWorldPosition(V()));forward.y=0;forward.normalize();lateral=V().crossVectors(UP,forward).normalize();
  // Author a balanced standing base from the imported static pose (one foot was raised).
  moveWorld(bones.jt_Cog_C,new Vector3(0,.25,0));
  rotate('jt_Spine1_C',lateral,-.27);rotate('jt_Neck1_C',lateral,-.30);rotate('jt_Neck2_C',lateral,-.16);
  rotate('jt_Tail1_C',lateral,.10);
  const a=bones.jt_Foot_L.getWorldPosition(V()),b=bones.jt_Foot_R.getWorldPosition(V());
  const height=Math.min(a.y,b.y),mid=a.clone().add(b).multiplyScalar(.5);mid.y=height;
  for(const [side,sign]of [['L',1],['R',-1]]){
   const point=mid.clone().addScaledVector(lateral,.43*sign).addScaledVector(forward,.04*sign);
   const foot=bones['jt_Foot_'+side],claw=bones['jt_ClawMiddle_'+side];
   const toeDirection=claw.getWorldPosition(V()).sub(foot.getWorldPosition(V())).normalize();
   const restingDirection=forward.clone().addScaledVector(UP,-.18).normalize();
   const own=Q().setFromUnitVectors(toeDirection,restingDirection).multiply(foot.getWorldQuaternion(Q()));
   pin(side,point,own);feet[side]={point,orientation:own};
  }
  // Align the lowest claw on each foot with the floor without translating the whole model.
  for(const side of ['L','R']){
   const claws=['Inner','Middle','Outter'].map(n=>bones['jt_Claw'+n+'_'+side]).filter(Boolean);
   const min=Math.min(...claws.map(b=>b.getWorldPosition(V()).y));feet[side].point.y+=.025-min;pin(side,feet[side].point,feet[side].orientation);
  }
  pivot=bones.jt_Cog_C.getWorldPosition(V());pivot.y=origin.y;base=snapshot();pose(0);
 }
 function target(side,t){
  let previous=0;
  for(const[a,b,angle]of steps[side]){
   if(t<a)break;
   if(t<b){const u=(t-a)/(b-a),yaw=MathUtils.lerp(previous,angle,ease(u));const point=feet[side].point.clone().sub(pivot).applyAxisAngle(UP,yaw).add(pivot);point.y+=.17*Math.sin(Math.PI*u)**2;
    return {point,orientation:Q().setFromAxisAngle(UP,yaw).multiply(feet[side].orientation),facing:forward.clone().applyAxisAngle(UP,yaw),planted:false};}
   previous=angle;
  }
  return {point:feet[side].point.clone().sub(pivot).applyAxisAngle(UP,previous).add(pivot),orientation:Q().setFromAxisAngle(UP,previous).multiply(feet[side].orientation),facing:forward.clone().applyAxisAngle(UP,previous),planted:true};
 }
 function pose(time){
  if(!base)return;const t=MathUtils.clamp(time,0,ROAR_SWEEP_DURATION);root.position.copy(origin);root.quaternion.copy(rotation);restorePose(base);
  const yaw=curve(turns,t),turn=Q().setFromAxisAngle(UP,yaw);root.quaternion.premultiply(turn);root.position.copy(origin).sub(pivot).applyQuaternion(turn).add(pivot);root.updateMatrixWorld(true);
  const side=lateral.clone().applyQuaternion(turn),front=forward.clone().applyQuaternion(turn);
  const inhale=pulse(0,.55,.65,1.15,t),roar=pulse(.55,1.35,2.05,2.65,t),brace=pulse(2.7,3.13,3.68,4.15,t),recover=pulse(4.2,4.5,5.5,6.3,t);
  const chest=pulse(.38,1.18,2.0,2.72,t),neck=pulse(.62,1.38,2.12,2.82,t);
  const swing=s=>steps[s].reduce((sum,[a,b])=>sum+(t>a&&t<b?Math.sin(Math.PI*(t-a)/(b-a))**2:0),0);
  const weight=.095*(swing('R')-swing('L'));
  const lag=(delay,limit)=>MathUtils.clamp(curve(turns,Math.max(0,t-delay))-yaw,-limit,limit);
  const recoil=pulse(3.72,3.88,4.05,4.35,t);
  moveWorld(bones.jt_Cog_C,UP.clone().multiplyScalar(-.035*inhale+.035*chest-.08*brace-.025*recover).addScaledVector(side,weight).addScaledVector(front,-.045*chest+.035*brace));
  // The pelvis tilts the whole trunk: the chest rises and the tail base lowers.
  // Feet are solved afterwards, so this does not rotate the planted feet off the floor.
  rotate('jt_Cog_C',side,-.12*chest);
  rotate('jt_Cog_C',front,-weight*.35+.025*recoil);
  rotate('jt_Spine1_C',side,.025*inhale-.21*chest+.025*brace+.025*recoil);
  rotate('jt_Spine2_C',side,-.09*chest-.02*recoil);
  rotate('jt_Neck1_C',side,-.13*neck-.035*brace);
  rotate('jt_Neck2_C',side,-.14*neck-.025*recoil);
  rotate('jt_Neck3_C',side,-.08*neck);
  const breath=pulse(1.25,1.45,1.95,2.15,t)*Math.sin((t-1.25)*18);
  rotate('jt_Head_C',side,-.04*roar+.008*breath);
  rotate('jt_Jaw_C',side,.65*pulse(.92,1.4,2.05,2.6,t));
  // Pelvis leads; chest and gaze lag behind it, then catch up during braking.
  rotate('jt_Spine1_C',UP,.55*lag(.09,.45)+.065*recoil);
  rotate('jt_Spine2_C',UP,.35*lag(.15,.45)-.035*recoil);
  rotate('jt_Neck1_C',UP,.23*lag(.19,.5));
  rotate('jt_Neck2_C',UP,.17*lag(.23,.5));
  rotate('jt_Head_C',UP,.12*lag(.27,.5));
  rotate('jt_Spine2_C',front,-.04*brace+.035*recoil);
  rotate('jt_Neck2_C',front,.025*brace-.02*recoil);
  for(let i=1;i<=6;i++){
   const lag=(i-1)*.028;
   const curl=curve([[0,0],[2.65+lag,0],[3.13+lag,-.16],[3.32+lag,-.18],[3.60+lag,.32],[3.82+lag,.23],[4.18+lag,.12],[4.65+lag,-.035],[5.15+lag,0]],t);
   rotate('jt_Tail'+i+'_C',UP,curl*(i<3?.75:1));
   rotate('jt_Tail'+i+'_C',side,-.012*pulse(.48+lag,1.25+lag,2.12+lag,2.9+lag,t)+.018*brace);
  }
  for(const s of ['L','R']){
   const sign=s==='L'?1:-1,arm=lag(s==='L'?.16:.21,.5);
   rotate('jt_Shoulder_'+s,side,-.1*chest+.08*brace+sign*.12*arm);
   rotate('jt_Shoulder_'+s,UP,.22*arm);
   rotate('jt_Elbow_'+s,side,.16*neck+sign*.10*arm+.04*recoil);
   rotate('jt_Wrist_'+s,side,sign*.14*lag(.28,.5)-.035*recoil);
   const f=target(s,t);pin(s,f.point,f.orientation,f.facing);
  }
  root.updateMatrixWorld(true);
 }
 function restore(){if(!saved)return;root.position.copy(origin);root.quaternion.copy(rotation);restorePose(saved);saved=null;}
 return {start,pose,restore,target};
}
