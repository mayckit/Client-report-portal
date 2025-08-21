const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middlewares/auth'); 
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

router.get('/dashboard', isLoggedIn, async (req, res) => {
    const userId = req.session.usuarioId;

    if (!userId) {
        return res.redirect('/login');
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { 
                company: {
                    include: {
                        reports: {
                            orderBy: { creationDate: 'desc' } 
                        }
                    }
                },
                employee: true 
            } 
        });

        if (!user) {
            req.session.destroy((err) => {
                if (err) console.error("Erro ao destruir sessão:", err);
            });
            return res.redirect('/login');
        }

        if (user.isAdmin) { 
            console.log("Redirecionando administrador para /adminDashboard");
            return res.redirect('/adminDashboard');
        } else if (user.company) {
            console.log("Renderizando dashboard para usuário da empresa:", user.company.companyName);
            res.render('dashboard', {
                title: 'Dashboard da Empresa',
                user: res.locals.user,
                companyData: user.company, 
                reports: user.company.reports 
            });
        } else {
            console.log("Usuário logado sem perfil de empresa ou admin. Redirecionando para home.");
            return res.redirect('/'); 
        }

    } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
        res.status(500).render('500', { 
            title: 'Erro no Servidor',
            message: 'Não foi possível carregar o dashboard. Tente novamente mais tarde.',
            user: res.locals.user
        });
    }
});

module.exports = router;
