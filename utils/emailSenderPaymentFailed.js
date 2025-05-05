// emailSenderPaymentFailed.js
import nodemailer from "nodemailer";
import dotenv from 'dotenv';
dotenv.config();

const sendFailedPaymentEmail = async (email, data) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const statusMessages = {
    'deny': 'ditolak oleh sistem',
    'cancel': 'dibatalkan',
    'expire': 'kadaluarsa',
    'failure': 'gagal diproses'
  };

  const mailOptions = {
    from: `"Payment System" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Pembayaran Gagal #${data.orderId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f44336;">Pembayaran Gagal</h2>
        <p>Maaf, pembayaran Anda ${statusMessages[data.status] || 'tidak berhasil'}.</p>
        
        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3>Detail Transaksi</h3>
          <p><strong>Order ID:</strong> ${data.orderId}</p>
          <p><strong>Alasan:</strong> ${data.reason || 'Tidak diketahui'}</p>
        </div>
        
        <p>Anda dapat mencoba melakukan pembayaran kembali melalui aplikasi kami.</p>
        <p>Jika ini adalah kesalahan, silakan hubungi tim support kami.</p>
        
        <p style="margin-top: 30px;">Hormat kami,<br>Tim Pembayaran</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

export default sendFailedPaymentEmail;