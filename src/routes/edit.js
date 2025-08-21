const express = require('express');
const router = express.Router();
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const { isLoggedIn } = require('../middlewares/auth')

router.get('/edit/:id', (req, res) => {
  res.render('editCompany', { title: 'Editar Company' });
});

router.get('/edit-profile', isLoggedIn, async (req, res) => {
    try {
        const userCompany = await prisma.company.findUnique({
            where: {
                userId: req.session.usuarioId
            },
            include: {
                user: true 
            }
        });

        if (!userCompany) {
            console.log("Nenhuma empresa encontrada para o usuário:", req.session.usuarioId);
            return res.redirect('/dashboard');
        }

        res.render('edit-profile', {
            layout: 'main',
            title: 'Editar Perfil',
            user: req.session.usuario,
            companyData: userCompany, 
            userEmail: userCompany.user.email 
        });

    } catch (error) {
        console.error("Erro ao buscar dados para edição de perfil:", error);
        res.redirect('/dashboard');
    }
});

router.post('/edit-profile', isLoggedIn, async (req, res) => {
    try {
        const { companyName, cnpj, phone, address, email, password } = req.body;

        const userCompany = await prisma.company.findUnique({
            where: { userId: req.session.usuarioId }
        });

        if (!userCompany) {
            return res.status(403).send('Acesso negado.');
        }

        await prisma.company.update({
            where: { id: userCompany.id },
            data: {
                companyName,
                cnpj,
                phone,
                address
            }
        });

        const userDataToUpdate = { email };
        if (password) {
            userDataToUpdate.password = password;
        }

        await prisma.user.update({
            where: { id: req.session.usuarioId },
            data: userDataToUpdate
        });

        res.redirect('/dashboard');

    } catch (error) {
        console.error("Erro ao salvar perfil:", error);
        res.redirect('/edit-profile');
    }
});

module.exports = router;
