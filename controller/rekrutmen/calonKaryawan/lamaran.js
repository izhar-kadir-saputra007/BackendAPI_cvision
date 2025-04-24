import Lamaran from "../../../models/lamaranModel.js";
import Lowongan from "../../../models/lowonganModel.js"    
import UserModel from "../../../models/userModel.js";
import PTModel from "../../../models/PTModel.js";
import LowonganJenisSoal from "../../../models/lowonganJenisSoalModel.js";
import JenisSoal from "../../../models/jenisSoalModel.js";

// Melamar ke lowongan
export const applyToLowongan = async (req, res) => {
    const { lowonganId } = req.params; // Ambil lowonganId dari params
    const userId = req.user.id; // Ambil userId dari req.user (objek user langsung dari database)
  
    try {
      // Validasi input
      if (!lowonganId) {
        return res.status(400).json({ message: 'Lowongan ID harus diisi.' });
      }
  
      // Cek apakah lowongan ada
      const lowongan = await Lowongan.findByPk(lowonganId);
      if (!lowongan) {
        return res.status(404).json({ message: 'Lowongan tidak ditemukan.' });
      }
  
      // Cek apakah user sudah melamar ke lowongan ini sebelumnya
      const existingLamaran = await Lamaran.findOne({
        where: { userId, lowonganId },
      });
      if (existingLamaran) {
        return res.status(400).json({ message: 'Anda sudah melamar ke lowongan ini.' });
      }
  
      // Buat lamaran baru
      const newLamaran = await Lamaran.create({
        userId,
        lowonganId,
        status: 'menunggu', // Default status
      });
  
      return res.status(201).json({
        message: 'Lamaran berhasil dikirim.',
        data: newLamaran,
      });
    } catch (error) {
      console.error('Error applying to lowongan:', error);
      return res.status(500).json({ message: 'Terjadi kesalahan saat mengirim lamaran.' });
    }
  };
  
  // Get semua lamaran untuk calon karyawan
  export const getLamaranForUser = async (req, res) => {
    const userId = req.user.id; // Ambil userId dari user yang login (calon karyawan)
  
    try {
      // Cari semua lamaran yang dibuat oleh user tersebut
      const lamaranList = await Lamaran.findAll({
        where: { userId },
        include: [
          {
            model: Lowongan,
            attributes: ['judul', 'deskripsi', 'tanggalBuka', 'tanggalTutup'],
            include: [
              {
                model: PTModel,
                attributes: ['namaPT', 'alamat'],
              },
            ],
          },
        ],
      });
  
      return res.status(200).json({
        message: 'Data lamaran berhasil diambil.',
        data: lamaranList,
      });
    } catch (error) {
      console.error('Error fetching lamaran for user:', error);
      return res.status(500).json({ message: 'Terjadi kesalahan saat mengambil data lamaran.' });
    }
  };


// API untuk mendapatkan jenis soal dari lamaranId
export const getJenisSoalByLamaranId = async (req, res) => {
  const { lamaranId } = req.params;

  try {
    // 1. Cek apakah lamaran ada
    const lamaran = await Lamaran.findByPk(lamaranId);
    if (!lamaran) {
      return res.status(404).json({ message: "Lamaran tidak ditemukan." });
    }

    // 2. Ambil data lowongan_jenis_soal beserta jenis_soal
    const lowonganJenisSoals = await LowonganJenisSoal.findAll({
      where: { lowonganId: lamaran.lowonganId },
      include: [{
        model: JenisSoal,
        attributes: ['id', 'namaJenis'],
        required: true
      }]
    });

    // 3. Format data response - menggunakan lowercase 'jenissoal'
    const data = lowonganJenisSoals.map(item => {
      // Akses relasi melalui properti lowercase
      const jenisSoal = item.jenissoal;
      
      return {
        id: jenisSoal.id,
        namaJenis: jenisSoal.namaJenis
      };
    });

    if (data.length === 0) {
      return res.status(404).json({ 
        message: "Tidak ada jenis soal yang ditemukan untuk lowongan ini." 
      });
    }

    return res.status(200).json({
      message: "Data jenis soal berhasil diambil.",
      data: data
    });

  } catch (error) {
    console.error("Error fetching jenis soal:", error);
    return res.status(500).json({ 
      message: "Terjadi kesalahan saat mengambil data jenis soal.",
      error: error.message
    });
  }
};