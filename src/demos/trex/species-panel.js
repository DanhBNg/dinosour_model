import {SPECIES} from './species-data.js';
export function createSpeciesPanel({getId,getActions}){
 const stage=document.getElementById('stage'),button=document.createElement('button');button.id='species-info';button.textContent='ⓘ';button.setAttribute('aria-label','Thông tin loài');button.setAttribute('aria-expanded','false');document.querySelector('.tools').append(button);
 const dialog=document.createElement('dialog');dialog.id='species-dialog';dialog.setAttribute('aria-labelledby','species-heading');stage.append(dialog);
 let resumed=false,action=null;
 function close(){dialog.close();}
 function open(){const record=SPECIES[getId()];if(!record)return;dialog.replaceChildren();
  const header=document.createElement('div');header.className='species-header';const h=document.createElement('h2');h.id='species-heading';h.textContent=record.name;const x=document.createElement('button');x.textContent='✕';x.setAttribute('aria-label','Đóng thông tin');x.onclick=close;header.append(h,x);dialog.append(header);
  const body=document.createElement('div');body.className='species-content';dialog.append(body);
  const text=(tag,value,className)=>{const e=document.createElement(tag);e.textContent=value;if(className)e.className=className;body.append(e);return e;};
  text('p',record.scientificName,'scientific-name');text('p',record.taxonomy.join(' › '),'taxonomy');text('p',record.summary);text('h3','Thông tin cơ bản');
  const groups=Object.groupBy(record.attributes,a=>a.group||'Tổng quan');
  const sourceLinks=(el,ids)=>{for(const id of ids||[]){const source=record.sources[id];if(!source)continue;const a=document.createElement('a');a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';a.className='field-source';a.textContent=` [${id+1}]`;a.title=source.title;el.append(a);}};
  const order=['Định danh','Niên đại và phân bố','Kích thước tham khảo','Giải phẫu và vận động','Sinh thái','Giới hạn dữ liệu'];
  for(const [group,attributes]of Object.entries(groups).sort(([a],[b])=>order.indexOf(a)-order.indexOf(b))){
   const section=document.createElement('section');section.className='species-group';const title=document.createElement('h3');title.textContent=group;section.append(title);
   const dl=document.createElement('dl');for(const attr of attributes){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=attr.label;dd.textContent=attr.status==='unknown'?'Chưa xác định':(attr.display??String(attr.value))+(attr.unit?' '+attr.unit:'');
    const states={estimate:'Ước tính',inferred:'Suy luận',uncertain:'Chưa chắc chắn'};if(states[attr.evidence]){const badge=document.createElement('small');badge.className='evidence-tag';badge.textContent=states[attr.evidence];dd.append(badge);}
    sourceLinks(dd,attr.sourceIds);if(attr.note){const note=document.createElement('small');note.className='attribute-note';note.textContent=attr.note;dd.append(note);}dl.append(dt,dd);}section.append(dl);body.append(section);
  }
  if(record.parts){text('h3','Các bộ phận');for(const part of record.parts){const p=text('p',part.name+': '+part.description);sourceLinks(p,part.sourceIds);}}
  if(record.reconstruction){text('h3','Lưu ý khi dùng model 3D');for(const value of Object.values(record.reconstruction))text('p',value,'identity-note');}
  text('h3','Định danh mô hình');text('p',record.identityNote,'identity-note');text('h3','Nguồn tham khảo');
  for(const src of record.sources){const a=document.createElement('a');a.href=src.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=src.title+' ↗';body.append(a);text('small','Tra cứu: '+src.accessedAt);}
  text('p','Dữ liệu demo · Chưa kết nối ModelDB','data-status');
  action=getActions();resumed=!action.state.paused;if(resumed)action.pause();document.getElementById('pause').textContent='▶ Tiếp tục';button.setAttribute('aria-expanded','true');
  const rect=stage.getBoundingClientRect();dialog.style.left=rect.left+'px';dialog.style.top=rect.top+'px';dialog.style.width=rect.width+'px';dialog.style.height=rect.height+'px';dialog.showModal();x.focus();
 }
 button.onclick=open;dialog.addEventListener('close',()=>{if(resumed&&getActions()===action&&action.state.paused)action.pause();document.getElementById('pause').textContent=getActions().state.paused?'▶ Tiếp tục':'Ⅱ Tạm dừng';button.setAttribute('aria-expanded','false');button.focus();});
 new ResizeObserver(()=>{if(dialog.open){const r=stage.getBoundingClientRect();Object.assign(dialog.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});}}).observe(stage);
 return {open,close};
}
