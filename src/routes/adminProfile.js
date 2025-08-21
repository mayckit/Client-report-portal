const express = require('express');
const router = express.Router();
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs'); 


const { isLoggedIn, isAdmin } = require('../middlewares/auth'); 

router.get('/edit-profile', isLoggedIn, isAdmin, async (req, res) => {
    const adminUserId = req.session.usuarioId;

    try {
        const adminUser = await prisma.user.findUnique({
            where: { id: adminUserId },
            select: {
                id: true,
                email: true,
                isAdmin: true,
                employee: { 
                    select: {
                        id: true,
                        fullName: true,
                        cpf: true
                    }
                }
            }
        });

        if (!adminUser) {
            return res.status(404).render('404', { 
                title: 'Perfil Admin Não Encontrado',
                message: 'Seu perfil de administrador não pôde ser carregado.',
                user: res.locals.user 
            });
        }

        res.render('editAdminProfile', { 
            title: 'Editar Meu Perfil de Administrador',
            user: res.locals.user, 
            profileData: adminUser 
        });

    } catch (error) {
        console.error("Erro ao carregar perfil do administrador:", error);
        res.status(500).render('500', {
            title: 'Erro no Servidor',
            message: 'Não foi possível carregar seu perfil de administrador.',
            user: res.locals.user
        });
    }
});

router.put('/edit-profile', isLoggedIn, isAdmin, async (req, res) => {
    const adminUserId = req.session.usuarioId;
    const { email, password, fullName, cpf } = req.body; 

    if (!email && !password && !fullName && !cpf) {
        return res.status(400).json({ error: 'Pelo menos um campo (email, senha, nome completo ou CPF) deve ser fornecido para atualização.' });
    }

    try {
        const transaction = []; 

        let updateUserData = {};
        if (email) updateUserData.email = email;
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateUserData.password = hashedPassword;
        }

        if (Object.keys(updateUserData).length > 0) {
            transaction.push(prisma.user.update({
                where: { id: adminUserId },
                data: updateUserData,
            }));
        }

        if (fullName || cpf) {
            let updateEmployeeData = {};
            if (fullName) updateEmployeeData.fullName = fullName;
            if (cpf) updateEmployeeData.cpf = cpf;

            const existingEmployee = await prisma.employee.findUnique({
                where: { userId: adminUserId }
            });

            if (existingEmployee) {
                transaction.push(prisma.employee.update({
                    where: { userId: adminUserId },
                    data: updateEmployeeData,
                }));
            } else {
                if (fullName || cpf) {
                    return res.status(404).json({ error: 'Registro de funcionário não encontrado para este administrador.' });
                }
            }
        }
        
        await prisma.$transaction(transaction);

        const updatedAdmin = await prisma.user.findUnique({
            where: { id: adminUserId },
            include: { employee: true } 
        });

        if (updatedAdmin) {
            req.session.user = updatedAdmin; 
            req.session.admin = updatedAdmin.isAdmin; 
        }

        res.status(200).json({ message: 'Perfil de administrador atualizado com sucesso!', user: updatedAdmin });

    } catch (error) {
        console.error("Erro ao atualizar perfil do administrador:", error);
        if (error.code === 'P2002') { 
            let errorMessage = 'O e-mail ou CPF fornecido já está em uso.';
            if (error.meta?.target.includes('email')) errorMessage = 'O e-mail fornecido já está em uso.';
            if (error.meta?.target.includes('cpf')) errorMessage = 'O CPF fornecido já está em uso.';
            return res.status(409).json({ error: errorMessage });
        }
        res.status(500).json({ error: 'Erro interno do servidor ao atualizar o perfil do administrador.', details: error.message });
    }
});

module.exports = router;
