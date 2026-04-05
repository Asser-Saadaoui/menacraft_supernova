// ================================================
//   TruthHover — content.js
//   Injecté dans chaque page web
// ================================================

const TH_CONFIG = {
  HOVER_DELAY: 5000,          // ms avant d'analyser
  API_URL: 'http://localhost:3000/analyse',
  MIN_TEXT_LENGTH: 30,        // ignorer les textes trop courts
  // Sélecteurs ciblés par réseau social
  SELECTORS: {
    facebook:  '[data-ad-preview="message"], [data-testid="post_message"], .x1iorvi4, div[dir="auto"]',
    twitter:   '[data-testid="tweetText"]',
    instagram: '._a9zs, ._aacl',
    default:   'p, article, [class*="post"], [class*="tweet"], [class*="content"]'
  }
};

// ── ÉTAT GLOBAL ──────────────────────────────────
let hoverTimer = null;
let currentTarget = null;
let lastAnalysedEl = null;
let sidebarCreated = false;

// ── INJECTION SIDEBAR ────────────────────────────
function createSidebar() {
  if (sidebarCreated) return;
  sidebarCreated = true;

  // Badge countdown (flotte près du curseur)
  const badge = document.createElement('div');
  badge.id = 'th-countdown-badge';
  badge.textContent = '🔍 Analyse dans 5s...';
  document.body.appendChild(badge);

  // Sidebar principale
  const sidebar = document.createElement('div');
  sidebar.id = 'truthhover-sidebar';

  sidebar.innerHTML = `
    <!-- HEADER -->
    <div id="th-header">
      <div id="th-brand">
        <div id="th-brand-icon">🔍</div>
        <div id="th-brand-name">Truth<span>Hover</span></div>
      </div>
      <div id="th-close">✕</div>
    </div>

    <!-- BODY -->
    <div id="th-body">

      <!-- État : idle -->
      <div id="th-state-idle" class="th-active">
        <div class="th-idle-icon">👁</div>
        <p class="th-idle-text">
          Survolez un post pendant <strong>5 secondes</strong> pour déclencher l'analyse
        </p>
      </div>

      <!-- État : loading -->
      <div id="th-state-loading">
        <div class="th-dots">
          <div class="th-dot"></div>
          <div class="th-dot"></div>
          <div class="th-dot"></div>
        </div>
        <div class="th-loading-label">Analyse en cours...</div>
        <div class="th-loading-excerpt" id="th-excerpt"></div>
      </div>

      <!-- État : résultat -->
      <div id="th-state-result">

        <div class="th-verdict-badge" id="th-verdict-badge">
          <div class="th-verdict-icon" id="th-verdict-icon"></div>
          <div>
            <div class="th-verdict-label">Verdict</div>
            <div class="th-verdict-value" id="th-verdict-value"></div>
          </div>
        </div>

        <div class="th-score-wrap">
          <div class="th-section-title">Score de confiance</div>
          <div class="th-score-bar-bg">
            <div class="th-score-bar" id="th-score-bar"></div>
          </div>
          <div class="th-score-num" id="th-score-num"></div>
        </div>

        <div class="th-section-title">Analyse</div>
        <div class="th-reason-box" id="th-reason"></div>

        <div class="th-section-title">Signaux détectés</div>
        <div class="th-tags-row" id="th-tags"></div>

        <div class="th-section-title">Extrait analysé</div>
        <div class="th-snippet-box" id="th-snippet"></div>

        <div class="th-actions">
          <div class="th-btn" id="th-btn-report">⚑ Signaler</div>
          <div class="th-btn th-primary" id="th-btn-close2">Fermer</div>
        </div>

      </div>
    </div>

    <!-- FOOTER -->
    <div id="th-footer">
      <div>
        <span class="th-status-dot"></span>
        <span class="th-footer-txt" id="th-status-txt">en attente</span>
      </div>
      <span class="th-footer-txt">v2.1.0</span>
    </div>
  `;

  document.body.appendChild(sidebar);

  // Events fermeture
  document.getElementById('th-close').addEventListener('click', closeSidebar);
  document.getElementById('th-btn-close2').addEventListener('click', closeSidebar);

  // Event signaler
  document.getElementById('th-btn-report').addEventListener('click', function () {
    this.textContent = '✓ Signalé';
    this.classList.add('th-reported');
  });
}

// ── ÉTATS SIDEBAR ────────────────────────────────
function showIdle() {
  setState('idle');
  setStatus('en attente');
}

function showLoading(text) {
  setState('loading');
  setStatus('analyse...');
  const el = document.getElementById('th-excerpt');
  if (el) el.textContent = '"' + text.slice(0, 150) + (text.length > 150 ? '...' : '') + '"';
}

function showResult(data) {
  setState('result');
  setStatus('terminé');

  const isSuspect = data.status === 'suspect';
  const cls = isSuspect ? 'th-suspect' : 'th-fiable';

  // Verdict badge
  const badge = document.getElementById('th-verdict-badge');
  badge.className = 'th-verdict-badge ' + cls;
  document.getElementById('th-verdict-icon').textContent = isSuspect ? '⚠️' : '✅';
  document.getElementById('th-verdict-value').textContent = isSuspect ? 'Suspect' : 'Fiable';

  // Score
  const score = data.confidence || data.score || 0;
  const bar = document.getElementById('th-score-bar');
  bar.className = 'th-score-bar ' + cls;
  const num = document.getElementById('th-score-num');
  num.className = 'th-score-num ' + cls;
  num.textContent = score + '%';
  setTimeout(() => { bar.style.width = score + '%'; }, 60);

  // Raison
  const reason = document.getElementById('th-reason');
  if (reason) reason.textContent = data.reason || data.explanation || 'Aucune explication fournie.';

  // Tags
  const tagsRow = document.getElementById('th-tags');
  if (tagsRow) {
    tagsRow.innerHTML = '';
    const tags = data.tags || data.signals || [];
    tags.forEach(tag => {
      const t = document.createElement('div');
      t.className = 'th-tag ' + cls;
      t.textContent = tag;
      tagsRow.appendChild(t);
    });
  }

  // Snippet
  const snippet = document.getElementById('th-snippet');
  if (snippet && currentTarget) {
    const txt = currentTarget.innerText || '';
    snippet.textContent = '"' + txt.slice(0, 200) + (txt.length > 200 ? '...' : '') + '"';
  }

  // Reset bouton signaler
  const reportBtn = document.getElementById('th-btn-report');
  if (reportBtn) {
    reportBtn.textContent = '⚑ Signaler';
    reportBtn.classList.remove('th-reported');
  }
}

function showError(msg) {
  setState('result');
  setStatus('erreur');

  const badge = document.getElementById('th-verdict-badge');
  badge.className = 'th-verdict-badge th-suspect';
  document.getElementById('th-verdict-icon').textContent = '❌';
  document.getElementById('th-verdict-value').textContent = 'Erreur';

  const bar = document.getElementById('th-score-bar');
  bar.className = 'th-score-bar th-suspect';
  bar.style.width = '100%';
  document.getElementById('th-score-num').textContent = '—';
  document.getElementById('th-score-num').className = 'th-score-num th-suspect';

  const reason = document.getElementById('th-reason');
  if (reason) reason.textContent = msg;

  const tagsRow = document.getElementById('th-tags');
  if (tagsRow) tagsRow.innerHTML = '<div class="th-tag th-suspect">Backend hors ligne</div>';
}

function setState(name) {
  ['idle', 'loading', 'result'].forEach(s => {
    const el = document.getElementById('th-state-' + s);
    if (el) el.className = 'th-active' === name ? '' : '';
  });
  const target = document.getElementById('th-state-' + name);
  if (target) target.classList.add('th-active');
}

function setStatus(txt) {
  const el = document.getElementById('th-status-txt');
  if (el) el.textContent = txt;
}

// ── SIDEBAR OPEN / CLOSE ─────────────────────────
function openSidebar() {
  const sidebar = document.getElementById('truthhover-sidebar');
  if (sidebar) sidebar.classList.add('th-open');
}

function closeSidebar() {
  const sidebar = document.getElementById('truthhover-sidebar');
  if (sidebar) sidebar.classList.remove('th-open');
  setTimeout(showIdle, 420);
  hideBadge();
}

// ── BADGE COUNTDOWN ──────────────────────────────
let badgeInterval = null;

function showBadge(x, y) {
  const badge = document.getElementById('th-countdown-badge');
  if (!badge) return;
  badge.style.display = 'block';
  badge.style.left = (x + 14) + 'px';
  badge.style.top = (y - 30) + 'px';
  badge.textContent = '🔍 Analyse dans 5s...';

  let secs = 5;
  badgeInterval = setInterval(() => {
    secs--;
    if (secs <= 0) {
      badge.textContent = '🔍 Analyse...';
      clearInterval(badgeInterval);
    } else {
      badge.textContent = '🔍 Analyse dans ' + secs + 's...';
    }
  }, 1000);
}

function hideBadge() {
  const badge = document.getElementById('th-countdown-badge');
  if (badge) badge.style.display = 'none';
  clearInterval(badgeInterval);
}

function moveBadge(x, y) {
  const badge = document.getElementById('th-countdown-badge');
  if (badge && badge.style.display !== 'none') {
    badge.style.left = (x + 14) + 'px';
    badge.style.top = (y - 30) + 'px';
  }
}

// ── DÉTECTION DES POSTS ──────────────────────────
function getPostSelector() {
  const host = window.location.hostname;
  if (host.includes('facebook')) return TH_CONFIG.SELECTORS.facebook;
  if (host.includes('twitter') || host.includes('x.com')) return TH_CONFIG.SELECTORS.twitter;
  if (host.includes('instagram')) return TH_CONFIG.SELECTORS.instagram;
  return TH_CONFIG.SELECTORS.default;
}

function findPostElement(el) {
  // Remonter le DOM pour trouver l'élément de post le plus pertinent
  const selector = getPostSelector();
  let node = el;
  let depth = 0;
  while (node && node !== document.body && depth < 10) {
    if (node.matches && node.matches(selector)) {
      const text = (node.innerText || '').trim();
      if (text.length >= TH_CONFIG.MIN_TEXT_LENGTH) {
        return node;
      }
    }
    node = node.parentElement;
    depth++;
  }
  return null;
}

// ── ANALYSE BACKEND ──────────────────────────────
async function analysePost(postEl) {
  const text = (postEl.innerText || '').trim();
  if (!text || text.length < TH_CONFIG.MIN_TEXT_LENGTH) return;

  openSidebar();
  showLoading(text);

  try {
    const response = await fetch(TH_CONFIG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text })
    });

    if (!response.ok) {
      throw new Error('Serveur HTTP ' + response.status);
    }

    const data = await response.json();
    showResult(data);

  } catch (err) {
    console.error('[TruthHover] Erreur API :', err.message);
    showError(
      'Impossible de joindre le backend.\n\n' +
      'Vérifiez que votre serveur tourne sur ' + TH_CONFIG.API_URL + '\n\n' +
      'Erreur : ' + err.message
    );
  }
}

// ── EVENTS HOVER ────────────────────────────────
let mouseX = 0, mouseY = 0;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  moveBadge(mouseX, mouseY);
});

document.addEventListener('mouseover', (e) => {
  // Ignorer la sidebar elle-même
  if (e.target.closest('#truthhover-sidebar') || e.target.id === 'th-countdown-badge') return;

  const post = findPostElement(e.target);
  if (!post) return;
  if (post === lastAnalysedEl) return; // ne pas ré-analyser le même

  // Annuler le timer précédent si on change de post
  if (currentTarget && currentTarget !== post) {
    currentTarget.classList.remove('th-hovering-post');
    clearTimeout(hoverTimer);
    hideBadge();
  }

  currentTarget = post;
  post.classList.add('th-hovering-post');
  showBadge(mouseX, mouseY);

  hoverTimer = setTimeout(() => {
    post.classList.remove('th-hovering-post');
    hideBadge();
    lastAnalysedEl = post;
    analysePost(post);
  }, TH_CONFIG.HOVER_DELAY);
});

document.addEventListener('mouseout', (e) => {
  if (e.target.closest('#truthhover-sidebar') || e.target.id === 'th-countdown-badge') return;

  if (currentTarget && e.target === currentTarget) {
    currentTarget.classList.remove('th-hovering-post');
    clearTimeout(hoverTimer);
    hideBadge();
    currentTarget = null;
  }
});

// ── INIT ─────────────────────────────────────────
createSidebar();
console.log('[TruthHover] Extension chargée ✓ sur', window.location.hostname);
