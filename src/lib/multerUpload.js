// server/lib/multerUpload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = file.fieldname === 'cover' ? 'uploads/group-covers' : 'uploads/group-media';
    ensureDir(folder);
    cb(null, folder);
  },
  filename: (_req, file, cb) => {
    const unique = Date.now() + '_' + Math.random().toString(36).slice(2) + path.extname(file.originalname);
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

module.exports = { upload };
