import Lowongan from "../../../models/lowonganModel.js";
import PTModel from "../../../models/PTModel.js";
import JenisSoal from "../../../models/jenisSoalModel.js";
import LowonganJenisSoal from "../../../models/lowonganJenisSoalModel.js";
import Lamaran from "../../../models/lamaranModel.js";
import UserModel from "../../../models/userModel.js";
import sequelize from "../../../config/dataBase.js";
import { Op } from "sequelize";

import puppeteer from 'puppeteer';
import ExcelJS from 'exceljs';
import handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';

export const createLowongan = async (req, res) => {
    const { judul, deskripsi, tanggalTutup } = req.body;
    const { ptId } = req.user;
  
    try {
      // Validasi input
      if (!judul || !deskripsi || !tanggalTutup) {
        return res.status(400).json({ message: 'Judul, deskripsi, dan tanggal tutup harus diisi.' });
      }
  
      // Cek apakah PT ada
      const pt = await PTModel.findByPk(ptId);
      if (!pt) {
        return res.status(404).json({ message: 'PT tidak ditemukan.' });
      }
  
      // Buat lowongan
      const newLowongan = await Lowongan.create({
        judul,
        deskripsi,
        tanggalTutup,
        ptId,
      });
  
      return res.status(201).json({
        message: 'Lowongan berhasil dibuat.',
        data: newLowongan,
      });
    } catch (error) {
      console.error('Error creating lowongan:', error);
      return res.status(500).json({ message: 'Terjadi kesalahan saat membuat lowongan.' });
    }
  };


  // Menambahkan jenis soal ke lowongan
  export const addJenisSoalToLowongan = async (req, res) => {
    const { lowonganId } = req.params;
    const { jenisSoalIds } = req.body;

    try {
        // Validasi input
        if (!jenisSoalIds || !Array.isArray(jenisSoalIds)) {
            return res.status(400).json({ message: 'Jenis soal harus berupa array.' });
        }

        const transaction = await sequelize.transaction();
        
        try {
            // Cek lowongan
            const lowongan = await Lowongan.findByPk(lowonganId, { transaction });
            if (!lowongan) {
                await transaction.rollback();
                return res.status(404).json({ message: 'Lowongan tidak ditemukan.' });
            }

            // Hapus dulu semua relasi yang ada (optional)
            await LowonganJenisSoal.destroy({
                where: { lowonganId },
                transaction
            });

            // Tambahkan yang baru
            const records = jenisSoalIds.map(jenisSoalId => ({
                lowonganId,
                jenisSoalId
            }));

            await LowonganJenisSoal.bulkCreate(records, { transaction });
            
            await transaction.commit();
            
            return res.status(201).json({
                message: 'Jenis soal berhasil ditambahkan ke lowongan.',
            });
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ 
            message: 'Terjadi kesalahan saat menambahkan jenis soal ke lowongan.',
            error: error.message 
        });
    }
};
  // Get data lowongan untuk Admin PT
  export const getLowonganForAdminPT = async (req, res) => {
    const { ptId } = req.user; // Ambil ptId dari user yang login (Admin PT)
  
    try {
      const lowonganList = await Lowongan.findAll({
        where: { ptId },
        include: [
          {
            model: PTModel,
            attributes: ['namaPT', 'alamat'],
          },
          {
            model: JenisSoal,
            attributes: ['id', 'namaJenis', 'deskripsi'],
            through: {
              attributes: [], // Jangan ambil atribut dari tabel pivot
            },
          },
        ],
      });
  
      return res.status(200).json({
        message: 'Data lowongan berhasil diambil.',
        data: lowonganList,
      });
    } catch (error) {
      console.error('Error fetching lowongan for Admin PT:', error);
      return res.status(500).json({ message: 'Terjadi kesalahan saat mengambil data lowongan.' });
    }
  };
  

  // Get semua data lowongan untuk calon karyawan
export const getAllLowongan = async (req, res) => {
  try {
    const lowonganAktif = await Lowongan.findAll({
      where: {
        status: 'active',
      },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: PTModel,
          attributes: ['namaPT', 'alamat'],
        },
        
      ]
    });

    res.status(200).json({
      message: 'Berhasil mengambil lowongan yang aktif',
      data: lowonganAktif,
    });
  } catch (error) {
    console.error('Error saat mengambil lowongan aktif:', error);
    res.status(500).json({
      message: 'Gagal mengambil data lowongan aktif',
    });
  }
};

export const updateStatusLowongan = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validasi status yang diterima
    if (!['active', 'unactive'].includes(status)) {
      return res.status(400).json({ message: 'Status tidak valid. Gunakan "active" atau "unactive".' });
    }

    const lowongan = await Lowongan.findByPk(id);

    if (!lowongan) {
      return res.status(404).json({ message: 'Lowongan tidak ditemukan.' });
    }

    lowongan.status = status;
    await lowongan.save();

    res.status(200).json({
      message: `Status lowongan berhasil diperbarui menjadi '${status}'.`,
      data: lowongan,
    });
  } catch (error) {
    console.error('Error saat mengubah status lowongan:', error);
    res.status(500).json({ message: 'Gagal memperbarui status lowongan.' });
  }
};

  export const getPelamarByPT = async (req, res) => {
    const { ptId } = req.user; // Ambil ptId dari user yang login (Admin PT)
  
    try {
      // Cari semua lowongan yang terkait dengan PT tersebut
      const lowonganList = await Lowongan.findAll({
        where: { ptId },
        attributes: ["id"], // Ambil hanya id lowongan
      });
  
      // Ekstrak id lowongan
      const lowonganIds = lowonganList.map((lowongan) => lowongan.id);
  
      // Cari semua lamaran yang terkait dengan lowongan tersebut
      const pelamarList = await Lamaran.findAll({
        where: { lowonganId: lowonganIds },
        attributes: ["status"], // Ambil hanya id lamaran
        include: [
          {
            model: UserModel, 
            attributes: ["id", "name", "email"], 
          },
          {
            model: Lowongan, 
            attributes: ["judul"], 
            include: [
              {
                model: PTModel, 
                attributes: ["namaPT"],
              },
            ],
          },
        ],
      });
  
      return res.status(200).json({
        message: "Data pelamar berhasil diambil.",
        data: pelamarList,
      });
    } catch (error) {
      console.error("Error fetching pelamar data:", error);
      return res.status(500).json({ message: "Terjadi kesalahan saat mengambil data pelamar." });
    }
  };


//get data user berdasarkan lowongan
export const getUsersByLowongan = async (req, res) => {
  const { lowonganId } = req.params; // Ambil lowonganId dari params

  try {
    // Cari semua lamaran yang terkait dengan lowongan tersebut
    const pelamarList = await Lamaran.findAll({
      where: { lowonganId },
      include: [
        {
          model: UserModel, // Sertakan data user (calon karyawan)
          attributes: ["id", "name", "email"], // Ambil data yang diperlukan
        },
        {
          model: Lowongan, // Sertakan data lowongan
          attributes: ["judul"], // Ambil judul lowongan
          include: [
            {
              model: PTModel, // Sertakan data PT
              attributes: ["namaPT"], // Ambil nama PT
            },
          ],
        },
      ],
    });

    return res.status(200).json({
      message: "Data user berdasarkan lowongan berhasil diambil.",
      data: pelamarList,
    });
  } catch (error) {
    console.error("Error fetching users by lowongan:", error);
    return res.status(500).json({ message: "Terjadi kesalahan saat mengambil data user." });
  }
};


export const getLowonganById = async (req, res) => {
  const { id } = req.params;

  try {
    const lowongan = await Lowongan.findByPk(id, {
      include: [
        {
          model: PTModel,
          attributes: ['namaPT', 'alamat'],
        },
        {
          model: JenisSoal,
          attributes: ['id', 'namaJenis', 'deskripsi'],
          through: {
            attributes: [],
          },
        },
      ],
    });

    if (!lowongan) {
      return res.status(404).json({ message: 'Lowongan tidak ditemukan.' });
    }

    return res.status(200).json({
      message: 'Detail lowongan berhasil diambil.',
      data: lowongan,
    });
  } catch (error) {
    console.error('Error saat mengambil data lowongan:', error);
    return res.status(500).json({ message: 'Gagal mengambil detail lowongan.' });
  }
};


export const deleteLowongan = async (req, res) => {
  const { id } = req.params;

  try {
    const lowongan = await Lowongan.findByPk(id);

    if (!lowongan) {
      return res.status(404).json({ message: 'Lowongan tidak ditemukan.' });
    }

    await lowongan.destroy();

    return res.status(200).json({ message: 'Lowongan berhasil dihapus.' });
  } catch (error) {
    console.error('Error saat menghapus lowongan:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan saat menghapus lowongan.' });
  }
};

export const generatePelamarReport = async (req, res) => {
  const { lowonganId } = req.params;

  try {
    // 1. Get data dengan error handling lebih ketat
    const lowongan = await Lowongan.findByPk(lowonganId, {
      include: [
        {
          model: PTModel,
          attributes: ['namaPT'],
          required: true // Pastikan PT ada
        }
      ]
    });

    if (!lowongan) {
      return res.status(404).json({ message: 'Lowongan tidak ditemukan' });
    }

    const pelamarList = await Lamaran.findAll({
      where: { lowonganId },
      include: [
        {
          model: UserModel,
          attributes: ['name', 'email'],
          required: true // Pastikan User ada
        }
      ],
      order: [['createdAt', 'DESC']]
    });
  

   // 2. Format data pelamar dengan penanganan Sequelize yang benar
const formattedPelamar = pelamarList.map((p, index) => {
  // Akses dataValues untuk mendapatkan nilai sebenarnya
  const userData = p.user?.dataValues || {};
  const lamaranData = p.dataValues || {};
  
  return {
    no: index + 1,
    nama: userData.name || 'Nama tidak tersedia',
    email: userData.email || 'Email tidak tersedia',
    status: lamaranData.status || 'menunggu',
    tanggalDaftar: lamaranData.createdAt ? 
      new Date(lamaranData.createdAt).toLocaleDateString('id-ID') : 
      'Tanggal tidak tersedia'
  };
});

    // 3. Baca template
    const templatePath = path.join(process.cwd(), 'templates', 'laporanLowongan.hbs');
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    
    // 4. Kompilasi template
    const template = handlebars.compile(templateContent);
    const html = template({
      judul: lowongan.judul || 'Judul tidak tersedia',
      perusahaan: lowongan.PT?.namaPT || 'Perusahaan tidak tersedia',
      tanggalBuka: lowongan.createdAt ? 
        new Date(lowongan.createdAt).toLocaleDateString('id-ID') : 
        'Tanggal tidak tersedia',
      tanggalTutup: lowongan.tanggalTutup ? 
        new Date(lowongan.tanggalTutup).toLocaleDateString('id-ID') : 
        'Tanggal tidak tersedia',
      pelamar: formattedPelamar,
      generatedAt: new Date().toLocaleString('id-ID')
    });
    // 4. Generate PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox']
    });
    const page = await browser.newPage();
    
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });

    await browser.close();

    // 5. Kirim PDF sebagai response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Laporan_Pelamar_${lowongan.judul}.pdf`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      message: 'Gagal membuat laporan',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};


export const getAllPelamarReport = async (req, res) => {
  try {
    const { ptId } = req.user; // Ambil ptId dari token

    // 1. Get semua data pelamar berdasarkan PT
    const pelamarList = await Lamaran.findAll({
      include: [
        {
          model: UserModel,
          attributes: ['name', 'email'],
          required: true
        },
        {
          model: Lowongan,
          attributes: ['judul', 'tanggalTutup'],
          where: { ptId }, // Filter by PT
          include: [{
            model: PTModel,
            attributes: ['namaPT']
          }]
        }
      ],
      order: [
        ['createdAt', 'DESC']
      ]
    });

    // 2. Validasi data
    if (pelamarList.length === 0) {
      return res.status(404).json({ 
        message: 'Tidak ada data pelamar untuk PT Anda' 
      });
    }

    // 3. Format data
    const formattedPelamar = pelamarList.map((p, index) => {
      const lamaran = p.dataValues;
      const user = p.user?.dataValues || {};
      const lowongan = p.lowongan?.dataValues || {};
      const pt = p.lowongan?.PT?.dataValues || {};

      return {
        no: index + 1,
        nama: user.name || '-',
        email: user.email || '-',
        lowongan: lowongan.judul || '-',
        perusahaan: pt.namaPT || '-',
        status: lamaran.status || 'menunggu',
        tanggalDaftar: lamaran.createdAt?.toLocaleDateString('id-ID') || '-',
        tanggalTutup: lowongan.tanggalTutup?.toLocaleDateString('id-ID') || '-'
      };
    });

    // 4. Generate PDF (sama seperti sebelumnya)
    const templatePath = path.join(process.cwd(), 'templates', 'laporanAllPelamar.hbs');
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    
    const template = handlebars.compile(templateContent);
    const html = template({
      totalPelamar: pelamarList.length,
      pelamar: formattedPelamar,
      generatedAt: new Date().toLocaleString('id-ID'),
      perusahaan: pelamarList[0]?.lowongan?.PT?.namaPT || 'Perusahaan Anda' // Tambahkan header khusus PT
    });

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });

    await browser.close();

    // 5. Kirim response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Laporan_Pelamar_${ptId}.pdf`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      message: 'Gagal membuat laporan',
      error: error.message 
    });
  }
};


export const downloadlowonganLaporanExcel = async (req, res) => {
  const { ptId } = req.user;

  try {
    // 1. Ambil data dari database
    const pelamarList = await Lamaran.findAll({
      include: [
        {
          model: UserModel,
          attributes: ['name', 'email', 'phoneNumber'],
          required: true
        },
        {
          model: Lowongan,
          attributes: ['judul', 'tanggalTutup'],
          where: { ptId },
          include: [{
            model: PTModel,
            attributes: ['namaPT']
          }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    if (pelamarList.length === 0) {
      return res.status(404).json({ message: 'Tidak ada data pelamar' });
    }

    // 2. Buat workbook Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data Pelamar');

    // 3. Set header kolom
    worksheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Nama', key: 'nama', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Telepon', key: 'phone', width: 15 },
      { header: 'Lowongan', key: 'lowongan', width: 30 },
      { header: 'Perusahaan', key: 'perusahaan', width: 25 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Tanggal Daftar', key: 'tanggalDaftar', width: 20 }
    ];

    // 4. Isi data
    pelamarList.forEach((pelamar, index) => {
      worksheet.addRow({
        no: index + 1,
        nama: pelamar.user.name,
        email: pelamar.user.email,
        phone: pelamar.user.phoneNumber || '-',
        lowongan: pelamar.lowongan.judul,
        perusahaan: pelamar.lowongan.PT.namaPT,
        status: pelamar.status,
        tanggalDaftar: new Date(pelamar.createdAt).toLocaleDateString('id-ID')
      });
    });

    // 5. Styling header
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F81BD' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // 6. Set response header
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Laporan_Pelamar_${new Date().toISOString().split('T')[0]}.xlsx`
    );

    // 7. Kirim file
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error generating Excel:', error);
    res.status(500).json({ 
      message: 'Gagal membuat laporan Excel',
      error: error.message 
    });
  }
};


export const downloadLaporanLowonganExcelPerLowongan = async (req, res) => {
  const { lowonganId } = req.params;

  try {
    // 1. Get data spesifik lowongan
    const lowongan = await Lowongan.findByPk(lowonganId, {
      include: [{
        model: PTModel,
        attributes: ['namaPT']
      }]
    });

    if (!lowongan) {
      return res.status(404).json({ message: 'Lowongan tidak ditemukan' });
    }

    // 2. Get data pelamar
    const pelamarList = await Lamaran.findAll({
      where: { lowonganId },
      include: [{
        model: UserModel,
        attributes: ['name', 'email', 'phoneNumber']
      }],
      order: [['createdAt', 'DESC']]
    });

    // 3. Create Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Pelamar');

    // Styling Header
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F81BD' }
    };

    // Set Columns
    worksheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Nama Pelamar', key: 'nama', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Telepon', key: 'telepon', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Tanggal Daftar', key: 'tanggalDaftar', width: 20 }
    ];

    // Add Data
    pelamarList.forEach((pelamar, index) => {
      worksheet.addRow({
        no: index + 1,
        nama: pelamar.user.name,
        email: pelamar.user.email,
        telepon: pelamar.user.phoneNumber || '-',
        status: pelamar.status,
        tanggalDaftar: new Date(pelamar.createdAt).toLocaleDateString('id-ID')
      });
    });

    // 4. Set Response
    const fileName = `Laporan_Pelamar_${lowongan.judul.replace(/[^a-z0-9]/gi, '_')}.xlsx`;
    
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileName}"`
    );

    // 5. Send Excel
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      message: 'Gagal generate laporan',
      error: error.message 
    });
  }
};