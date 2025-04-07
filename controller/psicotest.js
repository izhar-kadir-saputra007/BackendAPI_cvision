
import questions from '../utils/soal.js';
import HasilPsikotes from '../models/hasilPsikotes.js'; 

// Endpoint untuk mengirim jawaban psikotes dan menghitung skor
export const totalScore = async (req, res) => {
    const { answers } = req.body; // Ambil jawaban user dari body request
    let totalScore = 0;

    try {
        // Validasi jumlah jawaban
        if (answers.length !== questions.length) {
            return res.status(400).json({ error: "Jumlah jawaban tidak sesuai dengan jumlah soal" });
        }

        // Hitung skor berdasarkan jawaban user
        answers.forEach((userAnswer, index) => {
            const question = questions[index];
            const selectedOption = question.options.find(option => option.answer === userAnswer);

            if (selectedOption) {
                totalScore += selectedOption.score; // Tambah skor berdasarkan jawaban
            }
        });

        // Simpan hasil ke database
        const userId = req.user.id; // Mendapatkan ID user yang terautentikasi
        const hasil = await HasilPsikotes.create({ 
            userId,
            totalScore,
            date: new Date(),
        });

        res.status(200).json({ message: "Jawaban berhasil disimpan", totalScore });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Terjadi kesalahan saat menyimpan jawaban" });
    }
};
