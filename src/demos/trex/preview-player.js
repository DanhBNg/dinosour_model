import {defaultPlaybackSpeed} from './playback-defaults.js';
// A single desktop preview, or two mostly visible touch previews.
export function createPreviewPlayers(panel){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),touch=matchMedia('(hover: none)');
 const entries=[];let desktop=null;
 function sync(){
  const eligible=!document.hidden&&!reduced.matches;
  const visible=eligible&&touch.matches?entries.filter(e=>!e.button.hidden&&e.ratio>=.6).sort((a,b)=>b.ratio-a.ratio).slice(0,2):[];
  for(const e of entries){if(visible.includes(e))e.start();else if(touch.matches||!eligible||e.button.hidden)e.stop();}
 }
 const observer=new IntersectionObserver(changes=>{for(const c of changes){const e=entries.find(e=>e.button===c.target);if(e)e.ratio=c.intersectionRatio;}sync();},{threshold:[0,.6,.9,1]});
 document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);touch.addEventListener('change',()=>{entries.forEach(e=>e.stop());sync();});
 return {sync,add(button,img,asset){
  const media=document.createElement('div');media.className='model-preview';img.replaceWith(media);media.append(img);
  const video=document.createElement('video');video.muted=true;video.playsInline=true;video.preload='none';video.setAttribute('aria-hidden','true');video.disablePictureInPicture=true;media.append(video);
  const clips=asset?.motions||[asset?.motion].filter(Boolean);let last=-1,token=0,wanted=false,failed=false;
  function next(){
   const choices=clips.map((_,i)=>i).filter(i=>i!==last);last=choices.length?choices[Math.floor(Math.random()*choices.length)]:0;
   media.classList.remove('playing');video.src=clips[last];video.defaultPlaybackRate=video.playbackRate=defaultPlaybackSpeed(button.dataset.model);const request=++token;
   video.play().catch(()=>{if(request===token){failed=true;e.stop();}});
  }
  const e={button,ratio:0,start(){
   if(wanted||failed||!clips.length||reduced.matches||document.hidden||button.hidden)return;
   if(!touch.matches){desktop?.stop();desktop=e;}
   wanted=true;next();
  },stop(){wanted=false;token++;video.pause();media.classList.remove('playing');if(desktop===e)desktop=null;}};
  video.addEventListener('playing',()=>{if(wanted)media.classList.add('playing');else video.pause();});
  video.addEventListener('ended',()=>{if(wanted)next();});video.addEventListener('error',()=>{failed=true;e.stop();});
  button.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'&&!touch.matches)e.start();});
  button.addEventListener('pointerleave',()=>{if(!touch.matches)e.stop();});
  button.addEventListener('focus',()=>{if(!touch.matches)e.start();});button.addEventListener('blur',()=>{if(!touch.matches)e.stop();});
  entries.push(e);observer.observe(button);
 }};
}
