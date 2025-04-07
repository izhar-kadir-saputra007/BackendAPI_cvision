import Users from "../models/userModel.js";
import Resume from "../models/Resume.js";
import HasilPsicotest from "../models/hasilPsikotes.js";

export const sendPassedUsers = async (req, res) => {
  try {
    const { users, minScore, minProbability } = req.body; // Ambil data users yang dikirim

    // Verifikasi apakah data users ada
    if (!users || users.length === 0) {
      return res.status(400).json({ message: "No users data provided." });
    }

    // Proses data untuk menyimpan ke dalam database atau mengubah status
    for (const user of users) {
      const { id, hasilPsikotests, probability } = user;

      // Ambil data hasil psikotes
      const psikotes = await HasilPsicotest.findOne({ where: { userId: id } });

      // Ambil data resume
      const resume = await Resume.findOne({ where: { userId: id } });

      // Pastikan data psikotes dan resume ada
      if (!psikotes || !resume) continue;

      // Memeriksa kriteria kelulusan
      if (resume.probability >= minProbability && psikotes.totalScore >= minScore) {
        // Mengubah status user menjadi 'Passed' jika memenuhi kriteria
        await Users.update(
          { status: 'Passed' }, // Mengubah status menjadi Passed
          { where: { id } }      // Berdasarkan ID pengguna
        );
      }
    }

    res.status(200).json({ message: "Passed users data processed successfully." });
  } catch (error) {
    console.error("Error processing passed users:", error);
    res.status(500).json({ message: "An error occurred while processing passed users." });
  }
};


// Fungsi untuk mendapatkan pengguna dengan status "Passed"
export const getUsersWithPassedStatus = async (req, res) => {
  try {
    // Mengambil data user dengan status "Passed"
    const users = await Users.findAll({
      where: {
        status: 'Passed',
      },
    });

    // Mengecek jika tidak ada pengguna dengan status Passed
    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users with 'Passed' status found." });
    }

    // Mengirimkan response dengan data pengguna
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching passed users:", error);
    res.status(500).json({ message: "An error occurred while fetching passed users." });
  }
};