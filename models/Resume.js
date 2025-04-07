import { DataTypes } from 'sequelize';
import db from '../config/dataBase.js';

const Resume = db.define('Resume', {
    resume_text: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    file_path: {
        type: DataTypes.STRING, // Untuk menyimpan lokasi file
        allowNull: true,
    },
    file_name: {
        type: DataTypes.STRING, // Menyimpan nama file
        allowNull: true,
    },
    predicted_category: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    probability: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    upload_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    userId: { // Foreign key
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'user', // Nama tabel UserModel
            key: 'id',
        },
    },
}, {
    tableName: 'resumes',
    timestamps: false,
});

export default Resume;
