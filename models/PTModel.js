import { DataTypes } from "sequelize";
import db from '../config/dataBase.js';

const PT = db.define('PT', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      namaPT: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      alamat: {
        type: DataTypes.STRING(255),
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
})

export default PT;