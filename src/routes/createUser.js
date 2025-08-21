const express = require('express');
const router = express.Router();

const { isLoggedIn, isAdmin } = require('../middlewares/auth');

router.get('/create-user', isLoggedIn, isAdmin, (req, res) => {
    res.render('createUser', { 
        title: 'Cadastrar Novo Usuário',
        user: res.locals.user
    });
});

module.exports = router;
