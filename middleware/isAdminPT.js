import jwt from 'jsonwebtoken';
import UserModel from '../models/userModel.js';
import dotenv from 'dotenv';
dotenv.config();

const authenticateAdminPT = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Mengambil token dari header Authorization: Bearer <token>

    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    // Verifikasi token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    // console.log("Decoded Token:", decoded); // Debugging log

    // Ambil user berdasarkan userId dari token
    const user = await UserModel.findByPk(decoded.userId);
    // console.log("Authenticated User:", user); // Debugging log

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (!user.refresh_token) {
      return res.status(401).json({ error: 'Invalid token or user logged out.' });
    }

    if (user.role !== 'adminPT') {
      return res.status(403).json({ error: 'Access denied. Only Admin PT can access this endpoint.' });
    }

    // Menyimpan user ke `req.user`
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(400).json({ error: 'Invalid token.' });
  }
};

export default authenticateAdminPT;
