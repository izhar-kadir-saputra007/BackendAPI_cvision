import express from "express";
import multer from "multer";
import { getUsers, Login, Register, Logout, getUserById, getUsersByProbability,resetPassword,verifyResetToken,forgotPassword, changePassword } from "../controller/user.js";
import { createUser, updateUser, deleteUser } from "../controller/CRUD.js";
import {getTimerDuration, setTimerDuration } from "../controller/setting.js"
import { sendPassedUsers, getUsersWithPassedStatus } from "../controller/statusUser.js";
import predictRouter from "../controller/predict.js"; 
import { totalScore } from "../controller/psicotest.js";
import authenticate from "../middleware/authenticate.js";
import isAdmin from "../middleware/isAdmin.js";
import questions from "../controller/question.js";
import { unduhPDF } from "../controller/downloadPDF.js";

import {predictCVUmum, upload, downloadCSV } from "../controller/predictCVUmum.js";

// import { sendWhatsAppMessage, logoutWhatsApp  } from '../WABot/whatsappController.js';

const router = express.Router();


// Rute User
router.get("/api/users", authenticate, getUsers);
router.get("/api/users/probability", authenticate, getUsersByProbability);
router.get("/api/users/:id", authenticate, getUserById);
router.post("/api/users", Register);
router.post("/api/login", Login);
router.delete("/api/logout", Logout);
router.post("/api/resetPassword", resetPassword); 
router.get("/api/verifyResetToken/:token", verifyResetToken); 
router.post("/api/forgotPassword", forgotPassword); 
router.put("/api/changePassword",authenticate, changePassword); 

// API endpoint untuk mengirim data pengguna yang lulus berdasarkan probabilitas dan skor
router.post('/api/sendPassedUsers', authenticate, sendPassedUsers); 
router.get('/api/usersPassed', authenticate, getUsersWithPassedStatus);


//CRUD User
router.delete("/api/users/delete/:id", isAdmin, deleteUser);
router.put("/api/users/update/:id", isAdmin, updateUser);
router.post("/api/users/create/", isAdmin, createUser);
router.post("/api/users", Register);

// Endpoint untuk setting 
router.get("/api/getTimerDuration", authenticate, getTimerDuration);
router.put("/api/setTimerDuration", isAdmin, setTimerDuration);

// Endpoint untuk mengirim pesan WhatsApp dengan hasil resume dan psikotes
// router.post('/api/send-whatsapp-report/:userId', sendWhatsAppMessage);
// router.post('/api/logoutWhatsApp', logoutWhatsApp);


// rute soal psikotes
router.get("/api/questions",authenticate, questions); 
router.post("/api/users/hasil", authenticate, totalScore);

//download pdf
router.get('/api/downloadPDF/:id', authenticate, unduhPDF);

// Mount Predict Router di bawah /api/predict
router.use("/api/predict", authenticate, predictRouter);

//prediksi cv umum
router.post("/api/predictCVUmum", upload.single("file"), predictCVUmum);
router.get("/api/downloadCSV/:type", downloadCSV);

export default router;
