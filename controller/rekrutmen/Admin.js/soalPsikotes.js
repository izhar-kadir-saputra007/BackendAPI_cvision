import JenisSoal from "../../../models/jenisSoalModel.js"; // Import model JenisSoal dari "../models"; 
import SoalPsikotes from "../../../models/soalPsikotestModel.js"; 
import Lamaran from "../../../models/lamaranModel.js";
import Lowongan  from "../../../models/lowonganModel.js";
import LowonganJenisSoal from "../../../models/lowonganJenisSoalModel.js";
import JawabanPsikotes from "../../../models/jawabanPsikotesModel.js";

// Membuat jenis soal
export const createJenisSoal = async (req, res) => {
  const { namaJenis, deskripsi } = req.body;

  try {
    // Validasi input
    if (!namaJenis) {
      return res.status(400).json({ message: 'Nama jenis soal harus diisi.' });
    }

    // Buat jenis soal
    const newJenisSoal = await JenisSoal.create({
      namaJenis,
      deskripsi,
    });

    return res.status(201).json({
      message: 'Jenis soal berhasil dibuat.',
      data: newJenisSoal,
    });
  } catch (error) {
    console.error('Error creating jenis soal:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan saat membuat jenis soal.' });
  }
};


// Membuat multiple soal psikotes
export const createSoalPsikotes = async (req, res) => {
    const { jenisSoalId } = req.params; // Ambil jenisSoalId dari params
    const { soalList } = req.body; // Ambil array soal dari body
  
    try {
      // Validasi input
      if (!soalList || !Array.isArray(soalList)) {
        return res.status(400).json({ message: 'Data soal harus berupa array.' });
      }
  
      // Cek apakah jenis soal ada
      const jenisSoal = await JenisSoal.findByPk(jenisSoalId);
      if (!jenisSoal) {
        return res.status(404).json({ message: 'Jenis soal tidak ditemukan.' });
      }
  
      // Buat multiple soal psikotes
      const createdSoal = await SoalPsikotes.bulkCreate(
        soalList.map((soal) => ({
          pertanyaan: soal.question,
          options: soal.options,
          jenisSoalId,
        }))
      );
  
      return res.status(201).json({
        message: 'Soal psikotes berhasil dibuat.',
        data: createdSoal,
      });
    } catch (error) {
      console.error('Error creating soal psikotes:', error);
      return res.status(500).json({ message: 'Terjadi kesalahan saat membuat soal psikotes.' });
    }
};



