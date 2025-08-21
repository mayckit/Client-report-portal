const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

// middlewares de auth.js
const { isAdmin, isLoggedIn } = require('../middlewares/auth'); 


router.post('/usuario', async (req, res) => {
    const { email, senha, isAdmin: isNewUserAdmin, fullName, cpf, 
            cnpj, companyName, phone, address } = req.body; 

    if (!email || !senha || typeof isNewUserAdmin !== 'boolean') {
        return res.status(400).json({ error: 'Email, senha e tipo de usuário (isAdmin) são obrigatórios' });
    }

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ error: 'Email já cadastrado' });
        }

        const hashedPassword = await bcrypt.hash(senha, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                isAdmin: isNewUserAdmin,
            }
        });

        if (isNewUserAdmin) {
            if (!cpf || !fullName) {
                await prisma.user.delete({ where: { id: user.id } });
                return res.status(400).json({ error: 'CPF e nome completo são obrigatórios para administradores (funcionários)' });
            }

            const existingCpf = await prisma.employee.findUnique({ where: { cpf } });
            if (existingCpf) {
                await prisma.user.delete({ where: { id: user.id } });
                return res.status(409).json({ error: 'CPF já cadastrado' });
            }

            await prisma.employee.create({
                data: {
                    userId: user.id,
                    cpf,
                    fullName
                }
            });

        } else { 
            if (!cnpj || !companyName || !phone || !address) {
                await prisma.user.delete({ where: { id: user.id } });
                return res.status(400).json({ error: 'CNPJ, nome da empresa, telefone e endereço são obrigatórios para empresas' });
            }

            const existingCnpj = await prisma.company.findUnique({ where: { cnpj } });
            if (existingCnpj) {
                await prisma.user.delete({ where: { id: user.id } });
                return res.status(409).json({ error: 'CNPJ já cadastrado' });
            }

            await prisma.company.create({
                data: {
                    userId: user.id,
                    cnpj,
                    companyName,
                    phone,
                    address: address 
                }
            });
        }

        res.status(201).json({ message: 'Usuário criado com sucesso', id: user.id });
    } catch (error) {
        console.error("Erro ao criar usuário:", error);
        res.status(500).json({ error: 'Erro ao criar usuário', details: error.message });
    }
});

// buscar todos os usuários 
router.get('/usuario', isAdmin, async (req, res) => { 
    try {
        const users = await prisma.user.findMany({
            include: {
                employee: true,
                company: true
            }
        });

        res.status(200).json(users);
    } catch (error) {
        console.error("Erro ao buscar usuários:", error);
        res.status(500).json({ error: 'Erro ao buscar usuários', details: error.message });
    }
});

// buscar apenas usuários do tipo Company 
router.get('/usuario/company', isAdmin, async (req, res) => { 
    const page = parseInt(req.query.page) || 1; 
    const limit = parseInt(req.query.limit) || 12; 
    const skip = (page - 1) * limit;

    try {
        const [users, totalItems] = await prisma.$transaction([
            prisma.user.findMany({
                where: { isAdmin: false },
                include: {
                    company: {
                        select: {
                            id: true,
                            companyName: true,
                            cnpj: true,
                            phone: true,
                            address: true
                        }
                    }
                },
                skip: skip,
                take: limit,
                orderBy: {
                    company: { companyName: 'asc' } 
                }
            }),
            prisma.user.count({
                where: { isAdmin: false }
            })
        ]);

        const totalPages = Math.ceil(totalItems / limit);

        res.status(200).json({
            data: users,
            currentPage: page,
            totalPages: totalPages,
            totalItems: totalItems
        });
    } catch (error) {
        console.error("Erro ao buscar usuários empresa (paginado):", error);
        res.status(500).json({ error: 'Erro ao buscar usuários empresa', details: error.message });
    }
});

// buscar usuário pelo ID
router.get('/usuario/:id', isLoggedIn, async (req, res) => { 
    const id = parseInt(req.params.id);

    try {
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                employee: true,
                company: {
                    include: {
                        reports: true
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        if (!req.session.admin && req.session.usuarioId !== user.id) {
            return res.status(403).json({ error: 'Acesso negado. Você só pode visualizar seus próprios dados.' });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error("Erro ao buscar usuário por ID:", error);
        res.status(500).json({ error: 'Erro ao buscar usuário', details: error.message });
    }
});

// atualizar dados de usuário Company
router.put('/usuario/company/:id', isLoggedIn, async (req, res) => { 
    const id = parseInt(req.params.id);
    const { email, companyName, phone, address } = req.body; 

    if (!req.session.admin && req.session.usuarioId !== id) {
        return res.status(403).json({ error: 'Acesso negado. Você só pode atualizar seus próprios dados de empresa.' });
    }

    try {
        const userToUpdate = await prisma.user.findUnique({
            where: { id },
            include: { company: true }
        });

        if (!userToUpdate || userToUpdate.isAdmin) {
            return res.status(404).json({ error: 'Usuário empresa não encontrado ou não é uma empresa.' });
        }

        let updateCompanyData = {};
        if (companyName) updateCompanyData.companyName = companyName;
        if (phone) updateCompanyData.phone = phone;
        if (address !== undefined) updateCompanyData.address = address; 

        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                email: email || userToUpdate.email, 
                company: {
                    update: updateCompanyData 
                }
            },
            include: { company: true }
        });

        res.status(200).json({ message: 'Dados da empresa atualizados com sucesso', user: updatedUser });
    } catch (error) {
        console.error("Erro ao atualizar dados da empresa:", error);
        if (error.code === 'P2002') { 
            return res.status(409).json({ error: 'O CNPJ fornecido já está em uso.' });
        }
        res.status(500).json({ error: 'Erro ao atualizar dados da empresa', details: error.message });
    }
});

// atualizar dados de usuário Employee
router.put('/usuario/employee/:id', isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    const { email, fullName, cpf } = req.body;

    try {
        const userToUpdate = await prisma.user.findUnique({
            where: { id },
            include: { employee: true }
        });

        if (!userToUpdate || !userToUpdate.isAdmin) {
            return res.status(404).json({ error: 'Usuário administrador (funcionário) não encontrado ou não é um administrador.' });
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                email: email || userToUpdate.email,
                employee: {
                    update: {
                        fullName: fullName || userToUpdate.employee?.fullName,
                        cpf: cpf || userToUpdate.employee?.cpf,
                    }
                }
            },
            include: { employee: true }
        });

        res.status(200).json({ message: 'Dados do funcionário atualizados com sucesso', user: updatedUser });
    } catch (error) {
        console.error("Erro ao atualizar dados do funcionário:", error);
        if (error.code === 'P2002') { 
            return res.status(409).json({ error: 'O CPF fornecido já está em uso.' });
        }
        res.status(500).json({ error: 'Erro ao atualizar dados do funcionário', details: error.message });
    }
});


// Deletar usuário 
router.delete('/usuario/:id', isAdmin, async (req, res) => { 
    const { id } = req.params;

    try {
        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) },
            include: {
                employee: true,
                company: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        if (user.isAdmin && user.employee) {
            await prisma.employee.delete({ where: { userId: user.id } });
        } else if (!user.isAdmin && user.company) {
            await prisma.report.deleteMany({ where: { companyId: user.company.id } });
            await prisma.company.delete({ where: { userId: user.id } });
        }

        await prisma.user.delete({ where: { id: user.id } });

        res.status(200).json({ message: 'Usuário deletado com sucesso' });
    } catch (error) {
        console.error("Erro ao deletar usuário:", error);
        res.status(500).json({ error: 'Erro ao deletar usuário', details: error.message });
    }
});

module.exports = router;
