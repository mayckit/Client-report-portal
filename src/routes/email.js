const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
require('dotenv').config();

router.post('/send-email', async (req, res) => {
  const { nome, email, assunto, mensagem } = req.body;

  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: true,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
    tls: { rejectUnauthorized: false }
  });

  const mailOptions = {
    from: process.env.MAIL_USER,
    to: process.env.MAIL_RECEP,
    subject: `Contato via Site: ${assunto}`,
    text: `
      Nome: ${nome}
      E-mail: ${email}
      Assunto: ${assunto}
      Mensagem: ${mensagem}
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ E-mail enviado com sucesso!');
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Erro ao enviar e-mail:', error);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
