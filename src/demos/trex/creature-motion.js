import {poseMosaBreach,MOSA_BREACH_LABEL} from './mosa-breach.js';
import * as T from 'three';
const up=new T.Vector3(0,1,0),right=new T.Vector3(1,0,0),forward=new T.Vector3(0,0,1);
const smooth=x=>{x=T.MathUtils.clamp(x,0,1);return x*x*(3-2*x);};
const pulse=(u,start,peak,end)=>u<peak?smooth((u-start)/(peak-start)):1-smooth((u-peak)/(end-peak));
// Bake on the imported skeleton, using world axes rather than guessing FBX bone axes.
export function addCreatureMotions(root,source,nodes,original,animations,definitions,id){
 if(!original)return;
 const objects=[];source.traverse(o=>objects.push(o));
 const rest=objects.map(o=>({p:o.position.clone(),q:o.quaternion.clone(),s:o.scale.clone()}));
 const restore=()=>objects.forEach((o,i)=>{o.position.copy(rest[i].p);o.quaternion.copy(rest[i].q);o.scale.copy(rest[i].s);});
 const mixer=new T.AnimationMixer(source);mixer.clipAction(original).play();
 const wq=new T.Quaternion(),pq=new T.Quaternion(),q=new T.Quaternion();
 function rotate(name,axis,angle){const b=nodes[name];if(!b)return;root.updateMatrixWorld(true);b.getWorldQuaternion(wq);b.parent.getWorldQuaternion(pq);b.quaternion.copy(pq.invert().multiply(q.setFromAxisAngle(axis,angle)).multiply(wq));}
 function move(name,x,y,z){const b=nodes[name];if(!b)return;root.updateMatrixWorld(true);const v=b.getWorldPosition(new T.Vector3()).add(new T.Vector3(x,y,z));b.position.copy(b.parent.worldToLocal(v));}
 function pin(name,chain,target,orientation){const foot=nodes[name];if(!foot)return;for(let k=0;k<9;k++)for(const joint of chain){const b=nodes[joint];if(!b)continue;root.updateMatrixWorld(true);const p=b.getWorldPosition(new T.Vector3()),a=foot.getWorldPosition(new T.Vector3()).sub(p).normalize(),v=target.clone().sub(p).normalize();b.getWorldQuaternion(wq);b.parent.getWorldQuaternion(pq);b.quaternion.copy(pq.invert().multiply(q.setFromUnitVectors(a,v)).multiply(wq));}root.updateMatrixWorld(true);foot.parent.getWorldQuaternion(pq);foot.quaternion.copy(pq.invert().multiply(orientation));}
 const specs=id==='mosa'?[['bankTurn','Ngoặt hướng · quật đuôi',7],['strike','Cuộn thân · lao tới',6]]:id==='trice'?[['headbutt','Lấy đà · húc sừng',6],['hornSweep','Quét sừng hai bên',7]]:[['soar','Sải cánh lướt',8]];
 if(id==='mosa')specs.push(['breachDive',MOSA_BREACH_LABEL,8]);
 for(const [action,label,duration]of specs){
  const times=[],samples=objects.map(()=>({p:[],q:[],s:[]}));const count=Math.round(duration*30);
  for(let frame=0;frame<=count;frame++){
   const t=frame/count*duration,u=t/duration,a=u*Math.PI*2,env=Math.sin(Math.PI*u)**2;
   // Rebind each sample: restoring transforms while reusing mixer caches can leave
   // constant tracks in bind pose, notably the flyer's body height and orientation.
   mixer.stopAllAction();restore();mixer.clipAction(original).reset().play();mixer.setTime(id==='ptero'?.35:.01);root.updateMatrixWorld(true);
   if(id==='mosa'&&action==='breachDive'){
    const front=nodes.Bone004.getWorldPosition(new T.Vector3()).sub(nodes.Bone020.getWorldPosition(new T.Vector3()));front.y=0;front.normalize();
    const lateral=new T.Vector3().crossVectors(up,front).normalize();
    poseMosaBreach({u,rotate,move,front,right:lateral,up});
   }else if(id==='mosa'){
    const turn=action==='bankTurn',coil=pulse(u,.02,.28,.55),burst=pulse(u,.3,.5,.9);
    const heading=turn?1.05*Math.sin(a)*env:-.4*coil+.35*burst;
    rotate('Bone020',up,heading);rotate('Bone020',forward,turn?.32*Math.sin(a)*env:.17*coil-.12*burst);
    move('Bone020',turn?.65*Math.sin(a)*env:.2*coil,turn?.15*env:.2*burst,turn?.5*env:-.45*coil+1.45*burst);
    ['Bone007','Bone008','Bone009','Bone010','Bone011','Bone014','Bone015','Bone016'].forEach((n,i)=>{
     const wave=.07*Math.sin(a*3-i*.6)*env;
     rotate(n,up,turn?-.12*Math.sin(a-i*.2)*env+wave:.15*coil-.18*pulse(u,.28+i*.012,.43+i*.012,.67+i*.012)+wave);
    });
    for(const [n,s]of [['Bone023',1],['Bone032',-1],['Bone028',1],['Bone036',-1]]){rotate(n,forward,s*(.3*coil+.2*Math.sin(a)*env));rotate(n,up,s*.18*burst);}
    rotate('Bone001',up,-heading*.18);rotate('Bone002',right,turn?0:-.13*burst);
   }else if(id==='trice'){
    const feet=[['Bip001_L_Hand',['Bip001_L_Forearm','Bip001_L_UpperArm']],['Bip001_R_Hand',['Bip001_R_Forearm','Bip001_R_UpperArm']],['Bip001_L_Foot',['Bip001_L_Calf','Bip001_L_Thigh']],['Bip001_R_Foot',['Bip001_R_Calf','Bip001_R_Thigh']]].map(([n,c])=>[n,c,nodes[n].getWorldPosition(new T.Vector3()),nodes[n].getWorldQuaternion(new T.Quaternion())]);
    const charge=action==='headbutt',brace=pulse(u,.03,.32,.7),hit=pulse(u,.32,.46,.72);
    move('Bip001_Pelvis',charge?0:.05*Math.sin(a)*env,-.07*brace,charge?-.1*brace+.2*hit:0);
    rotate('Bip001_Spine1',right,.045*brace-.065*hit);
    const yaw=charge?.06*Math.sin(a)*env:.68*Math.sin(a)*env;
    const pitch=charge?.28*brace-.62*hit:.12*env;
    for(const [n,k]of [['Bip001_Neck',.35],['Bip001_Neck1',.35],['Bip001_Head',.3]]){rotate(n,up,yaw*k);rotate(n,right,pitch*k);}
    ['Bip001_Tail','Bip001_Tail1','Bip001_Tail2','Bip001_Tail3'].forEach((n,i)=>rotate(n,up,-.07*Math.sin(a-i*.35)*env));
    feet.forEach(f=>pin(...f));
   }else{
    // Use the spread-wing original pose; shoulders, wrists and tips respond at different phases.
    for(const side of ['L','R']){const sign=side==='L'?1:-1;for(const [prefix,amp,lag]of [['upperArm',.065,0],['foreArm',.045,.4],['wrist',.055,.75],['wing01',.025,1]]){const name=Object.keys(nodes).find(n=>n.startsWith(side+prefix));if(name)rotate(name,forward,sign*amp*Math.sin(a*2-lag)*env);}}
    rotate('center5',forward,.12*Math.sin(a)*env);rotate('neck_0312',up,-.08*Math.sin(a)*env);rotate('head15',right,.045*Math.sin(a-.3)*env);
   }
   root.updateMatrixWorld(true);times.push(t);objects.forEach((o,i)=>{samples[i].p.push(...o.position.toArray());samples[i].q.push(...o.quaternion.toArray());samples[i].s.push(...o.scale.toArray());});
  }
  const tracks=[];objects.forEach((o,i)=>{tracks.push(new T.VectorKeyframeTrack(o.uuid+'.position',times,samples[i].p),new T.QuaternionKeyframeTrack(o.uuid+'.quaternion',times,samples[i].q),new T.VectorKeyframeTrack(o.uuid+'.scale',times,samples[i].s));});
  const key='authored-'+action;animations[key]=new T.AnimationClip(key,duration,tracks);definitions[action]=[key,label,'Chuyển động bổ sung trên rig: phối hợp nhiều khớp, có độ trễ giữa thân và chi.',true];
 }
 mixer.stopAllAction();mixer.uncacheRoot(source);restore();root.updateMatrixWorld(true);
}
