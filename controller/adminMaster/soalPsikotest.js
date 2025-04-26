import { Op } from "sequelize";
import db from "../../config/dataBase.js"
import JenisSoal from "../../models/jenisSoalModel.js"; // Import model JenisSoal dari "../models"; 
import SoalPsikotes from "../../models/soalPsikotestModel.js"; 
import JawabanPsikotes from "../../models/jawabanPsikotesModel.js";
import RiwayatPsikotes from "../../models/riwayatPsikotesModel.js";
import Lamaran from "../../models/lamaranModel.js";
import LowonganJenisSoal from "../../models/lowonganJenisSoalModel.js";
// import Lamaran from "../../../models/lamaranModel.js";
// import Lowongan  from "../../../models/lowonganModel.js";
// import LowonganJenisSoal from "../../../models/lowonganJenisSoalModel.js";
// import JawabanPsikotes from "../../../models/jawabanPsikotesModel.js";

// Membuat jenis soal

//tambhakan dapat menagkap user id

export const createJenisSoalAdminMaster = async (req, res) => {
  const { namaJenis, deskripsi } = req.body;
  const userId = req.user.id; // Tangkap user ID dari request

  try {
    // Validasi input
    if (!namaJenis) {
      return res.status(400).json({ message: 'Nama jenis soal harus diisi.' });
    }

    // Buat jenis soal
    const newJenisSoal = await JenisSoal.create({
      namaJenis,
      deskripsi,
      userId, // Simpan user ID
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
export const createSoalPsikotesAdminMaster = async (req, res) => {
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

// Mendapatkan soal psikotes berdasarkan jenisSoalId
export const getSoalPsikotesByJenisSoalId = async (req, res) => {
    const { jenisSoalId } = req.params; // Ambil jenisSoalId dari params

    try {
        // Cek apakah jenis soal ada
        const jenisSoal = await JenisSoal.findByPk(jenisSoalId);
        if (!jenisSoal) {
            return res.status(404).json({ message: 'Jenis soal tidak ditemukan.' });
        }

        // Ambil semua soal psikotes berdasarkan jenisSoalId
        const soalPsikotes = await SoalPsikotes.findAll({
            where: { jenisSoalId },
        });

        // Transformasi data options ke format yang diinginkan
        const transformedSoalPsikotes = soalPsikotes.map((soal) => {
            // Pastikan options adalah array
            let options = [];
            try {
                // Jika options adalah string JSON, parse menjadi array
                if (typeof soal.options === 'string') {
                    options = JSON.parse(soal.options);
                } else if (Array.isArray(soal.options)) {
                    options = soal.options;
                }
            } catch (error) {
                console.error('Error parsing options:', error);
                options = []; // Default ke array kosong jika parsing gagal
            }

            return {
                id: soal.id,
                pertanyaan: soal.pertanyaan,
                options: options.map((option) => ({
                    answer: option.answer,
                    score: option.score,
                })),
                jenisSoalId: soal.jenisSoalId,
                createdAt: soal.createdAt,
                updatedAt: soal.updatedAt,
            };
        });

        return res.status(200).json({
            message: 'Soal psikotes berhasil diambil.',
            data: transformedSoalPsikotes,
        });
    } catch (error) {
        console.error('Error fetching soal psikotes:', error);
        return res.status(500).json({ message: 'Terjadi kesalahan saat mengambil soal psikotes.' });
    }
};


// Mengambil semua jenis soal untuk user dengan id = 5
export const getJenisSoalByUserId = async (req, res) => {
    const userId = 5; // Set langsung userId ke 5

    try {
        // Cari semua jenis soal berdasarkan userId = 5
        const jenisSoal = await JenisSoal.findAll({
            where: { userId }, // Filter berdasarkan userId = 5
        });

        // Jika tidak ada jenis soal ditemukan
        if (jenisSoal.length === 0) {
            return res.status(404).json({ 
                message: 'Tidak ada jenis soal ditemukan untuk user ini.',
            });
        }

        // Jika berhasil, kembalikan data jenis soal
        return res.status(200).json({
            message: 'Jenis soal berhasil diambil.',
            data: jenisSoal,
        });
    } catch (error) {
        console.error('Error fetching jenis soal:', error);
        return res.status(500).json({ 
            message: 'Terjadi kesalahan saat mengambil jenis soal.',
        });
    }
};

// Fungsi helper untuk mengecek kelengkapan tes
export const submitBulkJawabanPsikotes = async (req, res) => {
    const { jenisSoalId, lamaranId } = req.params;
    const jawaban = req.body;
    const userId = req.user.id;
    const transaction = await db.transaction();

    try {
        // Validasi dasar
        if (!jenisSoalId) {
            await transaction.rollback();
            return res.status(400).json({ 
                message: 'Jenis Soal ID diperlukan.' 
            });
        }

        if (!Array.isArray(jawaban)) {
            await transaction.rollback();
            return res.status(400).json({ 
                message: 'Data jawaban harus berupa array.' 
            });
        }

        // Validasi jenis soal
        const jenisSoal = await JenisSoal.findByPk(jenisSoalId, { transaction });
        if (!jenisSoal) {
            await transaction.rollback();
            return res.status(404).json({
                message: 'Jenis soal tidak ditemukan.'
            });
        }

        // Jika ada lamaranId, validasi kepemilikan lamaran
        let lamaran = null;
        if (lamaranId) {
            lamaran = await Lamaran.findOne({
                where: { id: lamaranId, userId },
                transaction
            });
            
            if (!lamaran) {
                await transaction.rollback();
                return res.status(403).json({
                    message: 'Anda tidak memiliki akses ke lamaran ini.'
                });
            }
        }

        // Hitung total skor
        const totalSkor = jawaban.reduce((sum, item) => sum + (item.skor || 0), 0);

        // Format data jawaban
        const jawabanData = jawaban.map((item) => ({
            userId,
            lamaranId: lamaranId || null, // null jika tidak ada lamaranId
            soalPsikotesId: item.soalPsikotesId,
            jenisSoalId,
            jawaban: item.jawaban || null,
            skor: item.skor || 0,
            createdAt: new Date(),
            updatedAt: new Date()
        }));

        // Simpan jawaban
        await JawabanPsikotes.bulkCreate(jawabanData, {
            updateOnDuplicate: ['jawaban', 'skor', 'updatedAt'],
            transaction
        });

        // Simpan/update riwayat psikotes
        const riwayatData = {
            userId,
            jenisSoalId,
            totalSkor,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        if (lamaranId) {
            riwayatData.lamaranId = lamaranId;
        }

        await RiwayatPsikotes.upsert(riwayatData, {
            conflictFields: lamaranId 
                ? ['userId', 'lamaranId', 'jenisSoalId'] 
                : ['userId', 'jenisSoalId'],
            transaction
        });

        // Jika ada lamaranId, cek kelengkapan tes
        if (lamaranId) {
            const allTestsCompleted = await checkAllTestsCompleted(userId, lamaranId, transaction);

            if (allTestsCompleted) {
                await Lamaran.update({
                    isFinishTest: 1,
                    updatedAt: new Date()
                }, {
                    where: { id: lamaranId },
                    transaction
                });
            }
        }

        await transaction.commit();

        return res.status(201).json({
            message: 'Jawaban psikotes berhasil disimpan.',
            data: {
                jenisSoalId,
                totalSkor,
                ...(lamaranId && { 
                    lamaranId,
                    isAllTestsCompleted: await checkAllTestsCompleted(userId, lamaranId) 
                }),
                jumlahSoal: jawaban.length
            }
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Error submitting bulk jawaban psikotes:', error);
        return res.status(500).json({ 
            message: 'Terjadi kesalahan saat menyimpan jawaban psikotes.',
            ...(process.env.NODE_ENV === 'development' && { 
                error: error.message 
            })
        });
    }
};

// Fungsi helper yang dimodifikasi untuk handle case tanpa lamaranId
const checkAllTestsCompleted = async (userId, lamaranId, transaction) => {
  try {
    const lamaran = await Lamaran.findOne({
      where: { id: lamaranId, userId },
      attributes: ['lowonganId'],
      transaction
    });
    
    if (!lamaran) return false;

    // Dapatkan semua jenis soal yang diperlukan
    const requiredTests = await LowonganJenisSoal.findAll({
      where: { lowonganId: lamaran.lowonganId },
      attributes: ['jenisSoalId'],
      transaction
    });

    if (!requiredTests.length) return false;

    const requiredTestIds = requiredTests.map(item => item.jenisSoalId);

    // Dapatkan semua jenis soal yang sudah dikerjakan untuk lamaran ini
    const completedTests = await RiwayatPsikotes.findAll({
      where: { 
        userId, 
        lamaranId,
        jenisSoalId: requiredTestIds
      },
      attributes: ['jenisSoalId'],
      group: ['jenisSoalId'],
      transaction
    });

    const completedTestIds = completedTests.map(item => item.jenisSoalId);

    return requiredTestIds.every(id => completedTestIds.includes(id));
  } catch (error) {
    console.error("Error checking test completion:", error);
    return false;
  }
};
// Mengambil total skor user dari tabel RiwayatPsikotes untuk jenis soal tertentu (5, 6, dan 7)
export const getTotalSkorUser = async (req, res) => {
    const userId = req.user.id; // Ambil userId dari middleware
    const jenisSoalIds = [5, 6, 7]; // Jenis soal yang ingin diambil total skornya

    try {
        let groupedData = {};
        
        // Ambil data total skor dari tabel RiwayatPsikotes per jenisSoalId dengan limit 5 data terbaru
        for (let jenisSoalId of jenisSoalIds) {
            const totalSkorData = await RiwayatPsikotes.findAll({
                where: { userId, jenisSoalId },
                include: [
                    {
                        model: JenisSoal,
                        attributes: ['id', 'namaJenis',"createdAt"],
                    },
                ],
                order: [['createdAt', 'DESC']], 
                limit: 5 
            });

            // Format hasilnya
            groupedData[jenisSoalId] = totalSkorData.map((riwayat) => ({
                jenisSoalId: riwayat.jenisSoalId,
                namaJenisSoal: riwayat.jenissoal ? riwayat.jenissoal.namaJenis : 'Jenis Soal Tidak Ditemukan',
                totalSkor: riwayat.totalSkor,
                createdAt: riwayat.createdAt,
            }));
        }

        // Response sukses
        return res.status(200).json({
            message: 'Total skor berhasil diambil.',
            data: groupedData,
        });
    } catch (error) {
        console.error('Error fetching total skor:', error);
        return res.status(500).json({ 
            message: 'Terjadi kesalahan saat mengambil total skor.' 
        });
    }
};
