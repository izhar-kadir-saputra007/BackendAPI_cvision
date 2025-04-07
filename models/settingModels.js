import { DataTypes } from 'sequelize';
import db from '../config/dataBase.js';

const Settings = db.define('Settings', {
  timerDuration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5, // Default timer 5 menit
    validate: {
      min: 1,  // Minimal 1 menit
      max: 60  // Maksimal 60 menit, sesuaikan jika perlu
    }
  }
}, {
  tableName: 'settings',
  timestamps: true // Akan otomatis menambahkan createdAt dan updatedAt
});

export default Settings;
