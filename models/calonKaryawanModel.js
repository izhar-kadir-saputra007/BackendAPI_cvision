import { DataTypes } from "sequelize";
import db from '../config/dataBase.js';

const calonKaryawan = db.define('calonkaryawan', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
          model: 'user', 
      }
  },
    namaLengkap: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    alamat: {
      type: DataTypes.STRING(255),
    },
    tanggalLahir: {
      type: DataTypes.DATE,
    },
    jenisKelamin: {
      type: DataTypes.STRING(10),
    },
    pendidikanTerakhir: {
      type: DataTypes.STRING(50),
    },
    jurusan: {
      type: DataTypes.STRING(50),
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      onUpdate: DataTypes.NOW,
    },
  });
  
  export default calonKaryawan;