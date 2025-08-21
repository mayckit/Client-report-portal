const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middlewares/auth');

const { PrismaClient } = require('../generated/prisma'); 
const prisma = new PrismaClient(); 

router.get('/adminDashboard', isAdmin, async (req, res) => {
    try {
        const empresas = await prisma.user.findMany({
            where: {
                company: {
                    isNot: null 
                }
            },
            select: {
                id: true,
                email: true,
                company: {
                    select: {
                        id: true,
                        companyName: true,
                        cnpj: true,
                        phone: true,
                        address: true
                    }
                }
            }
        });

        res.render('adminDashboard', {
            title: 'Painel do Administrador',
            usuario: { 
                email: req.session.user?.email || '',
                isAdmin: true,
                id: req.session.user?.id
            },
            empresas 
        });

    } catch (error) {
        console.error('Erro ao carregar empresas:', error);
        res.render('adminDashboard', {
            title: 'Painel do Administrador',
            usuario: { isAdmin: true, email: req.session.user?.email || '' }, 
            empresas: [],
            erroEmpresas: 'Erro ao carregar empresas. Tente novamente mais tarde.'
        });
    }
});

module.exports = router;
