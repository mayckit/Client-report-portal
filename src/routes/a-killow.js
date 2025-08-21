const express = require('express');
const router = express.Router();

router.get('/a-killow', (req, res) => {
  res.render('a-killow', { title: 'A Killow' });
});

module.exports = router;
