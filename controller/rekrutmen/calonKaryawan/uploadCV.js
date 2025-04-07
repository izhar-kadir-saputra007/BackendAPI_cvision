import Resume from "../../../models/Resume.js";
import Lamaran from "../../../models/lamaranModel.js";

export const uploadCV = async (req, res) => {
    const { lamaranId } = req.params; // Ambil lamaranId dari params
    const userId = req.user.id; // Ambil userId dari req.user (calon karyawan)
    const filePath = req.file.path; // Path file CV yang diunggah
    const fileName = req.file.originalname; // Nama file CV
  
    try {
      // Cek apakah lamaran dengan ID ini ada dan milik user yang sesuai
      const lamaran = await Lamaran.findOne({
        where: { id: lamaranId, userId },
      });
  
      if (!lamaran) {
        return res.status(403).json({ message: 'Lamaran tidak ditemukan atau tidak sesuai.' });
      }
  
      // Buat entri baru di tabel Resume
      const newResume = await Resume.create({
        file_path: filePath,
        file_name: fileName,
        predicted_category: "Default Category", // Ganti dengan prediksi yang sesuai
        probability: 0.0, // Ganti dengan probabilitas yang sesuai
        userId,
      });
  
      // Update kolom resumeId di tabel Lamaran
      await Lamaran.update(
        { resumeId: newResume.id },
        { where: { id: lamaranId } }
      );
  
      return res.status(201).json({
        message: 'CV berhasil diunggah.',
        data: newResume,
      });
    } catch (error) {
      console.error('Error uploading CV:', error);
      return res.status(500).json({ message: 'Terjadi kesalahan saat mengunggah CV.' });
    }
  };
