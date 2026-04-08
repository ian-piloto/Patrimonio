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
                    // Armazena sala do professor se retornar
                    if (data.sala_id && data.nome_sala) {
                        localStorage.setItem('usuario_sala_id', data.sala_id);
                        localStorage.setItem('usuario_sala_nome', data.nome_sala);
                    } else {
                        // Limpa para evitar resquícios de outros logins
                        localStorage.removeItem('usuario_sala_id');
                        localStorage.removeItem('usuario_sala_nome');
                    }
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
    console.log("Aplicando permissões para:", tipoUsuario);
    
    if (tipoUsuario === 'admin') {
        // Se for admin, remove a restrição de tudo que estiver marcado como restrito no HTML
        document.querySelectorAll('.restricted-access').forEach(el => {
            el.classList.remove('restricted-access');
        });
    } else {
        // Se NÃO for admin (professor), garantimos que abas sensíveis fiquem ocultas
        const tabsParaEsconder = [
            'tab-emprestimos',
            'tab-cadastro'
        ];
        
        tabsParaEsconder.forEach(target => {
            const btn = document.querySelector(`.nav-item[data-target="${target}"]`);
            if (btn) btn.classList.add('hidden');
        });

        // O painel de admin na aba Salas (se houver) deve continuar com a classe restricted-access (que é display:none)
    }
}
