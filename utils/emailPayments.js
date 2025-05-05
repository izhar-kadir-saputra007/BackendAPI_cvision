import nodemailer from "nodemailer";
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 1. Email Konfirmasi Pembayaran Berhasil
const sendConfirmationEmail = async (email, data) => {
  const mailOptions = {
    from: `"Layanan Premium" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Pembayaran Berhasil #${data.orderId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Pembayaran Berhasil!</h2>
        <p>Terima kasih telah berlangganan layanan premium kami.</p>
        
        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3>Detail Transaksi</h3>
          <p><strong>Order ID:</strong> ${data.orderId}</p>
          <p><strong>Jumlah:</strong> Rp ${data.amount.toLocaleString('id-ID')}</p>
          <p><strong>Metode Pembayaran:</strong> ${data.paymentMethod}</p>
          ${data.vaNumber ? `
            <p><strong>Nomor VA:</strong> ${data.vaNumber}</p>
            <p><strong>Bank:</strong> ${data.bank}</p>
          ` : ''}
          <p><strong>Waktu Transaksi:</strong> ${new Date(data.transactionTime).toLocaleString('id-ID')}</p>
        </div>
        
        <p>Status premium Anda telah aktif dan dapat digunakan segera.</p>
      </div>
    `
  };
  await transporter.sendMail(mailOptions);
};

// 2. Email Pembayaran Gagal
const sendFailedPaymentEmail = async (email, data) => {
  const statusMessages = {
    'deny': 'ditolak',
    'cancel': 'dibatalkan',
    'expire': 'kadaluarsa',
    'failure': 'gagal diproses'
  };

  const mailOptions = {
    from: `"Layanan Premium" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Pembayaran Gagal #${data.orderId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f44336;">Pembayaran ${statusMessages[data.status] || 'tidak berhasil'}</h2>
        
        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3>Detail Transaksi</h3>
          <p><strong>Order ID:</strong> ${data.orderId}</p>
          <p><strong>Jumlah:</strong> Rp ${data.amount.toLocaleString('id-ID')}</p>
          <p><strong>Status:</strong> ${data.status}</p>
          <p><strong>Alasan:</strong> ${data.reason || 'Tidak diketahui'}</p>
        </div>
        
        <p>Anda dapat mencoba melakukan pembayaran kembali.</p>
      </div>
    `
  };
  await transporter.sendMail(mailOptions);
};

// 3. Email Refund
const sendRefundNotification = async (email, data) => {
  const mailOptions = {
    from: `"Layanan Premium" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Pengembalian Dana #${data.orderId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FF9800;">Pengembalian Dana Diproses</h2>
        
        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3>Detail Pengembalian</h3>
          <p><strong>Order ID:</strong> ${data.orderId}</p>
          <p><strong>Jumlah Dikembalikan:</strong> Rp ${data.refundAmount.toLocaleString('id-ID')}</p>
          <p><strong>Alasan:</strong> ${data.reason}</p>
          <p><strong>Tanggal Pengembalian:</strong> ${new Date(data.refundDate).toLocaleString('id-ID')}</p>
        </div>
        
        <p>Status premium Anda telah dinonaktifkan.</p>
      </div>
    `
  };
  await transporter.sendMail(mailOptions);
};

// 4. Email Verifikasi Fraud
const sendFraudReviewNotification = async (email, data) => {
  const mailOptions = {
    from: `"Layanan Premium" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Verifikasi Pembayaran Dibutuhkan #${data.orderId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FFC107;">Pembayaran Membutuhkan Verifikasi</h2>
        
        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3>Detail Transaksi</h3>
          <p><strong>Order ID:</strong> ${data.orderId}</p>
          <p><strong>Jumlah:</strong> Rp ${data.amount.toLocaleString('id-ID')}</p>
          <p><strong>Metode Pembayaran:</strong> ${data.paymentMethod}</p>
        </div>
        
        <p>Tim kami akan menghubungi Anda untuk verifikasi lebih lanjut.</p>
      </div>
    `
  };
  await transporter.sendMail(mailOptions);
};

export { 
  sendConfirmationEmail,
  sendFailedPaymentEmail,
  sendRefundNotification,
  sendFraudReviewNotification
};