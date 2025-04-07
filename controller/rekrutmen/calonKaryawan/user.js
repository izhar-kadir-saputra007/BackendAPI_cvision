import  UserModel  from "../../../models/userModel.js";
import calonKaryawan from "../../../models/calonKaryawanModel.js";
import sequelize from "../../../config/dataBase.js";

export const getUserProfile = async (req, res) => {
    try {
        // ID user diambil dari middleware (biasanya dari req.user)
        const userId = req.user.id;

        // Cari user beserta data calon karyawan yang terkait
        const user = await UserModel.findOne({
            where: { id: userId },
            include: [{
                model: calonKaryawan,
                attributes: { exclude: ['createdAt', 'updatedAt'] } // Opsional: exclude timestamps
            }],
            attributes: { exclude: ['password', 'refresh_token', 'verificationToken'] } 
        });

        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User tidak ditemukan' 
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Data user berhasil ditemukan',
            data: user
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ 
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message 
        });
    }
};

export const editProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            name,
            phoneNumber,
            alamat,
            tanggalLahir,
            jenisKelamin,
            pendidikanTerakhir,
            jurusan
        } = req.body;

        // Mulai transaction untuk memastikan konsistensi data
        const transaction = await sequelize.transaction();

        try {
            // Update data user
            const updatedUser = await UserModel.update(
                {
                    name,
                    phoneNumber
                },
                {
                    where: { id: userId },
                    transaction
                }
            );

            // Update data calon karyawan
            const updatedCalonKaryawan = await calonKaryawan.update(
                {
                    namaLengkap: name, // Sinkronkan nama dengan user
                    alamat,
                    tanggalLahir,
                    jenisKelamin,
                    pendidikanTerakhir,
                    jurusan
                },
                {
                    where: { userId: userId },
                    transaction
                }
            );

            // Commit transaction jika semua operasi berhasil
            await transaction.commit();

            // Ambil data terbaru untuk response
            const userData = await UserModel.findOne({
                where: { id: userId },
                include: [{
                    model: calonKaryawan,
                    attributes: { exclude: ['createdAt', 'updatedAt'] }
                }],
                attributes: { exclude: ['password', 'refresh_token', 'verificationToken'] }
            });

            return res.status(200).json({
                success: true,
                message: 'Profil berhasil diperbarui',
                data: userData
            });

        } catch (error) {
            // Rollback transaction jika terjadi error
            await transaction.rollback();
            throw error;
        }

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Gagal memperbarui profil',
            error: error.message
        });
    }
};