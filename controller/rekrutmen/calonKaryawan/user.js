import path from 'path';
import fs from 'fs';
import  UserModel  from "../../../models/userModel.js";
import calonKaryawan from "../../../models/calonKaryawanModel.js";
import sequelize from "../../../config/dataBase.js";


export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Cari user beserta data calon karyawan
    const user = await UserModel.findOne({
      where: { id: userId },
      include: [
        {
          model: calonKaryawan,
          attributes: {
            exclude: ["createdAt", "updatedAt"],
          },
        },
      ],
      attributes: {
        exclude: [
          "password",
          "refresh_token",
          "verificationToken",
          "resetToken",
          "resetTokenExpiry",
        ],
      },
    });

    // Jika user tidak ditemukan
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    // Format data foto profil jika ada
    const fotoProfil = user.calonkaryawan?.fotoProfil
    ? {
        url: `${req.protocol}://${req.get('host')}/${user.calonkaryawan.fotoProfil.replace(/\\/g, '/')}`,
        originalName: user.calonkaryawan.fotoOriginalName,
        mimeType: user.calonkaryawan.fotoMimeType,
        size: user.calonkaryawan.fotoSize
      }
    : null;

    // Response data user + calon karyawan
    const responseData = {
      ...user.toJSON(),
      fotoProfil,
    };

    return res.status(200).json({
      success: true,
      message: "Data user berhasil ditemukan",
      data: responseData,
    });
  } catch (error) {
    console.error("Error in getUserProfile:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
      error: error.message,
    });
  }
};

// controllers/profileController.js
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
              { name, phoneNumber },
              { where: { id: userId }, transaction }
          );

          // Cari atau buat data calon karyawan
          const [calon] = await calonKaryawan.findOrCreate({
              where: { userId },
              defaults: {
                  userId,
                  namaLengkap: name,
                  alamat,
                  tanggalLahir,
                  jenisKelamin,
                  pendidikanTerakhir,
                  jurusan
              },
              transaction
          });

          // Update data calon karyawan jika sudah ada
          if (calon) {
              const updateData = {
                  namaLengkap: name,
                  alamat,
                  tanggalLahir,
                  jenisKelamin,
                  pendidikanTerakhir,
                  jurusan
              };

              // Handle upload foto jika ada
              if (req.file) {
                  // Hapus foto profil lama jika ada
                  if (calon.fotoProfil) {
                      const oldFilePath = path.join(__dirname, '../', calon.fotoProfil);
                      if (fs.existsSync(oldFilePath)) {
                          fs.unlinkSync(oldFilePath);
                      }
                  }

                  const relativePath = path.relative(path.join(__dirname, '../'), req.file.path);
                  
                  updateData.fotoProfil = relativePath;
                  updateData.fotoOriginalName = req.file.originalname;
                  updateData.fotoMimeType = req.file.mimetype;
                  updateData.fotoSize = req.file.size;
              }

              await calonKaryawan.update(
                  updateData,
                  { where: { userId }, transaction }
              );
          }

          await transaction.commit();

          // Ambil data terbaru untuk response
          const userData = await UserModel.findOne({
              where: { id: userId },
              include: [{
                  model: calonKaryawan,
                  attributes: { 
                      exclude: ['createdAt', 'updatedAt'],
                      include: [
                          ['fotoProfil', 'fotoUrl'],
                          ['fotoOriginalName', 'fotoOriginalName'],
                          ['fotoMimeType', 'fotoMimeType'],
                          ['fotoSize', 'fotoSize']
                      ]
                  }
              }],
              attributes: { exclude: ['password', 'refresh_token', 'verificationToken'] }
          });

          // Transform response
          const responseData = {
              ...userData.toJSON(),
              fotoProfil: userData.calonKaryawan?.fotoUrl 
                  ? {
                      url: `${req.protocol}://${req.get('host')}/${userData.calonKaryawan.fotoUrl}`,
                      originalName: userData.calonKaryawan.fotoOriginalName,
                      mimeType: userData.calonKaryawan.fotoMimeType,
                      size: userData.calonKaryawan.fotoSize
                  }
                  : null
          };

          return res.status(200).json({
              success: true,
              message: 'Profil berhasil diperbarui',
              data: responseData
          });

      } catch (error) {
          await transaction.rollback();
          
          // Hapus file yang sudah terupload jika terjadi error
          if (req.file && fs.existsSync(req.file.path)) {
              fs.unlinkSync(req.file.path);
          }
          
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

// Tambahkan fungsi untuk upload foto profil
export const uploadFotoProfil = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Validasi file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada file yang diupload'
      });
    }

    const transaction = await sequelize.transaction();

    try {
      // Cari data calon karyawan
      const calon = await calonKaryawan.findOne({ 
        where: { userId }, 
        transaction 
      });

      if (!calon) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Data calon karyawan tidak ditemukan'
        });
      }

      // Hapus foto profil lama jika ada
      if (calon.fotoProfil) {
        const oldFilePath = path.join(process.cwd(), calon.fotoProfil);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      // Simpan foto baru
      const filePath = req.file.path;
      const relativePath = path.relative(process.cwd(), filePath);
      
      await calonKaryawan.update({
        fotoProfil: relativePath,
        fotoOriginalName: req.file.originalname,
        fotoMimeType: req.file.mimetype,
        fotoSize: req.file.size
      }, { 
        where: { userId },
        transaction 
      });

      await transaction.commit();

      return res.status(200).json({
        success: true,
        message: 'Foto profil berhasil diupload',
        data: {
          url: `${req.protocol}://${req.get('host')}/uploads/fotoProfil/${path.basename(filePath)}`,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size
        }
      });

    } catch (error) {
      await transaction.rollback();
      
      // Hapus file yang sudah terupload jika terjadi error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      throw error;
    }

  } catch (error) {
    console.error('Error uploading profile photo:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengupload foto profil',
      error: error.message
    });
  }
};