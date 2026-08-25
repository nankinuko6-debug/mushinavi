(() => {
  "use strict";
  const AI_ENDPOINT = "https://mushinavi-ai.nankinuko6.workers.dev/";
  const MAX_SIDE = 1280;
  let selectedFile = null;

  const pick = (ss) => {
    for (const s of ss) { const e = document.querySelector(s); if (e) return e; }
    return null;
  };
  const fileInput = () => document.querySelector('input[type="file"]');
  const checkButton = () => pick([
    "#aiCheckBtn","#ai-check","#checkBtn","#check-button",
    "#runCheck","#analyzeBtn","#analyze","#submitCheck"
  ]) || [...document.querySelectorAll("button,[role='button'],input[type='button'],input[type='submit']")]
    .find(e => /AIにおまかせ|AIチェック|判定する|チェックする|画像を判定|判定/i.test(e.textContent || e.value || ""));
  const resultArea = () => pick(["#result","#checkResult","#aiResult","#resultArea",".result",".check-result",".ai-result","[data-result]"]);

  function area() {
    let e = resultArea();
    if (e) return e;
    e = document.createElement("section");
    e.id = "mushinavi-ai-result";
    e.setAttribute("aria-live","polite");
    e.style.cssText="margin-top:20px;padding:18px;border-radius:16px;background:#fff;border:1px solid #dfe6e9;box-shadow:0 8px 24px rgba(0,0,0,.06)";
    const b=checkButton(); (b?.parentElement||document.body).appendChild(e); return e;
  }
  const esc = v => String(v ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
  const icon = c => c==="bee"?"🐝":c==="tick"?"🕷️":c==="other"?"⚪":"❓";

  function status(s,busy=false){ area().innerHTML=`<div style="font-size:20px;font-weight:800">${busy?"🤖 ":""}${esc(s)}</div>`; }

  function show(data) {
    const r=data?.result||data||{}, c=r.category||"unknown";
    const conf=Math.max(0,Math.min(100,Number(r.confidence)||0));
    const risk=r.risk||"不明";
    area().innerHTML=`
      <div style="font-size:28px;font-weight:800">${icon(c)} ${esc(r.label||"判定困難")}</div>
      <div style="font-weight:700;margin:8px 0">判定の確からしさ：${conf}%</div>
      <div style="font-weight:700;margin:10px 0">⚠️ 危険度：${esc(risk)}</div>
      <div><strong>判定理由</strong><p>${esc(r.reason||"写真だけでは判断できない情報があります。")}</p></div>
      <div><strong>まずやること</strong><p>${esc(r.action||"安全な距離を確保し、無理に触らないでください。")}</p></div>
      <div style="padding:12px;border-radius:12px;background:#f7f7f7"><strong>注意</strong><p>${esc(r.warning||"AIによる画像チェックは確定診断・確定同定ではありません。")}</p></div>
      <p style="font-size:12px;opacity:.7">※ AIによる画像チェックです。写真だけでは確定できない場合があります。</p>`;
    area().scrollIntoView({behavior:"smooth",block:"start"});
  }

  function dataURL(file){
    return new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=no;r.readAsDataURL(file);});
  }
  async function prepare(file){
    const url=await dataURL(file), img=new Image();
    await new Promise((ok,no)=>{img.onload=ok;img.onerror=no;img.src=url;});
    const scale=Math.min(1,MAX_SIDE/Math.max(img.naturalWidth,img.naturalHeight));
    const w=Math.max(1,Math.round(img.naturalWidth*scale)), h=Math.max(1,Math.round(img.naturalHeight*scale));
    const cv=document.createElement("canvas"); cv.width=w;cv.height=h;
    cv.getContext("2d",{alpha:false}).drawImage(img,0,0,w,h);
    return {imageBase64:cv.toDataURL("image/jpeg",.78),mimeType:"image/jpeg"};
  }

  async function run() {
    const input=fileInput(); const file=selectedFile||input?.files?.[0];
    if(!file){status("まず写真を選択してください。");return;}
    if(!file.type.startsWith("image/")){status("画像ファイルを選択してください。");return;}
    try{
      status("写真を準備しています…",true);
      const body=await prepare(file);
      status("Geminiが画像をチェックしています…",true);
      const res=await fetch(AI_ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      const data=await res.json().catch(()=>({}));
      if(!res.ok||!data.ok) throw new Error(data.detail||data.error||`HTTP ${res.status}`);
      show(data);
    }catch(e){console.error(e);status("AIチェックに失敗しました。通信状態を確認して、もう一度お試しください。");}
  }

  function setup(){
    const input=fileInput(), button=checkButton();
    if(input) input.addEventListener("change",()=>{selectedFile=input.files?.[0]||null;if(selectedFile)status(`写真を選択しました：「${selectedFile.name}」`);});
    if(button) button.addEventListener("click",e=>{e.preventDefault();run();});
    window.MushinaviAI={endpoint:AI_ENDPOINT,check:run};
    console.info("ムシナビ Gemini AI接続版 v0.3 起動");
  }
  document.readyState==="loading"?document.addEventListener("DOMContentLoaded",setup):setup();
})();