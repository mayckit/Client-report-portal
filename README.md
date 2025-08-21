# Portal web de Gestão de Clientes e Relatórios

## 📖 Sobre o Projeto

Este projeto é um sistema de dashboard completo, desenvolvido para otimizar a comunicação e a entrega de documentos entre a empresa e seus clientes. A plataforma oferece dois níveis de acesso distintos: um painel administrativo para gestão interna e um portal exclusivo para cada cliente.

O sistema permite que administradores gerenciem perfis de empresas, façam o upload de relatórios técnicos em PDF e acompanhem a atividade dos clientes. Do outro lado, os clientes podem acessar um portal seguro para visualizar seus dados cadastrais, baixar relatórios importantes a qualquer momento e ter um canal de comunicação centralizado.

## ✨ Principais Funcionalidades

-   **Autenticação Segura:** Sistema de login com diferenciação de permissões entre Administradores e Clientes.
-   **Dashboard Administrativo:** Painel completo para administradores visualizarem e gerenciarem todas as empresas clientes.
-   **Portal do Cliente:** Dashboard exclusivo para a empresa cliente visualizar seus próprios dados e a lista de relatórios disponíveis.
-   **Gestão de Relatórios:** Funcionalidade de upload de arquivos (PDF) pelos administradores, associando cada relatório a uma empresa específica.
-   **Download de Arquivos:** Clientes podem baixar de forma segura os relatórios que pertencem à sua empresa.
-   **CRUD de Usuários:** Sistema para criar, ler, atualizar e deletar perfis de clientes (disponível para admins).
-   **Design Responsivo:** Interface adaptável para uma boa experiência em desktops e dispositivos móveis.

## 🚀 Tecnologias Utilizadas

-   **Back-end:** Node.js, Express.js
-   **Banco de Dados:** MySQL com Prisma ORM
-   **Front-end:** Handlebars.js (Renderização no Servidor), HTML5, CSS3, JavaScript
-   **Autenticação:** Sessões com `express-session`
-   **Upload de Arquivos:** Multer

## 🏁 Como Começar

Siga os passos abaixo para executar o projeto localmente.

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/seu-usuario/Client-report-portal.git]
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure as variáveis de ambiente:**
    - Renomeie o arquivo `.env.example` para `.env`.
    - Preencha a variável `DATABASE_URL` com a sua string de conexão do MySQL.

4.  **Execute as migrações do banco de dados:**
    ```bash
    npx prisma migrate dev
    ```

5.  **Inicie o servidor:**
    ```bash
    npm start
    ```

O projeto estará rodando em `http://localhost:3000` (ou na porta que você configurou).
