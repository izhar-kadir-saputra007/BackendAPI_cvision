import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Buat transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Verifikasi transporter
transporter.verify((error, success) => {
    if (error) {
        console.error('Error verifying transporter:', error);
    } else {
        console.log('Server is ready to send emails');
    }
});

/**
 * Fungsi untuk mengirim email verifikasi
 * @param {string} to - Email penerima
 * @param {string} token - Token verifikasi
 */
export const sendVerificationEmail = async (to, token, name) => {
    const verificationLink = `http://localhost:3000/api/verify-email?token=${token}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject: 'Verifikasi Email',
        html: `<p>haalo ${name}, Silakan klik link berikut untuk verifikasi email Anda: <a href="${verificationLink}">${verificationLink}</a></p>`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email verifikasi berhasil dikirim');
    } catch (error) {
        console.error('Gagal mengirim email verifikasi:', error);
        throw error;
    }
};

// Fungsi untuk mengirim email reset password
export const sendResetPasswordEmail = async (email, token, name) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Reset Password Anda',
        html: `
            <h2>Halo ${name},</h2>
            <p>Anda menerima email ini karena meminta reset password. Silakan klik link berikut untuk reset password:</p>
            <a href="${process.env.BASE_URL}/api/verifyResetToken/${token}">Reset Password</a>
            <p>Link ini akan kadaluarsa dalam 1 jam.</p>
            <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
        `
    };

    await transporter.sendMail(mailOptions);
};