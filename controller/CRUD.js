import Users from "../models/userModel.js";
import Resume from "../models/Resume.js";
import HasilPsicotest from "../models/hasilPsikotes.js";
import bcrypt from "bcrypt";

// 1. Mengambil semua data pengguna beserta resume dan hasil psikotest mereka
export const getAllUsers = async (req, res) => {
    try {
        const users = await Users.findAll({
            include: [
                { model: Resume, as: 'resumes' },
                { model: HasilPsicotest, as: 'hasilPsikotests' }
            ]
        });
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Terjadi kesalahan saat mengambil data pengguna" });
    }
};

// 2. Mengambil data pengguna berdasarkan ID
export const getUserById = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await Users.findOne({
            where: { id: userId },
            include: [
                { model: Resume, as: 'resumes' },
                { model: HasilPsicotest, as: 'hasilPsikotests' }
            ]
        });
        if (!user) return res.status(404).json({ msg: "User tidak ditemukan" });
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Terjadi kesalahan saat mengambil data pengguna" });
    }
};

// 3. Membuat pengguna baru
export const createUser = async (req, res) => {
    const { name, phoneNumber, email, password, confPassword, role } = req.body;

    // Validasi password dan konfirmasi password
    if (password !== confPassword) {
        return res.status(400).json({ msg: "Password dan konfirmasi password tidak cocok" });
    }

    const salt = await bcrypt.genSalt();
    const hashPassword = await bcrypt.hash(password, salt);

    try {
        // Role diterima dari frontend, jika tidak ada, set default 'user'
        const userRole = role || 'user';

        await Users.create({
            name,
            phoneNumber,
            email,
            password: hashPassword,
            role: userRole // Menyimpan role yang diterima
        });
        res.json({ msg: "Pengguna berhasil dibuat" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Terjadi kesalahan saat membuat pengguna" });
    }
};

// Fungsi update user
export const updateUser = async (req, res) => {
    const { id } = req.params;
    const { name, email, phoneNumber, password, role } = req.body;

    try {
        // Dapatkan user berdasarkan ID
        const user = await Users.findByPk(id);
        if (!user) {
            return res.status(404).json({ msg: "Pengguna tidak ditemukan" });
        }

        // Update user dengan data baru
        user.name = name || user.name;
        user.email = email || user.email;
        user.phoneNumber = phoneNumber || user.phoneNumber;
        if (password) {
            const salt = await bcrypt.genSalt();
            user.password = await bcrypt.hash(password, salt);
        }
        user.role = role || user.role; // Update role

        await user.save();
        res.json({ msg: "Pengguna berhasil diperbarui" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Terjadi kesalahan saat memperbarui pengguna" });
    }
};

// 5. Menghapus pengguna berdasarkan ID
export const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await Users.findByPk(userId);
        if (!user) return res.status(404).json({ msg: "User tidak ditemukan" });

        await user.destroy();
        res.json({ msg: "Pengguna berhasil dihapus" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Terjadi kesalahan saat menghapus pengguna" });
    }
};
