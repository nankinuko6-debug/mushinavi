const photoInput = document.getElementById("photoInput"),
      previewWrap = document.getElementById("previewWrap"),
      preview = document.getElementById("preview"),
      removePhoto = document.getElementById("removePhoto"),
      diagnoseBtn = document.getElementById("diagnoseBtn"),
      diagnoseMsg = document.getElementById("diagnoseMsg"),
      result = document.getElementById("result");

let selectedType = "hachi", photoSelected = false;

// タブ切り替え
document.querySelectorAll(".type-card").forEach(card => card.addEventListener("click", () => {
    selectedType = card.dataset.type;
    document.querySelectorAll(".type-card").forEach(c => c.classList.remove("active"));
    card.classList.add("active");
    document.getElementById("hachiQuestions").classList.toggle("hidden", selectedType !== "hachi");
    document.getElementById("madaniQuestions").classList.toggle("hidden", selectedType !== "madani");
    result.classList.add("hidden");
}));

// 写真読み込み・削除
photoInput.addEventListener("change", () => {
    const file = photoInput.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
        diagnoseMsg.textContent = "画像ファイルを選択してください。";
        return;
    }
    const r = new FileReader();
    r.onload = e => {
        preview.src = e.target.result;
        previewWrap.classList.remove("hidden");
        photoSelected = true;
        diagnoseMsg.textContent = "写真を読み込みました。";
    };
    r.readAsDataURL(file);
});

removePhoto.addEventListener("click", () => {
    photoInput.value = "";
    preview.src = "";
    previewWrap.classList.add("hidden");
    photoSelected = false;
    result.classList.add("hidden");
    diagnoseMsg.textContent = "";
});

// 🐝 蜂の判定ロジック（見た目・特徴による緩和を追加）
function hachiResult() {
    const nest = document.getElementById("hNest").value;
    const near = document.getElementById("hNear").value;
    // 追加された見た目の選択値を取得（なければ "unknown"）
    const typeEl = document.getElementById("hType");
    const type = typeEl ? typeEl.value : "unknown";

    // ① クマバチ・ミツバチ等（丸くて毛深い／おとなしい蜂）の緩和ロジック
    // ※大型の巣がない場合に適用
    if (type === "gentle" && nest !== "yes") {
        return {
            candidate: "クマバチ・ミツバチ等の可能性（温厚）",
            risk: "注意（低）",
            cls: "orange",
            action: "こちらから刺激せず、静かに放置・離れる",
            caution: "温厚な種類のため、払いのけたり叩いたりしなければ刺してくることは滅多にありません。",
            extra: "室内に迷い込んだ場合は、窓を開けて静かに自然に出ていくのを待ってください。"
        };
    }

    // ② 危険度の高い状況（巣がある、またはスズメバチ等の特徴＋つきまとわれる）
    if (nest === "yes" || (near === "yes" && (type === "hornet" || type === "unknown"))) {
        return {
            candidate: "蜂（スズメバチ等を含む可能性）",
            risk: "危険",
            cls: "red",
            action: "近づかず、人やペットを安全な場所へ移動する",
            caution: "巣や集団がある場合は刺激せず、必要なら専門業者へ相談してください。",
            extra: "巣をつつく・追い払う・自分で駆除するなど、刺激する行動は避けてください。"
        };
    }

    // ③ その他の一般的な判定
    return {
        candidate: "蜂の可能性",
        risk: "注意",
        cls: "orange",
        action: "安全な距離から確認し、近づかない",
        caution: "写真だけでは種類を確定できません。巣が見つかった場合は無理に対処しないでください。",
        extra: "刺される危険があるため、手で払ったり追い回したりしないでください。"
    };
}

// 🕷️ マダニの判定ロジック
function madaniResult() {
    const attached = document.getElementById("mAttached").value;
    if (attached === "yes") {
        return {
            candidate: "マダニの可能性",
            risk: "要相談",
            cls: "red",
            action: "無理に引っ張ったり潰したりせず、医療機関への相談を検討する",
            caution: "付着しているマダニを自分で無理に除去すると、口器が残るなどの問題が起こる可能性があります。",
            extra: "発熱などの体調変化がある場合は、マダニに刺された可能性を伝えて医療機関へ相談してください。"
        };
    }
    return {
        candidate: "マダニの可能性",
        risk: "注意",
        cls: "orange",
        action: "素手で触らず、衣服・皮膚を確認する",
        caution: "写真だけでは確定できません。草むら・森林などの後は身体や衣服を確認してください。",
        extra: "付着が疑われる場合は無理に取ろうとせず、適切な医療機関への相談を検討してください。"
    };
}

// 診断ボタン処理
diagnoseBtn.addEventListener("click", () => {
    if (!photoSelected) {
        diagnoseMsg.textContent = "まず写真を選んでください。";
        return;
    }
    
    // 蜂の場合は hType もチェック対象に含める（要素が存在する場合）
    let vals = selectedType === "hachi" 
        ? ["hLocation", "hNest", "hNear", ...(document.getElementById("hType") ? ["hType"] : [])]
        : ["mLocation", "mAttached", "mPulled"];

    if (vals.some(id => !document.getElementById(id).value)) {
        diagnoseMsg.textContent = "すべての項目を選択してください。";
        return;
    }

    diagnoseMsg.textContent = "確認中…";
    setTimeout(() => {
        const d = selectedType === "hachi" ? hachiResult() : madaniResult();
        document.getElementById("resultCandidate").textContent = d.candidate;
        document.getElementById("resultRisk").textContent = d.risk;
        document.getElementById("resultAction").textContent = d.action;
        document.getElementById("resultCaution").textContent = d.caution;
        
        const pill = document.getElementById("riskPill");
        pill.textContent = d.risk;
        pill.className = `pill ${d.cls}`;
        
        document.getElementById("resultTitle").textContent = selectedType === "hachi" ? "蜂の確認結果" : "マダニの確認結果";
        
        const ex = document.getElementById("resultEmergency");
        ex.textContent = d.extra;
        ex.classList.remove("hidden");
        
        result.classList.remove("hidden");
        diagnoseMsg.textContent = "確認結果を表示しました。";
        result.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 500);
});

// 投稿機能・デモマップ
const sightings = JSON.parse(localStorage.getItem("mushinavi_sightings") || "[]");
document.getElementById("postSighting")?.addEventListener("click", () => {
    const type = document.getElementById("sightingType").value,
          area = document.getElementById("sightingArea").value.trim(),
          note = document.getElementById("sightingNote").value.trim(),
          msg = document.getElementById("postMsg");
    if (!area) {
        msg.textContent = "地域を入力してください。";
        return;
    }
    sightings.push({ type, area, note, createdAt: new Date().toISOString() });
    localStorage.setItem("mushinavi_sightings", JSON.stringify(sightings));
    msg.textContent = `「${area}」の${type}情報を保存しました。v0.2ではこのブラウザ内だけに保存されます。`;
    document.getElementById("sightingArea").value = "";
    document.getElementById("sightingNote").value = "";
});

document.querySelectorAll(".marker").forEach(m => m.addEventListener("click", () => alert(m.title + "\nv0.2のデモ用目撃地点です。")));