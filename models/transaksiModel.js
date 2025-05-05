import { DataTypes } from "sequelize";
import db from "../config/dataBase.js";

const TransaksiModel = db.define(
  "transactions", // Using plural table name convention
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      onDelete: "CASCADE",
    },
    orderId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    grossAmount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    transactionStatus: {
      type: DataTypes.ENUM('pending', 'settlement', 'capture', 'deny', 'cancel', 'expire'),
      allowNull: false,
      defaultValue: "pending",
    },
    paymentType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    transactionTime: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    vaNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    bank: {
      type: DataTypes.STRING,
      allowNull: true
    },
    settlementTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: "IDR"
    },
    pdfUrl: {  // Changed from pdf_url to pdfUrl for consistency
      type: DataTypes.STRING,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
  },
  {
    tableName: 'transactions', // Explicit table name
    timestamps: true // Enable createdAt and updatedAt
  }
);

export default TransaksiModel;