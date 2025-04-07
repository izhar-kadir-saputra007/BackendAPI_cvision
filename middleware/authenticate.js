import jwt from 'jsonwebtoken';
import UserModel from '../models/userModel.js';
import dotenv from 'dotenv';
dotenv.config();

const authenticate = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Mengambil token dari header Authorization: Bearer <token>

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET); // Verifikasi token menggunakan secret
        // console.log('Decoded token:', decoded); // Log hasil decode token

        const user = await UserModel.findByPk(decoded.userId); // Memperbaiki dengan menggunakan userId
        // console.log('User found:', user); // Log untuk memeriksa apakah user ditemukan

        // Memeriksa apakah user tidak ditemukan atau sudah logout
        if (!user || !user.refresh_token) {
            return res.status(401).json({ error: 'Invalid token or user logged out.' });
        }

        req.user = user;
        next();
    } catch (error) {
        // console.error('Authentication error:', error); // Log error jika terjadi masalah dengan token
        res.status(400).json({ error: 'Invalid token.' });
    }
};

export const validateToken = async (req, res) => {
    try {
      const user = req.user; // Didapatkan dari middleware authenticate
      
      if (!user) {
        return res.status(401).json({ 
          valid: false,
          message: 'User not found' 
        });
      }
  
      res.json({
        valid: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email
          // tambahkan field lain yang diperlukan
        }
      });
  
    } catch (error) {
      res.status(500).json({ 
        valid: false,
        message: 'Server error' 
      });
    }
  };

export default authenticate;
