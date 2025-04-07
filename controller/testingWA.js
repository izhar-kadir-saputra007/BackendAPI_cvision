import axios from 'axios';

const apiKey = '6ViyngSvUqb1USEzddfZICTT9dwiB37Ta0DpkZlthDU9pw9g8O';
const url = 'https://api.ngirimwa.com/send-message';

const sendWhatsAppMessage = async (phoneNumber, message) => {
  try {
    const response = await axios.post(url, {
      api_key: apiKey,
      phone: phoneNumber,  // ganti dengan nomor telepon tujuan
      message: message      // isi pesan
    });
    console.log('Pesan berhasil dikirim:', response.data);
  } catch (error) {
    console.error('Gagal mengirim pesan:', error.response ? error.response.data : error.message);
  }
};

sendWhatsAppMessage('+6282290316560', 'Ini adalah pesan tes menggunakan ngirimWA!');
