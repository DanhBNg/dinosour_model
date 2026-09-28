import {Box3, Vector3, Spherical, MathUtils} from 'three';

// Independent camera choreography. Never changes a model transform or animation pose.
export function createEntranceCamera(camera, controls, host, {reducedMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches}={}) {
  let transition=null;
  const directions={trex:[1.3,.5,3],stego:[2.5,.65,1.4],trice:[2.5,.65,1.4],deino:[-1,.25,1.7],mosa:[1,.24,1.7],ptero:[1,.22,1.8]};
  function frame(root,id,{animate=true}={}) {
    root.updateMatrixWorld(true);
    root.traverse(node=>node.skeleton?.update());
    const box=new Box3().setFromObject(root,true),center=box.getCenter(new Vector3());
    if(box.isEmpty())return;
    const size=box.getSize(new Vector3());
    const direction=new Vector3(...(directions[id]||[1,.26,1.6])).normalize();
    const right=new Vector3(direction.z,0,-direction.x).normalize();
    const up=new Vector3().crossVectors(direction,right).normalize();
    camera.aspect=host.clientWidth/Math.max(1,host.clientHeight);camera.updateProjectionMatrix();
    const tan=Math.tan(MathUtils.degToRad(camera.fov/2));
    let distance=1;
    // Allow peripheral tail/wing cropping; keep the torso dominant in the frame.
    const fill=host.clientWidth<600?1.12:1.03;
    for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
      const v=new Vector3(x,y,z).sub(center);
      distance=Math.max(distance,v.dot(direction)+Math.max(Math.abs(v.dot(right))/(tan*camera.aspect*fill),Math.abs(v.dot(up))/(tan*fill)));
    }
    distance*=id==='trex'?.74:['stego','trice'].includes(id)?.78:id==='mosa'?.80:id==='ptero'?.87:.87;
    if(id==='trex'){
      const head=root.userData.sculptRuntime?.nodes?.jt_Head_C;
      if(head){const focus=head.getWorldPosition(new Vector3());focus.y=center.y;center.lerp(focus,.3);}
    }
    center.y-=size.y*.045;
    const final=new Spherical().setFromVector3(direction.multiplyScalar(distance));
    controls.target.copy(center);
    transition={elapsed:0,duration:2.8,target:center,end:final,start:new Spherical(final.radius*1.34,final.phi-.08,final.theta+.48)};
    if(!animate||reducedMotion()){apply(1);transition=null;}else apply(0);
  }
  function apply(t){const s=transition;if(!s)return;const e=t*t*t*(t*(t*6-15)+10);const p=new Spherical(MathUtils.lerp(s.start.radius,s.end.radius,e),MathUtils.lerp(s.start.phi,s.end.phi,e),MathUtils.lerp(s.start.theta,s.end.theta,e));camera.position.copy(s.target).add(new Vector3().setFromSpherical(p));controls.target.copy(s.target);controls.update();}
  function cancel(){transition=null;}
  controls.addEventListener('start',cancel);
  return {frame,cancel,update(dt){if(!transition)return;transition.elapsed+=dt;const t=Math.min(1,transition.elapsed/transition.duration);apply(t);if(t===1)transition=null;},get active(){return !!transition;},dispose(){cancel();controls.removeEventListener('start',cancel);}};
}
