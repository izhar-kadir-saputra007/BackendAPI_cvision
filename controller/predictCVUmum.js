import axios from "axios";
import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";
import FormData from "form-data";
import PredicCVUmum from "../models/predictCVUmumModel.js";
import { v4 as uuidv4 } from "uuid";
import csvParser from "csv-parser"; 

// Konversi __dirname ke ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔹 Konfigurasi Multer di dalam Controller
const storage = multer.memoryStorage(); // Simpan file di buffer, bukan disk
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Format file tidak didukung! Harap upload file PDF."), false);
  }
};

export const upload = multer({ storage, fileFilter });

export const predictCVUmum = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "File tidak ditemukan!" });
    }

    // 🔹 Kirim file ke Flask untuk prediksi
    const formData = new FormData();
    formData.append("file", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

   

    const flaskResponse = await axios.post("https://5408-36-90-138-218.ngrok-free.app/api/predict_umum", formData, {
      headers: formData.getHeaders(),
    });

    const { id, posisi, cv_user, probability, top_5_positions } = flaskResponse.data;

 // 🔹 Buat folder penyimpanan CSV jika belum ada
// 🔹 Pastikan folder penyimpanan ada
const csvDir = path.join(__dirname, "../data");
if (!fs.existsSync(csvDir)) {
  fs.mkdirSync(csvDir, { recursive: true });
}

// 🔹 Tentukan file penyimpanan berdasarkan probabilitas
const probValue = parseFloat(probability.replace("%", ""));
const datasetFile = probValue >= 60
  ? path.join(csvDir, "cv_predicted_above_60.csv")
  : path.join(csvDir, "cv_predicted_below_60.csv");

// 🔹 Baca data CSV yang sudah ada untuk mencegah duplikasi
const existingCVs = new Set();
if (fs.existsSync(datasetFile)) {
  const csvData = fs.readFileSync(datasetFile, "utf8");
  const lines = csvData.split("\n").slice(1); // Lewati header

  lines.forEach((line) => {
    const columns = line.split('","'); // Pecah berdasarkan koma dalam tanda kutip
    if (columns.length > 2) {
      existingCVs.add(columns[2]); // Ambil isi CV (kolom cv_user)
    }
  });
}

// 🔹 Cek apakah CV sudah ada
if (!existingCVs.has(cv_user)) {
  // 🔹 Buat data CSV tanpa top_5_positions
  const csvHeader = `"id","posisi","cv_user","probability"\n`;
  const csvData = `"${uuidv4()}","${posisi}","${cv_user}","${probability}"\n`;

  // 🔹 Simpan data ke file CSV tanpa menimpa yang lama
  const isNewFile = !fs.existsSync(datasetFile);
  fs.appendFileSync(datasetFile, isNewFile ? csvHeader + csvData : csvData, "utf8");

 
} else {
 
}
    // 🔹 Simpan ke database
    const newPrediction = await PredicCVUmum.create({
        id,  // id akan dihasilkan otomatis jika pakai auto-increment
        posisi,  // menggunakan posisi yang diterima dari Flask
        probability,
        cv_user,
        top_5_positions,
        csv_path: datasetFile, 
    });

    // 🔹 Kirim respons ke client
    res.status(200).json({
      message: "Prediksi berhasil",
      prediction: newPrediction,
      csv_path: datasetFile,
    });

  } catch (error) {
    console.error("❌ Error:", error.message);
    res.status(500).json({ error: "Terjadi kesalahan dalam prediksi" });
  }
};


// download file cvs
export const downloadCSV = (req, res) => {
  const { type } = req.params;

  // 🔹 Validasi tipe file yang diperbolehkan
  if (type !== "above_60" && type !== "below_60") {
    return res.status(400).json({ error: "Tipe file tidak valid!" });
  }

  // 🔹 Tentukan path file CSV berdasarkan tipe (di atas atau di bawah 60%)
  const csvDir = path.join(__dirname, "../data");
  const fileMap = {
    above_60: "cv_predicted_above_60.csv",
    below_60: "cv_predicted_below_60.csv",
  };

  const datasetFile = path.join(csvDir, fileMap[type]);

  // 🔹 Periksa apakah file ada
  if (!fs.existsSync(datasetFile)) {
    return res.status(404).json({ error: "File tidak ditemukan!" });
  }

  // 🔹 Kirim file CSV sebagai respons untuk diunduh
  res.download(datasetFile, `prediksi_${type}.csv`, (err) => {
    if (err) {
      
      return res.status(500).json({ error: "Gagal mengunduh file" });
    }
  });
};
