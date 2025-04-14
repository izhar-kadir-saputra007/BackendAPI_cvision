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
    
}, {
    tableName: 'pts', // Pastikan nama tabel sesuai dengan yang ada di database
    timestamps: false // Nonaktifkan fitur timestamps otomatis
});

export default PT;