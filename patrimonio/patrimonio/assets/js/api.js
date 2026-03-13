// Serviço para conversar com o PHP API (routes.php)

const API_ROUTES = 'api/routes.php';

const api = {
    // Busca listas base
    getSalas: async () => {
        const res = await fetch(`${API_ROUTES}?action=get_salas`);
        return (await res.json()).data || [];
    },

    getCategorias: async () => {
        const res = await fetch(`${API_ROUTES}?action=get_categorias`);
        return (await res.json()).data || [];
    },

    // Nova Sala
    cadastrarSala: async (nome_sala) => {
        const formData = new FormData();
        formData.append('action', 'cadastrar_sala');
        formData.append('nome_sala', nome_sala);
        const res = await fetch(API_ROUTES, { method: 'POST', body: formData });
        return await res.json();
    },

    // Vincular Sala
    vincularSala: async (sala_id, professor_id = 1) => {
        // Em app real o professor_id vem da sessão PHP. Mandamos apenas sala_id
        const formData = new FormData();
        formData.append('action', 'vincular_sala');
        formData.append('sala_id', sala_id);
        // Enviando 1 temporariamente como fallback se a sessão PHP não pegar
        formData.append('professor_id', professor_id);

        const res = await fetch(API_ROUTES, { method: 'POST', body: formData });
        return await res.json();
    },

    getPatrimoniosSala: async (sala_id) => {
        const res = await fetch(`${API_ROUTES}?action=listar_patrimonios_da_sala&sala_id=${sala_id}`);
        return (await res.json()).data || [];
    },

    // QR Code
    buscarPatrimonioPorQR: async (qrcode) => {
        const res = await fetch(`${API_ROUTES}?action=buscar_patrimonio&qrcode=${qrcode}`);
        return await res.json();
    },

    cadastrarPatrimonio: async (qrcode, nome, categoria_id, sala_id) => {
        const formData = new FormData();
        formData.append('action', 'cadastrar_patrimonio');
        formData.append('qrcode', qrcode);
        formData.append('nome', nome);
        formData.append('categoria_id', categoria_id);
        formData.append('sala_id', sala_id);

        const res = await fetch(API_ROUTES, { method: 'POST', body: formData });
        return await res.json();
    },

    // Ocorrências
    salvarOcorrencia: async (patrimonio_id, sala_id, tipo, descricao) => {
        const formData = new FormData();
        formData.append('action', 'salvar_ocorrencia');
        formData.append('patrimonio_id', patrimonio_id);
        formData.append('sala_id', sala_id);
        formData.append('tipo', tipo);
        formData.append('descricao', descricao);

        const res = await fetch(API_ROUTES, { method: 'POST', body: formData });
        return await res.json();
    },

    // Empréstimo
    registrarEmprestimo: async (patrimonio_id, sala_origem_id, sala_destino_id) => {
        const formData = new FormData();
        formData.append('action', 'registrar_emprestimo');
        formData.append('patrimonio_id', patrimonio_id);
        formData.append('sala_origem_id', sala_origem_id);
        formData.append('sala_destino_id', sala_destino_id);

        const res = await fetch(API_ROUTES, { method: 'POST', body: formData });
        return await res.json();
    },

    // Notificações
    getNotificacoes: async () => {
        const res = await fetch(`${API_ROUTES}?action=get_notificacoes`);
        return (await res.json()).data || [];
    },

    marcarNotificacoesLidas: async () => {
        const formData = new FormData();
        formData.append('action', 'marcar_notificacoes_lidas');
        const res = await fetch(API_ROUTES, { method: 'POST', body: formData });
        return await res.json();
    }
};
