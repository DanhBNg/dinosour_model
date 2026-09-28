import {AnimationMixer,LoopRepeat,LoopOnce} from 'three';
import {createRoarSweep,ROAR_SWEEP_DURATION} from './roar-sweep.js';
import {createAuthoredMotion,CUSTOM} from './authored-motion.js';
export const ACTIONS={idle:['idle investigate loop','Quan sát','Chuyển động nghỉ và quan sát môi trường.',true],walk:['walk loop','Đi bộ','Chu kỳ đi bộ từ animation gốc.',true],run:['sprint loop','Chạy','Chu kỳ chạy nhanh tại chỗ.',true],roar:['ROAR','Gầm','Chuyển động cổ và hàm; demo không có âm thanh.',false],bite:['chase bite','Đuổi ngoạm','Clip ngoạm khi truy đuổi; chưa có con mồi tương tác.',false],left:['look left','Nhìn trái','Quan sát về bên trái.',false],right:['look right','Nhìn phải','Quan sát về bên phải.',false]};
export function createTrexActions(root,definitions=ACTIONS){
 const repeatSelected=definitions===ACTIONS;
 const runtime=root.userData.sculptRuntime,mixer=new AnimationMixer(runtime.source),authored=createAuthoredMotion(root),sweep=createRoarSweep(root);let current=null,custom=null,elapsed=0;const state={id:'idle',paused:false,speed:1};
 function play(id){
  const spec=definitions[id];if(!spec)return false;
  if(custom){if(custom==='roarSweep')sweep.restore();else authored.restore();custom=null;mixer.stopAllAction();current=null;}
  if(id==='roarSweep'){mixer.stopAllAction();current=null;sweep.start();custom=id;elapsed=0;state.id=id;state.paused=false;return true;}
  if(CUSTOM[id]){mixer.stopAllAction();current=null;const neutral=mixer.clipAction(runtime.animations['idle investigate loop']);neutral.reset().play();mixer.timeScale=1;mixer.update(.01);neutral.paused=true;authored.capture();custom=id;elapsed=0;state.id=id;state.paused=false;authored.pose(id,0);return true;}
  if(!runtime.animations[spec[0]])return false;const next=mixer.clipAction(runtime.animations[spec[0]]);if(current===next){next.reset().play();}else{next.reset().setEffectiveWeight(1).setEffectiveTimeScale(1).play();if(current){current.fadeOut(.22);next.fadeIn(.22);}}next.setLoop(repeatSelected||spec[3]?LoopRepeat:LoopOnce,Infinity);next.clampWhenFinished=!(repeatSelected||spec[3]);current=next;state.id=id;state.paused=false;mixer.timeScale=state.speed;return true;
 }
 const initial=Object.keys(definitions)[0];mixer.addEventListener('finished',()=>{if(!state.paused&&state.id!=='death')play(initial);});
 play(initial);return {state,mixer,play,update:dt=>{if(custom){if(state.paused)return;const spec=custom==='roarSweep'?{duration:ROAR_SWEEP_DURATION,hold:false}:CUSTOM[custom];elapsed=Math.min(spec.duration,elapsed+Math.min(dt,.05)*state.speed);if(custom==='roarSweep')sweep.pose(elapsed);else authored.pose(custom,elapsed);if(elapsed>=spec.duration&&(repeatSelected||!spec.hold))play(repeatSelected?state.id:initial);}else mixer.update(Math.min(dt,.05));},pause:()=>{state.paused=!state.paused;mixer.timeScale=state.paused?0:state.speed;},setSpeed:v=>{state.speed=Math.max(.25,Math.min(2,Number(v)||1));mixer.timeScale=state.paused?0:state.speed;},get progress(){return custom?elapsed/(custom==='roarSweep'?ROAR_SWEEP_DURATION:CUSTOM[custom].duration):current?current.time/current.getClip().duration:0;},dispose(){sweep.restore();authored.restore();mixer.stopAllAction();mixer.uncacheRoot(runtime.source);}};
}
Object.assign(ACTIONS,{jump:[null,'Nhảy lên','Động tác tự tạo: lấy đà, bật lên và đáp xuống.',false],death:[null,'Ngã chết','Động tác tự tạo: khuỵu chân, lăn nghiêng và nằm bất động. Chọn động tác khác để đứng lại.',false],sniff:[null,'Đánh hơi','Động tác tự tạo: cúi cổ, đảo đầu và đung đưa đuôi.',false]});
ACTIONS.death=['death short','Ngã chết','Clip ngã gốc, phát lại từ đầu khi kết thúc.',false];

ACTIONS.roarSweep=[null,'Ng\u1eeda m\u1eb7t g\u1ea7m & qu\u00e9t \u0111u\u00f4i','Animation t\u1ef1 t\u1ea1o: g\u1ea7m, b\u01b0\u1edbc \u0111\u1ed5i tr\u1ee5 v\u00e0 qu\u00e9t \u0111u\u00f4i ngang. Kh\u00f4ng c\u00f3 \u00e2m thanh.',false];
