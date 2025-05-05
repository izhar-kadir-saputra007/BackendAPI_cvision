
import express from "express";
import dotenv from "dotenv";
import path from "path";
import cors from "cors";
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import bodyParser from "body-parser";
import db from "./config/dataBase.js"; 
import router from "./routers/index.js"; 
import routers from "./routers/rekrutment.js";
dotenv.config();
import "./models/index.js";

const app = express();
app.use(cookieParser())
// Middleware untuk parsing application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware untuk parsing application/json
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Middleware
app.use(morgan('dev'));
// ✅ Tambahkan whitelist origin untuk CORS
const allowedOrigins = [
    'http://localhost:5173',
    'https://cvisionjob.com',
    'https://www.cvisionjob.com' // opsional kalau kamu juga pakai versi www
];

app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (e.g., mobile apps or curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        } else {
            return callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE','PATCH',],
    credentials: true
}));
app.use(express.json());

// âœ… Route pengecekan server
app.get("/", (req, res) => {
    res.status(200).json({ message: "Server Express berjalan dengan baik ðŸš€" });
});

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
        
          const PORT = 3000 || 29311; 
        app.listen(PORT, () => {
            console.log(`Express server berjalan di port ${PORT}`);
        });

    } catch (error) {
        console.error("Error saat menghubungkan ke database:", error);
        process.exit(1);
    }
};
startServer();