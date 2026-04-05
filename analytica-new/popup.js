const BACKEND = 'http://localhost:3000';

// ── TAB SWITCHING ──────────────────────────────────────────────
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
  });
});

// ── CHAR COUNT ─────────────────────────────────────────────────
const textInput = document.getElementById('textInput');
const charCount = document.getElementById('charCount');
textInput.addEventListener('input', () => {
  charCount.textContent = textInput.value.length;
});

// ── RESULT CARD BUILDER ─────────────────────────────────────────
function buildResultCard(label, value, confidence = null) {
  const card = document.createElement('div');
  card.className = 'result-card';
  card.style.marginBottom = '10px';
  card.innerHTML = `
    <div class="result-card-label">${label}</div>
    <div class="result-card-value">${value}</div>
    ${confidence !== null ? `
    <div class="confidence-bar">
      <div class="confidence-fill" data-target="${confidence}"></div>
    </div>` : ''}
  `;
  return card;
}

function animateConfidenceBars(container) {
  container.querySelectorAll('.confidence-fill').forEach(bar => {
    const target = bar.dataset.target;
    setTimeout(() => { bar.style.width = target + '%'; }, 80);
  });
}

function showResults(sectionEl, cardsEl, cards) {
  cardsEl.innerHTML = '';
  cards.forEach(c => cardsEl.appendChild(buildResultCard(c.label, c.value, c.confidence ?? null)));
  sectionEl.style.display = 'flex';
  sectionEl.style.flexDirection = 'column';
  sectionEl.style.gap = '10px';
  animateConfidenceBars(cardsEl);
}

function showError(sectionEl, cardsEl, message) {
  cardsEl.innerHTML = '';
  const card = document.createElement('div');
  card.className = 'result-card';
  card.style.marginBottom = '10px';
  card.innerHTML = `<div class="result-card-label" style="color:#ff4d6d;">Error</div>
                    <div class="result-card-value">${message}</div>`;
  cardsEl.appendChild(card);
  sectionEl.style.display = 'flex';
}

// ── LOADING STATE HELPER ──────────────────────────────────────
function setLoading(btn, loading) {
  if (loading) {
    btn.dataset.orig = btn.innerHTML;
    btn.innerHTML = `<div class="btn-spinner"></div> Analysing…`;
    btn.classList.add('loading');
    btn.disabled = true;
  } else {
    btn.innerHTML = btn.dataset.orig || btn.innerHTML;
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}

// ── HELPER: call backend /send-input ──────────────────────────
async function runDetection(input, type) {
  const resp = await fetch(`${BACKEND}/send-input`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input, type }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${resp.status}`);
  }
  return resp.json(); // { message, data }
}

// ── HELPER: call backend /explain ─────────────────────────────
async function getExplanation(analysis) {
  const resp = await fetch(`${BACKEND}/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: 'Explique-moi ce rapport de manière claire et pédagogique.',
      analysis,
    }),
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  return data.explanation || null;
}

// ── HELPER: build cards from detection result ─────────────────
function buildCardsFromResult(result, type) {
  const cards = [];
  const d = result.data || result;

  if (type === 'text') {
    const det = d.ai_content_detection || d;
    const conf = Math.round((det.confidence ?? 0) * 100);
    cards.push({ label: 'Verdict', value: det.is_ai_generated ? '🤖 AI-Generated' : '✅ Human-Written', confidence: conf });
    cards.push({ label: 'Confidence', value: `${conf}%` });
    if (det.reasoning_bullets?.length)
      cards.push({ label: 'Reasoning', value: det.reasoning_bullets.join('<br>') });
    if (det.model_used)
      cards.push({ label: 'Model Used', value: det.model_used });
  }

  else if (type === 'image') {
    const det = d.deepfake_detection || d;
    const conf = Math.round((det.confidence ?? 0) * 100);
    cards.push({ label: 'Verdict', value: det.is_deepfake ? '🤖 AI-Generated / Deepfake' : '✅ Likely Real', confidence: conf });
    cards.push({ label: 'Confidence', value: `${conf}%` });
    if (det.verdict) cards.push({ label: 'Assessment', value: det.verdict });
    if (det.reasoning?.length)
      cards.push({ label: 'Reasoning', value: det.reasoning.join('<br>') });
  }

  else if (type === 'video') {
    const det = d.deepfake_detection || d;
    const conf = Math.round((det.confidence ?? 0) * 100);
    cards.push({ label: 'Verdict', value: det.is_deepfake ? '🤖 Deepfake Detected' : '✅ Likely Authentic', confidence: conf });
    cards.push({ label: 'Confidence', value: `${conf}%` });
    if (det.verdict) cards.push({ label: 'Assessment', value: det.verdict });
  }

  else if (type === 'link') {
    const det = d.link_analysis || d;
    cards.push({ label: 'URL Safety', value: det.is_malicious ? '🚨 Suspicious / Malicious' : '✅ Looks Safe' });
    if (det.verdict) cards.push({ label: 'Assessment', value: det.verdict });
    if (det.confidence !== undefined)
      cards.push({ label: 'Confidence', value: `${Math.round(det.confidence * 100)}%`, confidence: Math.round(det.confidence * 100) });
  }

  return cards;
}

// ── IMAGE UPLOAD ───────────────────────────────────────────────
const imageZone    = document.getElementById('imageZone');
const imageInput   = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');

imageZone.addEventListener('click', () => imageInput.click());
imageZone.addEventListener('dragover', e => { e.preventDefault(); imageZone.classList.add('drag-over'); });
imageZone.addEventListener('dragleave', () => imageZone.classList.remove('drag-over'));
imageZone.addEventListener('drop', e => {
  e.preventDefault();
  imageZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) showImagePreview(file);
});
imageInput.addEventListener('change', () => {
  if (imageInput.files[0]) showImagePreview(imageInput.files[0]);
});

let _uploadedImagePath = null;

function showImagePreview(file) {
  const sizeStr = file.size > 1024 * 1024
    ? (file.size / (1024 * 1024)).toFixed(1) + ' MB'
    : Math.round(file.size / 1024) + ' KB';

  const reader = new FileReader();
  reader.onload = e => {
    imagePreview.innerHTML = `
      <div class="file-preview">
        <img class="file-preview-thumb" src="${e.target.result}" alt="">
        <div class="file-preview-info">
          <div class="file-preview-name">${file.name}</div>
          <div class="file-preview-size">${sizeStr}</div>
        </div>
        <span class="file-preview-remove" id="removeImage">&#x2715;</span>
      </div>`;
    imagePreview.style.display = 'block';
    imageZone.style.display = 'none';

    // Upload to backend immediately so we have the path ready
    const form = new FormData();
    form.append('image', file);
    fetch(`${BACKEND}/upload-image`, { method: 'POST', body: form })
      .then(r => r.json())
      .then(data => { _uploadedImagePath = data.path; })
      .catch(() => { _uploadedImagePath = null; });

    document.getElementById('removeImage').addEventListener('click', () => {
      imagePreview.style.display = 'none';
      imageZone.style.display = 'block';
      imageInput.value = '';
      _uploadedImagePath = null;
      document.getElementById('imageResults').style.display = 'none';
    });
  };
  reader.readAsDataURL(file);
}

// ── VIDEO UPLOAD ───────────────────────────────────────────────
const videoZone    = document.getElementById('videoZone');
const videoInput   = document.getElementById('videoInput');
const videoPreview = document.getElementById('videoPreview');

videoZone.addEventListener('click', () => videoInput.click());
videoZone.addEventListener('dragover', e => { e.preventDefault(); videoZone.classList.add('drag-over'); });
videoZone.addEventListener('dragleave', () => videoZone.classList.remove('drag-over'));
videoZone.addEventListener('drop', e => {
  e.preventDefault();
  videoZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('video/')) showVideoPreview(file);
});
videoInput.addEventListener('change', () => {
  if (videoInput.files[0]) showVideoPreview(videoInput.files[0]);
});

let _uploadedVideoPath = null;

function showVideoPreview(file) {
  const sizeStr = file.size > 1024 * 1024
    ? (file.size / (1024 * 1024)).toFixed(1) + ' MB'
    : Math.round(file.size / 1024) + ' KB';

  videoPreview.innerHTML = `
    <div class="file-preview">
      <div class="file-preview-icon-wrap">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c5cfc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
      </div>
      <div class="file-preview-info">
        <div class="file-preview-name">${file.name}</div>
        <div class="file-preview-size">${sizeStr}</div>
      </div>
      <span class="file-preview-remove" id="removeVideo">&#x2715;</span>
    </div>`;
  videoPreview.style.display = 'block';
  videoZone.style.display = 'none';

  // Upload video to backend
  const form = new FormData();
  form.append('video', file);
  fetch(`${BACKEND}/upload-video`, { method: 'POST', body: form })
    .then(r => r.json())
    .then(data => { _uploadedVideoPath = data.path; })
    .catch(() => { _uploadedVideoPath = null; });

  document.getElementById('removeVideo').addEventListener('click', () => {
    videoPreview.style.display = 'none';
    videoZone.style.display = 'block';
    videoInput.value = '';
    _uploadedVideoPath = null;
    document.getElementById('videoResults').style.display = 'none';
  });
}

// ── ANALYSE TEXT ──────────────────────────────────────────────
document.getElementById('analyseText').addEventListener('click', async () => {
  const text = textInput.value.trim();
  if (!text) return;

  const btn = document.getElementById('analyseText');
  const resultsEl = document.getElementById('textResults');
  const cardsEl   = document.getElementById('textResultCards');
  setLoading(btn, true);

  try {
    const result = await runDetection(text, 'text');
    const cards  = buildCardsFromResult(result, 'text');

    // Get chatbot explanation and add it as a card
    const explanation = await getExplanation(result.data || result);
    if (explanation) cards.push({ label: '🤖 AI Expert Explanation', value: explanation });

    showResults(resultsEl, cardsEl, cards);
  } catch (err) {
    showError(resultsEl, cardsEl, err.message);
  } finally {
    setLoading(btn, false);
  }
});

// ── ANALYSE IMAGE ─────────────────────────────────────────────
document.getElementById('analyseImage').addEventListener('click', async () => {
  if (!_uploadedImagePath) {
    alert('Please select an image first.');
    return;
  }

  const btn      = document.getElementById('analyseImage');
  const resultsEl = document.getElementById('imageResults');
  const cardsEl   = document.getElementById('imageResultCards');
  setLoading(btn, true);

  try {
    const result = await runDetection(_uploadedImagePath, 'image');
    const cards  = buildCardsFromResult(result, 'image');

    const explanation = await getExplanation(result.data || result);
    if (explanation) cards.push({ label: '🤖 AI Expert Explanation', value: explanation });

    showResults(resultsEl, cardsEl, cards);
  } catch (err) {
    showError(resultsEl, cardsEl, err.message);
  } finally {
    setLoading(btn, false);
  }
});

// ── ANALYSE VIDEO ─────────────────────────────────────────────
document.getElementById('analyseVideo').addEventListener('click', async () => {
  if (!_uploadedVideoPath) {
    alert('Please select a video first.');
    return;
  }

  const btn      = document.getElementById('analyseVideo');
  const resultsEl = document.getElementById('videoResults');
  const cardsEl   = document.getElementById('videoResultCards');
  setLoading(btn, true);

  try {
    const result = await runDetection(_uploadedVideoPath, 'video');
    const cards  = buildCardsFromResult(result, 'video');

    const explanation = await getExplanation(result.data || result);
    if (explanation) cards.push({ label: '🤖 AI Expert Explanation', value: explanation });

    showResults(resultsEl, cardsEl, cards);
  } catch (err) {
    showError(resultsEl, cardsEl, err.message);
  } finally {
    setLoading(btn, false);
  }
});

// ── CHAT ───────────────────────────────────────────────────────
const chatInput    = document.getElementById('chatInput');
const chatMessages = document.getElementById('chatMessages');
const sendBtn      = document.getElementById('sendBtn');

let _lastAnalysis = null; // stores last detection result for chat context

chatInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});
sendBtn.addEventListener('click', sendMessage);

chatInput.addEventListener('input', () => {
  chatInput.style.height = 'auto';
  chatInput.style.height = Math.min(chatInput.scrollHeight, 100) + 'px';
});

async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  appendMessage('user', text);
  chatInput.value = '';
  chatInput.style.height = '';

  if (!_lastAnalysis) {
    appendMessage('ai', 'Please run a detection first so I have results to explain.');
    return;
  }

  try {
    const resp = await fetch(`${BACKEND}/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: text, analysis: _lastAnalysis }),
    });
    const data = await resp.json();
    appendMessage('ai', data.explanation || data.error || 'No response.');
  } catch {
    appendMessage('ai', 'Could not reach the backend. Is it running?');
  }
}

function appendMessage(role, text) {
  const msg = document.createElement('div');
  msg.className = `msg ${role}`;
  msg.innerHTML = `
    <div class="msg-avatar">${role === 'ai' ? 'Ax' : 'Me'}</div>
    <div class="msg-bubble">${text}</div>
  `;
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ── RECEIVE DATA FROM CONTENT SCRIPT ──────────────────────────
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'SELECTED_TEXT') {
      textInput.value = msg.text;
      charCount.textContent = msg.text.length;
      document.querySelector('[data-tab="text"]').click();
    }
    if (msg.type === 'SELECTED_IMAGE') {
      window._pendingImageUrl = msg.src;
      const preview = document.getElementById('imagePreview');
      preview.innerHTML = `
        <div class="file-preview">
          <img class="file-preview-thumb" src="${msg.src}" alt="">
          <div class="file-preview-info">
            <div class="file-preview-name">Image from page</div>
            <div class="file-preview-size">${msg.src.slice(0, 45)}…</div>
          </div>
        </div>`;
      preview.style.display = 'block';
      document.getElementById('imageZone').style.display = 'none';
      document.querySelector('[data-tab="image"]').click();

      // Auto-upload the image URL as a path
      _uploadedImagePath = msg.src;
    }
  });
}