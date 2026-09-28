import test from 'node:test';
import assert from 'node:assert/strict';
import {Vector3} from 'three';
import {poseMosaBreach,MOSA_BREACH_LABEL} from '../src/demos/trex/mosa-breach.js';
const sample=u=>{const values=[];poseMosaBreach({u,front:new Vector3(0,0,1),right:new Vector3(1,0,0),up:new Vector3(0,1,0),rotate:(name,axis,value)=>values.push({name,value}),move:(name,...v)=>v.forEach(value=>values.push({name,value}))});return values;};
test('Mosasaurus label is valid Vietnamese and endpoints settle for looping',()=>{
 assert.equal(MOSA_BREACH_LABEL,'Vọt lên · nghiêng mình lặn');
 for(const t of [0,1])assert.ok(sample(t).every(v=>Math.abs(v.value)<1e-10));
 for(let i=0;i<=240;i++)assert.ok(sample(i/240).every(v=>Number.isFinite(v.value)));
});
test('maneuver articulates trunk, tail and distal fins rather than root alone',()=>{
 const affected=new Set();for(let i=0;i<=100;i++)sample(i/100).filter(v=>Math.abs(v.value)>.01).forEach(v=>affected.add(v.name));
 for(const n of ['Bone001','Bone006','Bone007','Bone009','Bone010','Bone016','Bone024','Bone033','Bone029','Bone037'])assert.ok(affected.has(n),n);
});
