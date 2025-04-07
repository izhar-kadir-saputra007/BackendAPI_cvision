import Lowongan from "../../../models/lowonganModel.js";
import PTModel from "../../../models/PTModel.js";
import JenisSoal from "../../../models/jenisSoalModel.js";
import LowonganJenisSoal from "../../../models/lowonganJenisSoalModel.js";
import Lamaran from "../../../models/lamaranModel.js";
import UserModel from "../../../models/userModel.js";

export const createLowongan = async (req, res) => {
    const { judul, deskripsi, tanggalTutup } = req.body;
    const { ptId } = req.user; // Ambil ptId dari user yang login (Admin PT)
  
    try {
      // Validasi input
      if (!judul || !deskripsi || !tanggalTutup) {
        return res.status(400).json({ message: 'Judul, deskripsi, dan tanggal tutup harus diisi.' });
      }
  
      // Cek apakah PT ada
      const pt = await PTModel.findByPk(ptId);
      if (!pt) {
        return res.status(404).json({ message: 'PT tidak ditemukan.' });
      }
  
      // Buat lowongan
      const newLowongan = await Lowongan.create({
        judul,
        deskripsi,
        tanggalTutup,
        ptId,
      });
  
      return res.status(201).json({
        message: 'Lowongan berhasil dibuat.',
        data: newLowongan,
      });
    } catch (error) {
      console.error('Error creating lowongan:', error);
      return res.status(500).json({ message: 'Terjadi kesalahan saat membuat lowongan.' });
    }
  };


  // Menambahkan jenis soal ke lowongan
export const addJenisSoalToLowongan = async (req, res) => {
    const { lowonganId } = req.params; // Ambil lowonganId dari params
    const { jenisSoalIds } = req.body; // Ambil array jenisSoalIds dari body
  
    try {
      // Validasi input
      if (!jenisSoalIds || !Array.isArray(jenisSoalIds)) {
        return res.status(400).json({ message: 'Jenis soal harus berupa array.' });
      }
  
      // Cek apakah lowongan ada
      const lowongan = await Lowongan.findByPk(lowonganId);
      if (!lowongan) {
        return res.status(404).json({ message: 'Lowongan tidak ditemukan.' });
      }
  
      // Cek apakah semua jenis soal ada
      const jenisSoalList = await JenisSoal.findAll({
        where: { id: jenisSoalIds },
      });
  
      if (jenisSoalList.length !== jenisSoalIds.length) {
        return res.status(404).json({ message: 'Salah satu atau lebih jenis soal tidak ditemukan.' });
      }
  
      // Tambahkan jenis soal ke lowongan
      await lowongan.addJenisSoal(jenisSoalIds);
  
      return res.status(201).json({
        message: 'Jenis soal berhasil ditambahkan ke lowongan.',
      });
    } catch (error) {
      console.error('Error adding jenis soal to lowongan:', error);
      return res.status(500).json({ message: 'Terjadi kesalahan saat menambahkan jenis soal ke lowongan.' });
    }
  };


  // Get data lowongan untuk Admin PT
export const getLowonganForAdminPT = async (req, res) => {
    const { ptId } = req.user; // Ambil ptId dari user yang login (Admin PT)
  
    try {
      // Cari semua lowongan yang terkait dengan PT tersebut
      const lowonganList = await Lowongan.findAll({
        where: { ptId },
        include: [
          {
            model: PTModel,
            attributes: ['namaPT', 'alamat'], // Sertakan informasi PT
          },
        ],
      });
  
      return res.status(200).json({
        message: 'Data lowongan berhasil diambil.',
        data: lowonganList,
      });
    } catch (error) {
      console.error('Error fetching lowongan for Admin PT:', error);
      return res.status(500).json({ message: 'Terjadi kesalahan saat mengambil data lowongan.' });
    }
  };

  // Get semua data lowongan untuk calon karyawan
export const getAllLowongan = async (req, res) => {
    try {
      // Cari semua lowongan yang tersedia
      const lowonganList = await Lowongan.findAll({
        include: [
          {
            model: PTModel,
            attributes: ['namaPT', 'alamat'], // Sertakan informasi PT
          },
        ],
      });
  
      return res.status(200).json({
        message: 'Data lowongan berhasil diambil.',
        data: lowonganList,
      });
    } catch (error) {
      console.error('Error fetching all lowongan:', error);
      return res.status(500).json({ message: 'Terjadi kesalahan saat mengambil data lowongan.' });
    }
  };


  export const getPelamarByPT = async (req, res) => {
    const { ptId } = req.user; // Ambil ptId dari user yang login (Admin PT)
  
    try {
      // Cari semua lowongan yang terkait dengan PT tersebut
      const lowonganList = await Lowongan.findAll({
        where: { ptId },
        attributes: ["id"], // Ambil hanya id lowongan
      });
  
      // Ekstrak id lowongan
      const lowonganIds = lowonganList.map((lowongan) => lowongan.id);
  
      // Cari semua lamaran yang terkait dengan lowongan tersebut
      const pelamarList = await Lamaran.findAll({
        where: { lowonganId: lowonganIds },
        attributes: ["status"], // Ambil hanya id lamaran
        include: [
          {
            model: UserModel, // Sertakan data user (calon karyawan)
            attributes: ["id", "name", "email"], // Ambil data yang diperlukan
          },
          {
            model: Lowongan, // Sertakan data lowongan
            attributes: ["judul"], // Ambil judul lowongan
            include: [
              {
                model: PTModel, // Sertakan data PT
                attributes: ["namaPT"], // Ambil nama PT
              },
            ],
          },
        ],
      });
  
      return res.status(200).json({
        message: "Data pelamar berhasil diambil.",
        data: pelamarList,
      });
    } catch (error) {
      console.error("Error fetching pelamar data:", error);
      return res.status(500).json({ message: "Terjadi kesalahan saat mengambil data pelamar." });
    }
  };


//get data user berdasarkan lowongan
export const getUsersByLowongan = async (req, res) => {
  const { lowonganId } = req.params; // Ambil lowonganId dari params

  try {
    // Cari semua lamaran yang terkait dengan lowongan tersebut
    const pelamarList = await Lamaran.findAll({
      where: { lowonganId },
      include: [
        {
          model: UserModel, // Sertakan data user (calon karyawan)
          attributes: ["id", "name", "email"], // Ambil data yang diperlukan
        },
        {
          model: Lowongan, // Sertakan data lowongan
          attributes: ["judul"], // Ambil judul lowongan
          include: [
            {
              model: PTModel, // Sertakan data PT
              attributes: ["namaPT"], // Ambil nama PT
            },
          ],
        },
      ],
    });

    return res.status(200).json({
      message: "Data user berdasarkan lowongan berhasil diambil.",
      data: pelamarList,
    });
  } catch (error) {
    console.error("Error fetching users by lowongan:", error);
    return res.status(500).json({ message: "Terjadi kesalahan saat mengambil data user." });
  }
};