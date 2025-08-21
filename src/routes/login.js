const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

router.get('/login', (req, res) => {
    if (req.session.usuarioId) {
        if (req.session.admin) {
            return res.redirect('/adminDashboard');
        } else if (req.session.companyId) {
            return res.redirect('/dashboard'); 
        }
        return res.redirect('/'); 
    }
    res.render('login', { title: 'Login' });
});

router.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email },
            include: { company: true }
        });

        if (!user || !(await bcrypt.compare(senha, user.password))) {
            return res.status(401).json({ error: 'Email ou senha inválidos.' });
        }

        req.session.usuarioId = user.id;
        req.session.admin = user.isAdmin;
        req.session.companyId = user.company ? user.company.id : null; 

        if (user.isAdmin) {
            return res.status(200).json({ message: 'Login bem-sucedido', user: { id: user.id, isAdmin: true }, redirectTo: '/adminDashboard' });
        } else if (user.company) { 
            return res.status(200).json({ message: 'Login bem-sucedido', user: { id: user.id, isAdmin: false, companyId: user.company.id }, redirectTo: '/dashboard' });
        } else {
            return res.status(200).json({ message: 'Login bem-sucedido', user: { id: user.id, isAdmin: false }, redirectTo: '/' });
        }

    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({ error: 'Erro interno do servidor durante o login.' });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Erro ao fazer logout:", err);
            return res.status(500).json({ error: 'Erro ao fazer logout.' });
        }
        res.redirect('/login');
    });
});

module.exports = router;
