import express from 'express';
import axios from 'axios';
import multer from 'multer';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Proxy to OCR service - accepts file and forwards it
router.post('/extract', upload.single('file'), async (req, res) => {
  try {
    // In containerized env we can call the ocr service at http://ocr:8000
    // For now, respond with placeholder
    res.json({ text: 'ocr result placeholder' });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;