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

    const transaction = await sequelize.transaction();

    try {
      // Update tabel User
      await UserModel.update(
        {
          name,
          phoneNumber
        },
        {
          where: { id: userId },
          transaction
        }
      );

      // Update tabel CalonKaryawan
      const calon = await calonKaryawan.findOne({ where: { userId }, transaction });

      if (calon) {
        // Jika calon karyawan sudah ada, update
        await calonKaryawan.update(
          {
            namaLengkap: name,
            alamat,
            tanggalLahir,
            jenisKelamin,
            pendidikanTerakhir,
            jurusan
          },
          {
            where: { userId },
            transaction
          }
        );
      } else {
        // Jika belum ada, create baru
        await calonKaryawan.create(
          {
            userId,
            namaLengkap: name,
            alamat,
            tanggalLahir,
            jenisKelamin,
            pendidikanTerakhir,
            jurusan
          },
          { transaction }
        );
      }

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
