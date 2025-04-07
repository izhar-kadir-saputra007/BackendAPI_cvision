// controllers/resumeController.js

import Resume from '../models/Resume.js'; // Import model Resume

// Fungsi untuk mengunduh file resume berdasarkan ID
// controllers/downloadPDF.js
// Pastikan model Resume diimport
import fs from 'fs';
import path from 'path';

export const unduhPDF = async (req, res) => {
    try {
        const resumeId = req.params.id; // Ambil ID dari parameter
        const resume = await Resume.findByPk(resumeId); // Mencari resume berdasarkan ID

        if (!resume) {
            return res.status(404).json({ error: 'Resume tidak ditemukan.' });
        }

        const filePath = resume.file_path; // Ambil path file dari database

        // Pastikan file ada
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File tidak ditemukan.' });
        }

        // Mengatur header untuk mendownload file
        res.download(filePath, resume.file_name, (err) => {
            if (err) {
                console.error('Error downloading file:', err);
                res.status(500).send('Error downloading file.');
            }
        });
    } catch (error) {
        console.error('Error in downloadPDF controller:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
