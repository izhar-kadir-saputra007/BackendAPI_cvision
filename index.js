import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import bodyParser from "body-parser";
import db from "./config/dataBase.js"; 
import router from "./routers/index.js"; 
import routers from "./routers/rekrutment.js"
dotenv.config();
import "./models/index.js";

const app = express();
app.use(cookieParser())
// Middleware untuk parsing application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware untuk parsing application/json
app.use(bodyParser.json());

// Middleware
app.use(morgan('dev'));
app.use(cors({
    origin: 'http://localhost:5173', 
    methods: ['GET', 'POST','PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json());

// Routes
app.use(router);
app.use(routers);

// Fungsi untuk menghubungkan ke database sebelum server mulai
const startServer = async () => {
    try {
        await db.authenticate(); 
        console.log("Database sedang terhubung...");
        
        // await db.sync({alter: true});
        console.log("Database sudah terhubung dan telah di-sync.");
        const PORT = process.env.PORT || 3000; 
        app.listen(PORT, () => {
            console.log(`Express server berjalan di port ${PORT}`);
        });
    } catch (error) {
        console.error("Error saat menghubungkan ke database:", error);
        process.exit(1);
    }
};

startServer();
