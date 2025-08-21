const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    let token = req.headers['authorization'];
    if (token && token.startsWith('Bearer ')) {
        token = token.slice(7, token.length); 
    }

    if (!token) {
        if (req.accepts('json')) {
            return res.status(401).json({ error: 'Token de autenticação não fornecido.' });
        }
        return res.redirect('/login');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; 
        
        req.session = req.session || {}; 
        req.session.usuarioId = decoded.id;
        req.session.admin = decoded.isAdmin;
        req.session.companyId = decoded.companyId;

        next();
    } catch (error) {
        console.error("Erro na verificação do token JWT:", error);
        if (req.accepts('json')) {
            return res.status(401).json({ error: 'Token inválido ou expirado.', details: error.message });
        }
        res.redirect('/login');
    }
}

module.exports = {
    verifyToken
};