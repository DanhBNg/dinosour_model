import * as T from 'three';
import {MOTION_PROFILES} from './animal-motion-profiles.js';
import {createAnimalAuthored} from './animal-authored.js';

// Landmarks in the normalized six-unit asset, +Z forward. Each source is posed,
// so the two rear chains retain their independently measured rest locations.
export const ANIMAL_PROFILES={
 wolf:{hip:[0,2.65,-1.85],chest:[0,2.75,.7],neck:[0,3.2,1.35],head:[0,3.25,2.15],tail:[0,2.4,-2.4],tip:[0,1.2,-2.8],width:.4,belly:1.95,front:[[2.65,.72],[1.65,.6],[.55,.6],[.13,.85]],rear:[[2.6,-1.8],[1.65,-2.25],[.82,-2.7],[.13,-2.75]],rearFar:[[2.6,-1.8],[1.6,-1.55],[.9,-1.95],[.13,-1.5]],period:1.65,stride:.46,lift:.22},
 fox:{hip:[0,1.9,-1.05],chest:[0,1.85,1.15],neck:[0,2.3,1.7],head:[0,2.5,2.4],tail:[0,1.9,-1.7],tip:[0,.8,-2.85],width:.36,belly:1.42,front:[[1.8,1.15],[1.1,1.1],[.38,1.05],[.1,1.3]],rear:[[1.85,-1.05],[.95,-1.25],[.66,-1.75],[.1,-1.7]],rearFar:[[1.85,-1.05],[.92,-.45],[.56,-.95],[.1,-.5]],period:1.4,stride:.37,lift:.2},
 bear:{hip:[0,2.3,-1.75],chest:[0,2.35,.65],neck:[0,2.5,1.4],head:[0,2.48,2.25],tail:[0,2.4,-2.75],tip:[0,2.1,-2.95],width:.65,belly:1.5,front:[[2.2,.65],[1.25,.45],[.35,.6],[.13,.8]],rear:[[2.2,-1.8],[1.15,-2],[.45,-2.55],[.13,-2.4]],rearFar:[[2.2,-1.8],[1.15,-1.5],[.4,-1.45],[.13,-1.1]],period:2.2,stride:.33,lift:.16},
 boar:{hip:[0,2.15,-1.7],chest:[0,2,.4],neck:[0,2,1.2],head:[0,1.8,2.05],tail:[0,2.5,-2.7],tip:[0,1.8,-2.9],width:.44,belly:1.25,front:[[1.9,.35],[.95,.22],[.3,.2],[.12,.45]],rear:[[2.1,-1.75],[1,-2.2],[.4,-2.8],[.12,-2.85]],rearFar:[[2.1,-1.75],[1,-1.9],[.4,-1.75],[.12,-1.65]],period:1.8,stride:.28,lift:.14},
 hyena:{hip:[0,1.9,-1.5],chest:[0,2.5,.9],neck:[0,2.7,1.7],head:[0,2.75,2.35],tail:[0,2.1,-2],tip:[0,2.45,-2.85],width:.5,belly:1.55,front:[[2.4,1],[1.48,.9],[.62,1.75],[.13,2]],rear:[[1.95,-1.5],[1.08,-1.15],[.6,-2.4],[.13,-2.1]],rearFar:[[1.95,-1.5],[1.08,-1],[.6,-2.1],[.13,-1.8]],period:1.75,stride:.32,lift:.2},
 lion:{hip:[0,1.6,-.7],chest:[0,1.35,1.3],neck:[0,1.75,1.8],head:[0,1.95,2.35],tail:[0,1.9,-1.4],tip:[0,1.6,-2.9],width:.48,belly:.87,front:[[1.4,1.25],[.82,1.1],[.25,2.1],[.13,2.5]],rear:[[1.65,-.65],[.82,-.3],[.4,-.8],[.13,-.5]],rearFar:[[1.65,-.65],[.82,-.65],[.4,-1],[.13,-.8]],period:2,stride:.26,lift:.15},
};

export function createAnimalRig(geometry,material,id){
 const p=ANIMAL_PROFILES[id],bones=[],nodes={},points={},segments=[];
 const bone=(name,parent,xyz)=>{const b=new T.Bone();b.name='animal_'+name;points[name]=new T.Vector3(...xyz);b.position.copy(points[name]);if(parent){b.position.sub(points[parent]);nodes[parent].add(b);}nodes[name]=b;bones.push(b);return b;};
 bone('hips',null,p.hip);bone('spine','hips',p.hip.map((v,i)=>(v+p.chest[i])/2));bone('chest','spine',p.chest);bone('neck','chest',p.neck);bone('head','neck',p.head);bone('muzzle','head',[0,p.head[1]-.15,2.98]);
 const tailPath=MOTION_PROFILES[id].tail,tailNames=tailPath.map((_,i)=>'tail'+i);
 tailPath.forEach((xyz,i)=>bone(tailNames[i],i?tailNames[i-1]:'hips',xyz));
 const chains=[];
 for(const [side,sign] of [['L',1],['R',-1]])for(const end of ['front','rear']){
  const coords=end==='rear'&&side==='R'?p.rearFar:p[end],names=coords.map((_,i)=>end+side+i);
  coords.forEach(([y,z],i)=>bone(names[i],i?names[i-1]:end==='front'?'chest':'hips',[sign*p.width,y,z]));
  chains.push({names,side,end,offset:end==='rear'?(side==='L'?0:.5):(side==='L'?.25:.75)});
 }
 for(const [name,b] of Object.entries(nodes))for(const child of b.children){const childName=Object.keys(nodes).find(k=>nodes[k]===child);segments.push({name,index:bones.indexOf(b),a:points[name],b:points[childName],leg:/^(front|rear)/.test(name)});}
 for(const chain of chains){const name=chain.names[3];segments.push({name,index:bones.indexOf(nodes[name]),a:points[name],b:points[name].clone().add(new T.Vector3(0,-.015,.2)),leg:true});}
 const tailSegments=segments.filter(s=>s.name.startsWith('tail'));
 function distanceToSegment(v,s){ab.subVectors(s.b,s.a);const u=T.MathUtils.clamp(v.clone().sub(s.a).dot(ab)/ab.lengthSq(),0,1);return near.copy(s.a).addScaledVector(ab,u).distanceTo(v);}
 const indices=new Uint16Array(geometry.attributes.position.count*4),weights=new Float32Array(indices.length),v=new T.Vector3(),ab=new T.Vector3(),near=new T.Vector3();
 for(let i=0;i<geometry.attributes.position.count;i++){
  v.fromBufferAttribute(geometry.attributes.position,i);const side=v.x>=0?'L':'R';
  const legGate=1-T.MathUtils.smoothstep(v.y,p.belly-.28,p.belly+.35),front=v.z>(p.hip[2]+p.chest[2])/2;
  const tailDistance=Math.min(...tailSegments.map(s=>distanceToSegment(v,s)));
  const bodyDistance=Math.min(...segments.filter(s=>!s.name.startsWith('tail')).map(s=>distanceToSegment(v,s)));
  const tailGate=(1-T.MathUtils.smoothstep(v.z,tailPath[0][2]-.08,tailPath[0][2]+.28))*T.MathUtils.smoothstep(bodyDistance-tailDistance,-.12,.22);
  const headGate=T.MathUtils.smoothstep(v.z,p.neck[2],p.head[2]);
  const candidates=[];
  for(const s of segments){
   let gate=s.name.startsWith('tail')?tailGate:(s.leg?legGate:1-legGate)*(1-tailGate);
   if(s.leg){const left=T.MathUtils.smoothstep(v.x,-.2,.2),forward=T.MathUtils.smoothstep(v.z,(p.hip[2]+p.chest[2])/2-.3,(p.hip[2]+p.chest[2])/2+.3);gate*=s.name.includes('L')?left:1-left;gate*=s.name.startsWith('front')?forward:1-forward;}
   if(s.name==='head')gate=Math.max(gate,headGate);else if(!s.leg)gate*=1-headGate;
   if(gate<1e-6)continue;
   ab.subVectors(s.b,s.a);const u=T.MathUtils.clamp(v.clone().sub(s.a).dot(ab)/ab.lengthSq(),0,1);near.copy(s.a).addScaledVector(ab,u);
   candidates.push([s.index,gate/Math.pow(v.distanceToSquared(near)+.025,2.6)]);
  }
  candidates.sort((a,b)=>b[1]-a[1]);const top=candidates.slice(0,4),sum=top.reduce((s,a)=>s+a[1],0);
  for(let j=0;j<4;j++){indices[i*4+j]=top[j]?.[0]??0;weights[i*4+j]=sum?(top[j]?.[1]??0)/sum:j===0?1:0;}
 }
 geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(indices,4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));
 const mesh=new T.SkinnedMesh(geometry,material);mesh.name=id;mesh.add(nodes.hips);mesh.updateMatrixWorld(true);mesh.bind(new T.Skeleton(bones));mesh.castShadow=mesh.receiveShadow=true;mesh.frustumCulled=false;
 const rest=bones.map(b=>({position:b.position.clone(),quaternion:b.quaternion.clone()}));
 function reset(){bones.forEach((b,i)=>{b.position.copy(rest[i].position);b.quaternion.copy(rest[i].quaternion);});mesh.updateMatrixWorld(true);}
 const worldQ=new T.Quaternion();
 function ik(chain,target){
  const [top,knee,ankle,foot]=chain.names.map(n=>nodes[n]),[a,b,c,d]=chain.names.map(n=>points[n]);
  const start=top.getWorldPosition(new T.Vector3()),end=target.clone().sub(d.clone().sub(c));
  const upper=b.clone().sub(a),lower=c.clone().sub(b),l1=upper.length(),l2=lower.length();
  const direction=end.sub(start),distance=T.MathUtils.clamp(direction.length(),Math.abs(l1-l2)+.001,l1+l2-.001);direction.normalize();
  // Preserve the rest-pose bend plane instead of allowing an unconstrained CCD wrist flip.
  const restDirection=c.clone().sub(a).normalize(),bend=upper.clone().addScaledVector(restDirection,-upper.dot(restDirection));
  if(bend.lengthSq()<.0001)bend.set(0,0,chain.end==='front'?-1:1);
  bend.addScaledVector(direction,-bend.dot(direction)).normalize();
  const along=(l1*l1-l2*l2+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,l1*l1-along*along));
  const joint=start.clone().addScaledVector(direction,along).addScaledVector(bend,height),ankleTarget=start.clone().addScaledVector(direction,distance);
  const orient=(bone,from,to)=>{const q=new T.Quaternion().setFromUnitVectors(from.clone().normalize(),to.clone().normalize());bone.parent.getWorldQuaternion(worldQ);bone.quaternion.copy(worldQ.invert()).multiply(q);bone.updateWorldMatrix(false,true);};
  orient(top,upper,joint.clone().sub(start));orient(knee,lower,ankleTarget.sub(joint));
  for(const bone of [ankle,foot]){bone.parent.getWorldQuaternion(worldQ);bone.quaternion.copy(worldQ.invert());bone.updateWorldMatrix(false,true);}
 }
 function pose(t){
  reset();const phase=t/p.period,angle=phase*Math.PI*2;
  nodes.hips.position.y+=.025*Math.cos(angle*2);nodes.hips.position.x+=.025*Math.sin(angle);
  nodes.spine.rotation.y=.018*Math.sin(angle);nodes.chest.rotation.z=.015*Math.sin(angle+.4);
  nodes.neck.rotation.x=.02*Math.cos(angle*2+.6);nodes.head.rotation.y=.018*Math.sin(angle+.9);
  tailNames.forEach((name,i)=>{nodes[name].rotation.y=MOTION_PROFILES[id].tailGain*Math.sin(angle-i*.42);});mesh.updateMatrixWorld(true);
  for(const chain of chains){
   const u=((phase+chain.offset)%1+1)%1,stance=.68;let z,y;
   if(u<stance){z=p.stride*(.5-u/stance);y=0;}else{const s=(u-stance)/(1-stance);z=p.stride*(-.5+s-Math.sin(2*Math.PI*s)/(2*Math.PI));y=p.lift*Math.sin(Math.PI*s)**2;}
   const target=points[chain.names[3]].clone();target.z+=z;target.y+=y;ik(chain,target);
  }
  mesh.updateMatrixWorld(true);mesh.skeleton.update();
 }
 function bake(){const frames=73,times=Array.from({length:frames},(_,i)=>i*p.period/(frames-1)),tracks=[];const samples=bones.map(()=>({q:[],p:[]}));for(const t of times){pose(t);bones.forEach((b,i)=>{samples[i].q.push(...b.quaternion.toArray());samples[i].p.push(...b.position.toArray());});}bones.forEach((b,i)=>{tracks.push(new T.QuaternionKeyframeTrack(b.name+'.quaternion',times,samples[i].q),new T.VectorKeyframeTrack(b.name+'.position',times,samples[i].p));});reset();return new T.AnimationClip('Đi bộ',p.period,tracks);}
 return {mesh,bones,nodes,points,chains,tailNames,ik,pose,reset,bake,profile:p};
}

export async function createAnimalCreature(asset,textures,id){
 const loader=new T.TextureLoader();const spec=asset.materials[0];const map=await loader.loadAsync(textures[spec.maps.map]);map.colorSpace=T.SRGBColorSpace;
 const material=new T.MeshStandardMaterial({map,roughness:.88,side:T.DoubleSide});
 const geometry=new T.BufferGeometryLoader().parse(asset.parts[0]);const rig=createAnimalRig(geometry,material,id),source=rig.mesh,root=new T.Group();root.add(source);
 const head=new T.Object3D();head.position.copy(rig.points.head);head.userData.viewCenter=[0,rig.profile.chest[1]*.62,0];root.add(head);
 const authored=createAnimalAuthored(rig,id),animations={},definitions={};
 ['rest','observe','detail'].forEach((name,i)=>{animations['authored-'+name]=authored.bake(name);definitions['animal'+name]=['authored-'+name,authored.config.labels[i],'Chuyển động tự tạo riêng cho model.',true];});
 root.userData.sculptRuntime={source,meshes:{body:source},nodes:rig.nodes,sockets:{head},animations,stats:{triangles:(geometry.index?.count||geometry.attributes.position.count)/3},rig};
 return {model:root,definitions};
}
