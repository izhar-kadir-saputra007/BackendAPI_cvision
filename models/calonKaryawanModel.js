import { DataTypes } from "sequelize";
import db from '../config/dataBase.js';

const calonKaryawan = db.define('calonkaryawan', {
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
        }
    },
    namaLengkap: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    alamat: {
        type: DataTypes.STRING(255),
    },
    tanggalLahir: {
        type: DataTypes.DATE,
    },
    jenisKelamin: {
        type: DataTypes.STRING(10),
    },
    pendidikanTerakhir: {
        type: DataTypes.STRING(50),
    },
    jurusan: {
        type: DataTypes.STRING(50),
    },
    // Field untuk foto profil
    fotoProfil: {
        type: DataTypes.STRING(255),
        comment: 'Path/lokasi file foto profil'
    },
    fotoOriginalName: {
        type: DataTypes.STRING(255),
        comment: 'Nama asli file foto'
    },
    fotoMimeType: {
        type: DataTypes.STRING(50),
        comment: 'MIME type file foto'
    },
    fotoSize: {
        type: DataTypes.INTEGER,
        comment: 'Ukuran file foto dalam bytes'
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
}, {
    timestamps: true
});

export default calonKaryawan;