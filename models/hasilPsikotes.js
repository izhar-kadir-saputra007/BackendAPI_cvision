import { DataTypes } from 'sequelize';
import db from '../config/dataBase.js';
import UserModel from './userModel.js'; // Import UserModel

const HasilPsicotest = db.define('HasilPsicotest', {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: UserModel, // Gunakan model yang diimpor
            key: 'id'
        }
    },
    totalScore: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: false,
    freezeTableName: true // Pastikan menggunakan nama tabel yang tepat
});

export default HasilPsicotest;
