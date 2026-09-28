import {Vector3} from 'three';
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{x=clamp(x);return x*x*x*(10+x*(-15+6*x));};
const ramp=(t,a,b)=>ease((t-a)/(b-a));
const band=(t,a,b,c,d)=>ramp(t,a,b)*(1-ramp(t,c,d));
export const MOSA_BREACH_LABEL='Vọt lên · nghiêng mình lặn';

// Stylized swimming maneuver. Uses one reference pose, not a retargeted clip.
// Bone006–009 are the trunk; Bone010–017 form the posterior tail chain.
export function poseMosaBreach({u,rotate,move,front,right,up}){
 const load=band(u,.01,.12,.16,.27),rise=band(u,.12,.31,.36,.56),dive=band(u,.38,.53,.64,.85),settle=band(u,.67,.77,.85,1);
 const active=band(u,0,.12,.83,1),bank=band(u,.33,.49,.61,.86);
 rotate('Bone020',right,.08*load-.46*rise+.38*dive);
 rotate('Bone020',front,.38*bank);
 rotate('Bone020',up,.30*bank-.12*settle);
 const offset=new Vector3().addScaledVector(up,-.06*load+1.05*rise+.10*dive).addScaledVector(front,-.16*load+.95*rise+.35*dive).addScaledVector(right,.52*bank);
 move('Bone020',offset.x,offset.y,offset.z);
 // Neck stabilizes the gaze; torso follows the pitch with increasing delay.
 rotate('Bone001',right,.10*rise-.08*dive);
 rotate('Bone002',right,-.10*band(u,.25,.32,.36,.45));
 ['Bone006','Bone007','Bone008','Bone009'].forEach((name,i)=>{
  const delay=i*.015,t=u-delay;
  rotate(name,right,-.024*band(t,.10,.25,.33,.50)+.033*band(t,.37,.50,.63,.80));
  rotate(name,up,(.014+i*.008)*Math.sin(u*Math.PI*7-i*.45)*active-.025*bank);
 });
 ['Bone010','Bone011','Bone014','Bone015','Bone016'].forEach((name,i)=>{
  const delay=i*.026,t=u-delay,drive=band(t,.01,.15,.32,.46),brake=band(t,.38,.50,.61,.82);
  const wave=Math.sin(u*Math.PI*7-i*.65-1.3);
  rotate(name,up,(.035+i*.012)*wave*active+(.025+i*.009)*Math.sin(u*Math.PI*10-i*.65)*drive);
  rotate(name,right,.028*rise-.036*brake);
 });
 // Paired front fins steer/brake; rear fins follow later with smaller amplitude.
 for(const [base,distal,sign,delay,strength]of [['Bone023','Bone024',1,0,1],['Bone032','Bone033',-1,.012,1],['Bone028','Bone029',1,.04,.7],['Bone036','Bone037',-1,.055,.7]]){
  const tuck=band(u-delay,.14,.29,.36,.49),brake=band(u-delay,.40,.55,.67,.88);
  rotate(base,front,sign*strength*(.10*load-.17*tuck+.24*brake)+.055*bank);
  rotate(base,up,sign*strength*(.10*tuck-.13*brake));
  rotate(distal,front,sign*strength*(-.065*tuck+.085*brake));
 }
}
