document.addEventListener("DOMContentLoaded", () => {

    
    let currentCompanyIdBeingEdited = null;
    let profileType = null;
    let currentPage = 1;
    const itemsPerPage = 12; 

    // menu responsivo
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const mainNav = document.getElementById('main-nav');

    if (hamburgerMenu && mainNav) {
        hamburgerMenu.addEventListener('click', () => {
            hamburgerMenu.classList.toggle('active');
            mainNav.classList.toggle('active');
        });

        // Fechar menu quando um link é clicado
        mainNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburgerMenu.classList.remove('active');
                mainNav.classList.remove('active');
            });
        });
    }

    // animação do carrossel
    const track = document.getElementById('carrossel-track');
    if (track) {
        let offset = 0;
        const speed = 0.5;
        const clones = track.innerHTML;
        track.innerHTML += clones;

        function deslizar() {
            offset -= speed;
            if (Math.abs(offset) >= track.scrollWidth / 2) {
                offset = 0;
            }
            track.style.transform = `translateX(${offset}px)`;
            requestAnimationFrame(deslizar);
        }
        deslizar();
    }

    // form de contato + envio de emails
    const formContato = document.getElementById('form-contato');
    if (formContato) {
        formContato.addEventListener('submit', async (e) => {
            e.preventDefault();
            const button = document.getElementById('submit-mail');
            const feedback = document.getElementById('feedback-mensagem');

            button.disabled = true;
            button.textContent = 'Enviando...';
            feedback.innerHTML = '';

            const formData = {
                nome: document.getElementById('nome').value,
                email: document.getElementById('email').value,
                assunto: document.getElementById('assunto').value,
                mensagem: document.getElementById('mensagem').value
            };

            try {
                const response = await fetch('/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (data.success) {
                    feedback.innerHTML = '<p style="color: green;">Mensagem enviada com sucesso!</p>';
                    formContato.reset();
                } else {
                    feedback.innerHTML = '<p style="color: red;">Erro ao enviar mensagem. Tente novamente.</p>';
                }
            } catch (error) {
                console.error('Erro:', error);
                feedback.innerHTML = '<p style="color: red;">Erro de conexão com o servidor.</p>';
            } finally {
                button.disabled = false;
                button.textContent = 'Enviar Mensagem';

                setTimeout(() => {
                    feedback.innerHTML = '';
                }, 5000);
            }
        });
    }

    // autenticação via Fetch API
    const loginForm = document.querySelector('.formLogin');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const emailInput = document.getElementById('email');
            const senhaInput = document.getElementById('senha');
            const errorMessageDiv = loginForm.querySelector('.erro-msg');

            const email = emailInput.value.trim();
            const senha = senhaInput.value.trim();

            if (!email || !senha) {
                if (errorMessageDiv) {
                    errorMessageDiv.textContent = 'Preencha todos os campos!';
                    errorMessageDiv.style.display = 'block';
                } else {
                    alert('Preencha todos os campos!');
                }
                return;
            }

            if (errorMessageDiv) {
                errorMessageDiv.textContent = '';
                errorMessageDiv.style.display = 'none';
            }

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ email, senha })
                });

                const data = await response.json();

                if (response.ok) {
                    console.log("Login bem-sucedido:", data);
                    if (data.user && data.user.isAdmin) {
                        window.location.href = '/adminDashboard';
                    } else {
                        window.location.href = '/dashboard';
                    }
                } else {
                    if (errorMessageDiv) {
                        errorMessageDiv.textContent = data.error || 'Erro desconhecido no login.';
                        errorMessageDiv.style.display = 'block';
                    } else {
                        alert(data.error || 'Erro desconhecido no login.');
                    }
                }
            } catch (error) {
                console.error('Erro ao enviar requisição de login:', error);
                if (errorMessageDiv) {
                    errorMessageDiv.textContent = 'Erro de conexão com o servidor ou resposta inválida.';
                    errorMessageDiv.style.display = 'block';
                } else {
                    alert('Erro de conexão com o servidor ou resposta inválida.');
                }
            }
        });
    }

    // formatar CNPJ
    function formatarCNPJ(cnpj) {
        if (!cnpj) return 'Não informado';
        cnpj = cnpj.toString().replace(/\D/g, '');
        return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }

    // criação de cards de usuário para o AdminDashboard
    function criarCardUsuario(usuario) {
        const card = document.createElement('div');
        card.className = 'cliente-card';
        const cnpjFormatado = formatarCNPJ(usuario.company?.cnpj);

        card.innerHTML = `
            <div class="cliente-header">
                <i class="fas fa-user-tie cliente-icon"></i>
                <h3>${usuario.company.companyName || 'Cliente'}</h3>
            </div>
            <div class="cliente-info">
                <p><i class="fas fa-id-card"></i> <strong>CNPJ:</strong> ${cnpjFormatado}</p>
                <p><i class="fas fa-envelope"></i> <strong>Email:</strong> ${usuario.email}</p>
                <p><i class="fas fa-phone"></i> <strong>Telefone:</strong> ${usuario.company.phone || 'Não informado'}</p>
            </div>
            <button class="detalhes-btn" data-id="${usuario.id}">Mais Detalhes <i class="fas fa-chevron-right"></i></button>
        `;
        return card;
    }

    // carregar clientes (company) para o Admin Dashboard 
    const listaUsuarios = document.getElementById('lista-usuarios');
    const paginationControls = document.getElementById('pagination-controls');

    async function carregarClientes(page = 1) {
        if (!listaUsuarios) return;

        listaUsuarios.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 20px; color: #777;">Carregando empresas...</div>';
        if (paginationControls) paginationControls.innerHTML = '';

        currentPage = page;

        try {
            const response = await fetch(`/usuario/company?page=${currentPage}&limit=${itemsPerPage}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao buscar clientes.');
            }
            const data = await response.json();
            const usuarios = data.data;
            const totalPages = data.totalPages;

            listaUsuarios.innerHTML = '';

            if (usuarios.length === 0) {
                listaUsuarios.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 20px; color: #777;">Nenhuma empresa encontrada.</div>';
                if (paginationControls) paginationControls.innerHTML = '';
                return;
            }

            usuarios.forEach(usuario => {
                const card = criarCardUsuario(usuario);
                listaUsuarios.appendChild(card);
            });

            renderPaginationControls(totalPages);

            // re-adiciona event listeners para os botões "Mais Detalhes"
            document.querySelectorAll('.detalhes-btn').forEach(btn => {
                btn.addEventListener('click', function () {
                    const usuarioId = this.getAttribute('data-id');
                    const usuario = usuarios.find(u => u.id == usuarioId);

                    if (usuario) {
                        const cnpjFormatado = formatarCNPJ(usuario.company.cnpj);
                        document.getElementById('modal-titulo').textContent = usuario.company.companyName || 'Detalhes do Cliente';
                        document.getElementById('modal-conteudo').innerHTML = `
                            <p><i class="fas fa-id-card"></i> <strong>CNPJ:</strong> ${cnpjFormatado}</p>
                            <p><i class="fas fa-envelope"></i> <strong>Email:</strong> ${usuario.email}</p>
                            ${usuario.company.phone ? `<p><i class="fas fa-phone"></i> <strong>Telefone:</strong> ${usuario.company.phone}</p>` : ''}
                            ${usuario.company.address ? `<p><i class="fas fa-map-marker-alt"></i> <strong>Endereço:</strong> ${usuario.company.address}</p>` : ''} 
                            ${usuario.createdAt ? `<p><i class="fas fa-calendar-alt"></i> <strong>Data de Cadastro:</strong> ${new Date(usuario.createdAt).toLocaleDateString()}</p>` : ''}
                            <div class="modal-buttons">
                                <a href="/edit/${usuario.id}" class="btn btn-editar">
                                    <i class="fas fa-edit"></i> Editar Cliente
                                </a>
                            </div>
                        `;
                         modal.classList.add('show'); 
                    }
                });
            });

        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
            const mensagemVazia = document.getElementById('mensagem-nenhum-resultado');
            if (mensagemVazia) {
                mensagemVazia.textContent = 'Erro ao carregar clientes. Tente novamente mais tarde.';
                mensagemVazia.style.display = 'block';
            }
            if (listaUsuarios) listaUsuarios.innerHTML = '';
            if (paginationControls) paginationControls.innerHTML = ''; 
        }
    }

    // renderizar os controles de paginação
    function renderPaginationControls(totalPages) {
        if (!paginationControls) return;

        let paginationHtml = '';

        if (totalPages > 1) {
            paginationHtml += `
                <button class="pagination-btn" id="prev-page" ${currentPage === 1 ? 'disabled' : ''}>Anterior</button>
                <div class="page-numbers">
            `;
            for (let i = 1; i <= totalPages; i++) {
                paginationHtml += `<span class="page-number ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</span>`;
            }
            paginationHtml += `
                </div>
                <button class="pagination-btn" id="next-page" ${currentPage === totalPages ? 'disabled' : ''}>Próxima</button>
            `;
        }

        paginationControls.innerHTML = paginationHtml;

        // event botões de paginação
        if (totalPages > 1) {
            const prevBtn = document.getElementById('prev-page');
            const nextBtn = document.getElementById('next-page');

            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    if (currentPage > 1) {
                        carregarClientes(currentPage - 1);
                    }
                });
            }

            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    if (currentPage < totalPages) {
                        carregarClientes(currentPage + 1);
                    }
                });
            }

            document.querySelectorAll('.page-number').forEach(pageNumberSpan => {
                pageNumberSpan.addEventListener('click', (event) => {
                    const page = parseInt(event.target.dataset.page);
                    if (page !== currentPage) {
                        carregarClientes(page);
                    }
                });
            });
        }
    }

    // MODAL DE DETALHES: abrir/fechar modal de detalhes
    const modal = document.getElementById('detalhesModal');
    const closeBtn = document.querySelector('.close-btn');

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('show');
        });

        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.classList.remove('show');
            }
        });
    }

    // Chama a função para carregar clientes (para AdminDashboard)
    if (document.getElementById('lista-usuarios')) {
        carregarClientes(1);
    }


    // PESQUISA/FILTRO DE USUÁRIOS: Lógica de busca e filtro
    const searchInput = document.getElementById('search-input');
    const searchFilter = document.getElementById('search-filter');

    if (searchInput && searchFilter) {
        searchInput.addEventListener('input', filtrarCards);
        searchFilter.addEventListener('change', filtrarCards);

        function filtrarCards() {
            const termoRaw = searchInput.value.toLowerCase();
            const filtro = searchFilter.value;

            const cards = document.querySelectorAll('.cliente-card');
            const mensagemSemResultado = document.getElementById('mensagem-nenhum-resultado');

            let algumVisivel = false;

            cards.forEach(card => {
                const cnpjTexto = card.querySelector('p:nth-child(1)')?.textContent || '';
                const nomeTexto = card.querySelector('.cliente-header h3')?.textContent || '';
                const emailTexto = card.querySelector('p:nth-child(2)')?.textContent || '';
                const enderecoTexto = card.querySelector('p:nth-child(4)')?.textContent || '';

                const cnpj = cnpjTexto.replace(/\D/g, '');
                const nome = nomeTexto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const email = emailTexto.toLowerCase();
                const endereco = enderecoTexto.toLowerCase();

                let mostrar = false;

                if (filtro === 'cnpj') {
                    const termoNumeros = termoRaw.replace(/\D/g, '');
                    mostrar = cnpj.includes(termoNumeros);
                } else {
                    const termoTexto = termoRaw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    mostrar = nome.includes(termoTexto) || email.includes(termoTexto) || endereco.includes(termoTexto);
                }

                if (mostrar || termoRaw === '') {
                    card.style.display = '';
                    algumVisivel = true;
                } else {
                    card.style.display = 'none';
                }
            });

            if (mensagemSemResultado) {
                mensagemSemResultado.style.display = algumVisivel ? 'none' : 'block';
            }
        }
    }

    // funçao auxiliar para extrair o ID do usuário da URL (/edit/:id)
    function getIdFromUrl() {
        const path = window.location.pathname;
        const parts = path.split('/');
        if (parts.includes('edit') && parts.length > 2 && !parts.includes('admin')) {
            return parts[2];
        }
        return null;
    }
    
    async function handleReportDownload(reportId) {
        if (!reportId) {
            alert('Erro: ID do relatório não encontrado.');
            return;
        }
        const button = document.querySelector(`.download-report-btn[data-id="${reportId}"]`);
        try {
            if(button) button.textContent = 'Baixando...';

            const downloadResponse = await fetch(`/reports/${reportId}/download`);
            if (!downloadResponse.ok) {
                const errorData = await downloadResponse.json();
                throw new Error(errorData.error || 'Erro ao baixar o relatório.');
            }
            const blob = await downloadResponse.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `relatorio_${reportId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            console.error('Erro ao baixar relatório:', error);
            alert('Erro ao baixar relatório: ' + error.message);
        } finally {
            if(button) button.textContent = 'Baixar';
        }
    }


    // exibidr dados do user company: Carrega e exibe os dados na página /edit/:id
    async function exibirDadosUsuario() {
        const container = document.getElementById('dados-usuario');
        if (!container) return;

        const usuarioIdFromUrl = getIdFromUrl();
        if (!usuarioIdFromUrl) {
            return;
        }

        try {
            const response = await fetch(`/usuario/${usuarioIdFromUrl}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao buscar dados do usuário.');
            }

            const usuario = await response.json();

            if (usuario.company && usuario.company.id) {
                profileType = 'company';
                currentCompanyIdBeingEdited = usuario.company.id;
            } else if (usuario.employee) {
                profileType = 'employee';
            } else {
                profileType = 'admin_user';
            }
            console.log('Tipo de perfil:', profileType, 'ID da empresa:', currentCompanyIdBeingEdited);


            let profileHtml = `<h2>${usuario.email || 'Perfil de Usuário'}</h2>`;

            if (profileType === 'company') {
                profileHtml = `
                    <h2>${usuario.company?.companyName || 'Nome não informado'}</h2>
                    <p><strong>CNPJ:</strong> ${formatarCNPJ(usuario.company?.cnpj)}</p>
                    <p><strong>Email:</strong> ${usuario.email || 'Não informado'}</p>
                    <p><strong>Telefone:</strong> ${usuario.company?.phone || 'Não informado'}</p>
                    <p><strong>Endereço:</strong> ${usuario.company?.address || 'Não informado'}</p>
                `;
            } else if (profileType === 'employee') {
                profileHtml = `
                    <h2>${usuario.employee?.fullName || 'Nome não informado'}</h2>
                    <p><strong>CPF:</strong> ${usuario.employee?.cpf || 'Não informado'}</p>
                    <p><strong>Email:</strong> ${usuario.email || 'Não informado'}</p>
                `;
            } else {
                profileHtml = `
                    <h2>Perfil do Administrador</h2>
                    <p><strong>Email:</strong> ${usuario.email || 'Não informado'}</p>
                    <p>Você está editando o perfil de um administrador. Note que esta conta não tem um perfil de empresa ou funcionário associado para dados adicionais aqui.</p>
                `;
                const reportsContainer = document.querySelector('.tabela-relatorios-container');
                if (reportsContainer) reportsContainer.style.display = 'none';

                const addReportButton = document.getElementById('add-report-btn');
                if (addReportButton) addReportButton.style.display = 'none';
            }
            profileHtml += `<p><strong>Data de cadastro:</strong> ${usuario.createdAt ? new Date(usuario.createdAt).toLocaleDateString() : 'Não informado'}</p>`;
            container.innerHTML = profileHtml;

            if (profileType === 'company') {
                loadReportsForCompany();
            }
        } catch (error) {
            console.error('Erro ao exibir dados do usuário:', error);
            container.innerHTML = '<p>Erro ao carregar os dados do usuário.</p>';
        }
    }

    if (window.location.pathname.startsWith('/edit/')) {
        exibirDadosUsuario();
    }


    // relatorios: funcao para carregar e exibir relatórios na tabela
    const reportsTableBody = document.getElementById('reports-table-body');

    async function loadReportsForCompany() {
        if (!reportsTableBody) return;

        reportsTableBody.innerHTML = '<tr><td colspan="4">Carregando relatórios...</td></tr>';

        try {
            let fetchUrl = '/reports';
            if (currentCompanyIdBeingEdited) {
                fetchUrl = `/reports?companyId=${currentCompanyIdBeingEdited}`;
                console.log("Buscando relatórios para companyId:", currentCompanyIdBeingEdited);
            } else {
                console.log("Buscando relatórios para o usuário logado (sem filtro de companyId explícito na URL).");
            }

            const response = await fetch(fetchUrl);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao buscar relatórios.');
            }

            const reports = await response.json();
            reportsTableBody.innerHTML = '';

            if (reports.length === 0) {
                reportsTableBody.innerHTML = '<tr><td colspan="4">Nenhum relatório encontrado para esta empresa.</td></tr>';
                return;
            }

            reports.forEach((report, index) => {
                const row = document.createElement('tr');
                const creationDateFormatted = new Date(report.creationDate).toLocaleDateString('pt-BR');

                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${report.description}</td>
                    <td>${creationDateFormatted}</td>
                    <td>
                        <button class="btn-acao download-report-btn" data-id="${report.id}">Baixar</button>
                        <button class="btn-acao excluir delete-report-btn" data-id="${report.id}">Excluir</button>
                    </td>
                `;
                reportsTableBody.appendChild(row);
            });

            document.querySelectorAll('.download-report-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const reportId = event.target.dataset.id;
                    handleReportDownload(reportId); 
                });
            });

            document.querySelectorAll('.delete-report-btn').forEach(button => {
                button.addEventListener('click', async (event) => {
                    const reportId = event.target.dataset.id;
                    if (confirm('Tem certeza que deseja excluir este relatório?')) {
                        try {
                            const deleteResponse = await fetch(`/reports/${reportId}`, {
                                method: 'DELETE'
                            });
                            const data = await deleteResponse.json();
                            if (deleteResponse.ok) {
                                alert(data.message);
                                loadReportsForCompany();
                            } else {
                                throw new Error(data.error || 'Erro ao excluir o relatório.');
                            }
                        } catch (error) {
                            console.error('Erro ao excluir relatório:', error);
                            alert('Erro ao excluir relatório: ' + error.message);
                        }
                    }
                });
            });

        } catch (error) {
            console.error('Erro ao carregar relatórios:', error);
            reportsTableBody.innerHTML = `<tr><td colspan="4" style="color: red;">Erro ao carregar relatórios: ${error.message}</td></tr>`;
        }
    }

  // modal para adicionar novo relatorio: Lógica para abrir, fechar e submeter 
const addReportBtn = document.getElementById('add-report-btn');
const addReportModal = document.getElementById('addReportModal');
const addReportForm = document.getElementById('addReportForm');
const reportFeedbackMessage = document.getElementById('report-feedback-message');

if (addReportBtn && addReportModal && addReportForm) {

    addReportBtn.addEventListener('click', () => {
        addReportForm.reset(); 
        reportFeedbackMessage.textContent = ''; 
        addReportModal.classList.add('show'); 
    });

    // fechar modal clicando no x
    const closeButtons = addReportModal.querySelectorAll('.close-button-form');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            addReportModal.classList.remove('show'); 
        });
    });

    //  fechar modal clicando fora
    window.addEventListener('click', (event) => {
        if (event.target === addReportModal) {
            addReportModal.classList.remove('show'); 
        }
    });

    // enviar form para adicionar    relatorio
    addReportForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        reportFeedbackMessage.textContent = 'Enviando relatório...';
        reportFeedbackMessage.style.color = 'blue';

        const formData = new FormData(addReportForm);

        if (currentCompanyIdBeingEdited && profileType === 'company') {
            formData.append('companyId', currentCompanyIdBeingEdited);
        } else {
            reportFeedbackMessage.textContent = 'Erro: Relatórios só podem ser adicionados para perfis de empresa.';
            reportFeedbackMessage.style.color = 'red';
            setTimeout(() => { reportFeedbackMessage.textContent = ''; }, 5000);
            return;
        }
        const submitBtn = addReportForm.querySelector('button[type="submit"]');

        try {
            submitBtn.disabled = true;
            const response = await fetch('/reports', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                reportFeedbackMessage.textContent = data.message || 'Relatório adicionado com sucesso!';
                reportFeedbackMessage.style.color = 'green';
                addReportForm.reset();

                setTimeout(() => {
                    addReportModal.classList.remove('show'); 
                    if (profileType === 'company') {
                        loadReportsForCompany();
                    }
                }, 1500);

            } else {
                reportFeedbackMessage.textContent = data.error || 'Erro ao adicionar relatório.';
                reportFeedbackMessage.style.color = 'red';
            }
        } catch (error) {
            console.error('Erro ao enviar relatório:', error);
            reportFeedbackMessage.textContent = 'Erro de conexão ou ao enviar o arquivo.';
            reportFeedbackMessage.style.color = 'red';
        } finally {
            submitBtn.disabled = false;
        }
    });
}

 // editar perfil de usuario company
    const editProfileForm = document.getElementById('editProfileForm');
    if (editProfileForm) {
        const editDataBtn = document.getElementById('edit-data-btn');
        const editFormContainer = document.querySelector('.edit-profile-form-container');
        const cancelEditBtn = document.getElementById('cancelEditBtn');

        function setAddressFieldsForEdit(fullAddress) {
            const editAddressInput = document.getElementById('editAddress');
            if (editAddressInput) {
                editAddressInput.value = fullAddress || '';
            }
        }


        if (editDataBtn && editFormContainer && cancelEditBtn) {
            editDataBtn.addEventListener('click', () => {
                editFormContainer.style.display = 'block';
                const addressInput = document.getElementById('editAddress');
                if (addressInput && profileType === 'company') {
                    setAddressFieldsForEdit(addressInput.value);
                }
            });
            cancelEditBtn.addEventListener('click', () => {
                editFormContainer.style.display = 'none';
            });
        }

        editProfileForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const submitBtn = editProfileForm.querySelector('button[type="submit"]');
            const feedbackDiv = document.getElementById('editProfileFeedback');

            submitBtn.disabled = true;
            feedbackDiv.textContent = 'Salvando alterações...';
            feedbackDiv.style.color = 'blue';

            const userIdToUpdate = getIdFromUrl();

            const data = {};
            data.email = document.getElementById('editEmail').value;
            data.password = document.getElementById('editPassword').value;

            if (profileType === 'company') {
                data.companyName = document.getElementById('editCompanyName').value;
                data.cnpj = document.getElementById('editCnpj').value;
                data.phone = document.getElementById('editPhone').value;
                data.address = document.getElementById('editAddress').value;
            }
            if (profileType === 'employee') {
                data.fullName = document.getElementById('editFullName').value;
                data.cpf = document.getElementById('editCpf').value;
            }


            try {
                const response = await fetch(`/edit/${userIdToUpdate}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok) {
                    feedbackDiv.textContent = result.message || 'Perfil atualizado com sucesso!';
                    feedbackDiv.style.color = 'green';
                    exibirDadosUsuario();
                } else {
                    feedbackDiv.textContent = result.error || 'Erro ao atualizar perfil.';
                    feedbackDiv.style.color = 'red';
                }
            } catch (error) {
                console.error('Erro ao enviar requisição de atualização:', error);
                feedbackDiv.textContent = 'Erro de conexão ou ao processar a atualização.';
                feedbackDiv.style.color = 'red';
            } finally {
                submitBtn.disabled = false;
                setTimeout(() => { feedbackDiv.textContent = ''; }, 5000);
            }
        });
    }

    // edicao do perfil de admin
    const adminProfileEditForm = document.getElementById('adminProfileEditForm');
    const adminProfileFeedback = document.getElementById('adminProfileFeedback');

    async function setupAdminProfileEditPage() {
        if (!adminProfileEditForm) return;

        adminProfileEditForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const submitBtn = adminProfileEditForm.querySelector('button[type="submit"]');

            submitBtn.disabled = true;
            adminProfileFeedback.textContent = 'Salvando alterações...';
            adminProfileFeedback.style.color = 'blue';

            const formData = new FormData(adminProfileEditForm);
            const data = {};
            formData.forEach((value, key) => {
                data[key] = value;
            });

            try {
                const response = await fetch('/admin/edit-profile', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok) {
                    adminProfileFeedback.textContent = result.message || 'Perfil atualizado com sucesso!';
                    adminProfileFeedback.style.color = 'green';
                    if (result.user && result.user.email) {
                        document.getElementById('adminEmail').value = result.user.email;
                    }
                    if (result.user && result.user.employee) {
                        document.getElementById('adminFullName').value = result.user.employee.fullName;
                        document.getElementById('adminCpf').value = result.user.employee.cpf;
                    }
                    document.getElementById('adminPassword').value = '';
                } else {
                    adminProfileFeedback.textContent = result.error || 'Erro ao atualizar perfil.';
                    adminProfileFeedback.style.color = 'red';
                }
            } catch (error) {
                console.error('Erro ao enviar requisição de atualização do admin:', error);
                adminProfileFeedback.textContent = 'Erro de conexão ou ao processar a atualização.';
                adminProfileFeedback.style.color = 'red';
            } finally {
                submitBtn.disabled = false;
                setTimeout(() => { adminProfileFeedback.textContent = ''; }, 5000);
            }
        });
    }

    if (window.location.pathname === '/admin/edit-profile') {
        setupAdminProfileEditPage();
    }


    // form de cadastro dos usuários
    const createUserForm = document.getElementById('createUserForm');
    if (createUserForm) {
        const userTypeSelect = document.getElementById('userType');
        const senhaInput = document.getElementById('senha');
        const companyFields = document.getElementById('companyFields');
        const adminFields = document.getElementById('adminFields');
        const createUserFeedback = document.getElementById('createUserFeedback');

        function toggleUserTypeFields() {
            const selectedType = userTypeSelect.value;
            const companyInputs = companyFields.querySelectorAll('input');
            const adminInputs = adminFields.querySelectorAll('input');

            if (selectedType === 'company') {
                companyFields.style.display = 'block';
                adminFields.style.display = 'none';
                companyInputs.forEach(input => input.required = true);
                adminInputs.forEach(input => input.required = false);
            } else if (selectedType === 'admin') {
                companyFields.style.display = 'none';
                adminFields.style.display = 'block';
                companyInputs.forEach(input => input.required = false);
                adminInputs.forEach(input => input.required = true);
            } else {
                companyFields.style.display = 'none';
                adminFields.style.display = 'none';
                companyInputs.forEach(input => input.required = false);
                adminInputs.forEach(input => input.required = false);
            }
            senhaInput.required = true;
        }

        userTypeSelect.addEventListener('change', toggleUserTypeFields);
        toggleUserTypeFields();

        createUserForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const submitBtn = createUserForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            createUserFeedback.textContent = 'Cadastrando usuário...';
            createUserFeedback.style.color = 'blue';

            const emailInput = document.getElementById('email');
            const userType = userTypeSelect.value;

            const formData = {
                email: emailInput.value,
                senha: senhaInput.value,
                isAdmin: (userType === 'admin')
            };

            if (userType === 'company') {
                formData.companyName = document.getElementById('companyName').value;
                formData.cnpj = document.getElementById('cnpj').value;
                formData.phone = document.getElementById('phone').value;
                formData.address = document.getElementById('address').value;
            } else if (userType === 'admin') {
                formData.fullName = document.getElementById('fullName').value;
                formData.cpf = document.getElementById('cpf').value;
            }

            try {
                const response = await fetch('/usuario', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();

                if (response.ok) {
                    createUserFeedback.textContent = result.message || 'Usuário cadastrado com sucesso!';
                    createUserFeedback.style.color = 'green';
                    createUserForm.reset();
                    toggleUserTypeFields();
                    setTimeout(() => {
                        window.location.href = '/adminDashboard';
                    }, 1500);
                } else {
                    createUserFeedback.textContent = result.error || 'Erro ao cadastrar usuário.';
                    createUserFeedback.style.color = 'red';
                }
            } catch (error) {
                console.error('Erro ao enviar requisição de cadastro:', error);
                createUserFeedback.textContent = 'Erro de conexão ou ao processar o cadastro.';
                createUserFeedback.style.color = 'red';
            } finally {
                submitBtn.disabled = false;
                setTimeout(() => {
                    createUserFeedback.textContent = '';
                }, 5000);
            }
        });
    }

    const dashboardReportTableBody = document.getElementById('company-reports-table-body');
    if (dashboardReportTableBody && !window.location.pathname.startsWith('/edit/')) {
        console.log("Página de dashboard detectada. Adicionando listeners de download.");
        
        const downloadButtons = dashboardReportTableBody.querySelectorAll('.download-report-btn');

        downloadButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const reportId = event.target.dataset.id;
                handleReportDownload(reportId);
            });
        });

        if (downloadButtons.length === 0 && dashboardReportTableBody.querySelector('td[colspan="4"]') === null) {
             console.log("Nenhum botão de download foi encontrado na tabela do dashboard.");
        }
    }
});