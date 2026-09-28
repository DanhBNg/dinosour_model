import {createPreviewPlayers} from './preview-player.js';
import {SPECIES,ANIMAL_IDS} from './species-data.js';
export function createModelGallery(chooser){
 const assets=JSON.parse(document.getElementById('preview-data')?.textContent||'{}');
 const panel=document.createElement('nav');panel.className='model-gallery';panel.setAttribute('aria-label','Chọn mô hình');
 const heading=document.createElement('h2');heading.textContent='Mô hình';panel.append(heading);
 const categories=document.createElement('div');categories.className='category-tabs';categories.setAttribute('role','group');categories.setAttribute('aria-label','Nhóm mô hình');panel.append(categories);
 const grid=document.createElement('div');grid.className='model-grid';panel.append(grid);
 let category='dinosaurs';const last={dinosaurs:'trex',animals:'wolf'};
 const previews=createPreviewPlayers(panel);
 for(const [id,label]of [['dinosaurs','Khủng long'],['animals','Động vật']]){const b=document.createElement('button');b.textContent=label;b.dataset.category=id;b.setAttribute('aria-pressed',String(category===id));b.onclick=async()=>{if(chooser.disabled||category===id)return;category=id;filter();panel.scrollLeft=0;panel.scrollTop=0;const card=grid.querySelector(`[data-model="${last[id]}"]`);await card.onclick();};categories.append(b);}
 function filter(){grid.querySelectorAll('[data-model]').forEach(b=>b.hidden=(ANIMAL_IDS.includes(b.dataset.model)?'animals':'dinosaurs')!==category);categories.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category===category)));previews.sync();}
 for(const option of chooser.options){
  const id=option.value,asset=assets[id],button=document.createElement('button');button.className='model-card';button.dataset.model=id;button.setAttribute('aria-pressed',String(id===chooser.value));
  const img=document.createElement('img');if(asset)img.src=asset.still;img.alt='';img.width=300;img.height=200;
  const label=document.createElement('span');label.textContent=option.textContent.split(' · ')[0];button.append(img,label);
  label.textContent=SPECIES[id]?.name||label.textContent;
  previews.add(button,img,asset);
  button.onclick=async()=>{if(chooser.disabled||chooser.value===id)return;chooser.value=id;grid.setAttribute('aria-busy','true');panel.querySelectorAll('button').forEach(b=>b.disabled=true);try{await chooser.onchange();last[category]=chooser.value;}finally{category=ANIMAL_IDS.includes(chooser.value)?'animals':'dinosaurs';filter();grid.removeAttribute('aria-busy');panel.querySelectorAll('button').forEach(b=>b.disabled=false);grid.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.model===chooser.value)) );}};
  grid.append(button);
 }
 chooser.hidden=true;document.querySelector('main').prepend(panel);filter();
}
