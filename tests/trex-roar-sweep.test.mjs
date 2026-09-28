import test from 'node:test';
import assert from 'node:assert/strict';
import {ACTIONS,createTrexActions} from '../src/demos/trex/actions.js';
import * as T from 'three';
import fs from 'node:fs';
import {createRoarSweep,ROAR_SWEEP_DURATION} from '../src/demos/trex/roar-sweep.js';
import * as sweepModule from '../src/demos/trex/roar-sweep.js';

function model(){
 const source=new T.ObjectLoader().parse(JSON.parse(fs.readFileSync('model3d/trex-demo/model.json'))),root=new T.Group(),visual=new T.Group();visual.add(source);root.add(visual);source.updateMatrixWorld(true);
 const box=new T.Box3().setFromObject(source),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3()),scale=8/Math.max(size.x,size.y,size.z);
 visual.scale.setScalar(scale);visual.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);
 root.userData.sculptRuntime={source,animations:{}};return root;
}
test('tail bends with a stiff base and a delayed distal release',()=>{
 assert.equal(typeof sweepModule.tailSweepAngles,'function');
 const angles=sweepModule.tailSweepAngles;
 const wind=angles(3.27);assert.ok(Math.abs(wind[0])<.15);assert.ok(Math.abs(wind[4])>.3);
 const peaks=Array.from({length:6},()=>({value:-Infinity,time:0}));
 for(let t=3.3;t<4.5;t+=.005)angles(t).forEach((v,i)=>{if(v>peaks[i].value)peaks[i]={value:v,time:t};});
 assert.ok(peaks[4].time-peaks[0].time>.18,'tip releases with the base');
 assert.ok(peaks[3].value>peaks[0].value*2,'tail behaves like one rigid lever');
 assert.deepEqual(angles(0),[0,0,0,0,0,0]);assert.deepEqual(angles(ROAR_SWEEP_DURATION),[0,0,0,0,0,0]);
});
test('new action is registered and works without ANY source animation clips',()=>{
 assert.ok(ACTIONS.roarSweep,'missing authored roarSweep action');
 const root=model(),actions=createTrexActions(root);assert.equal(actions.play('roarSweep'),true);
 for(let i=0;i<150;i++){actions.update(.05);root.traverse(b=>{if(b.isBone)assert.ok([...b.position,...b.quaternion].every(Number.isFinite));});}
 assert.equal(actions.state.id,'roarSweep');actions.dispose();
});
test('standing posture stays raised and the whip is faster than recovery',()=>{
 const root=model(),nodes={};root.traverse(b=>{if(b.isBone&&!nodes[b.name])nodes[b.name]=b;});root.updateMatrixWorld(true);
 const rawHip=nodes.jt_Cog_C.getWorldPosition(new T.Vector3()).y,motion=createRoarSweep(root);motion.start();
 const hipY=()=>nodes.jt_Cog_C.getWorldPosition(new T.Vector3()).y;
 assert.ok(hipY()>rawHip+.15,'neutral stance remains crouched');
 let strike=0,recovery=0,previous;
 for(let t=0;t<=ROAR_SWEEP_DURATION;t+=.01){motion.pose(t);assert.ok(hipY()>rawHip+.04,'torso stays lowered');const p=nodes.jt_Tail6_C.getWorldPosition(new T.Vector3());if(previous){const speed=p.distanceTo(previous)/.01;if(t>3.15&&t<3.95)strike=Math.max(strike,speed);if(t>4.4)recovery=Math.max(recovery,speed);}previous=p;}
 console.log({strike,recovery});assert.ok(strike>recovery*2,'whip lacks a fast strike / slower recovery contrast');motion.restore();
});
test('sweep transfers weight and articulates the chest, upper neck and wrists',()=>{
 const root=model(),nodes={};root.traverse(b=>{if(b.isBone&&!nodes[b.name])nodes[b.name]=b;});const motion=createRoarSweep(root);motion.start();
 const names=['jt_Spine2_C','jt_Neck2_C','jt_Head_C','jt_Wrist_L','jt_Wrist_R'];
 motion.pose(3.2);const before=Object.fromEntries(names.map(n=>[n,nodes[n].quaternion.clone().normalize()]));const cog=nodes.jt_Cog_C.position.clone();
 motion.pose(3.63);for(const n of names)assert.ok(before[n].angleTo(nodes[n].quaternion.clone().normalize())>.012,n+' stays rigid through the strike');
 assert.ok(nodes.jt_Cog_C.position.distanceTo(cog)>.001);
 motion.pose(0);const start=Object.fromEntries(names.map(n=>[n,nodes[n].quaternion.clone().normalize()]));motion.pose(ROAR_SWEEP_DURATION);
 for(const n of names)assert.ok(start[n].angleTo(nodes[n].quaternion.clone().normalize())<1e-5,n+' fails to settle for looping');motion.restore();
});
test('roar raises the trunk and lowers the tail with both feet grounded',()=>{
 const root=model(),nodes={};root.traverse(b=>{if(b.isBone&&!nodes[b.name])nodes[b.name]=b;});const motion=createRoarSweep(root);motion.start();
 const position=n=>nodes[n].getWorldPosition(new T.Vector3());const chest=position('jt_Neck1_C'),tail=position('jt_Tail6_C');
 motion.pose(1.65);
 assert.ok(position('jt_Neck1_C').y>chest.y+.25,'neck base / chest does not rise');
 assert.ok(position('jt_Tail6_C').y<tail.y-.15,'tail does not counterbalance the raised trunk');
 assert.ok(position('jt_Tail6_C').y>.15,'tail touches floor');
 for(const side of ['L','R'])assert.ok(position('jt_Foot_'+side).distanceTo(motion.target(side,1.65).point)<.02);motion.restore();
});
test('authored motion holds stance feet, sweeps tail forward, and restores cleanly',()=>{
 const root=model(),nodes={};root.traverse(b=>{if(b.isBone&&!nodes[b.name])nodes[b.name]=b;});root.updateMatrixWorld(true);
 const original=nodes.jt_Head_C.quaternion.clone(),motion=createRoarSweep(root);motion.start();
 const forward=nodes.jt_Head_C.getWorldPosition(new T.Vector3()).sub(nodes.jt_Cog_C.getWorldPosition(new T.Vector3()));forward.y=0;forward.normalize();
 let reach=-Infinity,maxError=0,minClaw=Infinity;
 for(let i=0;i<=152;i++){
  const t=i*.05;motion.pose(t);
  for(const side of ['L','R']){const target=motion.target(side,t);maxError=Math.max(maxError,nodes['jt_Foot_'+side].getWorldPosition(new T.Vector3()).distanceTo(target.point));for(const n of ['Inner','Middle','Outter'])minClaw=Math.min(minClaw,nodes['jt_Claw'+n+'_'+side].getWorldPosition(new T.Vector3()).y);}
  const tail=nodes.jt_Tail6_C.getWorldPosition(new T.Vector3()).sub(nodes.jt_Cog_C.getWorldPosition(new T.Vector3()));reach=Math.max(reach,tail.dot(forward));
 }
 console.log({maxError,minClaw,reach});assert.ok(maxError<.07,'foot IK misses target');assert.ok(minClaw>-.03,'claws penetrate floor');assert.ok(reach>.5,'tail never reaches original forward hemisphere');
 motion.pose(1.5);const q=nodes.jt_Head_C.quaternion.clone();motion.pose(4.5);motion.pose(1.5);assert.deepEqual(q.toArray(),nodes.jt_Head_C.quaternion.toArray(),'pose sampling depends on frame order');
 motion.restore();assert.ok(original.angleTo(nodes.jt_Head_C.quaternion)<1e-6);assert.ok(root.position.length()<1e-6);
});
