// controller/predictRouter.js
import express from 'express';
import axios from 'axios';
import multer from 'multer';
import FormData from 'form-data';
import fs from 'fs';
import { Resume } from '../models/index.js'; // Import Resume model
import authenticate from '../middleware/authenticate.js'; // Middleware autentikasi

const router = express.Router(); 

// Konfigurasi Multer dengan Storage dan File Filter
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); 
    },
    filename: function (req, file, cb) {
        // Menghindari konflik nama file dengan menambahkan timestamp
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'file'), false);
    }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

/**
 * Route: POST /api/predict
 * Description: Menerima file PDF atau teks resume, meneruskannya ke API ML Flask, menyimpan data ke MySQL, dan mengembalikan hasil prediksi
 */
router.post('/', authenticate, upload.single('file'), async (req, res) => {

    if (!req.user) {
        return res.status(401).json({ error: 'User logged out. Please log in again.' });
    }
    try {
        let response;
        let filePath = '';  // Untuk menyimpan path file
        let fileName = ''; 

        if (req.file) {

             // Jika ada file yang diunggah, simpan nama file dan path
            filePath = req.file.path;
            fileName = req.file.filename;

            // Jika ada file yang diunggah, kirim sebagai form-data ke Flask API
            const form = new FormData();
            form.append('file', fs.createReadStream(req.file.path));

            response = await axios.post('http://localhost:5000/predict', form, {
                headers: form.getHeaders()
            });

            // Hapus file setelah upload
            // fs.unlinkSync(req.file.path);
        } else if (req.body.resume_text) {
            // Jika ada teks resume, kirim sebagai JSON ke Flask API
            response = await axios.post('http://localhost:5000/predict', {
                resume_text: req.body.resume_text
            });
        } else {
            return res.status(400).json({ error: 'No resume data provided.' });
        }

        // Mendapatkan hasil prediksi
        const { predicted_category, probability, probabilities } = response.data;

        // Menyiapkan data untuk disimpan ke database
        const resumeText = req.body.resume_text || ''; 
        const uploadDate = new Date();
        const userId = req.user.id; // Mendapatkan user ID dari req.user

        // Menyimpan data ke database menggunakan Sequelize
        const newResume = await Resume.create({
            resume_text: resumeText,
            predicted_category,
            probability,
            upload_date: uploadDate,
            userId, // Mengasosiasikan Resume dengan User
            file_name: fileName,    // Simpan nama file
            file_path: filePath     // Simpan path file
        });

        // Menambahkan ID resume yang baru disimpan ke respon
        response.data.resume_id = newResume.id;

        // Kembalikan hasil prediksi ke frontend
        return res.status(200).json(response.data);
    } catch (error) {
        if (error instanceof multer.MulterError) {
            // Tangani error Multer secara spesifik
            if (error.code === 'LIMIT_UNEXPECTED_FILE') {
                return res.status(400).json({ error: 'Unexpected field. Please upload a PDF file.' });
            }
            return res.status(400).json({ error: error.message });
        }
        console.error('Error communicating with ML API:', error.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
