import { DataTypes } from "sequelize";
import db from "../config/dataBase.js";

const JawabanPsikotes = db.define('JawabanPsikotes', {
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
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    soalPsikotesId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'soalPsikotes',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    // jenisSoalId: {
    //   type: DataTypes.INTEGER,
    //   allowNull: true,
    //   references: {
    //     model: 'jenisSoal',
    //     key: 'id'
    //   },
    //   onDelete: 'CASCADE',
    //   onUpdate: 'CASCADE',
    // },
    jawaban: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    skor: {
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
  
  export default JawabanPsikotes;