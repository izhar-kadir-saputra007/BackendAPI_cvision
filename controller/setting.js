import Setting from '../models/settingModels.js'; // Mengimpor model dengan nama Setting

// Endpoint untuk mendapatkan durasi timer
export const getTimerDuration = async (req, res) => {
    try {
        const settingData = await Setting.findOne(); // Menggunakan settingData agar tidak bentrok dengan model Setting
        if (!settingData) {
            return res.status(404).json({ error: "Setting tidak ditemukan" }); // Menangani jika data tidak ditemukan
        }
        res.json({ timerDuration: settingData.timerDuration }); // Mengirimkan durasi timer
    } catch (error) {
        console.error(error);  // Log error untuk informasi lebih lanjut
        res.status(500).json({ error: "Failed to get timer duration" });
    }
};

// Endpoint untuk mengatur durasi timer
export const setTimerDuration = async (req, res) => {
    try {
        let { timerDuration } = req.body;
        
        // Pastikan timerDuration adalah angka
        timerDuration = Number(timerDuration); // Mengonversi ke angka

        if (isNaN(timerDuration) || timerDuration <= 0) {
            return res.status(400).json({ error: "Durasi timer tidak valid" }); // Validasi input
        }
        
        await Setting.update({ timerDuration }, { where: { id: 1 } });
        res.json({ message: "Timer duration updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update timer duration" });
    }
};

