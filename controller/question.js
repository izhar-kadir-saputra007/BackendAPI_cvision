import questions from '../utils/soal.js';

 const getQuestions = async (req, res) => {
    try {
        // Mengirimkan soal psikotes ke user
        return res.status(200).json({ success: true, data: questions });
    } catch (error) {
        console.error('Error while fetching questions:', error);
        return res.status(500).json({ success: false, error: "Gagal memuat soal psikotes." });
    }
};

export default getQuestions;