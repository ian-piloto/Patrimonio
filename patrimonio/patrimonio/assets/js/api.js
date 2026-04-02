// Serviço para conversar com o PHP API (routes.php)

const API_ROUTES = 'api/routes.php';

const api = {
    // Busca listas base
    getSalas: async () => {
        const res = await fetch(`${API_ROUTES}?action=get_salas`);
        return (await res.json()).data || [];
    },

    getProfessores: async () => {
        const res = await fetch(`${API_ROUTES}?action=get_professores`);
        return (await res.json()).data || [];
    },

    cadastrarProfessor: async (nome, email, senha) => {
        const formData = new FormData();
        formData.append('action', 'cadastrar_professor');
        formData.append('nome', nome);
        formData.append('email', email);
        formData.append('senha', senha);
        const res = await fetch(API_ROUTES, { method: 'POST', body: formData });
        return await res.json();
    },

    getCategorias: async () => {
        const res = await fetch(`${API_ROUTES}?action=get_categorias`);
        return (await res.json()).data || [];
    },

    getMinhasSalas: async () => {
        const res = await fetch(`${API_ROUTES}?action=get_salas&meu_vinculo=true`);
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

    cadastrarPatrimonio: async (dados) => {
        const formData = new FormData();
        formData.append('action', 'cadastrar_patrimonio');
        formData.append('numero_qrcode', dados.numero_qrcode);
        formData.append('nome_descricao', dados.nome_descricao);
        formData.append('categoria_id', dados.categoria_id);
        formData.append('sala_atual_id', dados.sala_atual_id);

        const res = await fetch(API_ROUTES, { method: 'POST', body: formData });
        return await res.json();
    },

    // Vincular Sala
    vincularSala: async (sala_id, professor_id = null) => {
        const formData = new FormData();
        formData.append('action', 'vincular_sala');
        formData.append('sala_id', sala_id);
        if (professor_id) formData.append('professor_id', professor_id);

        const res = await fetch(API_ROUTES, { method: 'POST', body: formData });
        return await res.json();
    },

    desvincularSala: async (sala_id) => {
        const formData = new FormData();
        formData.append('action', 'desvincular_sala');
        formData.append('sala_id', sala_id);
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

    importarLote: async (patrimonios, categoria_id, sala_id) => {
        const formData = new FormData();
        formData.append('action', 'importar_lote');
        formData.append('patrimonios', JSON.stringify(patrimonios));
        formData.append('categoria_id', categoria_id);
        formData.append('sala_id', sala_id);

        const res = await fetch(API_ROUTES, { method: 'POST', body: formData });
        return await res.json();
    },

    // Ocorrências
    salvarOcorrencia: async (patrimonio_id, sala_id, tipo, descricao, sala_destino_id = null) => {
        const formData = new FormData();
        formData.append('action', 'salvar_ocorrencia');
        formData.append('patrimonio_id', patrimonio_id);
        formData.append('sala_id', sala_id);
        formData.append('tipo', tipo);
        formData.append('descricao', descricao);
        if (sala_destino_id) {
            formData.append('sala_destino_id', sala_destino_id);
        }

        const res = await fetch(API_ROUTES, { method: 'POST', body: formData });
        return await res.json();
    },

    // Empréstimo
    registrarEmprestimo: async (patrimonio_ids, sala_origem_id, sala_destino_id) => {
        const formData = new FormData();
        formData.append('action', 'registrar_emprestimo');
        
        if (Array.isArray(patrimonio_ids)) {
            patrimonio_ids.forEach(id => formData.append('patrimonio_ids[]', id));
        } else {
            formData.append('patrimonio_ids[]', patrimonio_ids);
        }

        formData.append('sala_origem_id', sala_origem_id);
        formData.append('sala_destino_id', sala_destino_id);

        const res = await fetch(API_ROUTES, { method: 'POST', body: formData });
        return await res.json();
    },

    // Notificações
    getNotificacoes: async () => {
        const res = await fetch(`${API_ROUTES}?action=get_notificacoes`);
        const data = await res.json();
        return data.data || [];
    },
    marcarNotificacoesLidas: async () => {
        const res = await fetch(`${API_ROUTES}?action=marcar_notificacoes_lidas`);
        return await res.json();
    },
    marcarTodasLidas: async () => {
        const res = await fetch(`${API_ROUTES}?action=marcar_todas_lidas`);
        return await res.json();
    },
    responderTransferencia: async (notificacao_id, resposta) => {
        const formData = new FormData();
        formData.append('action', 'responder_transferencia');
        formData.append('notificacao_id', notificacao_id);
        formData.append('resposta', resposta);
        const res = await fetch(API_ROUTES, { method: 'POST', body: formData });
        return await res.json();
    },
    executarTransferenciaAdmin: async (notificacao_id) => {
        const formData = new FormData();
        formData.append('action', 'executar_transferencia_admin');
        formData.append('notificacao_id', notificacao_id);
        const res = await fetch(API_ROUTES, { method: 'POST', body: formData });
        return await res.json();
    }
};
