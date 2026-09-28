import * as T from 'three';
export const HUNT_DURATION=10;
const smooth=(a,b,t)=>{const x=T.MathUtils.clamp((t-a)/(b-a),0,1);return x*x*x*(x*(x*6-15)+10);};
export function huntBeat(time){
 const t=T.MathUtils.clamp(time,0,HUNT_DURATION),stop=smooth(4.3,6.5,t);
 // Integral of a smooth velocity ramp; C1-continuous deceleration.
 const u=T.MathUtils.clamp((t-4.3)/2.2,0,1);
 const travel=2.1*(Math.min(t,4.3)+2.2*(u-2.5*u**4+3*u**5-u**6));
 return {t,z:-5+travel,stop,grip:smooth(4.15,4.85,t),reach:smooth(3.5,4.35,t),lift:smooth(4.85,6.4,t),settle:smooth(6.4,9,t)};
}
const V=()=>new T.Vector3(),Q=()=>new T.Quaternion();
function freePrey(t){const b=huntBeat(Math.max(0,t));return new T.Vector3(.18*Math.sin(t*1.5),0,(t<0?-5+2.1*t:b.z)+4.3-.95*b.reach);}
function footPath(t,side,{period,duty,lift,height,x,z,path}){
 const phase=((t/period+side*.5)%1+1)%1,start=t-phase*period;
 const plant=when=>{const point=path(when),end=path(when+period*duty);point.z+=(end.z-point.z)*.5+z;point.x+=x;point.y=height;return point;};
 const a=plant(start);if(phase<=duty)return a;
 const u=(phase-duty)/(1-duty),b=plant(start+period),distance=a.distanceTo(b);
 a.lerp(b,smooth(0,1,u));a.y+=lift*Math.sin(Math.PI*u)**2*Math.min(1,distance/.25);return a;
}
export function preyFootTarget(t,side){return footPath(t,side,{period:.64,duty:.42,lift:.23,height:.06,x:side===0?-.105:.105,z:.48,path:freePrey});}
function pinFoot(end,chain,target,orientation){
 for(let i=0;i<10;i++)for(const joint of chain){
  joint.updateWorldMatrix(true,true);const origin=joint.getWorldPosition(V()),from=end.getWorldPosition(V()).sub(origin),to=target.clone().sub(origin);
  if(from.lengthSq()<1e-10||to.lengthSq()<1e-10)continue;
  const delta=Q().setFromUnitVectors(from.normalize(),to.normalize()),parent=joint.parent.getWorldQuaternion(Q());
  joint.quaternion.premultiply(parent.clone().invert().multiply(delta).multiply(parent));
 }
 end.updateWorldMatrix(true,false);end.quaternion.copy(end.parent.getWorldQuaternion(Q()).invert().multiply(orientation));end.updateWorldMatrix(false,true);
}
function turnWorld(b,axis,angle){if(!b)return;b.updateWorldMatrix(true,false);const p=b.parent.getWorldQuaternion(Q()),q=Q().setFromAxisAngle(axis,angle);b.quaternion.premultiply(p.clone().invert().multiply(q).multiply(p));b.updateWorldMatrix(false,true);}
export function createHuntActions({base,predator,prey,scene,camera,controls,floor,ring}){
 const r=predator.userData.sculptRuntime,p=prey.userData.sculptRuntime;
 const pm=new T.AnimationMixer(r.source),dm=new T.AnimationMixer(p.source);
 const run=pm.clipAction(r.animations['sprint loop']),idle=pm.clipAction(r.animations['idle investigate loop']);
 const biteClip=r.animations['chase bite'].clone();biteClip.tracks=biteClip.tracks.filter(t=>/jt_(Neck|Head|Jaw|Shoulder|Elbow|Wrist)/.test(t.name));
 const bite=pm.clipAction(biteClip),drun=dm.clipAction(p.animations['original-4']),drest=dm.clipAction(p.animations['original-0']);
 idle.play();idle.time=1;pm.update(0);predator.updateMatrixWorld(true);
 const closedJaw=r.nodes.jt_Jaw_C.quaternion.clone();
 pm.stopAllAction();
 const state=base.state;let active=false,time=0,saved=null;
 const mouth=V(),anchor=V(),lastTarget=V();
 let rawPred=null,rawPrey=null;
 const capture=nodes=>Object.values(nodes).filter(n=>n.isBone).map(n=>[n,n.quaternion.clone(),n.position.clone()]);
 const restore=pose=>{for(const [n,q,p]of pose||[]){n.quaternion.copy(q);n.position.copy(p);}};
 function sample(action,t,weight){action.enabled=true;action.play();action.setEffectiveWeight(weight);action.time=t;}
 function pose(t){
  const b=huntBeat(t);time=b.t;
  // Restore only our procedural offsets. Mixer caches otherwise leave the last
  // frame's edits in place when a held clip is sampled at the same timestamp.
  restore(rawPred);restore(rawPrey);
  predator.position.set(0,0,b.z);predator.quaternion.identity();
  sample(run,((b.z+5)/2.1*1.35)%run.getClip().duration,1-b.stop);sample(idle,1+b.t*.22,b.stop);
  sample(bite,.12+.65*b.reach,b.reach*.92);pm.update(0);rawPred=capture(r.nodes);
  const hit=Math.sin(Math.PI*T.MathUtils.clamp((t-4.55)/.55,0,1))**2;
  const cog=r.nodes.jt_Cog_C;if(cog){cog.updateWorldMatrix(true,false);const v=cog.getWorldPosition(V());v.z+=.12*b.reach*(1-.5*b.lift)-.05*hit;v.y-=.09*b.reach*(1-b.lift)+.06*hit;cog.position.copy(cog.parent.worldToLocal(v));}
  // Lower the neck before contact, then lift only enough to take the prey's weight.
  turnWorld(r.nodes.jt_Neck1_C,new T.Vector3(1,0,0),.24*b.reach-.2*b.lift-.03*hit);
  turnWorld(r.nodes.jt_Head_C,new T.Vector3(1,0,0),-.07*b.reach);
  turnWorld(r.nodes.jt_Tail2_C,new T.Vector3(0,1,0),.035*Math.sin(Math.max(0,t-4.55)*5)*Math.exp(-Math.max(0,t-4.55))*b.grip);
  r.nodes.jt_Jaw_C.quaternion.copy(closedJaw);
  turnWorld(r.nodes.jt_Jaw_C,new T.Vector3(1,0,0),b.reach*(.48-.8*b.grip));
  // Preserve authored sprint leg and toe articulation; procedural IK here
  // overwrote the original gait and flattened the ankle/toe roll.
  predator.updateMatrixWorld(true);
  const head=r.nodes.jt_Head_C.getWorldPosition(V()),neck=r.nodes.jt_Neck3_C.getWorldPosition(V());
  const forward=head.clone().sub(neck);forward.y=0;forward.normalize();
  // Grip inside the tooth rows, not at the front of the muzzle. The transition
  // into the oral cavity happens while the jaws are still open.
  mouth.copy(r.nodes.jt_Jaw_C.getWorldPosition(V())).addScaledVector(forward,.98-.32*smooth(4.15,4.75,t));mouth.y-=.035;
  const swingTime=Math.max(0,t-4.65),swing=.15*Math.sin(swingTime*5.2)*Math.exp(-swingTime*.85)*smooth(4.65,4.95,t);
  prey.scale.setScalar(.36);prey.rotation.set(0,Math.PI-1.2*smooth(4.3,5.5,t)+swing*.5,0);
  const roll=Q().setFromAxisAngle(new T.Vector3(0,0,1),.65*smooth(4.55,6,t)+swing);prey.quaternion.multiply(roll);
  const free=freePrey(t);free.x*=1-b.grip;prey.position.copy(free);
  sample(drun,(b.t*1.85+.35)%drun.getClip().duration,1-b.grip);sample(drest,2,b.grip);dm.update(0);rawPrey=capture(p.nodes);
  const struggle=b.grip*(1-b.settle),phase=Math.max(0,b.t-4.6);
  for(const [i,s]of ['L','R'].entries()){
   const pulse=Math.sin(phase*8+i*1.9)*.16*struggle;
   p.nodes['thigh'+s].rotation.x+=.45*b.grip+pulse;
   p.nodes['knee'+s].rotation.x-=.5*b.grip+pulse*.6;
   p.nodes['forearm'+s].rotation.x+=.2*b.grip+.09*Math.sin(phase*7+i)*struggle;
  }
  p.nodes.spine.rotation.x-=.07*b.grip;
  p.nodes.neckMid.rotation.x-=.18*b.grip+.035*Math.sin(phase*5)*struggle;
  p.nodes.head.rotation.x-=.07*b.grip;
  for(let i=1;i<=4;i++)p.nodes['tail'+i].rotation.y+=.055*Math.sin(phase*5-i*.6)*struggle;
  const planted=1-smooth(4.1,4.65,t);
  if(planted>0)for(const [i,s]of ['L','R'].entries()){
   prey.updateMatrixWorld(true);const end=p.nodes['ankle'+s],target=end.getWorldPosition(V()).lerp(preyFootTarget(t,i),planted);
   pinFoot(end,['hock','knee','thigh'].map(n=>p.nodes[n+s]),target,prey.quaternion);
  }
  // Chest bone lies near the back surface. Bind the centre of the ribcage,
  // slightly behind/below that bone, so both jaws surround the body.
  const ribcage=new T.Vector3(0,-.13,.28);
  prey.position.copy(free);prey.updateMatrixWorld(true);anchor.copy(p.nodes.chest.localToWorld(ribcage.clone()));
  prey.position.add(mouth.clone().sub(anchor).multiplyScalar(b.grip));prey.updateMatrixWorld(true);anchor.copy(p.nodes.chest.localToWorld(ribcage.clone()));
  if(active){const target=V().set(0,1.25,b.z+1);camera.position.add(target.clone().sub(lastTarget));controls.target.add(target.clone().sub(lastTarget));lastTarget.copy(target);}
 }
 function leave(){if(!active)return;active=false;scene.remove(prey);pm.stopAllAction();dm.stopAllAction();predator.position.copy(saved.position);predator.quaternion.copy(saved.rotation);floor.scale.copy(saved.floor);ring.scale.copy(saved.ring);camera.position.copy(saved.camera);controls.target.copy(saved.target);controls.update();}
 const api={state,mixer:base.mixer,play(id){
  if(id!=='hunt'){leave();return base.play(id);}
  if(active)leave();base.play('idle');base.mixer.stopAllAction();
  saved={position:predator.position.clone(),rotation:predator.quaternion.clone(),camera:camera.position.clone(),target:controls.target.clone(),floor:floor.scale.clone(),ring:ring.scale.clone()};
  rawPred=null;rawPrey=null;active=true;state.id='hunt';state.paused=false;scene.add(prey);prey.name='hunt-deinonychus';floor.scale.set(2.6,1,2.6);ring.scale.setScalar(2.6);
  lastTarget.set(0,1.25,-4);api.frameView('hero');pose(0);return true;
 },update(dt){if(!active)return base.update(dt);if(!state.paused)pose(Math.min(HUNT_DURATION,time+Math.min(dt,.05)*state.speed));},pause(){if(active)state.paused=!state.paused;else base.pause();},setSpeed(v){base.setSpeed(v);},get progress(){return active?time/HUNT_DURATION:base.progress;},dispose(){leave();pm.uncacheRoot(r.source);dm.uncacheRoot(p.source);base.dispose();},
 frameView(id){const offset={hero:[12,4.5,8],side:[14,2,0],head:[7,2,6]}[id]||[12,4.5,8];controls.target.copy(lastTarget);camera.position.copy(lastTarget).add(new T.Vector3(...offset).multiplyScalar(camera.aspect<1?1.35:1));controls.update();},
 get hunt(){return {active,time,contactError:anchor.distanceTo(mouth),mouth:mouth.toArray(),anchor:anchor.toArray()};},seek(t){if(active)pose(t);}};
 return api;
}
