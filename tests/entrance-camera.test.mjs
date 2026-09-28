import test from 'node:test';
import assert from 'node:assert/strict';
import {PerspectiveCamera,Vector3,EventDispatcher,Mesh,BoxGeometry,MeshBasicMaterial} from 'three';
import {createEntranceCamera} from '../src/demos/trex/entrance-camera.js';
test('entrance settles, respects reduced motion and yields permanently to user control',()=>{
 const camera=new PerspectiveCamera(37,1,.05,100),controls=new EventDispatcher();controls.target=new Vector3();controls.update=()=>{};
 const root=new Mesh(new BoxGeometry(3,4,7),new MeshBasicMaterial());const host={clientWidth:1000,clientHeight:800};
 const c=createEntranceCamera(camera,controls,host,{reducedMotion:()=>false});c.frame(root,'trex');const start=camera.position.clone();
 for(let i=0;i<180;i++)c.update(1/60);
 assert.equal(c.active,false);assert.ok(camera.position.distanceTo(controls.target)<start.distanceTo(controls.target));
 const end=camera.position.clone();c.update(1);assert.ok(camera.position.equals(end));
 c.frame(root,'trex');controls.dispatchEvent({type:'start'});const interrupted=camera.position.clone();c.update(10);assert.equal(c.active,false);assert.ok(camera.position.equals(interrupted));c.dispose();
 const reduced=createEntranceCamera(camera,controls,host,{reducedMotion:()=>true});reduced.frame(root,'trex');assert.equal(reduced.active,false);assert.ok(camera.position.distanceTo(end)<1e-8);reduced.dispose();
});
