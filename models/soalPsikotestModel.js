import { DataTypes } from "sequelize";
import db from '../config/dataBase.js';

const soalPsikotes = db.define('soalpsikotes', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    pertanyaan: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    options: {
      type: DataTypes.JSON, // Menyimpan data dalam format JSON
      allowNull: false,
    },
    jenisSoalId: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    tableName: 'soalpsikotes', // Pastikan nama tabel sesuai dengan yang ada di database
    timestamps: false, // Nonaktifkan fitur timestamps otomatis
  });

  export default soalPsikotes;