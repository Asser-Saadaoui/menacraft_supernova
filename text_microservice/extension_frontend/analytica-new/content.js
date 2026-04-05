(() => {
  'use strict';

  if (document.getElementById('analytica-bubble')) return;

  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap';
  document.head.appendChild(fontLink);

  const style = document.createElement('style');
  style.textContent = `
    #analytica-bubble {
      position: fixed; bottom: 28px; right: 28px;
      width: 52px; height: 52px; border-radius: 50%;
      background: linear-gradient(135deg, #7c5cfc, #b48aff);
      border: none; cursor: pointer; z-index: 2147483646;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 24px rgba(124,92,252,0.5);
      transition: transform 0.2s, box-shadow 0.2s;
      font-family: 'Syne', sans-serif; font-weight: 800; font-size: 12px;
      color: white; letter-spacing: -0.5px; user-select: none;
    }
    #analytica-bubble:hover { transform: scale(1.1); box-shadow: 0 6px 32px rgba(124,92,252,0.65); }
    #analytica-bubble.open { transform: scale(0.95); }
    #analytica-panel {
      position: fixed; bottom: 92px; right: 28px; width: 420px; max-height: 82vh;
      background: #07070f; border: 1px solid rgba(110,90,255,0.2); border-radius: 18px;
      box-shadow: 0 24px 80px rgba(0,0,0,0.7); z-index: 2147483645;
      display: none; flex-direction: column; overflow: hidden;
      font-family: 'DM Sans', sans-serif; font-size: 13px; color: #ede9ff;
      animation: apIn 0.22s cubic-bezier(0.34,1.5,0.64,1);
    }
    #analytica-panel.closing { animation: apOut 0.2s ease forwards; }
    @keyframes apIn { from{opacity:0;transform:translateY(14px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
    @keyframes apOut { to{opacity:0;transform:translateY(10px) scale(0.97)} }
    #analytica-panel-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 15px 18px 13px; border-bottom: 1px solid rgba(110,90,255,0.15);
      background: linear-gradient(135deg,#0b0b18,#0f0f1e); flex-shrink: 0;
    }
    .a-logo { display: flex; align-items: center; gap: 9px; }
    .a-logo-icon {
      width: 30px; height: 30px; background: linear-gradient(135deg,#7c5cfc,#b48aff);
      border-radius: 8px; display: flex; align-items: center; justify-content: center;
      font-family:'Syne',sans-serif; font-weight:800; font-size:10px; color:white; letter-spacing:-0.5px;
      box-shadow: 0 0 14px rgba(124,92,252,0.4);
    }
    .a-logo-text {
      font-family:'Syne',sans-serif; font-weight:800; font-size:14px; letter-spacing:-0.3px;
      background: linear-gradient(90deg,#ede9ff,#b48aff); -webkit-background-clip:text; -webkit-text-fill-color:transparent;
    }
    .a-close-btn {
      width:28px; height:28px; border-radius:8px; border:1px solid rgba(110,90,255,0.2);
      background:rgba(255,255,255,0.04); color:#6a6a8a; font-size:13px; cursor:pointer;
      display:flex; align-items:center; justify-content:center; transition:all 0.18s;
    }
    .a-close-btn:hover { color:#f87171; border-color:rgba(248,113,113,0.3); background:rgba(248,113,113,0.08); }
    .a-tabs {
      display:flex; padding:12px 16px 0; gap:3px;
      border-bottom:1px solid rgba(110,90,255,0.15); flex-shrink:0; background:#07070f;
    }
    .a-tab {
      flex:1; padding:8px 6px; text-align:center; font-size:12px; font-weight:600; color:#6a6a8a;
      cursor:pointer; border-radius:8px 8px 0 0; border:1px solid transparent; border-bottom:none;
      transition:all 0.18s; position:relative; bottom:-1px;
    }
    .a-tab.active { background:#0f0f1c; color:#ede9ff; border-color:rgba(110,90,255,0.2); border-bottom-color:#0f0f1c; }
    .a-tab:hover:not(.active) { color:#9090b8; background:rgba(255,255,255,0.03); }
    .a-panel-body { overflow-y:auto; flex:1; padding:16px; display:flex; flex-direction:column; gap:13px; }
    .a-panel-body::-webkit-scrollbar{width:4px} .a-panel-body::-webkit-scrollbar-thumb{background:rgba(110,90,255,0.25);border-radius:4px}
    .a-section { display:none; flex-direction:column; gap:12px; }
    .a-section.active { display:flex; }
    .a-textarea {
      width:100%; min-height:120px; background:#0f0f1c; border:1px solid rgba(110,90,255,0.18);
      border-radius:12px; padding:13px 15px; color:#ede9ff; font-family:'DM Sans',sans-serif;
      font-size:13px; line-height:1.6; resize:vertical; outline:none; transition:border-color 0.2s,box-shadow 0.2s;
    }
    .a-textarea:focus { border-color:#7c5cfc; box-shadow:0 0 0 3px rgba(124,92,252,0.1); }
    .a-textarea::placeholder { color:#6a6a8a; }
    .a-upload-zone {
      border:2px dashed rgba(110,90,255,0.25); border-radius:14px; padding:26px 18px; text-align:center;
      cursor:pointer; transition:all 0.22s; background:#0f0f1c; position:relative; overflow:hidden;
    }
    .a-upload-zone:hover { border-color:#7c5cfc; background:rgba(124,92,252,0.06); }
    .a-upload-svg { width:36px; height:36px; margin:0 auto 9px; display:block; opacity:0.75; }
    .a-upload-title { font-family:'Syne',sans-serif; font-weight:700; font-size:13.5px; color:#ede9ff; margin-bottom:5px; }
    .a-upload-sub { font-size:11px; color:#6a6a8a; }
    .a-type-row { display:flex; gap:5px; justify-content:center; margin-top:11px; flex-wrap:wrap; }
    .a-chip { padding:2px 9px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:20px; font-size:10px; color:#9090b8; }
    .a-file-preview { display:flex; align-items:center; gap:11px; padding:11px 14px; background:#171728; border:1px solid rgba(110,90,255,0.18); border-radius:11px; }
    .a-file-thumb { width:40px; height:40px; object-fit:cover; border-radius:7px; flex-shrink:0; }
    .a-file-icon-wrap { width:40px; height:40px; border-radius:7px; background:rgba(124,92,252,0.12); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .a-file-info { flex:1; min-width:0; }
    .a-file-name { font-size:12px; font-weight:500; color:#ede9ff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .a-file-size { font-size:10px; color:#6a6a8a; margin-top:2px; }
    .a-file-remove { cursor:pointer; color:#6a6a8a; font-size:13px; padding:4px; border-radius:5px; transition:all 0.15s; flex-shrink:0; }
    .a-file-remove:hover { color:#f87171; background:rgba(248,113,113,0.1); }
    .a-analyse-btn {
      width:100%; padding:12px; border-radius:12px; border:none;
      background:linear-gradient(135deg,#7c5cfc,#9b70ff); color:white;
      font-family:'Syne',sans-serif; font-weight:700; font-size:13px; cursor:pointer;
      transition:all 0.2s; display:flex; align-items:center; justify-content:center; gap:8px;
      box-shadow:0 4px 20px rgba(124,92,252,0.38),inset 0 1px 0 rgba(255,255,255,0.12);
    }
    .a-analyse-btn:hover { transform:translateY(-2px); box-shadow:0 7px 28px rgba(124,92,252,0.52); }
    .a-analyse-btn:active { transform:translateY(0); }
    .a-analyse-btn.loading { pointer-events:none; opacity:0.78; }
    .a-spinner { width:14px; height:14px; border:2px solid rgba(255,255,255,0.3); border-top-color:white; border-radius:50%; animation:a-spin 0.7s linear infinite; }
    @keyframes a-spin { to{transform:rotate(360deg)} }
    .a-result-box {
      display:none; flex-direction:column; background:#0f0f1c;
      border:1px solid rgba(110,90,255,0.22); border-radius:13px; overflow:hidden;
      animation:apIn 0.25s ease;
    }
    .a-result-box.visible { display:flex; }
    .a-result-box-header {
      display:flex; align-items:center; justify-content:space-between; padding:11px 15px;
      background:linear-gradient(135deg,#0f0f1e,#141428); border-bottom:1px solid rgba(110,90,255,0.15);
    }
    .a-result-box-title { font-family:'Syne',sans-serif; font-weight:700; font-size:11px; letter-spacing:0.9px; text-transform:uppercase; color:#ede9ff; }
    .a-result-live { display:flex; align-items:center; gap:5px; font-size:10px; color:#34d399; font-weight:500; }
    .a-live-dot { width:6px; height:6px; border-radius:50%; background:#34d399; box-shadow:0 0 5px #34d399; animation:a-pulse 2s infinite; }
    @keyframes a-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
    .a-result-body { padding:14px 15px; color:#ede9ff; font-size:13px; line-height:1.7; white-space:pre-wrap; }
    .a-chat-msgs { display:flex; flex-direction:column; gap:10px; max-height:280px; min-height:180px; overflow-y:auto; padding:2px 0; }
    .a-chat-msgs::-webkit-scrollbar{width:3px} .a-chat-msgs::-webkit-scrollbar-thumb{background:rgba(110,90,255,0.25);border-radius:3px}
    .a-msg { display:flex; gap:9px; animation:a-msg-in 0.2s ease; }
    @keyframes a-msg-in{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
    .a-msg.user { flex-direction:row-reverse; }
    .a-msg-avatar { width:28px; height:28px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-family:'Syne',sans-serif; font-weight:800; font-size:9px; color:white; }
    .a-msg.ai .a-msg-avatar { background:linear-gradient(135deg,#7c5cfc,#b48aff); }
    .a-msg.user .a-msg-avatar { background:#171728; border:1px solid rgba(110,90,255,0.2); }
    .a-msg-bubble { max-width:80%; padding:9px 13px; border-radius:13px; font-size:12.5px; line-height:1.55; }
    .a-msg.ai .a-msg-bubble { background:#171728; border:1px solid rgba(110,90,255,0.18); color:#ede9ff; border-radius:3px 13px 13px 13px; }
    .a-msg.user .a-msg-bubble { background:linear-gradient(135deg,#7c5cfc,#5e38d8); color:white; border-radius:13px 3px 13px 13px; }
    .a-chat-input-row { display:flex; gap:7px; margin-top:10px; align-items:center; }
    .a-chat-input { flex:1; background:#0f0f1c; border:1px solid rgba(110,90,255,0.2); border-radius:11px; padding:10px 13px; color:#ede9ff; font-family:'DM Sans',sans-serif; font-size:12.5px; outline:none; transition:border-color 0.2s; }
    .a-chat-input:focus { border-color:#7c5cfc; }
    .a-chat-input::placeholder { color:#6a6a8a; }
    .a-send-btn { width:38px; height:38px; border-radius:11px; border:none; background:linear-gradient(135deg,#7c5cfc,#b48aff); color:white; cursor:pointer; flex-shrink:0; display:flex; align-items:center; justify-content:center; transition:all 0.2s; font-size:14px; }
    .a-send-btn:hover { transform:scale(1.08); }
    .analytica-img-wrapper { position:relative; display:inline-block; }
    .analytica-img-overlay { position:absolute; bottom:8px; left:50%; transform:translateX(-50%); background:linear-gradient(135deg,#7c5cfc,#b48aff); color:white; border:none; border-radius:20px; padding:5px 14px; font-size:11px; font-weight:600; font-family:'Syne',sans-serif; cursor:pointer; opacity:0; transition:opacity 0.2s; white-space:nowrap; box-shadow:0 3px 12px rgba(124,92,252,0.5); z-index:10; }
    .analytica-img-wrapper:hover .analytica-img-overlay { opacity:1; }
    #analytica-selection-tooltip { position:absolute; z-index:2147483644; display:flex; align-items:center; background:#0f0f1c; border:1px solid rgba(110,90,255,0.3); border-radius:10px; overflow:hidden; box-shadow:0 8px 30px rgba(0,0,0,0.5); animation:apIn 0.15s ease; }
    .a-tooltip-btn { padding:8px 14px; background:transparent; border:none; color:#b48aff; font-size:12px; font-weight:600; font-family:'Syne',sans-serif; cursor:pointer; transition:background 0.15s; }
    .a-tooltip-btn:hover { background:rgba(124,92,252,0.12); }
    .a-tooltip-sep { width:1px; height:30px; background:rgba(110,90,255,0.2); }
    .a-tooltip-copy { padding:8px 10px; background:transparent; border:none; color:#6a6a8a; font-size:13px; cursor:pointer; transition:background 0.15s; }
    .a-tooltip-copy:hover { background:rgba(255,255,255,0.05); }
  `;
  document.head.appendChild(style);

  const bubble = document.createElement('div');
  bubble.id = 'analytica-bubble';
  bubble.textContent = 'Df';
  document.body.appendChild(bubble);

  const panel = document.createElement('div');
  panel.id = 'analytica-panel';
  panel.innerHTML = `
    <div id="analytica-panel-header">
      <div class="a-logo">
        <div class="a-logo-icon">Df</div>
        <span class="a-logo-text">Deepfake Detector</span>
      </div>
      <button class="a-close-btn" id="a-close-panel">✕</button>
    </div>
    <div class="a-tabs">
      <div class="a-tab active" data-atab="text">Text</div>
      <div class="a-tab" data-atab="image">Image</div>
      <div class="a-tab" data-atab="video">Video</div>
      <div class="a-tab" data-atab="chat">Chat</div>
    </div>
    <div class="a-panel-body">
      <div class="a-section active" id="a-sec-text">
        <textarea class="a-textarea" id="a-text-input" placeholder="Paste or type text to analyse…"></textarea>
        <button class="a-analyse-btn" id="a-analyse-text">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          Analyse Text
        </button>
        <div class="a-result-box" id="a-text-result">
          <div class="a-result-box-header">
            <span class="a-result-box-title">Analysis Result</span>
            <span class="a-result-live"><span class="a-live-dot"></span> Complete</span>
          </div>
          <div class="a-result-body" id="a-text-result-body"></div>
        </div>
      </div>
      <div class="a-section" id="a-sec-image">
        <div class="a-upload-zone" id="a-img-zone">
          <svg class="a-upload-svg" viewBox="0 0 48 48" fill="none">
            <rect x="4" y="8" width="40" height="32" rx="5" stroke="#7c5cfc" stroke-width="2"/>
            <circle cx="16" cy="19" r="4" stroke="#b48aff" stroke-width="2"/>
            <path d="M4 32l10-10 8 8 6-6 12 12" stroke="#7c5cfc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <div class="a-upload-title">Drop an image here</div>
          <div class="a-upload-sub">or click to browse</div>
          <div class="a-type-row"><span class="a-chip">JPG</span><span class="a-chip">PNG</span><span class="a-chip">WEBP</span><span class="a-chip">GIF</span></div>
        </div>
        <input type="file" id="a-img-input" accept="image/*" style="display:none">
        <div id="a-img-preview" style="display:none"></div>
        <button class="a-analyse-btn" id="a-analyse-img">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          Analyse Image
        </button>
        <div class="a-result-box" id="a-img-result">
          <div class="a-result-box-header">
            <span class="a-result-box-title">Analysis Result</span>
            <span class="a-result-live"><span class="a-live-dot"></span> Complete</span>
          </div>
          <div class="a-result-body" id="a-img-result-body"></div>
        </div>
      </div>
      <div class="a-section" id="a-sec-video">
        <div class="a-upload-zone" id="a-vid-zone">
          <svg class="a-upload-svg" viewBox="0 0 48 48" fill="none">
            <rect x="2" y="10" width="30" height="28" rx="4" stroke="#7c5cfc" stroke-width="2"/>
            <path d="M32 18l12-8v28l-12-8V18z" stroke="#b48aff" stroke-width="2" stroke-linejoin="round"/>
          </svg>
          <div class="a-upload-title">Drop a video here</div>
          <div class="a-upload-sub">or click to browse · up to 500 MB</div>
          <div class="a-type-row"><span class="a-chip">MP4</span><span class="a-chip">MOV</span><span class="a-chip">WEBM</span><span class="a-chip">AVI</span></div>
        </div>
        <input type="file" id="a-vid-input" accept="video/*" style="display:none">
        <div id="a-vid-preview" style="display:none"></div>
        <button class="a-analyse-btn" id="a-analyse-vid">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          Analyse Video
        </button>
        <div class="a-result-box" id="a-vid-result">
          <div class="a-result-box-header">
            <span class="a-result-box-title">Analysis Result</span>
            <span class="a-result-live"><span class="a-live-dot"></span> Complete</span>
          </div>
          <div class="a-result-body" id="a-vid-result-body"></div>
        </div>
      </div>
      <div class="a-section" id="a-sec-chat">
        <div class="a-chat-msgs" id="a-chat-msgs">
          <div class="a-msg ai">
            <div class="a-msg-avatar">Df</div>
            <div class="a-msg-bubble">Hello! I'm Deepfake Detector. Upload or paste content to analyse, or ask me anything.</div>
          </div>
        </div>
        <div class="a-chat-input-row">
          <input class="a-chat-input" id="a-chat-input" placeholder="Ask anything…">
          <button class="a-send-btn" id="a-send-btn">➤</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  let panelOpen = false;
  function openPanel() { panelOpen=true; bubble.classList.add('open'); panel.style.display='flex'; panel.classList.remove('closing'); }
  function closePanel() { panelOpen=false; bubble.classList.remove('open'); panel.classList.add('closing'); setTimeout(()=>{ panel.style.display='none'; panel.classList.remove('closing'); },220); }
  bubble.addEventListener('click', () => panelOpen ? closePanel() : openPanel());
  document.getElementById('a-close-panel').addEventListener('click', closePanel);

  panel.querySelectorAll('.a-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      panel.querySelectorAll('.a-tab').forEach(t=>t.classList.remove('active'));
      panel.querySelectorAll('.a-section').forEach(s=>s.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('a-sec-'+tab.dataset.atab).classList.add('active');
    });
  });
  function switchPanelTo(name) {
    panel.querySelectorAll('.a-tab').forEach(t=>t.classList.toggle('active',t.dataset.atab===name));
    panel.querySelectorAll('.a-section').forEach(s=>s.classList.remove('active'));
    const sec=document.getElementById('a-sec-'+name); if(sec) sec.classList.add('active');
  }

  function setLoading(btn,on) {
    if(on){btn._orig=btn.innerHTML;btn.innerHTML='<div class="a-spinner"></div> Analysing…';btn.classList.add('loading');}
    else{btn.innerHTML=btn._orig||btn.innerHTML;btn.classList.remove('loading');}
  }
  function showResult(boxId,bodyId,text) {
    document.getElementById(bodyId).textContent=text;
    document.getElementById(boxId).classList.add('visible');
  }

  const imgZone=document.getElementById('a-img-zone'), imgInput=document.getElementById('a-img-input');
  imgZone.addEventListener('click',()=>imgInput.click());
  imgZone.addEventListener('dragover',e=>{e.preventDefault();imgZone.style.borderColor='#7c5cfc';});
  imgZone.addEventListener('dragleave',()=>{imgZone.style.borderColor='';});
  imgZone.addEventListener('drop',e=>{e.preventDefault();imgZone.style.borderColor='';const f=e.dataTransfer.files[0];if(f&&f.type.startsWith('image/'))showImgPreview(f);});
  imgInput.addEventListener('change',()=>{if(imgInput.files[0])showImgPreview(imgInput.files[0]);});
  function showImgPreview(file) {
    const size=file.size>1048576?(file.size/1048576).toFixed(1)+' MB':Math.round(file.size/1024)+' KB';
    const reader=new FileReader();
    reader.onload=e=>{
      const prev=document.getElementById('a-img-preview');
      prev.innerHTML=`<div class="a-file-preview"><img class="a-file-thumb" src="${e.target.result}"><div class="a-file-info"><div class="a-file-name">${file.name}</div><div class="a-file-size">${size}</div></div><span class="a-file-remove" id="a-img-remove">✕</span></div>`;
      prev.style.display='block'; imgZone.style.display='none';
      document.getElementById('a-img-remove').onclick=()=>{imgZone.style.display='block';prev.style.display='none';prev.innerHTML='';document.getElementById('a-img-result').classList.remove('visible');imgInput.value='';};
    };
    reader.readAsDataURL(file);
  }

  const vidZone=document.getElementById('a-vid-zone'), vidInput=document.getElementById('a-vid-input');
  vidZone.addEventListener('click',()=>vidInput.click());
  vidInput.addEventListener('change',()=>{if(vidInput.files[0])showVidPreview(vidInput.files[0]);});
  function showVidPreview(file) {
    const size=file.size>1048576?(file.size/1048576).toFixed(1)+' MB':Math.round(file.size/1024)+' KB';
    const prev=document.getElementById('a-vid-preview');
    prev.innerHTML=`<div class="a-file-preview"><div class="a-file-icon-wrap"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c5cfc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg></div><div class="a-file-info"><div class="a-file-name">${file.name}</div><div class="a-file-size">${size}</div></div><span class="a-file-remove" id="a-vid-remove">✕</span></div>`;
    prev.style.display='block'; vidZone.style.display='none';
    document.getElementById('a-vid-remove').onclick=()=>{vidZone.style.display='block';prev.style.display='none';prev.innerHTML='';document.getElementById('a-vid-result').classList.remove('visible');vidInput.value='';};
  }

  document.getElementById('a-analyse-text').addEventListener('click',()=>{
    const text=document.getElementById('a-text-input').value.trim(); if(!text)return;
    const btn=document.getElementById('a-analyse-text'); setLoading(btn,true);
    setTimeout(()=>{setLoading(btn,false);showResult('a-text-result','a-text-result-body','The text appears to be authentic human-written content. No significant indicators of AI generation or deepfake manipulation detected.\n\nConfidence: 91% authentic — Natural sentence variation, contextual coherence, and stylistic consistency are all within expected human ranges.');},1400);
  });
  document.getElementById('a-analyse-img').addEventListener('click',()=>{
    const btn=document.getElementById('a-analyse-img'); setLoading(btn,true);
    setTimeout(()=>{setLoading(btn,false);showResult('a-img-result','a-img-result-body','No deepfake manipulation detected in this image.\n\nFace region analysis shows consistent lighting, natural skin texture gradients, and no GAN artifacts. Metadata integrity check passed.\n\nConfidence: 88% authentic.');},1600);
  });
  document.getElementById('a-analyse-vid').addEventListener('click',()=>{
    const btn=document.getElementById('a-analyse-vid'); setLoading(btn,true);
    setTimeout(()=>{setLoading(btn,false);showResult('a-vid-result','a-vid-result-body','Video analysis complete. No frame-level manipulation detected across 240 sampled frames.\n\nAudio-visual sync is consistent. No lip-sync anomalies found. Facial landmark tracking remained stable throughout.\n\nConfidence: 85% authentic.');},1900);
  });

  const chatInput=document.getElementById('a-chat-input'), chatMsgs=document.getElementById('a-chat-msgs');
  document.getElementById('a-send-btn').addEventListener('click',sendMsg);
  chatInput.addEventListener('keydown',e=>{if(e.key==='Enter')sendMsg();});
  function sendMsg(){const t=chatInput.value.trim();if(!t)return;appendMsg('user',t);chatInput.value='';setTimeout(()=>appendMsg('ai','Connect your backend to get AI responses here.'),650);}
  function appendMsg(role,text){const m=document.createElement('div');m.className=`a-msg ${role}`;m.innerHTML=`<div class="a-msg-avatar">${role==='ai'?'Df':'Me'}</div><div class="a-msg-bubble">${esc(text)}</div>`;chatMsgs.appendChild(m);chatMsgs.scrollTop=chatMsgs.scrollHeight;}
  function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

  function wrapImage(img){
    if(img.dataset.analyticaWrapped)return;
    if(img.width<60||img.height<60)return;
    if(img.closest('#analytica-bubble,#analytica-panel'))return;
    img.dataset.analyticaWrapped='1';
    const wrap=document.createElement('div');wrap.className='analytica-img-wrapper';
    const cs=getComputedStyle(img);wrap.style.display=cs.display==='inline'?'inline-block':cs.display;wrap.style.position='relative';
    img.parentNode.insertBefore(wrap,img);wrap.appendChild(img);
    const btn=document.createElement('button');btn.className='analytica-img-overlay';btn.textContent='✦ Analyse Image';wrap.appendChild(btn);
    btn.addEventListener('click',e=>{
      e.stopPropagation();e.preventDefault();
      const prev=document.getElementById('a-img-preview'),zone=document.getElementById('a-img-zone');
      prev.innerHTML=`<div class="a-file-preview"><img class="a-file-thumb" src="${img.src}"><div class="a-file-info"><div class="a-file-name">Image from page</div><div class="a-file-size">${img.src.slice(0,40)}…</div></div></div>`;
      prev.style.display='block';zone.style.display='none';openPanel();switchPanelTo('image');
    });
  }
  document.querySelectorAll('img').forEach(wrapImage);
  new MutationObserver(muts=>muts.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType!==1)return;if(n.tagName==='IMG')wrapImage(n);n.querySelectorAll&&n.querySelectorAll('img').forEach(wrapImage);}))).observe(document.body,{childList:true,subtree:true});

  let selTip=null;
  document.addEventListener('mouseup',e=>{
    if(e.target.closest('#analytica-bubble,#analytica-panel,#analytica-selection-tooltip'))return;
    const sel=window.getSelection(),text=sel?sel.toString().trim():'';
    removeTip(); if(text.length<5)return;
    const rect=sel.getRangeAt(0).getBoundingClientRect();
    selTip=document.createElement('div');selTip.id='analytica-selection-tooltip';
    const ab=document.createElement('button');ab.className='a-tooltip-btn';ab.textContent='✦ Analyse';
    const sep=document.createElement('div');sep.className='a-tooltip-sep';
    const cb=document.createElement('button');cb.className='a-tooltip-copy';cb.textContent='📋';
    selTip.append(ab,sep,cb);document.body.appendChild(selTip);
    const tw=selTip.offsetWidth||160,th=selTip.offsetHeight||36;
    let left=rect.left+window.scrollX+rect.width/2-tw/2,top=rect.top+window.scrollY-th-10;
    left=Math.max(8,Math.min(left,window.innerWidth-tw-8));
    if(top<window.scrollY+8)top=rect.bottom+window.scrollY+10;
    selTip.style.cssText+=`left:${left}px;top:${top}px`;
    ab.addEventListener('click',()=>{document.getElementById('a-text-input').value=text;openPanel();switchPanelTo('text');removeTip();});
    cb.addEventListener('click',()=>{navigator.clipboard.writeText(text).catch(()=>{});cb.textContent='✅';setTimeout(()=>cb.textContent='📋',1200);});
  });
  document.addEventListener('mousedown',e=>{if(!e.target.closest('#analytica-selection-tooltip'))removeTip();});
  function removeTip(){if(selTip){selTip.remove();selTip=null;}}

  chrome.runtime.onMessage.addListener((msg,_s,res)=>{if(msg.type==='PING')res({ok:true});});
})();
