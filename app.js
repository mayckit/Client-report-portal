const express = require("express");
const exphbs = require("express-handlebars");
const path = require("path");
const session = require('express-session');
require('dotenv').config();

const { PrismaClient } = require('./src/generated/prisma'); 
const prisma = new PrismaClient(); 

const app = express();

app.use(session({
    secret: process.env.SESSION_SECRET || 'segredoSuperSecreto123',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 
    }
}));

// Middleware para carregar dados do usuário na sessão e em res.locals
app.use(async (req, res, next) => { 
    res.locals.user = null; 

    if (req.session.usuarioId) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: req.session.usuarioId },
                include: { 
                    company: true, 
                    employee: true
                } 
            });

            if (user) {
                res.locals.user = {
                    id: user.id,
                    email: user.email,
                    isAdmin: user.isAdmin,
                    companyId: user.company ? user.company.id : null,
                    company: user.company || null,
                    employee: user.employee || null
                };
                req.session.admin = user.isAdmin;
                req.session.companyId = user.company ? user.company.id : null;
            } else {
                req.session.destroy((err) => {
                    if (err) console.error("Erro ao destruir sessão:", err);
                });
            }
        } catch (error) {
            console.error("Erro ao carregar dados do usuário na sessão:", error);
            req.session.destroy((err) => {
                if (err) console.error("Erro ao destruir sessão após erro DB:", err);
            });
        }
    }
    next(); 
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.engine('handlebars', exphbs.engine({
    defaultLayout: 'main',
    helpers: {
        isAdmin: function(user, options) {
            if (user && user.isAdmin) {
                return options.fn(this);
            }
            return options.inverse(this);
        },
        isLoggedIn: function(user, options) {
            if (user) {
                return options.fn(this);
            }
            return options.inverse(this);
        },
        isCompanyUser: function(user, options) {
            if (user && !user.isAdmin && user.companyId) {
                return options.fn(this);
            }
            return options.inverse(this);
        },
        formatCNPJ: function(cnpj) {
            if (!cnpj) return 'Não informado';
            cnpj = cnpj.toString().replace(/\D/g, '');
            return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
        },
        formatDate: function(date) {
            if (!date) return 'Não informado';
            return new Date(date).toLocaleDateString('pt-BR');
        }
    }
}));


app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'src', 'views'));

// Importação das rotas
const homeRoutes = require('./src/routes/home');
const contactRoutes = require('./src/routes/contact');
const akillowRoutes = require('./src/routes/a-killow'); 
const emailRoutes = require('./src/routes/email');
const loginRoutes = require('./src/routes/login'); 
const usuarioRoutes = require('./src/routes/usuario');
const adminRoutes = require('./src/routes/admin');
const dashboardRoutes = require('./src/routes/dashboard'); 
const editRoutes = require('./src/routes/edit'); 
const reportRoutes = require('./src/routes/reports'); 
const adminProfileRoutes = require('./src/routes/adminProfile'); 
const createUserRoutes = require('./src/routes/createUser'); 

// Uso das rotas
app.use('/', homeRoutes);
app.use('/', contactRoutes);
app.use('/', akillowRoutes);
app.use('/', emailRoutes);
app.use('/', loginRoutes);
app.use('/', usuarioRoutes);
app.use('/', adminRoutes);
app.use('/', dashboardRoutes); 
app.use('/', editRoutes);
app.use('/', reportRoutes);
app.use('/admin', adminProfileRoutes); 
app.use('/', createUserRoutes); 

// Middleware para 404 
app.use((req, res) => {
    res.status(404).render('404', { 
        title: 'Página Não Encontrada',
        user: res.locals.user 
    });
});

// Middleware para 500 
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('500', {
        title: 'Erro no Servidor',
        message: 'Algo deu errado em nossos servidores. Por favor, tente novamente mais tarde.',
        user: res.locals.user
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ App funcionando na porta ${PORT}!`);
    console.log(`Acesse localmente em http://localhost:${PORT}`);
});
