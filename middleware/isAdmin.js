import jwt from 'jsonwebtoken';
import Users from '../models/userModel.js';

const isAdmin = async (req, res, next) => {
  try {
    // Ambil token dari header Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(403).json({ msg: "Akses ditolak, token tidak ditemukan" });
    }

    // Verifikasi token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Cek apakah pengguna ada di database dan memiliki role admin
    const user = await Users.findOne({ where: { id: decoded.userId } });
    if (!user) {
      return res.status(404).json({ msg: "Pengguna tidak ditemukan" });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ msg: "Akses ditolak, Anda bukan admin" });
    }

    // Lanjutkan ke endpoint berikutnya
    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    return res.status(403).json({ msg: "Token tidak valid" });
  }
};

export default isAdmin;
