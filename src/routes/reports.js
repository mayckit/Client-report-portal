const express = require('express');
const router = express.Router();
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const fs = require('fs').promises;
const path = require('path');

const upload = require('../config/MulterConfig');

const { isAdmin, isLoggedIn } = require('../middlewares/auth');
const { authorizeReportAccess } = require('../middlewares/authorizedReportAcess');

router.post('/reports', isLoggedIn, upload.single('pdfFile'), async (req, res) => {
    const { description, creationDate, companyId } = req.body;
    if (!req.file) {
        return res.status(400).json({ error: 'Arquivo PDF é obrigatório.' });
    }
    let targetCompanyId;
    if (req.session.admin && companyId) {
        targetCompanyId = parseInt(companyId, 10);
    } else if (!req.session.admin) {
        const userCompany = await prisma.company.findUnique({
            where: { userId: req.session.usuarioId },
            select: { id: true }
        });
        if (!userCompany) {
            return res.status(403).json({ error: 'Acesso negado. Usuário não associado a uma empresa.' });
        }
        targetCompanyId = userCompany.id;
    } else {
        return res.status(400).json({ error: 'ID da empresa é obrigatório para administradores.' });
    }
    try {
        const fileName = req.file.filename;
        const filePathRelative = `/pdfs/${fileName}`;
        const report = await prisma.report.create({
            data: {
                description,
                creationDate: new Date(creationDate),
                companyId: targetCompanyId,
                filePath: filePathRelative,
                fileName: fileName
            }
        });
        res.status(201).json({ message: 'Relatório criado com sucesso', report });
    } catch (error) {
        await fs.unlink(req.file.path);
        console.error("Erro ao criar relatório:", error);
        res.status(500).json({ error: 'Erro ao criar relatório', details: error.message });
    }
});

router.get('/reports', authorizeReportAccess, async (req, res) => {
    try {
        let reports;
        const queryCompanyId = req.query.companyId ? parseInt(req.query.companyId, 10) : null;
        if (req.session.admin) {
            const whereClause = queryCompanyId ? { companyId: queryCompanyId } : {};
            reports = await prisma.report.findMany({ where: whereClause });
        } else {
            const userCompany = await prisma.company.findUnique({ where: { userId: req.session.usuarioId } });
            if (!userCompany) return res.status(403).json({ error: 'Acesso negado.' });
            reports = await prisma.report.findMany({ where: { companyId: userCompany.id } });
        }
        res.status(200).json(reports);
    } catch (error) {
        console.error("Erro ao buscar relatórios:", error);
        res.status(500).json({ error: 'Erro ao buscar relatórios', details: error.message });
    }
});


router.get('/reports/:id/download', authorizeReportAccess, async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const report = await prisma.report.findUnique({ where: { id } });
        if (!report || !report.filePath) {
            return res.status(404).json({ error: 'Arquivo do relatório não encontrado no banco de dados.' });
        }
        const absoluteFilePath = path.join(__dirname, '..', '..', 'uploads', 'pdfs', report.fileName);

        console.log(`Tentando acessar o arquivo em: ${absoluteFilePath}`);

        await fs.access(absoluteFilePath);
        res.download(absoluteFilePath, report.fileName);

    } catch (error) {
        console.error("Erro ao baixar PDF do relatório:", error);
        if (error.code === 'ENOENT') {
            res.status(404).json({ error: 'Arquivo físico não encontrado no servidor.' });
        } else {
            res.status(500).json({ error: 'Erro interno ao baixar o relatório.', details: error.message });
        }
    }
});


router.delete('/reports/:id', authorizeReportAccess, async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const reportToDelete = await prisma.report.findUnique({ where: { id } });
        if (!reportToDelete) {
            return res.status(404).json({ error: 'Relatório não encontrado.' });
        }

        const absoluteFilePath = path.join(__dirname, '..', '..', 'uploads', 'pdfs', reportToDelete.fileName);

        await prisma.report.delete({ where: { id } });

        try {
            await fs.unlink(absoluteFilePath);
            console.log(`Arquivo deletado com sucesso: ${absoluteFilePath}`);
        } catch (unlinkError) {
            console.error(`Arquivo físico não encontrado para deletar, mas o registro do DB foi removido: ${absoluteFilePath}`, unlinkError);
        }

        res.status(200).json({ message: 'Relatório deletado com sucesso' });
    } catch (error) {
        console.error("Erro ao deletar relatório:", error);
        res.status(500).json({ error: 'Erro ao deletar relatório', details: error.message });
    }
});

module.exports = router;
