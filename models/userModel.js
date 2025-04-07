import { DataTypes } from "sequelize";
import db from "../config/dataBase.js";

const UserModel = db.define("user", {
    id: { // Primary key
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // Pastikan email unik
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    phoneNumber: { // New field
        type: DataTypes.STRING,
        allowNull: true,
    },
    refresh_token: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    role: { // Tambahkan field role
        type: DataTypes.ENUM('admin',"adminPT", 'user'), // Enum untuk role
        defaultValue: 'user', // Default role
    },
    isPremium: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      ptId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

    status: { // Status kelulusan
        type: DataTypes.ENUM('Passed', 'Not Passed'), // Enum untuk status kelulusan
        defaultValue: 'Not Passed', 
    },
    verificationToken: { // Tambahkan field untuk token verifikasi
        type: DataTypes.STRING,
        allowNull: true,
    },
    isVerified: { 
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    resetToken: {
        type: DataTypes.STRING,
        allowNull: true
    },
    resetTokenExpiry: {
        type: DataTypes.BIGINT,
        allowNull: true
    },
}, {
    freezeTableName: true
});

export default UserModel;
