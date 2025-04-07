import { DataTypes } from "sequelize";
import db from '../config/dataBase.js';

const lamaran = db.define('lamaran', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    lowonganId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    isFinishTest: { 
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: true,
    },
    resumeId: { 
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('menunggu', 'diterima', 'ditolak'),
      defaultValue: 'menunggu',
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

  export default lamaran;