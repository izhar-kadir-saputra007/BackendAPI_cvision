import { DataTypes } from "sequelize";
import db from "../config/dataBase.js";
import JenisSoal from "./jenisSoalModel.js";
import User from "./userModel.js";
import Lamaran from "./lamaranModel.js";

const RiwayatPsikotes = db.define('riwayatpsikotes', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: User, // Pastikan nama tabel sesuai
            key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    },
    jenisSoalId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: JenisSoal, // Pastikan nama tabel sesuai
            key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    },
    lamaranId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Lamaran, // Pastikan nama tabel sesuai
            key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    },
    totalSkor: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
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

export default RiwayatPsikotes;