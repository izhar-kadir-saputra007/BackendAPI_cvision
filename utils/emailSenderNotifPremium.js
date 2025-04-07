import nodemailer from "nodemailer";
import dotenv from 'dotenv';

dotenv.config();

const sendConfirmationEmail = async (email) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Pembayaran Berhasil",
    text: "Selamat! Pembayaran Anda berhasil dan status premium Anda telah diaktifkan.",
  };

  await transporter.sendMail(mailOptions);
};

export default sendConfirmationEmail;