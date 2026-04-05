// ================================================
//   TruthHover — Backend Express
//   Lance avec : node server.js
// ================================================

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// ── MIDDLEWARES ──────────────────────────────────
app.use(cors());
app.use(express.json());

// ── HEALTH CHECK ─────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '2.1.0' });
});

// ── ANALYSE ──────────────────────────────────────
app.post('/analyse', async (req, res) => {
  const { content } = req.body;

  if (!content || content.trim().length < 10) {
    return res.status(400).json({ error: 'Contenu trop court ou vide' });
  }

  console.log('\n📩 Texte reçu :', content.slice(0, 100) + '...');

  try {
    const result = analyseText(content);
    console.log('✅ Résultat :', result.status, result.confidence + '%');
    res.json(result);
  } catch (err) {
    console.error('❌ Erreur analyse :', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── MOTEUR D'ANALYSE (règles locales) ────────────
// ⚠️ Remplace cette fonction par un appel à ton vrai modèle AI si tu en as un

function analyseText(text) {
  const lowerText = text.toLowerCase();

  // === SIGNAUX SUSPECTS ===
  const suspectSignals = [];
  let suspectScore = 0;

  const suspectPatterns = [
    { pattern: /urgent|breaking|alerte|flash/i,      label: 'Langage urgentiste',      weight: 15 },
    { pattern: /partagez|share|diffusez|forward/i,   label: 'Appel au partage',        weight: 10 },
    { pattern: /censure|censuré|supprimé|interdit/i, label: 'Rhétorique censure',      weight: 20 },
    { pattern: /gouvernement|complot|illuminati/i,   label: 'Complot',                 weight: 25 },
    { pattern: /secret|caché|ils ne veulent pas/i,   label: 'Info secrète prétendue',  weight: 20 },
    { pattern: /!/g,                                 label: 'Ponctuation excessive',   weight: (m) => m.length * 3 },
    { pattern: /🚨|🔴|⚡|💥/,                      label: 'Émojis alarmants',         weight: 10 },
    { pattern: /mon voisin|un ami|quelqu'un m'a dit/i, label: 'Source anonyme',        weight: 20 },
    { pattern: /stockez|préparez|survivez/i,         label: 'Panique induite',         weight: 15 },
    { pattern: /100%|garanti|prouvé scientifiquement/i, label: 'Certitudes absolues',  weight: 15 },
  ];

  suspectPatterns.forEach(({ pattern, label, weight }) => {
    const match = text.match(pattern);
    if (match) {
      suspectSignals.push(label);
      const w = typeof weight === 'function' ? Math.min(weight(match), 20) : weight;
      suspectScore += w;
    }
  });

  // === SIGNAUX FIABLES ===
  const reliableSignals = [];
  let reliableScore = 0;

  const reliablePatterns = [
    { pattern: /selon une étude|d'après des chercheurs|des scientifiques ont/i, label: 'Source citée',      weight: 20 },
    { pattern: /the lancet|nature|science|pubmed|ncbi|who\.int/i,               label: 'Revue reconnue',    weight: 25 },
    { pattern: /\d+%|\d+ pour cent/i,                                           label: 'Données chiffrées', weight: 10 },
    { pattern: /https?:\/\//i,                                                  label: 'Lien fourni',       weight: 15 },
    { pattern: /peer.review|comité de lecture/i,                                label: 'Peer-reviewed',     weight: 20 },
    { pattern: /modéré|nuancé|cependant|toutefois/i,                            label: 'Ton nuancé',        weight: 10 },
  ];

  reliablePatterns.forEach(({ pattern, label, weight }) => {
    if (pattern.test(text)) {
      reliableSignals.push(label);
      reliableScore += weight;
    }
  });

  // === CALCUL FINAL ===
  const rawScore = suspectScore - reliableScore;
  const isSuspect = rawScore > 20;

  let confidence, reason, tags;

  if (isSuspect) {
    confidence = Math.min(50 + rawScore, 99);
    tags = suspectSignals.slice(0, 4);
    reason = buildSuspectReason(suspectSignals, confidence);
    return {
      status: 'suspect',
      confidence,
      reason,
      tags,
    };
  } else {
    confidence = Math.min(50 + reliableScore - suspectScore / 2, 98);
    confidence = Math.max(confidence, 60);
    tags = reliableSignals.slice(0, 4);
    reason = buildReliableReason(reliableSignals, confidence);
    return {
      status: 'fiable',
      confidence: Math.round(confidence),
      reason,
      tags,
    };
  }
}

function buildSuspectReason(signals, score) {
  const count = signals.length;
  let reason = `Ce contenu présente ${count} signal(s) suspects : ${signals.join(', ')}. `;

  if (score > 80) {
    reason += 'Le niveau de désinformation probable est très élevé. ';
  } else if (score > 60) {
    reason += 'Plusieurs marqueurs classiques de fausses informations ont été détectés. ';
  } else {
    reason += 'Quelques éléments nécessitent une vérification. ';
  }

  reason += 'Vérifiez la source originale avant de partager ce contenu.';
  return reason;
}

function buildReliableReason(signals, score) {
  let reason = '';
  if (signals.length > 0) {
    reason = `Ce contenu présente ${signals.length} indicateur(s) de fiabilité : ${signals.join(', ')}. `;
  } else {
    reason = 'Aucun signal suspect majeur détecté. ';
  }

  if (score > 80) {
    reason += 'Le contenu semble bien sourcé et fiable.';
  } else {
    reason += 'Le contenu paraît raisonnable, mais restez vigilant(e).';
  }
  return reason;
}

// ── DÉMARRAGE ────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════╗
║       TruthHover Backend v2.1.0      ║
╠══════════════════════════════════════╣
║  ✓ Serveur lancé sur :               ║
║    http://localhost:${PORT}             ║
║                                      ║
║  Routes disponibles :                ║
║  GET  /health   → statut             ║
║  POST /analyse  → analyser un texte  ║
╚══════════════════════════════════════╝
  `);
});
