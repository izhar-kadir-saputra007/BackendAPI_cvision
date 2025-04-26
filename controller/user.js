import Users from "../models/userModel.js";
import Resume from "../models/Resume.js";
import HasilPsicotest from "../models/hasilPsikotes.js";
import calonKaryawan from "../models/calonKaryawanModel.js";
import { sendVerificationEmail, sendResetPasswordEmail } from "../utils/mailer.js";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';


import fs from 'fs';
import pkgFormData from 'form-data';
const { from } = pkgFormData;

import dotenv from 'dotenv';
dotenv.config();

// Fungsi untuk mengambil data pengguna beserta resume dan hasil psikotest mereka
export const getUsers = async (req, res) => {
    try {
        const users = await Users.findAll({
            include: [
                {
                    model: Resume,
                    as: 'resumes'
                },
                {
                    model: HasilPsicotest,
                    as: 'hasilPsikotests'
                }
            ]
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Fungsi registrasi pengguna baru
export const Register = async (req, res) => {
    const { name, phoneNumber, email, password, confPassword } = req.body;
    if (password !== confPassword) {
        return res.status(400).json({ msg: "Password dan konfirmasi password tidak cocok" });
    }

    const existingUser = await Users.findOne({ where: { email: email } });
    if (existingUser) {
        return res.status(400).json({ msg: "Email sudah digunakan" });
    }

    const salt = await bcrypt.genSalt();
    const hashPassword = await bcrypt.hash(password, salt);

    // Generate token verifikasi
    const verificationToken = uuidv4();

    try {
        const userCount = await Users.count();
        const role = userCount === 0 ? 'admin' : 'user';

        const newUser = await Users.create({
            name: name,
            phoneNumber: phoneNumber,
            email: email,
            password: hashPassword,
            role: role,
            verificationToken, 
            isVerified: false,
        });

     
        await calonKaryawan.create({
            userId: newUser.id,
            namaLengkap: name,
        });

        await sendVerificationEmail(email, verificationToken, name);

        return res.status(201).json({
            message: 'Registrasi user berhasil. Silakan cek email untuk verifikasi.',
            data: {
                user: newUser,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: error.message });
    }
};
// Fungsi login pengguna
export const Login = async (req, res) => {
    try {
        const user = await Users.findOne({
            where: { email: req.body.email }
        });

        if (!user) {
            return res.status(404).json({ msg: "Email tidak ditemukan" });
        }

        // Cek apakah email sudah terverifikasi
        if (!user.isVerified) {
            return res.status(403).json({ msg: "Email belum terverifikasi. Silakan verifikasi email terlebih dahulu." });
        }

        const match = await bcrypt.compare(req.body.password, user.password);
        if (!match) {
            return res.status(400).json({ msg: "Password yang Anda masukkan salah" });
        }

        const userId = user.id;
        const name = user.name;
        const email = user.email;
        const role = user.role;

        // Membuat access token
        const accessToken = jwt.sign({ userId, name, email }, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: '30d'
        });

        // Membuat refresh token
        const refreshToken = jwt.sign({ userId, name, email }, process.env.REFRESH_TOKEN_SECRET, {
            expiresIn: '30d'
        });

        // Mengupdate refresh_token di database
        await Users.update({ refresh_token: refreshToken }, {
            where: { id: userId }
        });

        // Mengatur cookie untuk refresh token
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000 // 1 hari
        });

        res.json({ accessToken, role });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Terjadi kesalahan saat login" });
    }
};

// Fungsi logout pengguna
export const Logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) return res.sendStatus(204); // No content

        const user = await Users.findOne({ where: { refresh_token: refreshToken } });
        if (!user) return res.sendStatus(204);

        await Users.update({ refresh_token: null }, { where: { id: user.id } });
        res.clearCookie('refreshToken');
        return res.sendStatus(200); 
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Terjadi kesalahan saat logout" });
    }
};

// Fungsi untuk mendapatkan data pengguna berdasarkan ID (hanya jika token valid)
export const getUserById = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await Users.findOne({
            where: { id: userId },
            include: [
                {
                    model: Resume,
                    as: 'resumes'
                },
                {
                    model: HasilPsicotest,
                    as: 'hasilPsikotests'
                }
            ]
        });

        if (!user) {
            return res.status(404).json({ msg: "User tidak ditemukan" });
        }

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: error.message });
    }
};


//mencari user berdasarkan probabalitinya
export const getUsersByProbability = async (req, res) => {
    const minProbability = parseFloat(req.query.minProbability); // Default ke 10 jika tidak disediakan
    const minScore = parseFloat(req.query.minScore); // Default ke 50 jika tidak disediakan

    try {
        let users = await Users.findAll({
            include: [
                {
                    model: Resume,
                    as: 'resumes',
                    where: {
                        probability: {
                            [Op.gte]: minProbability
                        }
                    },
                    required: true // Hanya ambil users dengan resume yang memenuhi syarat
                },
                {
                    model: HasilPsicotest,  
                    as: 'hasilPsikotests',
                    where: {
                        totalScore: {
                            [Op.gte]: minScore
                        }
                    },
                    required: true // Hanya ambil users dengan hasil psikotest yang memenuhi syarat
                }
            ]
        });

        // Filter hanya hasil psikotest pertama untuk setiap user
        users = users.map(user => {
            return {
                ...user.toJSON(),
                hasilPsikotests: user.hasilPsikotests.slice(0, 1) // Hanya ambil index ke-0
            };
        });

        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: error.message });
    }
};



// Fungsi untuk meminta reset password
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        
        // Cari user berdasarkan email
        const user = await Users.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ msg: "Email tidak ditemukan" });
        }

        // Generate token reset password
        const resetToken = uuidv4();
        const resetTokenExpiry = Date.now() + 3600000; // 1 jam dari sekarang

        // Simpan token dan expiry di database
        await Users.update(
            { 
                resetToken,
                resetTokenExpiry 
            },
            { where: { id: user.id } }
        );

        // Kirim email reset password
        await sendResetPasswordEmail(email, resetToken, user.name);

        res.status(200).json({ 
            msg: "Email instruksi reset password telah dikirim" 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Terjadi kesalahan saat memproses permintaan" });
    }
};

// Fungsi untuk verifikasi token reset password
export const verifyResetToken = async (req, res) => {
    try {
        const { token } = req.params;

        // Cari user berdasarkan token
        const user = await Users.findOne({ 
            where: { 
                resetToken: token,
                resetTokenExpiry: { [Op.gt]: Date.now() } // Cek apakah token masih valid
            } 
        });

        if (!user) {
            return res.status(400).json({ msg: "Token tidak valid atau sudah kadaluarsa" });
        }

        res.status(200).json({ 
            msg: "Token valid", 
            email: user.email 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Terjadi kesalahan saat verifikasi token" });
    }
};

// Fungsi untuk update password baru
export const resetPassword = async (req, res) => {
    try {
        const { token, password, confPassword } = req.body;

        // Validasi password
        if (password !== confPassword) {
            return res.status(400).json({ msg: "Password dan konfirmasi password tidak cocok" });
        }

        // Cari user berdasarkan token
        const user = await Users.findOne({ 
            where: { 
                resetToken: token,
                resetTokenExpiry: { [Op.gt]: Date.now() } // Cek apakah token masih valid
            } 
        });

        if (!user) {
            return res.status(400).json({ msg: "Token tidak valid atau sudah kadaluarsa" });
        }

        // Hash password baru
        const salt = await bcrypt.genSalt();
        const hashPassword = await bcrypt.hash(password, salt);

        // Update password dan hapus token reset
        await Users.update(
            { 
                password: hashPassword,
                resetToken: null,
                resetTokenExpiry: null 
            },
            { where: { id: user.id } }
        );

        res.status(200).json({ msg: "Password berhasil direset" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Terjadi kesalahan saat reset password" });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confNewPassword } = req.body;
        
        // Validasi input
        if (!currentPassword || !newPassword || !confNewPassword) {
            return res.status(400).json({ msg: "Semua field harus diisi" });
        }
        
        if (newPassword !== confNewPassword) {
            return res.status(400).json({ msg: "Password baru dan konfirmasi password tidak cocok" });
        }
        
        // Dapatkan user dari req.user (middleware sudah menyediakan)
        const user = req.user;
        
        if (!user) {
            return res.status(404).json({ msg: "User tidak ditemukan" });
        }
        
        // Verifikasi password saat ini
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: "Password saat ini salah" });
        }
        
        // Hash password baru
        const salt = await bcrypt.genSalt();
        const hashPassword = await bcrypt.hash(newPassword, salt);
        
        // Update password
        await Users.update(
            { password: hashPassword },
            {
                where: {
                    id: user.id
                }
            }
        );
        
        return res.status(200).json({ msg: "Password berhasil diubah" });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: error.message });
    }
};