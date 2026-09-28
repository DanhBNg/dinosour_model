import {Quaternion,Vector3} from 'three';
import {createMotionPhysics} from './physics.js';
export const CUSTOM={jump:{duration:2.8,hold:false},sniff:{duration:3.8,hold:false}};
const clamp=v=>Math.max(0,Math.min(1,v)),smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
export function createAuthoredMotion(root){
 const bones={},mesh=[];root.traverse(o=>{if(o.isBone&&!bones[o.name])bones[o.name]=o;if(o.isSkinnedMesh)mesh.push(o);});let bind=[],origin,rotation;
 const physics=createMotionPhysics();let previousTime=0;const axis=new Vector3(),parentQ=new Quaternion(),delta=new Quaternion(),v=new Vector3(),lengthAxis=new Vector3(0,0,1);
 function capture(){origin=root.position.clone();rotation=root.quaternion.clone();bind=Object.values(bones).map(b=>[b,b.quaternion.clone(),b.position.clone()]);root.updateMatrixWorld(true);if(bones.jt_Head_C&&bones.jt_Tail6_C){bones.jt_Head_C.getWorldPosition(lengthAxis);bones.jt_Tail6_C.getWorldPosition(v);lengthAxis.sub(v);lengthAxis.y=0;lengthAxis.normalize();}}
 function restore(){if(!origin)return;root.position.copy(origin);root.quaternion.copy(rotation);for(const [b,q,p]of bind){b.quaternion.copy(q);b.position.copy(p);}root.updateMatrixWorld(true);}
 function rotate(name,x=0,y=0,z=0){const b=bones[name];if(!b)return;const angle=Math.hypot(x,y,z);if(!angle)return;b.parent.getWorldQuaternion(parentQ);axis.set(x,y,z).divideScalar(angle).applyQuaternion(parentQ.invert());delta.setFromAxisAngle(axis,angle);b.quaternion.premultiply(delta);b.updateWorldMatrix(false,true);}
 function ground(height){root.updateMatrixWorld(true);let min=Infinity;for(const m of mesh){m.skeleton.update();const count=m.geometry.attributes.position.count;for(let i=0;i<count;i+=3){m.getVertexPosition(i,v);v.applyMatrix4(m.matrixWorld);min=Math.min(min,v.y);}}if(Number.isFinite(min))root.position.y+=height-min;root.updateMatrixWorld(true);}
 function pitch(name,angle){const lateral=new Vector3().crossVectors(new Vector3(0,1,0),lengthAxis).multiplyScalar(angle);rotate(name,lateral.x,lateral.y,lateral.z);}
 function pinFoot(side,target){const end=bones['jt_Ankle_'+side];if(!end)return;for(let iter=0;iter<7;iter++)for(const name of ['jt_Knee_'+side,'jt_Thigh_'+side]){const joint=bones[name];if(!joint)continue;const p=joint.getWorldPosition(new Vector3()),from=end.getWorldPosition(new Vector3()).sub(p).normalize(),to=target.clone().sub(p).normalize();const q=new Quaternion().setFromUnitVectors(from,to);joint.parent.getWorldQuaternion(parentQ);q.premultiply(parentQ.clone().invert()).multiply(parentQ);joint.quaternion.premultiply(q);joint.updateWorldMatrix(false,true);}}
 function pose(id,t){if(t===0||t<previousTime){physics.reset();previousTime=0;}const physical=physics.step(id,t-previousTime);previousTime=t;restore();let crouch=0,height=0,roll=0,head=0,jaw=0,tail=0;
  if(id==='jump'){
   height=physical.height;if(t<.5)crouch=smooth(t/.5);else if(physical.airborne){crouch=.25+.45*smooth(physical.height);tail=-.06*physical.velocity;head=-.06*physical.height;}else crouch=physical.impact*.85;
  }else if(id==='death'){
   const fall=smooth((t-.35)/1.5);roll=physical.angle;crouch=.7*smooth(t/1.4);head=.08*fall;jaw=.15*fall;tail=.1*physical.angularVelocity;
   root.quaternion.premultiply(delta.setFromAxisAngle(lengthAxis,roll));root.updateMatrixWorld(true);
  }else{const envelope=smooth(t/.85)*(1-smooth((t-2.8)/1));head=.32*envelope;jaw=.04*envelope;tail=.08*Math.sin(t*2)*envelope;rotate('jt_Neck2_C',.13*envelope,.1*Math.sin(t*3)*envelope,0);}
  if(id==='jump'){
   const feet=Object.fromEntries(['L','R'].map(s=>[s,bones['jt_Ankle_'+s].getWorldPosition(new Vector3())]));
   const air=physical.airborne,phase=clamp((t-.5)/.16),tuck=air?smooth((t-.62)/.23)*(1-smooth((t-1.16)/.28)):0;
   const compression=t<.5?smooth(t/.5):air?(1-phase):Math.pow(physical.impact,.55);
   const landing=1.54,stagger=smooth((t-1.35)/.18)*(1-smooth((t-landing-.14)/.2));
   const cog=bones.jt_Cog_C;if(cog){const p=cog.getWorldPosition(new Vector3());p.y-=.28*compression;cog.position.copy(cog.parent.worldToLocal(p));cog.updateWorldMatrix(false,true);}
   for(const [i,side]of ['L','R'].entries()){
    const lag=i===0?1:.78;pitch('jt_Thigh_'+side,-.72*tuck*lag-.14*compression+(i===0?-.07:.09)*tuck);pitch('jt_Knee_'+side,1.3*tuck*lag+.32*compression);pitch('jt_Ankle_'+side,-.55*tuck*lag-.12*compression);pitch('jt_ToeMiddle_'+side,.22*tuck);
    if(!air){const target=feet[side].clone();if(i===1)target.y+=.19*(1-smooth((t-landing)/.18))*smooth((t-.6)/.2);pinFoot(side,target);}
    else if(i===1){pitch('jt_Knee_'+side,.16*stagger);pitch('jt_Ankle_'+side,-.09*stagger);}
   }
   const settle=Math.max(0,t-landing);const recoil=settle?Math.sin(settle*10)*Math.exp(-settle*5):0;
   pitch('jt_Spine1_C',-.1*compression+.08*tuck+.035*recoil);pitch('jt_Neck1_C',.12*compression-.16*tuck-.04*recoil);pitch('jt_Tail1_C',-.18*compression+.18*tuck);pitch('jt_Tail3_C',.1*Math.sin(t*4)*tuck+.045*Math.sin(Math.max(0,settle-.06)*9)*Math.exp(-settle*4));
  }else for(const side of ['L','R']){pitch('jt_Thigh_'+side,-.22*crouch);pitch('jt_Knee_'+side,.45*crouch);pitch('jt_Ankle_'+side,-.2*crouch);}
  rotate('jt_Neck1_C',head*.5);rotate('jt_Head_C',head*.5);rotate('jt_Jaw_C',jaw);rotate('jt_Tail2_C',0,tail);rotate('jt_Tail4_C',0,tail*.7);ground(height);
 }
 return {capture,restore,pose};
}
