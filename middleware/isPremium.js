import jwt from 'jsonwebtoken';
import UserModel from '../models/userModel.js';
import dotenv from 'dotenv';
dotenv.config();

const isPremium = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Mengambil token dari header Authorization: Bearer <token>

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
  
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await UserModel.findByPk(decoded.userId);
        if (!user || !user.refresh_token) {
            return res.status(401).json({ error: 'Invalid token or user logged out.' });
        }

        if (!user.isPremium) {
            return res.status(403).json({ error: 'Access denied. User is not premium.' });
        }

        // Attach user ke request object
        req.user = user;

        // Lanjut ke middleware atau controller berikutnya
        next();
    } catch (error) {
        console.error('Error in isPremium middleware:', error);
        return res.status(400).json({ error: 'Invalid token.' });
    }
};

export default isPremium;