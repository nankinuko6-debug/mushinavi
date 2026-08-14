const photoInput = document.getElementById("photoInput");
const previewWrap = document.getElementById("previewWrap");
const preview = document.getElementById("preview");
const removePhoto = document.getElementById("removePhoto");
const diagnoseBtn = document.getElementById("diagnoseBtn");
const diagnoseMsg = document.getElementById("diagnoseMsg");
const result = document.getElementById("result");

let photoSelected = false;

photoInput.addEventListener("change", () => {
  const file = photoInput.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    diagnoseMsg.textContent = "画像ファイルを選択してください。";
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    preview.src = e.target.result;
    previewWrap.classList.remove("hidden");
    photoSelected = true;
    diagnoseMsg.textContent = "写真を読み込みました。";
  };
  reader.readAsDataURL(file);
});

removePhoto.addEventListener("click", () => {
  photoInput.value = "";
  preview.src = "";
  previewWrap.classList.add("hidden");
  photoSelected = false;
  diagnoseMsg.textContent = "";
  result.classList.add("hidden");
});

function classify({location, size, nest}) {
  // v0.1 is a rules-based demo. Replace this function with an AI/API call in v0.2.
  if (nest === "yes" || size === "3cm以上") {
    return {
      candidate: "大型の蜂・危険性のある昆虫の可能性",
      risk: "危険",
      cls: "red",
      action: "近づかず、安全な場所から距離を取る",
      caution: "巣が疑われる場合は自分で刺激せず、専門業者などへ相談してください。"
    };
  }
  if (location === "山・森林" || location === "畑・草むら") {
    return {
      candidate: "蜂・毛虫・マダニなどの可能性",
      risk: "注意",
      cls: "orange",
      action: "素手で触らず、周囲を確認する",
      caution: "皮膚への付着や刺傷・咬傷が疑われる場合は無理に処置せず相談してください。"
    };
  }
  return {
    candidate: "身近な昆虫の可能性",
    risk: "注意",
    cls: "orange",
    action: "近づかず、安全な距離から写真を撮る",
    caution: "写真だけでは種類を確定できません。危険を感じたら専門家へ。"
  };
}

diagnoseBtn.addEventListener("click", () => {
  const location = document.getElementById("location").value;
  const size = document.getElementById("size").value;
  const nest = document.getElementById("nest").value;

  if (!photoSelected) {
    diagnoseMsg.textContent = "まず虫の写真を選んでください。";
    return;
  }
  if (!location || !size || !nest) {
    diagnoseMsg.textContent = "写真以外の3項目も選択してください。";
    return;
  }

  diagnoseMsg.textContent = "判定中…";
  setTimeout(() => {
    const data = classify({location, size, nest});
    document.getElementById("resultCandidate").textContent = data.candidate;
    document.getElementById("resultRisk").textContent = data.risk;
    document.getElementById("resultAction").textContent = data.action;
    document.getElementById("resultCaution").textContent = data.caution;
    const pill = document.getElementById("riskPill");
    pill.textContent = data.risk;
    pill.className = `pill ${data.cls}`;
    document.getElementById("resultTitle").textContent = "今回の判定";
    result.classList.remove("hidden");
    diagnoseMsg.textContent = "判定結果を表示しました。";
    result.scrollIntoView({behavior:"smooth", block:"start"});
  }, 650);
});

const sightings = JSON.parse(localStorage.getItem("mushinavi_sightings") || "[]");

document.getElementById("postSighting").addEventListener("click", () => {
  const type = document.getElementById("sightingType").value;
  const area = document.getElementById("sightingArea").value.trim();
  const note = document.getElementById("sightingNote").value.trim();
  const msg = document.getElementById("postMsg");

  if (!area) {
    msg.textContent = "地域を入力してください。";
    return;
  }

  const item = {type, area, note, createdAt: new Date().toISOString()};
  sightings.push(item);
  localStorage.setItem("mushinavi_sightings", JSON.stringify(sightings));
  msg.textContent = `「${area}」の${type}情報を保存しました。v0.1ではブラウザ内データとして保存されます。`;
  document.getElementById("sightingArea").value = "";
  document.getElementById("sightingNote").value = "";
});

document.querySelectorAll(".marker").forEach(marker => {
  marker.addEventListener("click", () => {
    alert(marker.title + "\nこれはv0.1のデモ用目撃地点です。");
  });
});
