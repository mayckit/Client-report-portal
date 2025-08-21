const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

const authorizeReportAccess = async (req, res, next) => {
    const reportId = req.params.id ? parseInt(req.params.id) : null;
    const userId = req.session.usuarioId;

    if (!userId) {
        return res.redirect('/login');
    }

    try {
        if (req.session.admin) { 
            return next();
        }

        const userCompany = await prisma.company.findUnique({
            where: { userId: userId },
            select: { id: true }
        });

        if (!userCompany) {
            return res.status(403).json({ error: 'Acesso negado. Você não está associado a uma empresa.' });
        }

        if (reportId) { 
            const report = await prisma.report.findUnique({
                where: { id: reportId },
                select: { companyId: true }
            });

            if (!report) {
                return res.status(404).json({ error: 'Relatório não encontrado.' });
            }

            if (report.companyId === userCompany.id) {
                return next(); 
            } else {
                return res.status(403).json({ error: 'Acesso negado. Este relatório não pertence à sua empresa.' });
            }
        } else { 
            next();
        }

    } catch (error) {
        console.error("Erro na autorização do relatório:", error);
        res.status(500).json({ error: 'Erro interno do servidor ao verificar permissões.' });
    }
};

module.exports = {
    authorizeReportAccess
};