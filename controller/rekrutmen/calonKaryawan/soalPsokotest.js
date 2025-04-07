import JenisSoal from "../../../models/jenisSoalModel.js"; // Import model JenisSoal dari "../models"; 
import SoalPsikotes from "../../../models/soalPsikotestModel.js"; 
import Lamaran from "../../../models/lamaranModel.js";
import Lowongan  from "../../../models/lowonganModel.js";
import LowonganJenisSoal from "../../../models/lowonganJenisSoalModel.js";
import JawabanPsikotes from "../../../models/jawabanPsikotesModel.js";

export const getSoalPsikotesForCalonKaryawan = async (req, res) => {
    const { lowonganId } = req.params; // Ambil lowonganId dari params
    const userId = req.user.id; // Ambil userId dari req.user (calon karyawan)
  
    try {
      // Cek apakah calon karyawan sudah melamar ke lowongan ini
      const lamaran = await Lamaran.findOne({
        where: { userId, lowonganId },
      });
  
      if (!lamaran) {
        return res.status(403).json({ message: 'Anda belum melamar ke lowongan ini.' });
      }
  
      // Cari semua jenis soal yang terkait dengan lowongan ini
      const jenisSoalList = await LowonganJenisSoal.findAll({
        where: { lowonganId },
        include: [
          {
            model: JenisSoal,
            include: [
              {
                model: SoalPsikotes, // Ambil soal psikotes berdasarkan jenis soal
              },
            ],
          },
        ],
      });
  
          // Format data yang dikembalikan
          const soalPsikotesList = jenisSoalList
          .map((item) =>
            item.JenisSoal.soalPsikotes.map((soal) => ({
              id: soal.id,
              pertanyaan: soal.pertanyaan,
              options: JSON.parse(soal.options), 
              jenisSoalId: soal.jenisSoalId,
            }))
          )
          .flat(); 
  
      return res.status(200).json({
        message: 'Soal psikotes berhasil diambil.',
        data: soalPsikotesList,
      });
    } catch (error) {
      console.error('Error fetching soal psikotes:', error);
      return res.status(500).json({ message: 'Terjadi kesalahan saat mengambil soal psikotes.' });
    }
  };


  
//submit jawaban psikotes
export const submitJawabanPsikotes = async (req, res) => {
    const { lowonganId } = req.params; // Ambil lowonganId dari params
    const userId = req.user.id; // Ambil userId dari req.user (calon karyawan)
    const { jawabanList } = req.body; // Ambil array jawaban dari body
  
    try {
      // Validasi input
      if (!jawabanList || !Array.isArray(jawabanList)) {
        return res.status(400).json({ message: 'Data jawaban harus berupa array.' });
      }
  
      // Cek apakah calon karyawan sudah melamar ke lowongan ini
      const lamaran = await Lamaran.findOne({
        where: { userId, lowonganId },
      });
  
      if (!lamaran) {
        return res.status(403).json({ message: 'Anda belum melamar ke lowongan ini.' });
      }
  
      // Simpan jawaban psikotes
      const createdJawaban = await JawabanPsikotes.bulkCreate(
        jawabanList.map((jawaban) => ({
          userId,
          soalPsikotesId: jawaban.soalPsikotesId,
          jawaban: jawaban.jawaban,
          skor: jawaban.skor,
        }))
      );
  
      // Hitung total skor
      const totalSkor = jawabanList.reduce((total, jawaban) => total + jawaban.skor, 0);
  
      // Update total skor di tabel Lamaran
      await Lamaran.update(
        { totalSkor },
        { where: { userId, lowonganId } }
      );
  
      return res.status(201).json({
        message: 'Jawaban psikotes berhasil disimpan.',
        data: {
          jawaban: createdJawaban,
          totalSkor,
        },
      });
    } catch (error) {
      console.error('Error submitting jawaban psikotes:', error);
      return res.status(500).json({ message: 'Terjadi kesalahan saat menyimpan jawaban psikotes.' });
    }
  };