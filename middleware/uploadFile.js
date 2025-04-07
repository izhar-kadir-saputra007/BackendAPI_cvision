import multer from "multer";
import path from "path";
import fs from "fs";

// Tentukan direktori upload
const uploadDir = path.join(process.cwd(), "uploads", "cv");

// Buat direktori jika belum ada
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Konfigurasi penyimpanan file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Gunakan direktori yang sudah dibuat
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname); // Ambil ekstensi file
    cb(null, `cv-${uniqueSuffix}${ext}`); // Nama file unik
  },
});

// Filter file (hanya izinkan PDF)
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true); // Terima file
  } else {
    cb(new Error("Hanya file PDF yang diizinkan."), false); // Tolak file
  }
};

// Inisialisasi multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Batas ukuran file (5MB)
});

export default upload;