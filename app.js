(() => {
"use strict";
const AI_ENDPOINT="https://mushinavi-ai.nankinuko6.workers.dev/";
const MAX_SIDE=1280;
let selectedFile=null;
let selectedTarget="unknown";

const $=s=>document.querySelector(s);
function status(t){const e=$("#status");if(e)e.textContent=t;}

function showPreview(file){
  const box=$("#previewBox"), img=$("#preview");
  if(!box||!img)return;
  const url=URL.createObjectURL(file);
  img.onload=()=>URL.revokeObjectURL(url);
  img.src=url;
  box.classList.remove("hidden");
}
function clearPhoto(){
  selectedFile=null;
  const input=$("#photo"),box=$("#previewBox"),img=$("#preview");
  if(input)input.value="";
  if(img)img.removeAttribute("src");
  if(box)box.classList.add("hidden");
  status("");
}
function setupPhoto(){
  const input=$("#photo");
  if(!input)return;
  input.addEventListener("change",()=>{
    const f=input.files&&input.files[0];
    if(!f)return;
    if(!f.type.startsWith("image/")){clearPhoto();status("画像ファイルを選択してください。");return;}
    selectedFile=f;
    showPreview(f);
    status("写真を読み込みました："+f.name);
  });
  const clear=$("#clear");
  if(clear)clear.addEventListener("click",clearPhoto);
}
function setupChoice(){
  document.querySelectorAll(".choice-btn").forEach(btn=>{
    btn.addEventListener("click",()=>{
      document.querySelectorAll(".choice-btn").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      selectedTarget=btn.dataset.target||"unknown";
    });
  });
}
function dataURL(file){
  return new Promise((resolve,reject)=>{
    const r=new FileReader();
    r.onload=()=>resolve(r.result);
    r.onerror=reject;
    r.readAsDataURL(file);
  });
}
async function prepare(file){
  const url=await dataURL(file),img=new Image();
  await new Promise((ok,no)=>{img.onload=ok;img.onerror=no;img.src=url;});
  const scale=Math.min(1,MAX_SIDE/Math.max(img.naturalWidth,img.naturalHeight));
  const w=Math.max(1,Math.round(img.naturalWidth*scale));
  const h=Math.max(1,Math.round(img.naturalHeight*scale));
  const cv=document.createElement("canvas");
  cv.width=w;cv.height=h;
  cv.getContext("2d",{alpha:false}).drawImage(img,0,0,w,h);
  return {imageBase64:cv.toDataURL("image/jpeg",.80),mimeType:"image/jpeg"};
}
function renderResult(data){
  const r=data?.result||data||{},c=r.category||"unknown";
  const conf=Math.max(0,Math.min(100,Number(r.confidence)||0));
  const result=$("#result");
  if(result)result.classList.remove("hidden");
  const icon=c==="bee"?"🐝":c==="tick"?"🕷️":c==="other"?"⚪":"❓";
  const set=(id,v)=>{const e=$(id);if(e)e.textContent=v;};
  set("#name",icon+" "+(r.label||"判定困難"));
  set("#score",conf+"%");
  set("#candidate",r.label||"判定困難");
  set("#riskText",r.risk||"不明");
  set("#risk","⚠️ "+(r.risk||"不明"));
  set("#action",r.action||"安全な距離を確保し、無理に触らないでください。");
  set("#caution",r.warning||"AIによる画像チェックは確定診断・確定同定ではありません。");
  const bar=$("#bar");if(bar)bar.style.width=conf+"%";
  const medical=$("#medical");if(medical)medical.classList.toggle("hidden",c!=="tick");
  status("AIチェックが完了しました。");
  if(result)result.scrollIntoView({behavior:"smooth",block:"start"});
}
async function runAI(){
  if(!selectedFile){status("先に写真を選んでください。");$("#photo")?.click();return;}
  try{
    status("写真を準備しています…");
    const image=await prepare(selectedFile);
    status("Geminiが画像をチェックしています…");
    const res=await fetch(AI_ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...image,target:selectedTarget})});
    const data=await res.json().catch(()=>({}));
    if(!res.ok||!data.ok)throw new Error(data.detail||data.error||("HTTP "+res.status));
    renderResult(data);
  }catch(e){
    console.error(e);
    status("AIチェックに失敗しました。通信状態を確認して、もう一度お試しください。");
  }
}
function setup(){
  setupPhoto();setupChoice();
  const analyze=$("#analyze");
  if(analyze)analyze.addEventListener("click",e=>{e.preventDefault();runAI();});
  window.MushinaviAI={endpoint:AI_ENDPOINT,check:runAI};
}
document.readyState==="loading"?document.addEventListener("DOMContentLoaded",setup):setup();
})();