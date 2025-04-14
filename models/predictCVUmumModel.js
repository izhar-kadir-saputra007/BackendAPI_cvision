import { DataTypes } from "sequelize";
import db from '../config/dataBase.js';

const PredicCVUmum = db.define("prediccvumum", {
  id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    autoIncrement: true, 
    primaryKey: true,
  },
  posisi: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  probability: {
    type: DataTypes.STRING, // Dalam format "90.0%"
    allowNull: true,
  },
  cv_user: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  top_5_positions: {
      type: DataTypes.JSON, // Simpan sebagai JSON
      allowNull: true,
    },
   csv_path: {
    type: DataTypes.STRING, // Simpan path file CSV
    allowNull: false,
  },
});

export default PredicCVUmum;
