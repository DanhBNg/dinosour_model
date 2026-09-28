import * as T from 'three';
import DATA from './dog-motion.json' with {type:'json'};
import {MOTION_PROFILES} from './animal-motion-profiles.js';
export const DONOR_ACTIONS={walk:'Đi bộ',iddle:'Nghỉ · nhún người',run:'Chạy',jump:'Bật nhảy',walksent:'Đi đánh hơi'};
const HIP='DEF-spine.004',CHEST='DEF-spine.008',HEAD='DEF-spine.011';
export function createDogRetarget(rig,id){
 const p=rig.profile,config=MOTION_PROFILES[id],height=p.hip[1]/.433;
 const vec=a=>new T.Vector3(-a[0],a[1],-a[2]);
 const baseline=DATA.clips.iddle.frames[0];
 const pitch=f=>Math.atan2(f[CHEST][1]-f[HIP][1],f[HIP][2]-f[CHEST][2]);
 function pose(name,phase){
  rig.reset();const clip=DATA.clips[name],at=T.MathUtils.clamp(phase,0,1)*80,i=Math.min(79,Math.floor(at)),u=at-i;
  const f=Object.fromEntries(Object.keys(clip.frames[i]).map(k=>[k,clip.frames[i][k].map((v,j)=>T.MathUtils.lerp(v,clip.frames[i+1][k][j],u))]));
  const jumping=name==='jump',idle=name==='iddle',running=name==='run';
  const avg=clip.frames.reduce((s,f)=>s+f[HIP][1],0)/81;
  const bodyScale=jumping?config.jumpGain:config.bodyGain;
  rig.nodes.hips.position.y+=(f[HIP][1]-(jumping||idle?baseline[HIP][1]:avg))*height*bodyScale;
  rig.nodes.hips.position.x=-(f[HIP][0]-baseline[HIP][0])*height*.25;
  rig.nodes.hips.rotation.x=T.MathUtils.clamp(pitch(f)-pitch(baseline),-.35,.35)*bodyScale;
  rig.nodes.spine.rotation.y=-(f[HIP][0]-baseline[HIP][0])*.45;
  rig.nodes.chest.rotation.z=(f[HIP][0]-baseline[HIP][0])*.4;
  const headDrop=(f[HEAD][1]-f[CHEST][1])-(baseline[HEAD][1]-baseline[CHEST][1]);
  rig.nodes.neck.rotation.x=T.MathUtils.clamp(-headDrop*2.5,-.25,.65)*config.neckGain;
  rig.nodes.head.rotation.y=-(f[HEAD][0]-baseline[HEAD][0])*1.5;
  const tailSignal=(f['DEF-spine'][0]-f[HIP][0])-(baseline['DEF-spine'][0]-baseline[HIP][0]);
  rig.tailNames.forEach((n,k)=>{const delay=k*.42,falloff=.65+.35*k/(rig.tailNames.length-1);rig.nodes[n].rotation.y=config.tailGain*falloff*(Math.sin(phase*Math.PI*2-delay)+tailSignal*4);rig.nodes[n].rotation.x=config.tailGain*.3*Math.sin(phase*Math.PI*2-delay-.6);});
  rig.mesh.updateMatrixWorld(true);
  for(const chain of rig.chains){
   const key=`DEF-${chain.end==='front'?'front_':''}toe.${chain.side}`;
   const values=clip.frames.map(f=>f[key]),walkValues=DATA.clips.walk.frames.map(f=>f[key]);
   const minY=Math.min(...values.map(v=>v[1])),maxY=Math.max(...values.map(v=>v[1]));
   const zCenter=idle||jumping?baseline[key][2]:values.reduce((s,v)=>s+v[2],0)/81;
   const walkRange=Math.max(...walkValues.map(v=>v[2]))-Math.min(...walkValues.map(v=>v[2]));
   const zScale=p.stride/walkRange*(running?1.25:1);
   const target=rig.points[chain.names[3]].clone();
   target.z-=T.MathUtils.clamp((f[key][2]-zCenter)*zScale,-p.stride*(running?1.15:.85),p.stride*(running?1.15:.85));
   const rise=Math.max(0,f[key][1]-minY-.009);
   target.y+=jumping?rise*height*config.jumpGain:idle?0:rise/(maxY-minY||1)*p.lift*(running?1.6:1);
   // Hoof/paw stance stays on the source sole height; each species keeps its own limb lengths.
   rig.ik(chain,target);
  }
  rig.mesh.updateMatrixWorld(true);rig.mesh.skeleton.update();
 }
 function bake(name){
  const duration=DATA.clips[name].duration*config.pace,frames=97,times=[],samples=rig.bones.map(()=>({q:[],p:[]}));
  for(let i=0;i<frames;i++){times.push(i/(frames-1)*duration);pose(name,i/(frames-1));rig.bones.forEach((b,j)=>{samples[j].q.push(...b.quaternion.toArray());samples[j].p.push(...b.position.toArray());});}
  const tracks=[];rig.bones.forEach((b,j)=>{tracks.push(new T.QuaternionKeyframeTrack(b.name+'.quaternion',times,samples[j].q),new T.VectorKeyframeTrack(b.name+'.position',times,samples[j].p));});rig.reset();
  return new T.AnimationClip('dog-'+name,duration,tracks);
 }
 return {pose,bake};
}
