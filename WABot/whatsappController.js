// import qrcode from 'qrcode-terminal';
// import pkg from 'whatsapp-web.js';
// const { Client, LocalAuth } = pkg;
// import Users from "../models/userModel.js";
// import Resume from "../models/Resume.js";
// import HasilPsicotest from "../models/hasilPsikotes.js";

// const client = new Client({
//     authStrategy: new LocalAuth(), // Sesi tersimpan secara otomatis di folder .wwebjs_auth
// });

// // Event untuk menangani QR code
// client.on('qr', (qr) => {
//     console.log('QR code generated!');
//     qrcode.generate(qr, { small: true }); // Menampilkan QR code di terminal
//     console.log('Scan QR code ini di WhatsApp Web.');
// });

// // Event ketika klien sudah siap
// client.on('ready', () => {
//     console.log('WhatsApp client is ready!');
//     client.connected = true; // Menandakan klien terhubung
// });

// // Event ketika klien terputus
// client.on('disconnected', async (reason) => {
//     console.log('WhatsApp disconnected:', reason);
//     client.connected = false; // Tandai klien terputus
//     console.log('Reinitializing client...');

//     try {
//         // Menunggu beberapa detik sebelum mencoba menghancurkan dan menginisialisasi ulang
//         await new Promise(resolve => setTimeout(resolve, 5000));
//         await client.destroy(); // Hancurkan klien yang tidak terhubung
//         await client.initialize(); // Inisialisasi ulang klien
//     } catch (error) {
//         console.error('Error during disconnection and reinitialization:', error);
//     }
// });

// // Inisialisasi klien
// client.initialize();
// // Fungsi untuk mengirim pesan WhatsApp dengan hasil resume dan psikotes
// export const sendWhatsAppMessage = async (req, res) => {
//     const { userId } = req.params; // Ambil userId dari params

//     try {
//         // Ambil data pengguna termasuk nomor telepon berdasarkan userId
//         const user = await Users.findOne({
//             where: { id: userId },
//             include: [
//                 {
//                     model: Resume,
//                     as: 'resumes',
//                     attributes: ['probability', 'predicted_category', 'upload_date']
//                 },
//                 {
//                     model: HasilPsicotest,
//                     as: 'hasilPsikotests',
//                     attributes: ['totalScore', 'date']
//                 }
//             ]
//         });

//         if (!user) {
//             return res.status(404).json({ msg: 'User tidak ditemukan' });
//         }

//         const phoneNumber = user.phoneNumber;
//         if (!phoneNumber) {
//             return res.status(400).json({ msg: 'Nomor telepon tidak ditemukan pada pengguna' });
//         }

//         const message = `Halo ${user.name}!\nBerikut adalah hasil Seleksi Anda:\n\nHasil prediksi CV:\n- Posisi Sebagai: ${user.resumes[0]?.predicted_category || 'Tidak ada posisi yang cocok'}\n- Probaliti: ${user.resumes[0]?.probability || 'Tidak ada hasil prediksi CV'}\n- Tanggal Upload: ${user.resumes[0]?.upload_date || 'Tidak ada tanggal'}\n\nHasil Psikotes:\n- Skor: ${user.hasilPsikotests[0]?.totalScore || 'Belum ada skor'}\n- Tanggal Tes: ${user.hasilPsikotests[0]?.date || 'Tidak ada tanggal'}`;

//         // Periksa apakah klien terhubung sebelum mengirim pesan
//         if (client.connected) {
//             await client.sendMessage(`${phoneNumber}@c.us`, message);
//             res.status(200).json({ msg: 'Pesan berhasil dikirim!' });
//         } else {
//             console.log('Client not connected. Reinitializing...');
//             try {
//                 await client.destroy();
//                 await client.initialize();
//                 res.status(500).json({ msg: 'Klien WhatsApp tidak terhubung. Sedang menghubungkan ulang.' });
//             } catch (error) {
//                 console.error('Error during client reinitialization:', error);
//                 res.status(500).json({ msg: 'Gagal menghubungkan ulang klien WhatsApp.' });
//             }
//         }
//     } catch (error) {
//         console.error('Gagal mengirim pesan:', error);
//         if (error.message.includes('Execution context was destroyed')) {
//             console.log('Reinitializing client due to execution context error...');
//             try {
//                 await client.destroy();
//                 await client.initialize();
//             } catch (reinitError) {
//                 console.error('Error during client reinitialization:', reinitError);
//             }
//         }
//         res.status(500).json({ msg: 'Gagal mengirim pesan' });
//     }
// };

// // Fungsi untuk logout dari WhatsApp
// export const logoutWhatsApp = async (req, res) => {
//     try {
//         // Menghancurkan sesi yang aktif jika client terhubung
//         if (client && client.connected) {
//             await client.destroy();
//             console.log('WhatsApp client logged out and session destroyed.');
//             res.status(200).json({ msg: 'Berhasil logout dan sesi dihancurkan.' });
//         } else {
//             res.status(400).json({ msg: 'Tidak ada sesi yang aktif.' });
//         }
//     } catch (error) {
//         console.error('Gagal logout:', error);
//         res.status(500).json({ msg: 'Gagal logout', error: error.message });
//     }
// };
