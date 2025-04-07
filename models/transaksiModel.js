import { DataTypes } from "sequelize";
import db from "../config/dataBase.js";

const TransaksiModel = db.define(
  "transaction",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      onDelete: "CASCADE", // Jika user dihapus, transaksinya juga terhapus
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
      type: DataTypes.ENUM("pending", "settlement", "failed", "expire", "cancel"),
      allowNull: false,
      defaultValue: "pending", // Default status transaksi
    },
    paymentType: {
      type: DataTypes.STRING,
      allowNull: true, // Metode pembayaran (misal: credit_card, bank_transfer)
    },
    transactionTime: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW, // Waktu transaksi
    },
  },

);

export default TransaksiModel;