const nodemailer = require('nodemailer');

const user = 'cmnlu6u8760fbpb08z51lbqve';
const pass = 'oCTxfqiPcHdj4itqvef6H8Xzq23xacF1';
const to = process.argv[2] || 'admin@gudangku.space';

(async () => {
  try {
    const tr = nodemailer.createTransport({
      host: 'smtp.sumopod.com',
      port: 465,
      secure: true,
      auth: { user, pass }
    });
    await tr.verify();
    console.log('OK - SMTP verified!');
    const info = await tr.sendMail({
      from: '"Gudangku" <admin@gudangku.space>',
      to,
      subject: 'Test Email - Gudangku SMTP',
      text: 'SMTP is working correctly!'
    });
    console.log('Email sent:', info.messageId);
  } catch (e) {
    console.log('FAIL:', e.response || e.message);
  }
})();
