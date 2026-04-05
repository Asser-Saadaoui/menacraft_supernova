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

// ── IMAGE UPLOAD ───────────────────────────────────────────────
const imageZone = document.getElementById('imageZone');
const imageInput = document.getElementById('imageInput');
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

    document.getElementById('removeImage').addEventListener('click', () => {
      imagePreview.style.display = 'none';
      imageZone.style.display = 'block';
      imageInput.value = '';
      document.getElementById('imageResults').style.display = 'none';
    });
  };
  reader.readAsDataURL(file);
}

// ── VIDEO UPLOAD ───────────────────────────────────────────────
const videoZone = document.getElementById('videoZone');
const videoInput = document.getElementById('videoInput');
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

  document.getElementById('removeVideo').addEventListener('click', () => {
    videoPreview.style.display = 'none';
    videoZone.style.display = 'block';
    videoInput.value = '';
    document.getElementById('videoResults').style.display = 'none';
  });
}

// ── LOADING STATE HELPER ──────────────────────────────────────
function setLoading(btn, loading) {
  if (loading) {
    btn.dataset.orig = btn.innerHTML;
    btn.innerHTML = `<div class="btn-spinner"></div> Analysing…`;
    btn.classList.add('loading');
  } else {
    btn.innerHTML = btn.dataset.orig || btn.innerHTML;
    btn.classList.remove('loading');
  }
}

// ── ANALYSE TEXT ──────────────────────────────────────────────
document.getElementById('analyseText').addEventListener('click', () => {
  const text = textInput.value.trim();
  if (!text) return;

  const btn = document.getElementById('analyseText');
  setLoading(btn, true);

  setTimeout(() => {
    setLoading(btn, false);
    showResults(
      document.getElementById('textResults'),
      document.getElementById('textResultCards'),
      [
        { label: 'Overview', value: 'The text expresses a clear and confident viewpoint. The writing is structured and purposeful, with a positive overall tone.', confidence: 87 },
        { label: 'Key Topics', value: 'Product Strategy, Market Analysis, Competitive Positioning, Q4 Initiatives' },
        { label: 'Reading Level', value: 'Professional / Graduate level — well-suited for a business or technical audience.', confidence: 74 },
        { label: 'AI Insights', value: 'Content reads as promotional. Consider adding neutral data or third-party references for increased credibility.' },
      ]
    );
  }, 1400);
});

// ── ANALYSE IMAGE ─────────────────────────────────────────────
document.getElementById('analyseImage').addEventListener('click', () => {
  const btn = document.getElementById('analyseImage');
  setLoading(btn, true);

  setTimeout(() => {
    setLoading(btn, false);
    showResults(
      document.getElementById('imageResults'),
      document.getElementById('imageResultCards'),
      [
        { label: 'Classification', value: 'Outdoor Scene — Natural Landscape with human-made structures visible in the background.', confidence: 91 },
        { label: 'Objects Detected', value: 'Trees (12), Buildings (3), Road (1), People (2), Vehicles (1)' },
        { label: 'Dominant Colors', value: 'Forest green #2d6a4f · Sky blue #90e0ef · Stone grey #adb5bd' },
        { label: 'Safety Check', value: 'No sensitive content detected. Image is safe for all audiences.', confidence: 99 },
      ]
    );
  }, 1600);
});

// ── ANALYSE VIDEO ─────────────────────────────────────────────
document.getElementById('analyseVideo').addEventListener('click', () => {
  const btn = document.getElementById('analyseVideo');
  setLoading(btn, true);

  setTimeout(() => {
    setLoading(btn, false);
    showResults(
      document.getElementById('videoResults'),
      document.getElementById('videoResultCards'),
      [
        { label: 'Transcript Preview', value: '"…we are excited to announce the next chapter of our product roadmap, bringing you faster performance and a cleaner interface…"' },
        { label: 'Scene Summary', value: '4 distinct scenes detected — Office environment (0:00–0:42), Product demo (0:43–1:20), Interview (1:21–2:05), Outro (2:06–2:30)' },
        { label: 'Overall Summary', value: 'A promotional product announcement video with high production quality. Primarily focused on a new software release.', confidence: 83 },
        { label: 'Audio Quality', value: 'Clear speech, low background noise. Suitable for automated transcription.', confidence: 95 },
      ]
    );
  }, 1800);
});

// ── CHAT ───────────────────────────────────────────────────────
const chatInput = document.getElementById('chatInput');
const chatMessages = document.getElementById('chatMessages');
const sendBtn = document.getElementById('sendBtn');

chatInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});
sendBtn.addEventListener('click', sendMessage);

chatInput.addEventListener('input', () => {
  chatInput.style.height = 'auto';
  chatInput.style.height = Math.min(chatInput.scrollHeight, 100) + 'px';
});

function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  appendMessage('user', text);
  chatInput.value = '';
  chatInput.style.height = '';

  setTimeout(() => {
    appendMessage('ai', 'Great question! Connect your backend endpoint to get real AI responses here based on your analysis results.');
  }, 650);
}

function appendMessage(role, text) {
  const msg = document.createElement('div');
  msg.className = `msg ${role}`;
  msg.innerHTML = `
    <div class="msg-avatar">${role === 'ai' ? 'Ax' : 'Me'}</div>
    <div class="msg-bubble">${escapeHtml(text)}</div>
  `;
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
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
    }
  });
}
