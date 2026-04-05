const express = require('express');
const axios   = require('axios');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = 3000;

// AI microservice base URLs
const AI_SERVICES = {
    text:  'http://localhost:8000/detect/text',
    link:  'http://localhost:8001/detect/link',
    image: 'http://localhost:8002/detect/image',
    video: 'http://localhost:8003/detect/video',
};

// ── Multer: save uploaded images to /uploads ────────────────────────────────
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
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are allowed'));
    },
});
// ────────────────────────────────────────────────────────────────────────────

app.use(express.json());
app.use(express.static('public'));

// POST /upload-image  →  saves file to uploads/, returns its relative path
app.post('/upload-image', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No image file provided' });

    const filePath = path.join('uploads', req.file.filename);
    res.json({ path: filePath });
});

// POST /send-input  →  forwards input to the correct microservice
app.post('/send-input', async (req, res) => {
    try {
        const { input, type } = req.body;

        if (!AI_SERVICES[type]) {
            return res.status(400).json({ error: `Invalid input type: "${type}"` });
        }

        // Build the request body depending on type:
        //   image → { image_path: "uploads/filename.jpg" }
        //   everything else → { text: "..." }
        const body = type === 'image'
            ? { image_path: input }
            : { text: input };

        const response = await axios.post(AI_SERVICES[type], body);
        res.json(response.data);

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

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));