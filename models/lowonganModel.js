import { DataTypes } from 'sequelize';
import db from '../config/dataBase.js';

const Lowongan = db.define('lowongan', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    judul: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    deskripsi: {
      type: DataTypes.TEXT,
    },
    tanggalBuka: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    tanggalTutup: {
      type: DataTypes.DATE,
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
  }, {
    tableName: 'lowongans', // Pastikan nama tabel sesuai dengan yang ada di database 
    timestamps: false, // Nonaktifkan fitur timestamps otomatis
  });

  export default Lowongan;