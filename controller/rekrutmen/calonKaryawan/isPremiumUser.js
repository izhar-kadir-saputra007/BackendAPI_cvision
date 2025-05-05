import midtransClient from "midtrans-client";
import UserModel from "../../../models/userModel.js";
import TransaksiModel from "../../../models/transaksiModel.js";
import {sendConfirmationEmail} from "../../../utils/emailPayments.js";
import dotenv from "dotenv";
dotenv.config();

// Konfigurasi Midtrans
const snap = new midtransClient.Snap({
  isProduction: false, // Ubah true jika di produksi
  serverKey: process.env.MIDTRANS_SERVER_KEY, // Ambil dari .env
});

// Fungsi untuk membuat pembayaran premium
export const createPremiumPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await UserModel.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Pastikan user adalah calon karyawan
    if (user.role !== "user") {
      return res.status(403).json({ message: "Hanya calon karyawan yang dapat membeli paket premium" });
    }

    const orderId = `ORDER-${userId}-${Date.now()}`;
    const grossAmount = 50000; // Harga paket premium

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
      customer_details: {
        first_name: user.name,
        email: user.email,
        phone: user.phoneNumber,
      },
    };

    // Buat transaksi di Midtrans
    const transaction = await snap.createTransaction(parameter);

    // Simpan data transaksi ke database
    await TransaksiModel.create({
      userId: userId,
      orderId: orderId,
      grossAmount: grossAmount,
      transactionStatus: "pending", // Status awal
      paymentType: null, // Akan diupdate saat notifikasi diterima
      transactionTime: new Date(),
    });

    res.status(200).json({ token: transaction.token, redirect_url: transaction.redirect_url });
  } catch (error) {
    console.error("Error in createPremiumPayment:", error);

    // Berikan pesan error yang lebih spesifik
    if (error.message.includes("Midtrans API")) {
      return res.status(500).json({ message: "Gagal membuat transaksi di Midtrans" });
    }

    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Fungsi untuk menangani notifikasi dari Midtrans
export const handlePaymentNotification = async (req, res) => {
  console.log("Received notification payload:", req.body); 

  // Jika payload kosong, kirim respons OK saja tanpa error
  if (!req.body || Object.keys(req.body).length === 0) {
    console.log("Payload notifikasi kosong, mungkin ping test"); 
    return res.status(200).send("OK");
  }

  const { order_id, transaction_status, payment_type, fraud_status } = req.body;

  try {
    // Periksa apakah order_id ada dan valid
    if (!order_id) {
      return res.status(400).json({ message: "order_id tidak ditemukan dalam notifikasi" });
    }

    console.log("Processing transaction with order_id:", order_id); 

    // Cari transaksi berdasarkan order_id
    const transaksi = await TransaksiModel.findOne({ where: { orderId: order_id } });

    if (!transaksi) {
      console.log("Transaksi tidak ditemukan untuk order_id:", order_id); 
      return res.status(404).json({ message: "Transaksi tidak ditemukan" });
    }

    // Update status transaksi
    await TransaksiModel.update(
      {
        transactionStatus: transaction_status,
        paymentType: payment_type,
      },
      { where: { orderId: order_id } }
    );

    console.log("Transaction updated:", { order_id, transaction_status, payment_type }); 

    // Jika pembayaran berhasil, update status user menjadi premium
    if (
      (transaction_status === "capture" || transaction_status === "settlement") &&
      fraud_status === "accept"
    ) {
      const userId = order_id.split("-")[1];
      await UserModel.update({ isPremium: true }, { where: { id: userId } });

      const user = await UserModel.findByPk(userId);
      if (user && user.email) {
        await sendConfirmationEmail(user.email);
      }

      console.log("User updated to premium:", userId); 
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Error handling payment notification:", error);
    // Tetap kirim respon 200 untuk mencegah Midtrans mencoba ulang
    res.status(200).send("OK");
  }
};

// Middleware untuk memeriksa apakah user adalah premium
export const isPremiumUser = async (req, res, next) => {
  const userId = req.user.id;

  try {
    const user = await UserModel.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Periksa apakah user adalah premium
    if (!user.isPremium) {
      return res.status(403).json({ message: "Akses ditolak. Anda bukan user premium." });
    }

    next();
  } catch (error) {
    console.error("Error in isPremiumUser middleware:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};