import UserModel from "../../../models/userModel.js";
import PTModel from "../../../models/PTModel.js";
import {sendVerificationEmail } from "../../../utils/mailer.js";

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';


// Register Admin PT (Mitra)
export const registerAdminPT = async (req, res) => {
  const { name, email, password, confPassword, phoneNumber, namaPT, alamatPT } = req.body;

  try {
      // Validasi input
      if (!name || !email || !password || !confPassword || !namaPT || !alamatPT) {
          return res.status(400).json({ message: 'Semua field harus diisi.' });
      }

      // Validasi password dan confPassword
      if (password !== confPassword) {
          return res.status(400).json({ message: 'Password dan Confirm Password tidak cocok.' });
      }

      // Cek apakah email sudah digunakan
      const existingUser = await UserModel.findOne({ where: { email } });
      if (existingUser) {
          return res.status(400).json({ message: 'Email sudah digunakan.' });
      }

      // Cek apakah nama PT sudah digunakan
      const existingPT = await PTModel.findOne({ where: { namaPT } });
      if (existingPT) {
          return res.status(400).json({ message: 'Nama PT sudah digunakan.' });
      }

      // Hash password
      const salt = await bcrypt.genSalt();
      const hashPassword = await bcrypt.hash(password, salt);

      // Buat PT baru
      const newPT = await PTModel.create({
          namaPT,
          alamat: alamatPT,
      });

      // Generate token verifikasi
      const verificationToken = uuidv4();

      // Buat Admin PT
      const newAdminPT = await UserModel.create({
          name,
          email,
          password: hashPassword, // Simpan password yang sudah di-hash
          phoneNumber,
          role: 'adminPT', // Role untuk Admin PT
          ptId: newPT.id, // Tautkan Admin PT ke PT yang baru dibuat
          verificationToken, // Simpan token verifikasi
          isVerified: false, // Status verifikasi awal
      });

      // Kirim email verifikasi
      await sendVerificationEmail(email, verificationToken, name);

      return res.status(201).json({
          message: 'Registrasi Admin PT (Mitra) berhasil. Silakan cek email untuk verifikasi.',
          data: {
              user: newAdminPT,
              pt: newPT,
          },
      });
  } catch (error) {
      console.error('Error registering Admin PT:', error);
      return res.status(500).json({ message: 'Terjadi kesalahan saat registrasi.' });
  }
};

  // Login
export const loginAdminPT = async (req, res) => {
    const { email, password } = req.body;
  
    try {
      // Validasi input
      if (!email || !password) {
        return res.status(400).json({ message: 'Email dan password harus diisi.' });
      }
  
      // Cek apakah email terdaftar
      const user = await UserModel.findOne({ where: { email } });
      if (!user) {
        return res.status(404).json({ message: 'Email tidak terdaftar.' });
      }
  
      // Cek apakah password cocok
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: 'Password salah.' });
      }
  
      // Data yang akan disimpan di token
      const userId = user.id;
      const name = user.name;
      const emailUser = user.email;
  
      // Membuat access token
      const accessToken = jwt.sign({ userId, name, email: emailUser }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1h', // Access token berlaku 1 jam
      });
  
      // Membuat refresh token
      const refreshToken = jwt.sign({ userId, name, email: emailUser }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: '1d', // Refresh token berlaku 1 hari
      });
  
      // Simpan refresh token ke database
      await UserModel.update({ refresh_token: refreshToken }, { where: { id: userId } });
  
      // Kirim response
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true, // Hanya bisa diakses melalui HTTP (tidak melalui JavaScript)
        maxAge: 24 * 60 * 60 * 1000, // Cookie berlaku 1 hari
      });
  
      return res.status(200).json({
        message: 'Login berhasil.',
        accessToken,
      });
    } catch (error) {
      console.error('Error during login:', error);
      return res.status(500).json({ message: 'Terjadi kesalahan saat login.' });
    }
  };

// Verifikasi email
  export const verifyEmail = async (req, res) => {
    const { token } = req.query;

    try {
        // Cari pengguna berdasarkan token
        const user = await UserModel.findOne({ where: { verificationToken: token } });

        if (!user) {
            return res.status(400).json({ message: 'Token verifikasi tidak valid' });
        }

        // Update status verifikasi
        user.isVerified = true;
        user.verificationToken = null; // Hapus token setelah verifikasi
        await user.save();

        res.status(200).json({ message: 'Email berhasil diverifikasi' });
    } catch (error) {
        console.error('Error saat verifikasi email:', error);
        res.status(500).json({ message: 'Terjadi kesalahan saat verifikasi email' });
    }
};