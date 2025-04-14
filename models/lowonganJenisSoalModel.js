import { DataTypes } from "sequelize";
import db from '../config/dataBase.js';

const lowonganJenisSoal = db.define('lowonganjenissoal', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    lowonganId: {
      type: DataTypes.INTEGER,
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
  });

  export default lowonganJenisSoal;