import {chromium} from 'playwright';
import {mkdirSync,writeFileSync,statSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import ffmpeg from 'ffmpeg-static';
const ids=process.argv.slice(2);if(!ids.length)ids.push('trex','stego','trice','ptero','mosa','deino','wolf','fox','bear','boar','hyena','lion');
mkdirSync('previews',{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
try{
 const page=await browser.newPage({viewport:{width:1280,height:850}});
 await page.goto(pathToFileURL(process.cwd()+'/dist/index.html').href);await page.waitForFunction(()=>window.dinosaurDemo?.ready);
 for(const id of ids){
  await page.evaluate(async id=>{const s=document.querySelector('#model-select');s.value=id;await s.onchange();},id);
  await page.waitForFunction(id=>dinosaurDemo.modelId===id,id);

  const actions=await page.evaluate(id=>{
   const available=[...document.querySelectorAll('[data-action]')].map(b=>({id:b.dataset.action,label:b.textContent}));
   const preferred={trex:['walk','run','roar'],ptero:['clip0','glide','pteranodonRoar'],deino:['clip1','clip4','clip2']};
   const wanted=preferred[id]||(['wolf','fox','bear','boar','hyena','lion'].includes(id)?['animalrest','animalobserve','animaldetail']:available.filter(a=>!/t.pose|rest|idle/i.test(a.label)).map(a=>a.id));
   const chosen=[...new Set([...wanted,...available.map(a=>a.id)])].filter(a=>available.some(v=>v.id===a)).slice(0,3);
   if(chosen.length!==3)throw new Error('Need three actions for '+id);return chosen;
  },id);
  for(let variant=0;variant<3;variant++){
   const dir='artifacts/mp4-frames/'+id+'-'+variant;mkdirSync(dir,{recursive:true});
   await page.evaluate(({action,variant})=>{const d=dinosaurDemo;document.querySelector('[data-action="'+action+'"]').click();d.actions.setSpeed(1);if(!d.actions.state.paused)d.actions.pause();d.controls.autoRotate=false;d.camera.aspect=1.5;d.camera.updateProjectionMatrix();d.renderer.setPixelRatio(1);window.previewShot={target:d.controls.target.clone(),offset:d.camera.position.clone().sub(d.controls.target)};}, {action:actions[variant],variant});
   // Fit the animated silhouette across the clip, instead of inheriting the
   // distant full-size viewer camera. Keep a fixed centre to avoid camera jitter.
   await page.evaluate(({action,variant})=>{
    const d=dinosaurDemo,points=[],min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
    for(let frame=0;frame<80;frame++){
     d.actions.pause();d.actions.update(.05);d.actions.pause();
     if(frame%4!==0&&frame!==79)continue;
     d.model.updateMatrixWorld(true);
     d.model.traverse(mesh=>{if(!mesh.isMesh||!mesh.visible)return;mesh.skeleton?.update();const count=mesh.geometry.attributes.position.count,step=Math.max(1,Math.floor(count/1500));for(let j=0;j<count;j+=step){const v=mesh.getVertexPosition(j,d.camera.position.clone()).applyMatrix4(mesh.matrixWorld).toArray();points.push(v);for(let k=0;k<3;k++){min[k]=Math.min(min[k],v[k]);max[k]=Math.max(max[k],v[k]);}}});
    }
    const shot=window.previewShot;shot.target.set(...min.map((v,k)=>(v+max[k])/2));
    const original=shot.offset.clone().normalize(),tan=Math.tan(d.camera.fov*Math.PI/360),baseAngle=Math.atan2(original.x,original.z);
    let distance=0;
    for(let frame=0;frame<=8;frame++){
     const u=frame/8,e=u*u*(3-2*u),angle=baseAngle+(variant-1)*.4+(e-.5)*.5,flat=Math.sqrt(1-original.y**2);
     const forward=original.clone().set(Math.sin(angle)*flat,original.y+.025*Math.sin(Math.PI*u),Math.cos(angle)*flat).normalize();
     const right=forward.clone().set(forward.z,0,-forward.x).normalize(),up=forward.clone().cross(right).normalize();
     for(const p of points){const v=original.clone().set(...p).sub(shot.target);distance=Math.max(distance,v.dot(forward)+Math.max(Math.abs(v.dot(right))/(tan*1.5*.86),Math.abs(v.dot(up))/(tan*.86)));}
    }
    shot.offset.copy(original).multiplyScalar(distance/.86);
    document.querySelector('[data-action="'+action+'"]').click();d.actions.setSpeed(1);if(!d.actions.state.paused)d.actions.pause();
   },{action:actions[variant],variant});
   for(let i=0;i<80;i++){
    const png=await page.evaluate(({i,variant})=>{
     const d=dinosaurDemo,shot=window.previewShot,u=i/79,e=u*u*(3-2*u);
     d.actions.pause();d.actions.update(1/20);d.actions.pause();
     const off=shot.offset.clone(),radius=off.length(),angle=Math.atan2(off.x,off.z)+(variant-1)*.4+(e-.5)*.5;
     const zoom=variant===1?1-.14*e:variant===2?.87+.1*e:.93;
     const y=off.y/radius,flat=Math.sqrt(1-y*y);off.set(Math.sin(angle)*flat,y+.025*Math.sin(Math.PI*u),Math.cos(angle)*flat).normalize().multiplyScalar(radius*zoom);
     d.controls.target.copy(shot.target);d.camera.position.copy(shot.target).add(off);d.camera.lookAt(shot.target);d.renderer.setSize(360,240,false);d.renderer.render(d.scene,d.camera);
     const c=document.createElement('canvas');c.width=360;c.height=240;const ctx=c.getContext('2d');ctx.fillStyle='#dce4d7';ctx.fillRect(0,0,360,240);ctx.drawImage(d.renderer.domElement,0,0,360,240);return c.toDataURL('image/png').split(',')[1];
    },{i,variant});
    writeFileSync(dir+'/'+String(i).padStart(3,'0')+'.png',Buffer.from(png,'base64'));
    if(i===0&&variant===0)writeFileSync('src/demos/trex/previews/'+id+'.png',Buffer.from(png,'base64'));
   }
   const output='previews/'+id+'-'+(variant+1)+'.mp4';
   const result=spawnSync(ffmpeg,['-y','-loglevel','error','-framerate','20','-i',dir+'/%03d.png','-an','-c:v','libx264','-preset','slow','-crf','29','-pix_fmt','yuv420p','-movflags','+faststart',output],{encoding:'utf8'});
   if(result.status!==0)throw new Error(result.stderr||String(result.error));
   console.log(id,actions[variant],Math.round(statSync(output).size/1024)+' KiB');
   await page.evaluate(()=>{const d=dinosaurDemo,s=window.previewShot;d.camera.position.copy(s.target).add(s.offset);d.controls.target.copy(s.target);d.controls.update();});
  }

 }
}finally{await browser.close();}
