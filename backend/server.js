const express = require('express');
const axios   = require('axios');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = 3000;

// ── Shared data dir ──────────────────────────────────────────────────────────
const SHARED_DATA_DIR = path.join(__dirname, 'shared_data');
if (!fs.existsSync(SHARED_DATA_DIR)) fs.mkdirSync(SHARED_DATA_DIR);

// ── AI microservice base URLs ────────────────────────────────────────────────
const AI_SERVICES = {
    text:  'http://localhost:8000/detect/text',
    link:  'http://localhost:8001/detect/link',
    image: 'http://localhost:8002/detect/image',
    video: 'http://localhost:8003/detect/video',
};

// ── Multer ───────────────────────────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename:    (_req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
        cb(null, unique + path.extname(file.originalname));
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are allowed'));
    },
});

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.static('public'));

// ── POST /upload-image ───────────────────────────────────────────────────────
app.post('/upload-image', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No image file provided' });
    const filePath = path.join('uploads', req.file.filename);
    res.json({ path: filePath });
});

// ── POST /send-input ─────────────────────────────────────────────────────────
app.post('/send-input', async (req, res) => {
    try {
        const { input, type } = req.body;

        if (!AI_SERVICES[type]) {
            return res.status(400).json({ error: `Invalid input type: "${type}"` });
        }

        const body = type === 'image'
            ? { image_path: input }
            : { text: input };

        const response = await axios.post(AI_SERVICES[type], body);
        const analysisResult = response.data;

        // Save report for the chatbot
        const reportPath = path.join(SHARED_DATA_DIR, 'latest_report.json');
        fs.writeFileSync(reportPath, JSON.stringify({
            ...analysisResult,
            media_type: type,
            timestamp:  new Date().toISOString(),
        }, null, 2));

        res.json({
            message: 'Analyse réussie',
            data:    analysisResult,
        });

    } catch (err) {
        if (err.response) {
            return res.status(err.response.status).json({
                error: err.response.data?.detail || 'Microservice error'
            });
        }
        if (err.code === 'ECONNREFUSED') {
            return res.status(503).json({ error: 'AI microservice is not running' });
        }
        res.status(500).json({ error: 'Something went wrong' });
    }
});

// ── POST /explain ─────────────────────────────────────────────────────────────
app.post('/explain', async (req, res) => {
    try {
        const { question, analysis } = req.body;

        const response = await axios.post('http://localhost:5000/ask', {
            question,
            analysis,
        });

        res.json({ explanation: response.data.answer });

    } catch (err) {
        if (err.code === 'ECONNREFUSED') {
            return res.status(503).json({ error: 'Python chatbot is not running on port 5000' });
        }
        res.status(500).json({ error: 'Could not reach chatbot' });
    }
});

// ── Start server — ALWAYS LAST ───────────────────────────────────────────────
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));