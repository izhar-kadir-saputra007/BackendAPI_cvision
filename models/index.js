import UserModel from './userModel.js';
import Resume from './Resume.js';
import HasilPsicotest from './hasilPsikotes.js';
import PredicCVUmum from "./predictCVUmumModel.js"
import SoalPsikotes from './soalPsikotestModel.js';
import JenisSoal from './jenisSoalModel.js';
import Lowongan from './lowonganModel.js';
import PT from './PTModel.js';
import LowonganJenisSoal from './lowonganJenisSoalModel.js';
import Lamaran from './lamaranModel.js';
import CalonKaryawan from './calonKaryawanModel.js';
import JawabanPsikotes from './jawabanPsikotesModel.js';
import TransaksiModel from './transaksiModel.js';
import RiwayatPsikotes from './riwayatPsikotesModel.js';


// Define associations
UserModel.hasMany(Resume, { foreignKey: 'userId', as: 'resumes' });
Resume.belongsTo(UserModel, { foreignKey: 'userId', as: 'user' });

// Relasi antara User dan HasilPsicotest
UserModel.hasMany(HasilPsicotest, { foreignKey: 'userId', as: 'hasilPsikotests' });
HasilPsicotest.belongsTo(UserModel, { foreignKey: 'userId', as: 'user' });

//relasi antara user dan jenis soal
UserModel.hasMany(JenisSoal, { foreignKey: "userId", as: "jenisSoal" });
JenisSoal.belongsTo(UserModel, { foreignKey: "userId", as: "user" });

// Relasi JenisSoal -> SoalPsikotes
JenisSoal.hasMany(SoalPsikotes, { foreignKey: 'jenisSoalId' });
SoalPsikotes.belongsTo(JenisSoal, { foreignKey: 'jenisSoalId' });

// Relasi Lowongan -> JenisSoal (Many-to-Many melalui LowonganJenisSoal)
Lowongan.belongsToMany(JenisSoal, { through: LowonganJenisSoal, foreignKey: 'lowonganId' });
JenisSoal.belongsToMany(Lowongan, { through: LowonganJenisSoal, foreignKey: 'jenisSoalId' });

// Relasi lowonganJenisSoal -> JenisSoal
LowonganJenisSoal.belongsTo(JenisSoal, { foreignKey: 'jenisSoalId' });
JenisSoal.hasMany(LowonganJenisSoal, { foreignKey: 'jenisSoalId' });

// Relasi PT -> Lowongan
PT.hasMany(Lowongan, { foreignKey: 'ptId' });
Lowongan.belongsTo(PT, { foreignKey: 'ptId' });

// Relasi User -> PT
UserModel.belongsTo(PT, { foreignKey: 'ptId' });
PT.hasMany(UserModel, { foreignKey: 'ptId' });

// Relasi User -> Lamaran
UserModel.hasMany(Lamaran, { foreignKey: 'userId' });
Lamaran.belongsTo(UserModel, { foreignKey: 'userId' });

// Relasi Lowongan -> Lamaran
Lowongan.hasMany(Lamaran, { foreignKey: 'lowonganId' });
Lamaran.belongsTo(Lowongan, { foreignKey: 'lowonganId' });

// Relasi User -> CalonKaryawan (one-to-one)
UserModel.hasOne(CalonKaryawan, { foreignKey: 'userId' });
CalonKaryawan.belongsTo(UserModel, { foreignKey: 'userId' });

// Relasi Lamaran -> Resume
Lamaran.belongsTo(Resume, { foreignKey: 'resumeId' });
Resume.hasMany(Lamaran, { foreignKey: 'resumeId' });

//relasi dengan User (calon karyawan) dan SoalPsikotes.
JawabanPsikotes.belongsTo(UserModel, { foreignKey: 'userId' });
UserModel.hasMany(JawabanPsikotes, { foreignKey: 'userId' });

// //relasi dengan jenis soal  dan jawaban psikotes
// JawabanPsikotes.belongsTo(JenisSoal, { foreignKey: 'jenisSoalId' });
// JenisSoal.hasMany(JawabanPsikotes, { foreignKey: 'jenisSoalId' });

JawabanPsikotes.belongsTo(SoalPsikotes, { foreignKey: 'soalPsikotesId' });
SoalPsikotes.hasMany(JawabanPsikotes, { foreignKey: 'soalPsikotesId' });

// Definisi Relasi
UserModel.hasMany(TransaksiModel, { foreignKey: "userId", as: "transactions" });
TransaksiModel.belongsTo(UserModel, { foreignKey: "userId", as: "user" });

// Relasi User dengan RiwayatPsikotes
UserModel.hasMany(RiwayatPsikotes, { foreignKey: "userId" });
RiwayatPsikotes.belongsTo(UserModel, { foreignKey: "userId" });

// Relasi JenisSoal dengan RiwayatPsikotes
JenisSoal.hasMany(RiwayatPsikotes, { foreignKey: "jenisSoalId" });
RiwayatPsikotes.belongsTo(JenisSoal, { foreignKey: "jenisSoalId" });


  Lamaran.hasMany(RiwayatPsikotes, {foreignKey: 'lamaranId'});
  RiwayatPsikotes.belongsTo(Lamaran, {foreignKey: 'lamaranId'});

export { UserModel, Resume, HasilPsicotest, PredicCVUmum, SoalPsikotes, JenisSoal, Lowongan, PT, LowonganJenisSoal, Lamaran, CalonKaryawan, JawabanPsikotes, TransaksiModel, RiwayatPsikotes };
