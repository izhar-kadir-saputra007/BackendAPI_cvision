import express from "express";
import upload from "../middleware/uploadFile.js";
import authenticate from "../middleware/authenticate.js";
import {validateToken } from "../middleware/authenticate.js";
import authenticateAdminPT from "../middleware/isAdminPT.js"
import isAdmin from "../middleware/isAdmin.js"
import isPremium from "../middleware/isPremium.js";

import {createJenisSoalAdminMaster,createSoalPsikotesAdminMaster, getSoalPsikotesByJenisSoalId, getJenisSoalByUserId, submitBulkJawabanPsikotes, getTotalSkorUser} from "../controller/adminMaster/soalPsikotest.js"

import { createJenisSoal, createSoalPsikotes, } from "../controller/rekrutmen/Admin.js/soalPsikotes.js";
import { registerAdminPT, verifyEmail} from "../controller/rekrutmen/Admin.js/user.js";
import { createLowongan, addJenisSoalToLowongan,getLowonganForAdminPT, getAllLowongan, getPelamarByPT, getUsersByLowongan } from "../controller/rekrutmen/Admin.js/lowongan.js";
import { createPayment, handlePaymentNotification, checkPaymentStatus } from "../controller/rekrutmen/Admin.js/transaksi.js";

import { getSoalPsikotesForCalonKaryawan,submitJawabanPsikotes } from "../controller/rekrutmen/calonKaryawan/soalPsokotest.js"
import { applyToLowongan, getLamaranForUser, getJenisSoalByLamaranId  } from "../controller/rekrutmen/calonKaryawan/lamaran.js";
import {createPremiumPayment} from "../controller/rekrutmen/calonKaryawan/isPremiumUser.js";
import {uploadCV} from "../controller/rekrutmen/calonKaryawan/uploadCV.js";
import  { getUserProfile, editProfile } from "../controller/rekrutmen/calonKaryawan/user.js";
import router from "./index.js";

const routers = express.Router();

router.get("/api/validateToken", authenticate, validateToken);

// Endpoint untuk membuat jenis soal oleh Admin PT
routers.post('/api/jenis-soal', authenticateAdminPT, createJenisSoal);
routers.post('/api/jenis-soal/:jenisSoalId', authenticateAdminPT, createSoalPsikotes);

// Endpoint untuk membuat jenis soal oleh Admin master
routers.post('/api/createJenisSoalAdminMaster', isAdmin, createJenisSoalAdminMaster);
routers.post('/api/createSoalPsikotesAdminMaster/:jenisSoalId', isAdmin, createSoalPsikotesAdminMaster);
routers.get('/api/getSoalPsikotesByJenisSoalId/:jenisSoalId',authenticate, getSoalPsikotesByJenisSoalId);
routers.get('/api/getJenisSoalByUserId',isPremium, getJenisSoalByUserId);
routers.post('/api/submitBulkJawabanPsikotes/:jenisSoalId/:lamaranId?',authenticate, submitBulkJawabanPsikotes);
routers.get('/api/getTotalSkorUserPremium',isPremium, getTotalSkorUser);

//soal psikotes untuk calon karyawan
routers.get('/api/getSoalPsikotesForCalonKaryawan/:lowonganId/psikotes', authenticate, getSoalPsikotesForCalonKaryawan);
routers.post('/api/submitJawabanPsikotes/:lowonganId', authenticate, submitJawabanPsikotes);

//register adminPT
routers.post('/api/registerAdminPT', registerAdminPT);
routers.get('/api/verify-email', verifyEmail);

//lowongan
routers.post('/api/createLowongan',authenticateAdminPT, createLowongan );
routers.post('/api/addJenisSoalToLowongan/:lowonganId/jenis-soal',authenticateAdminPT, addJenisSoalToLowongan );
routers.get('/api/getLowonganForAdminPT', authenticateAdminPT, getLowonganForAdminPT );
routers.get('/api/getAllLowongan', getAllLowongan );
routers.get('/api/getPelamarByPT',authenticateAdminPT, getPelamarByPT );
routers.get('/api/getUsersByLowongan/:lowonganId',authenticateAdminPT, getUsersByLowongan );

//lamaaran lowongan
routers.post('/api/applyToLowongan/:lowonganId/aply', authenticate,applyToLowongan);
routers.get('/api/getLamaranForUser', authenticate, getLamaranForUser );
routers.get('/api/getJenisSoalByLamaranId/:lamaranId', authenticate, getJenisSoalByLamaranId );

//profil user
routers.get("/api/getUserProfile", authenticate, getUserProfile);
routers.put("/api/editProfile", authenticate, editProfile);

//upload file
routers.post("/api/upload-cv/:lamaranId", upload.single("cv"), authenticate, uploadCV);

//isPremium untuk Admin PT
routers.post("/api/create-payment", authenticateAdminPT, createPayment);
routers.post("/api/midtrans-notification", handlePaymentNotification);
routers.get("/api/checkPaymentStatus", checkPaymentStatus);

//isPremiun untuk calon karywan
routers.post("/api/createPremiumUser", authenticate, createPremiumPayment);


export default routers;