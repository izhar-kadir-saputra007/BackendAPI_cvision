import JenisSoal from "../../../models/jenisSoalModel.js"; // Import model JenisSoal dari "../models"; 
import SoalPsikotes from "../../../models/soalPsikotestModel.js"; 
import Lamaran from "../../../models/lamaranModel.js";
import Lowongan  from "../../../models/lowonganModel.js";
import LowonganJenisSoal from "../../../models/lowonganJenisSoalModel.js";
import JawabanPsikotes from "../../../models/jawabanPsikotesModel.js";

// Membuat jenis soal
// Fungsi untuk membuat jenis soal
export const createJenisSoal = async (req, res) => {
  try {
    // Ambil namaJenis dan deskripsi dari request body
    const { namaJenis, deskripsi } = req.body;
    
    // Ambil userId dari req.user yang sudah di-set di middleware
    const userId = req.user.id;

    // Cek apakah jenis soal dengan nama yang sama sudah ada untuk user ini
    const existingJenisSoal = await JenisSoal.findOne({
      where: { userId, namaJenis },
    });

    if (existingJenisSoal) {
      return res.status(400).json({
        message: `Jenis soal dengan nama '${namaJenis}' sudah ada untuk user ini.`,
      });
    }

    // Membuat jenis soal baru
    const jenisSoal = await JenisSoal.create({
      userId,
      namaJenis,
      deskripsi,
    });

    return res.status(201).json({
      message: 'Jenis soal berhasil dibuat',
      data: jenisSoal,
    });
  } catch (error) {
    console.error('Error creating jenis soal:', error);
    return res.status(500).json({
      message: 'Terjadi kesalahan saat membuat jenis soal',
    });
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


export const getAllJenisSoal = async (req, res) => {
  try {
    const userId = req.user.id; // Pastikan sudah ada middleware untuk set user di req.user

    const jenisSoalList = await JenisSoal.findAll({
      where: { userId },
      attributes: ['id', 'namaJenis', 'deskripsi', 'createdAt'],
      order: [['createdAt', 'DESC']], // Urutkan berdasarkan yang terbaru
    });

    return res.status(200).json({
      message: 'Berhasil mendapatkan semua jenis soal',
      data: jenisSoalList,
    });
  } catch (error) {
    console.error('Error getting jenis soal:', error);
    return res.status(500).json({
      message: 'Terjadi kesalahan saat mengambil data jenis soal',
    });
  }
};

// Fungsi untuk mendapatkan soal berdasarkan jenis soal
export const getSoalByJenisSoal = async (req, res) => {
  try {
    const { jenisSoalId } = req.params; // Mengambil jenisSoalId dari params

    // Cari jenis soal berdasarkan ID
    const jenisSoal = await JenisSoal.findByPk(jenisSoalId);
    if (!jenisSoal) {
      return res.status(404).json({
        message: 'Jenis soal tidak ditemukan.',
      });
    }

    // Ambil soal-soal yang terkait dengan jenis soal ini
    const soalList = await SoalPsikotes.findAll({
      where: { jenisSoalId },
      attributes: ['id', 'pertanyaan', 'options'], // Ambil kolom yang dibutuhkan
    });

    if (soalList.length === 0) {
      return res.status(404).json({
        message: 'Soal untuk jenis soal ini tidak ditemukan.',
      });
    }

    return res.status(200).json({
      message: 'Berhasil mendapatkan soal berdasarkan jenis soal',
      data: soalList.map((soal) => ({
        id: soal.id,
        question: soal.pertanyaan,
        options: JSON.parse(soal.options), // Parse JSON options yang berisi array objek
      })),
    });
  } catch (error) {
    console.error('Error getting soal by jenis soal:', error);
    return res.status(500).json({
      message: 'Terjadi kesalahan saat mengambil soal berdasarkan jenis soal',
    });
  }
};


// Menghapus jenis soal
export const deleteJenisSoal = async (req, res) => {
  try {
    const { jenisSoalId } = req.params; // Ambil jenisSoalId dari params
    const userId = req.user.id; // Ambil userId dari req.user yang sudah di-set di middleware

    // Cek apakah jenis soal ada dan milik user ini
    const jenisSoal = await JenisSoal.findOne({ where: { id: jenisSoalId, userId } });
    if (!jenisSoal) {
      return res.status(404).json({ message: 'Jenis soal tidak ditemukan atau tidak memiliki akses.' });
    }

    // Hapus jenis soal
    await jenisSoal.destroy();

    return res.status(200).json({
      message: 'Jenis soal berhasil dihapus.',
    });
  } catch (error) {
    console.error('Error deleting jenis soal:', error);
    return res.status(500).json({
      message: 'Terjadi kesalahan saat menghapus jenis soal.',
    });
  }
};



