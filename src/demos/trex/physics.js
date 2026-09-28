// Reduced-body dynamics: fixed-step gravity, ground impact, angular contact and damping.
// Not a full articulated ragdoll. All units refer to the normalized demo model.
export function createMotionPhysics(){
 const s={time:0,height:0,velocity:0,angle:0,angularVelocity:0,impact:0,airborne:false};let carry=0;
 function reset(){Object.assign(s,{time:0,height:0,velocity:0,angle:0,angularVelocity:0,impact:0,airborne:false});carry=0;}
 function step(id,dt){carry+=Math.max(0,Math.min(dt,.1));const h=1/120;while(carry>=h){carry-=h;const prev=s.time;s.time+=h;s.impact*=Math.exp(-h*8);
  if(id==='jump'){
   if(prev<.5&&s.time>=.5){s.velocity=5.15;s.airborne=true;}
   if(s.airborne){s.velocity-=9.81*h;s.height+=s.velocity*h;if(s.height<=0){s.impact=Math.min(1,Math.abs(s.velocity)/5);s.height=0;s.velocity=-s.velocity*.055;if(s.velocity<.35){s.airborne=false;s.velocity=0;}}}
  }else if(id==='death'&&s.time>.32){
   if(prev<=.32)s.angularVelocity=1.2;
   const penetration=Math.max(0,s.angle-Math.PI/2);const torque=4.8*Math.sin(s.angle+.12)-95*penetration-(penetration>0?12:1.1)*s.angularVelocity;
   s.angularVelocity+=torque*h;s.angle+=s.angularVelocity*h;
   if(s.time>3.7&&Math.abs(s.angularVelocity)<.035){s.angularVelocity=0;}
  }
 }return s;}
 return {state:s,reset,step};
}
