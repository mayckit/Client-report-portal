const express = require('express');
const router = express.Router();

router.get('/contact', (req, res) => {
  res.render('contact', { title: 'Contato' });
});

module.exports = router;
