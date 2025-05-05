import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Tentukan direktori upload
const uploadDir = path.join(process.cwd(), "uploads", "fotoProfil");

// Fungsi untuk memastikan folder upload ada
const ensureUploadDirExists = () => {
  try {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log(`Directory created: ${uploadDir}`);
    }
  } catch (err) {
    console.error(`Failed to create directory: ${err}`);
    throw new Error('Gagal membuat direktori upload');
  }
};

// Panggil fungsi saat middleware di-load
ensureUploadDirExists();

// Konfigurasi penyimpanan file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      // Verifikasi ulang folder sebelum menyimpan
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    } catch (err) {
      cb(new Error('Gagal mengakses direktori upload'), false);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `profile-${uniqueSuffix}${ext}`); 
  }
});

// Filter tipe file
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file gambar (JPEG, PNG, JPG) yang diperbolehkan'), false);
  }
};

// Konfigurasi Multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024, // 500KB
    files: 1 // Hanya 1 file yang diizinkan
  },
  fileFilter: fileFilter
});

// Middleware upload
export const uploadFotoProfilMiddleware = upload.single('fotoProfil');

// Error handling middleware
export const handleUploadError = (err, req, res, next) => {
  if (err) {
    // Handle error dari Multer
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Ukuran file terlalu besar. Maksimal 500KB'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Hanya boleh mengupload 1 file foto profil'
      });
    }
    if (err.message.includes('Hanya file gambar')) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    if (err.message.includes('Gagal membuat direktori') || 
        err.message.includes('Gagal mengakses direktori')) {
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server saat menyiapkan penyimpanan'
      });
    }
    
    // Error lainnya
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengupload file',
      error: err.message
    });
  }
  next();
};