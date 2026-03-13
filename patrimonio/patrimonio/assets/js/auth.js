// Controle de Autenticação

const API_AUTH = 'api/auth.php';

async function checkSession() {
    try {
        const res = await fetch(API_AUTH, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'action=check_session'
        });
        const data = await res.json();

        // Se estiver na tela de login e já logado, vai pro index
        if (window.location.pathname.includes('login.html')) {
            if (data.status === 'logged_in') {
                window.location.href = 'index.html';
            }
        } else {
            // Se estiver no app e não logado, vai pro login
            if (data.status !== 'logged_in') {
                window.location.href = 'login.html';
            } else {
                // Atualiza o nome no header do App
                const userNameDisplay = document.getElementById('userNameDisplay');
                if (userNameDisplay) userNameDisplay.textContent = `Olá, ${data.nome.split(' ')[0]}`;

                // Guarda o tipo de usuário na janela para outras lógicas e aplica permissões de UI
                window.usuarioTipo = data.tipo;
                aplicarPermissoes(data.tipo);

                // Inicia o polling de notificações
                if (typeof iniciarPollingNotificacoes === 'function') {
                    iniciarPollingNotificacoes();
                }
            }
        }
    } catch (e) {
        console.error("Erro ao verificar sessão", e);
    }
}

// Inicializa checagem ao carregar qualquer página
document.addEventListener('DOMContentLoaded', () => {
    checkSession();

    // Login Form Submit
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btnLogin');
            btn.textContent = 'Autenticando...';
            btn.disabled = true;

            const formData = new FormData(loginForm);
            formData.append('action', 'login');

            try {
                const res = await fetch(API_AUTH, { method: 'POST', body: formData });
                const data = await res.json();

                if (data.status === 'success') {
                    window.location.href = 'index.html';
                } else {
                    showMessage('loginMessage', data.message, 'error');
                }
            } catch (err) {
                showMessage('loginMessage', 'Erro de conexão com o servidor.', 'error');
            } finally {
                btn.textContent = 'Entrar no Sistema';
                btn.disabled = false;
            }
        });
    }

    // Botão de Logout
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            await fetch(API_AUTH, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'action=logout'
            });
            window.location.href = 'login.html';
        });
    }
});

// Controle de Permissões Baseado em Perfil (RBAC)
function aplicarPermissoes(tipoUsuario) {
    if (tipoUsuario !== 'admin') {
        // Se for um professor ou usuário não-admin, esconder botões de ação e tabs
        // O professor pode acessar a aba de ocorrências, então "tabOcorrencias" continua visível.
        const tabTransferir = document.querySelector('.nav-item[data-target="tab-emprestimos"]');
        const tabCadastrar = document.querySelector('.nav-item[data-target="tab-cadastro"]');
        const boxCriarSala = document.getElementById('boxCriarSala'); // Bloqueia criar sala

        if (tabTransferir) tabTransferir.classList.add('restricted-access');
        if (tabCadastrar) tabCadastrar.classList.add('restricted-access');
        if (boxCriarSala) boxCriarSala.classList.add('restricted-access');
    }
}
