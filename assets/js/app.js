// app.js - Lógica principal de navegação SPA e integração de abas

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // NOTIFICAÇÕES (MODAL + POLLING)
    // ==========================================
    let notificacaoPollingInterval = null;

    window.abrirModalNotificacoes = async function(e) {
        if (e) e.stopPropagation();
        const modal = document.getElementById('modalNotificacoes');
        if (modal) {
            modal.classList.remove('hidden');
        }
        
        // Carrega notificações (mostra as não lidas)
        await carregarNotificacoes();
        
        // Marca as informativas como lidas no banco para não aparecerem na próxima vez
        await api.marcarNotificacoesLidas();
        
        // Atualiza badge para o que restou (provavelmente só as de ação)
        const notificacoes = await api.getNotificacoes();
        const naoLidas = notificacoes.filter(n => !n.lida).length;
        atualizarBadgeNotificacoes(naoLidas);
    };

    window.fecharModalNotificacoes = function() {
        const modal = document.getElementById('modalNotificacoes');
        if (modal) {
            modal.classList.add('hidden');
        }
    };

    // Fechar modal clicando fora
    document.addEventListener('click', (e) => {
        const modalNotif = document.getElementById('modalNotificacoes');
        if (modalNotif && e.target === modalNotif) {
            fecharModalNotificacoes();
        }
        const modalSala = document.getElementById('modalDetalhesSala');
        if (modalSala && e.target === modalSala) {
            fecharModalDetalhesSala();
        }
    });

    async function carregarNotificacoes() {
        const lista = document.getElementById('listaNotificacoes');
        if (!lista) return;

        try {
            const notificacoes = await api.getNotificacoes();
            const unreadOnly = notificacoes.filter(n => !n.lida);

            if (unreadOnly.length === 0) {
                lista.innerHTML = `
                    <div class="notificacao-vazia">
                        <i class="bi bi-bell-slash" style="font-size: 2.5rem; display: block; margin-bottom: 15px; color: #ccc;"></i>
                        Nenhuma notificação no momento.
                    </div>`;
                atualizarBadgeNotificacoes(0);
                return;
            }

            atualizarBadgeNotificacoes(unreadOnly.length);

            lista.innerHTML = unreadOnly.map(n => {
                const dataObj = new Date(n.criada_em);
                const dataStr = dataObj.toLocaleDateString('pt-BR');
                const horaStr = dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                const isNova = !n.lida;
                const dados = n.dados_json ? JSON.parse(n.dados_json) : null;
                
                let botoesAcao = '';
                if (dados && isNova) {
                    if (dados.type === 'TRANSFER_REQUEST_PROF') {
                        botoesAcao = `
                            <div style="display: flex; gap: 8px; margin-top: 10px;">
                                <button onclick="responderTransferencia(${n.id}, 'aceitar')" class="btn-success-mini" style="font-size: 0.75rem; padding: 5px 10px; border-radius: 4px; background: #22c55e; color: white;">Aceitar</button>
                                <button onclick="responderTransferencia(${n.id}, 'recusar')" class="btn-danger-mini" style="font-size: 0.75rem; padding: 5px 10px; border-radius: 4px; background: #ef4444; color: white;">Recusar</button>
                            </div>`;
                    } else if (dados.type === 'TRANSFER_EXECUTE_ADMIN') {
                        botoesAcao = `
                            <div style="margin-top: 10px;">
                                <button onclick="executarTransferenciaAdmin(${n.id})" class="btn-primary-mini" style="font-size: 0.75rem; padding: 5px 10px; border-radius: 4px; background: #1a73e8; color: white;">Finalizar Transferência</button>
                            </div>`;
                    }
                }

                return `
                    <div class="notificacao-item ${isNova ? 'notificacao-nova' : ''}" style="
                        padding: 12px 14px;
                        border-bottom: 1px solid var(--border-color, #eee);
                        background: ${isNova ? 'rgba(26, 115, 232, 0.06)' : 'transparent'};
                        transition: background 0.2s;
                    ">
                        <div style="display: flex; align-items: flex-start; gap: 10px;">
                            <i class="bi ${isNova ? 'bi-exclamation-triangle-fill' : 'bi-check-circle'}" style="
                                font-size: 1.2rem;
                                color: ${isNova ? 'var(--warning, #f59e0b)' : 'var(--success, #22c55e)'};
                                margin-top: 2px;
                            "></i>
                            <div style="flex: 1;">
                                <strong style="font-size: 0.9rem; color: var(--text-main);">${n.titulo}</strong>
                                <p style="font-size: 0.82rem; color: var(--text-muted, #777); margin: 4px 0 0;">${n.mensagem}</p>
                                ${botoesAcao}
                                <small style="font-size: 0.75rem; color: var(--text-muted, #999); display: block; margin-top: 5px;">${dataStr} às ${horaStr}</small>
                            </div>
                        </div>
                    </div>`;
            }).join('');
        } catch (e) {
            console.error('Erro ao carregar notificações', e);
        }
    }

    function atualizarBadgeNotificacoes(count) {
        const badge = document.getElementById('badgeNotificacoes');
        if (!badge) return;
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    window.marcarTodasComoLidas = async function() {
        try {
            const res = await api.marcarTodasLidas();
            if (res.status === 'success') {
                // Ao marcar todas, limpamos a visualização
                await carregarNotificacoes();
                atualizarBadgeNotificacoes(0);
            }
        } catch (e) {
            console.error('Erro ao marcar todas como lidas', e);
        }
    };

    // Event handlers para botões de notificação
    window.responderTransferencia = async function(notifId, resposta) {
        try {
            const res = await api.responderTransferencia(notifId, resposta);
            if (res.status === 'success') {
                carregarNotificacoes();
            }
        } catch (e) { console.error(e); }
    };

    window.executarTransferenciaAdmin = async function(notifId) {
        try {
            const res = await api.executarTransferenciaAdmin(notifId);
            if (res.status === 'success') {
                alert("Transferência realizada!");
                carregarNotificacoes();
            }
        } catch (e) { console.error(e); }
    };

    // Inicia o polling de notificações (apenas para admins, configurado após checkSession)
    window.iniciarPollingNotificacoes = function() {
        console.log("Iniciando polling de notificações...");
        // Carrega imediatamente
        carregarNotificacoes();
        // Polling a cada 30 segundos
        if (notificacaoPollingInterval) clearInterval(notificacaoPollingInterval);
        notificacaoPollingInterval = setInterval(() => {
            console.log("Executando polling periódico...");
            carregarNotificacoes();
        }, 30000);
    };

    // ==========================================
    // NAVEGAÇÃO ENTRE ABAS (SPA)
    // ==========================================
    const navItems = $$('.nav-item');
    const sections = $$('.app-section');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const targetId = item.getAttribute('data-target');
            switchTab(targetId);
        });
    });

    // Torna global para poder ser chamada pelo scanner.js
    window.switchTab = function (targetId) {
        // Atualiza botões
        navItems.forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`.nav-item[data-target="${targetId}"]`);
        if (activeBtn) activeBtn.classList.add('active');

        // Atualiza sessões
        sections.forEach(sec => sec.classList.add('hidden'));
        const targetSec = document.getElementById(targetId);
        if (targetSec) {
            targetSec.classList.remove('hidden');
            // Carrega dinâmicas
            aoAbrirAba(targetId);
        }
    }

    // ==========================================
    // LÓGICA POR ABA (Lazy Load)
    // ==========================================
    window.salasAuditadasNaSessao = window.salasAuditadasNaSessao || {};

    async function aoAbrirAba(abaId) {
        if (abaId === 'tab-scanner') {
            // Carrega salas no dropdown da auditoria
            if (!window.listaSalasCache) {
                window.listaSalasCache = await api.getSalas();
            }
            populateSelect('selectSalaScanner', window.listaSalasCache, 'id', 'nome_sala', 'Selecione a sala em que você está');

            const salaSalva = localStorage.getItem('usuario_sala_id');
            if (salaSalva) {
                $('#selectSalaScanner').value = salaSalva;
                carregarListaAuditoria(salaSalva); // Carrega a lista automaticamente
            }

            // Atualiza a lista quando o usuário seleciona uma sala diferente
            $('#selectSalaScanner').addEventListener('change', (e) => {
                const sId = e.target.value;
                if (sId) {
                    carregarListaAuditoria(sId);
                } else {
                    document.getElementById('containerListaAuditoria').classList.add('hidden');
                }
            });

            // Se o scanner não estiver rodando, inicia.
            if (!window.scannerIniciado) {
                initQRScanner();
                window.scannerIniciado = true;
            } else if (html5QrcodeScanner && html5QrcodeScanner.getState() === 3) { // 3 = PAUSED
                html5QrcodeScanner.resume();
                if (typeof atualizarBotaoScannerUI === 'function') atualizarBotaoScannerUI(true);
            }
        } else {
            // Pausa a câmera se estiver em outra aba
            if (html5QrcodeScanner && html5QrcodeScanner.getState() === 2) { // 2 = SCANNING
                html5QrcodeScanner.pause(true);
                if (typeof atualizarBotaoScannerUI === 'function') atualizarBotaoScannerUI(false);
            }
        }

        if (abaId === 'tab-cadastro') {
            await carregarDadosCadastro();
        }

        if (abaId === 'tab-salas') {
            await carregarDadosSala();
        }

        if (abaId === 'tab-ocorrencias') {
            await carregarDadosOcorrencias();
        }

        if (abaId === 'tab-emprestimos') {
            await carregarDadosEmprestimo();
        }
    }

    // Início (Dispara a primeira aba)
    aoAbrirAba('tab-scanner');


    // ==========================================
    // FUNCIONALIDADE: CADASTRO
    // ==========================================
    async function carregarDadosCadastro() {
        // Carrega Categorias
        if (!window.listaCategoriasCache) {
            window.listaCategoriasCache = await api.getCategorias();
        }
        populateSelect('cadCategoria', window.listaCategoriasCache, 'id', 'nome');

        // Carrega Salas
        if (!window.listaSalasCache) {
            window.listaSalasCache = await api.getSalas();
        }
        populateSelect('cadSala', window.listaSalasCache, 'id', 'nome_sala');

        // Se houver uma sala já salva no local storage, preencher por padrão
        const salaSalva = localStorage.getItem('usuario_sala_id');
        if (salaSalva) {
            $('#cadSala').value = salaSalva;
        }
    }

    $('#cadastroForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const qrcode = $('#cadQrcode').value;
        const nome = $('#cadNome').value;
        const categoria = $('#cadCategoria').value;
        const salaId = $('#cadSala').value;

        if (!qrcode || !nome || !categoria || !salaId) {
            showMessage('cadastroMessage', 'Preencha todos os campos.', 'error');
            return;
        }

        const btn = e.target.querySelector('button');
        btn.disabled = true; btn.textContent = "Salvando...";

        try {
            const res = await api.cadastrarPatrimonio(qrcode, nome, categoria, salaId);
            if (res.status === 'success') {
                showMessage('cadastroMessage', res.message, 'success');
                // Limpar apenas texto para facilitar múltiplos cadastros
                $('#cadQrcode').value = '';
                $('#cadNome').value = '';
            } else {
                showMessage('cadastroMessage', res.message, 'error');
            }
        } catch (err) {
            showMessage('cadastroMessage', 'Erro de conexão.', 'error');
        } finally {
            btn.disabled = false; btn.textContent = "Salvar Patrimônio";
        }
    });

    // ==========================================
    // IMPORTAÇÃO EM LOTE (EXCEL/CSV)
    // ==========================================
    const importLoteForm = $('#importLoteForm');
    if (importLoteForm) {
        importLoteForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const arquivoInput = $('#importArquivo');
            const categoriaId = $('#importCategoria').value;
            const salaId = $('#importSala').value;

            if (!arquivoInput.files.length) {
                showMessage('importLoteMessage', 'Selecione um arquivo.', 'error');
                return;
            }
            if (!categoriaId || !salaId) {
                showMessage('importLoteMessage', 'Selecione Categoria e Sala.', 'error');
                return;
            }

            const file = arquivoInput.files[0];
            const btn = $('#btnImportLote');
            btn.disabled = true; 
            btn.innerHTML = '<span class="spinner text-white" style="width: 1rem; height: 1rem; border-width: 0.15em;"></span> Processando...';

            const reader = new FileReader();
            reader.onload = async function (ev) {
                try {
                    const data = new Uint8Array(ev.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    
                    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
                    let patrimonios = [];
                    
                    // As colunas: 7 = QRCode (Nº Inventário), 10 = Nome (Denominação)
                    for (let i = 4; i < json.length; i++) {
                        const row = json[i];
                        if (!row || row.length < 11) continue;
                        
                        const qrcode = (row[7] || '').toString().trim();
                        const nome = (row[10] || '').toString().trim();
                        
                        if (qrcode && nome) {
                            patrimonios.push({ qrcode, nome });
                        }
                    }

                    if (patrimonios.length === 0) {
                        showMessage('importLoteMessage', 'Nenhum item válido encontrado na planilha (colunas H e K vazias).', 'error');
                        btn.disabled = false; btn.innerHTML = '<i class="bi bi-cloud-upload"></i> Processar Planilha';
                        return;
                    }

                    const res = await api.importarLote(patrimonios, categoriaId, salaId);
                    
                    if (res.status === 'success') {
                        let msg = `✅ Processado! Sucessos: ${res.sucesso}, Falhas/Duplicados: ${res.erros_count}.`;
                        if (res.erros_count > 0 && res.detalhes_erro) {
                            msg += `<br><small style="color:red; display:block; max-height:100px; overflow-y:auto; text-align:left; line-height:1.2; padding:5px; background:rgba(255,0,0,0.1); border-radius:4px;">`;
                            msg += res.detalhes_erro.slice(0, 5).join('<br>');
                            if (res.detalhes_erro.length > 5) msg += `<br>...mais ${res.detalhes_erro.length - 5} ocultos.</small>`;
                            else msg += `</small>`;
                        }
                        showMessage('importLoteMessage', msg, 'success');
                        importLoteForm.reset();
                    } else {
                        showMessage('importLoteMessage', res.mensagem || 'Erro na API.', 'error');
                    }
                } catch (err) {
                    console.error('Erro de Excel:', err);
                    showMessage('importLoteMessage', 'Erro ao ler o arquivo XLSX/CSV.', 'error');
                } finally {
                    btn.disabled = false; btn.innerHTML = '<i class="bi bi-cloud-upload"></i> Processar Planilha';
                }
            };
            reader.readAsArrayBuffer(file);
        });
    }

    // ==========================================
    // FUNCIONALIDADE: SALAS
      // ==========================================
    // FUNCIONALIDADE: SALAS (GESTÃO ADMINISTRATIVA E CONSULTA)
    // ==========================================
    async function carregarDadosSala() {
        const selectProf = document.getElementById('selectProfVincular');
        const selectSalaAdmin = document.getElementById('selectSalaAdminVincular');
        const selectSalaDesvinc = document.getElementById('selectSalaAdminDesvincular');
        
        try {
            // 1. Carrega as salas para os selects e visualização geral
            const todasSalas = await api.getSalas();
            window.listaSalasCache = todasSalas;
            
            // Renderiza lista geral para todos
            renderizarListaSalasGeral(todasSalas);

            // Popula selects administrativos
            populateSelect('selectSalaAdminVincular', todasSalas, 'id', 'nome_sala', 'Selecionar Sala');
            
            // Popula select de desvinculação (apenas salas que tem professor)
            const salasOcupadas = todasSalas.filter(s => s.professor_id != null);
            populateSelect('selectSalaAdminDesvincular', salasOcupadas, 'id', 'nome_sala', 'Selecionar Sala Ocupada');

            // 2. Carrega professores para o select administrativo
            const professores = await api.getProfessores();
            populateSelect('selectProfVincular', professores, 'id', 'nome', 'Selecionar Professor');

            // 3. Se for professor, carrega os seus vínculos específicos
            await carregarMinhasSalas();

            // 4. Inicializa o buscador de salas em tempo real
            inicializarBuscaSalas();
        } catch (e) {
            console.error(e);
        }
    }

    function inicializarBuscaSalas() {
        const inputBusca = document.getElementById('inputBuscaSala');
        if (!inputBusca || inputBusca.dataset.searchInitialized) return;

        inputBusca.addEventListener('input', (e) => {
            const termo = e.target.value.toLowerCase().trim();
            if (!window.listaSalasCache) return;

            const salasFiltradas = window.listaSalasCache.filter(sala => {
                const nomeSala = (sala.nome_sala || '').toLowerCase();
                const nomeProf = (sala.nome_professor || '').toLowerCase();
                return nomeSala.includes(termo) || nomeProf.includes(termo);
            });

            renderizarListaSalasGeral(salasFiltradas);
        });

        inputBusca.dataset.searchInitialized = "true";
    }

    // Listener para o novo formulário de desvinculação administrative
    const formDesvincAdmin = document.getElementById('desvincularAdminForm');
    if (formDesvincAdmin) formDesvincAdmin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const salaId = document.getElementById('selectSalaAdminDesvincular').value;
        const btn = e.target.querySelector('button');

        if (!confirm('Deseja realmente remover o professor responsável desta sala?')) return;

        btn.disabled = true; btn.textContent = "Removendo...";
        try {
            const res = await api.desvincularSala(salaId);
            if (res.status === 'success') {
                showMessage('msgDesvincAdmin', 'Responsabilidade removida com sucesso!', 'success');
                await carregarDadosSala();
            } else {
                showMessage('msgDesvincAdmin', res.message, 'error');
            }
        } catch (e) {
            showMessage('msgDesvincAdmin', 'Erro de conexão.', 'error');
        } finally {
            btn.disabled = false; btn.textContent = "Remover Professor";
        }
    });

    function renderizarListaSalasGeral(salas) {
        const container = document.getElementById('listaSalasGeral');
        if (!container) return;

        if (salas.length === 0) {
            container.innerHTML = '<p class="text-muted">Nenhuma sala cadastrada.</p>';
            return;
        }

        const isAdmin = window.usuarioTipo === 'admin';

        container.innerHTML = salas.map(sala => `
            <div class="list-item" style="cursor: pointer;" onclick="selecionarSalaParaVisualizar(${sala.id}, '${sala.nome_sala}')">
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                    <div>
                        <strong>${sala.nome_sala}</strong>
                        <div class="badge ${sala.nome_professor ? 'badge-success-soft' : 'badge-warning-soft'}" style="font-size: 0.75rem; padding: 4px 8px; border-radius: 6px; display: inline-block; margin-left: 10px;">
                            ${sala.nome_professor ? '<i class="bi bi-person-check"></i> ' + sala.nome_professor : '<i class="bi bi-person-x"></i> Sem Responsável'}
                        </div>
                    </div>
                    
                    ${isAdmin && sala.nome_professor ? `
                        <button class="btn-desvincular-mini" onclick="event.stopPropagation(); desvincularAdminSala(${sala.id}, '${sala.nome_sala}', '${sala.nome_professor}')" title="Remover Responsável">
                            <i class="bi bi-x-circle"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    // Função de desvincular administrativa
    window.desvincularAdminSala = async function(salaId, nomeSala, nomeProf) {
        if (!confirm(`Deseja realmente remover a responsabilidade de "${nomeProf}" sobre a sala "${nomeSala}"?`)) return;

        try {
            const res = await api.desvincularSala(salaId);
            if (res.status === 'success') {
                // Limpa o localstorage se for a sala que estava aberta
                if (localStorage.getItem('usuario_sala_id') == salaId) {
                    localStorage.removeItem('usuario_sala_id');
                    localStorage.removeItem('usuario_sala_nome');
                }
                await carregarDadosSala();
            } else {
                alert(res.message);
            }
        } catch (e) {
            console.error(e);
        }
    };

    async function carregarMinhasSalas() {
        const listaDiv = document.getElementById('listaMinhasSalas');
        const containerMinhas = document.getElementById('containerMinhasSalas');
        const placeholderVazio = document.getElementById('placeholderSalasVazio');

        try {
            const minhasSalas = await api.getMinhasSalas();
            
            // Apenas mostra o container de "Suas Salas" se houver vínculos
            if (minhasSalas.length > 0) {
                containerMinhas.classList.remove('hidden');
                placeholderVazio.classList.add('hidden');
                
                listaDiv.innerHTML = minhasSalas.map(sala => `
                    <div class="sala-card-premium" id="sala-card-${sala.id}" onclick="selecionarSalaParaVisualizar(${sala.id}, '${sala.nome_sala}')">
                        <div class="sala-card-info">
                            <i class="bi bi-door-open-fill" style="color: var(--senai-red);"></i>
                            <strong>${sala.nome_sala}</strong>
                        </div>
                    </div>
                `).join('');

                // Se houver uma sala salva, seleciona
                const salaAtiva = localStorage.getItem('usuario_sala_id');
                if (salaAtiva && minhasSalas.some(s => s.id == salaAtiva)) {
                    selecionarSalaParaVisualizar(salaAtiva, localStorage.getItem('usuario_sala_nome'));
                }
            } else {
                containerMinhas.classList.add('hidden');
                placeholderVazio.classList.remove('hidden');
            }
        } catch (e) {
            console.error(e);
        }
    }

    window.selecionarSalaParaVisualizar = async function(salaId, nomeSala) {
        // Estilização do card ativo se existir na lista do professor
        document.querySelectorAll('.sala-card-premium').forEach(c => c.classList.remove('active'));
        const cardAtivo = document.getElementById(`sala-card-${salaId}`);
        if (cardAtivo) cardAtivo.classList.add('active');

        // Salva estado
        localStorage.setItem('usuario_sala_id', salaId);
        localStorage.setItem('usuario_sala_nome', nomeSala);

        // Abre o modal de detalhes
        await abrirModalDetalhesSala(salaId, nomeSala);
    };

    window.abrirModalDetalhesSala = async function(salaId, nomeSala) {
        const modal = document.getElementById('modalDetalhesSala');
        if (modal) {
            modal.classList.remove('hidden');
        }
        
        // Atualiza títulos do modal
        document.getElementById('tituloSalaSelecionadaModal').innerHTML = `<i class="bi bi-box-seam" style="color: var(--senai-red);"></i> ${nomeSala}`;
        document.getElementById('subtituloSalaSelecionadaModal').textContent = `Patrimônios vinculados a este setor`;

        // Carrega patrimônios
        await carregarPatrimoniosSalaAtual(salaId);
    };

    window.fecharModalDetalhesSala = function() {
        const modal = document.getElementById('modalDetalhesSala');
        if (modal) {
            modal.classList.add('hidden');
        }
    };

    // --- Listeners Administrativos ---
    
    // Cadastro de Professor
    const formCadProf = document.getElementById('cadastrarProfessorForm');
    if (formCadProf) formCadProf.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = document.getElementById('profNome').value.trim();
        const email = document.getElementById('profEmail').value.trim();
        const senha = document.getElementById('profSenha').value;
        const btn = e.target.querySelector('button');

        btn.disabled = true; btn.textContent = "Cadastrando...";
        try {
            const res = await api.cadastrarProfessor(nome, email, senha);
            if (res.status === 'success') {
                showMessage('msgCadProf', res.message, 'success');
                e.target.reset();
                await carregarDadosSala();
            } else {
                showMessage('msgCadProf', res.message, 'error');
            }
        } catch (e) {
            showMessage('msgCadProf', 'Erro de conexão.', 'error');
        } finally {
            btn.disabled = false; btn.textContent = "Cadastrar Professor";
        }
    });

    // Vínculo Administrativo
    const formVincAdmin = document.getElementById('vincularAdminForm');
    if (formVincAdmin) formVincAdmin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const profId = document.getElementById('selectProfVincular').value;
        const salaId = document.getElementById('selectSalaAdminVincular').value;
        const btn = e.target.querySelector('button');

        btn.disabled = true; btn.textContent = "Vinculando...";
        try {
            const res = await api.vincularSala(salaId, profId);
            if (res.status === 'success') {
                showMessage('msgVincAdmin', 'Responsabilidade atribuída!', 'success');
                await carregarDadosSala();
            } else {
                showMessage('msgVincAdmin', res.message, 'error');
            }
        } catch (e) {
            showMessage('msgVincAdmin', 'Erro de conexão.', 'error');
        } finally {
            btn.disabled = false; btn.textContent = "Realizar Vínculo";
        }
    });

    // Cadastro de Sala
    const formCriarSala = document.getElementById('criarSalaForm');
    if (formCriarSala) formCriarSala.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nomeSala = document.getElementById('inputNovaSala').value.trim();
        const btn = e.target.querySelector('button');

        btn.disabled = true; btn.textContent = "...";
        try {
            const res = await api.cadastrarSala(nomeSala);
            if (res.status === 'success') {
                showMessage('criarSalaMessage', 'Setor criado!', 'success');
                document.getElementById('inputNovaSala').value = '';
                await carregarDadosSala();
            } else {
                showMessage('criarSalaMessage', res.message, 'error');
            }
        } catch (e) {
            showMessage('criarSalaMessage', 'Erro.', 'error');
        } finally {
            btn.disabled = false; btn.textContent = "Criar";
        }
    });

    async function carregarPatrimoniosSalaAtual(salaId) {
        const container = $('#listaPatrimoniosSala');
        container.innerHTML = '<div class="spinner-container-mini"><div class="spinner-mini"></div></div>';
        try {
            const itens = await api.getPatrimoniosSala(salaId);
            if (itens.length === 0) {
                container.innerHTML = '<p class="text-muted text-center" style="padding: 20px;">Nenhum patrimônio cadastrado nesta sala.</p>';
                return;
            }

            container.innerHTML = itens.map(item => `
                <div class="list-item">
                    <span class="list-item-badge">${item.numero_qrcode}</span>
                    <strong class="mt-2">${item.nome_descricao}</strong>
                    <div style="display: flex; flex-direction: column; gap: 2px;">
                        <span class="text-muted" style="font-size: 0.8rem;">Cat: ${item.categoria}</span>
                        <span class="text-main" style="font-size: 0.8rem; font-weight: 600;">
                            <i class="bi bi-person-badge" style="color: var(--primary);"></i> Responsável: ${item.nome_professor || '<span style="font-weight: 400; color: #999;">Não atribuído</span>'}
                        </span>
                    </div>
                </div>
            `).join('');
        } catch (e) {
            container.innerHTML = '<p class="text-danger">Erro ao carregar itens da sala.</p>';
        }
    }

    // ==========================================
    // FUNCIONALIDADE: LISTA DE AUDITORIA (ABA SCANNER)
    // ==========================================
    async function carregarListaAuditoria(salaId) {
        const container = document.getElementById('containerListaAuditoria');
        const listaDiv = document.getElementById('listaItensAuditoria');

        container.classList.remove('hidden');
        listaDiv.innerHTML = '<div class="spinner text-center"></div>';

        try {
            const itens = await api.getPatrimoniosSala(salaId);

            // Acumula os itens da sala na memória da sessão ao invés de sobrescrever
            window.salasAuditadasNaSessao[salaId] = itens;

            if (itens.length === 0) {
                listaDiv.innerHTML = '<p class="text-muted text-center" style="padding:10px;">Nenhum patrimônio registrado para esta sala no banco de dados.</p>';
                atualizarPainelAuditoriaUI(0, 0); // Zera o painel se não houver itens
                return;
            }

            listaDiv.innerHTML = itens.map(item => {
                const isLido = typeof patrimonioFoiLidoNaSessao === 'function' && patrimonioFoiLidoNaSessao(item.numero_qrcode);
                const classChecked = isLido ? 'checked' : '';
                const iconChecked = isLido ? '<i class="bi bi-check-circle-fill"></i>' : '<i class="bi bi-circle"></i>';

                return `
                    <div class="list-item-auditoria ${classChecked}" id="audit-item-${item.numero_qrcode}" style="cursor: pointer;" onclick="if(typeof processarLeituraQR === 'function') processarLeituraQR('${item.numero_qrcode}')">
                        <div class="item-info">
                            <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted);"><i class="bi bi-qr-code"></i> ${item.numero_qrcode}</span>
                            <strong style="font-size: 0.95rem; color: var(--text-main); margin-top: 2px;">${item.nome_descricao}</strong>
                            <div style="font-size: 0.75rem; color: var(--primary); font-weight: 600; margin-top: 2px;">
                                <i class="bi bi-person-badge"></i> Responsável: ${item.nome_professor || "Sem Professor"}
                            </div>
                        </div>
                        <div style="display: flex; align-items: center;">
                            <button type="button" class="btn-ocorrencia-mini" title="Informar Problema" onclick="event.stopPropagation(); abrirOcorrenciaManual(${item.id}, '${item.numero_qrcode}')">
                                <i class="bi bi-exclamation-triangle"></i>
                            </button>
                            <div class="item-status" style="margin-left: 10px;">
                                ${iconChecked}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            // Atualiza o painel de resumo baseado nos itens lidos
            const lidosCount = itens.filter(item => typeof patrimonioFoiLidoNaSessao === 'function' && patrimonioFoiLidoNaSessao(item.numero_qrcode)).length;
            atualizarPainelAuditoriaUI(itens.length, lidosCount);

        } catch (e) {
            listaDiv.innerHTML = '<p class="text-danger text-center">Erro ao carregar a lista de auditoria.</p>';
        }
    }

    // Atualiza a barra de progresso e números do painel
    window.atualizarPainelAuditoriaUI = function(total, lidos) {
        const spanTotal = document.getElementById('countItensSala');
        const spanLidos = document.getElementById('countItensLidos');
        const spanFaltantes = document.getElementById('countItensFaltantes');
        const labelProgresso = document.getElementById('labelProgressoAuditoria');
        const barraProgresso = document.getElementById('barProgressoAuditoria');

        if (!spanTotal || !spanLidos || !spanFaltantes) return;

        const faltantes = Math.max(0, total - lidos);
        const percentual = total > 0 ? Math.round((lidos / total) * 100) : 0;

        spanTotal.textContent = total;
        spanLidos.textContent = lidos;
        spanFaltantes.textContent = faltantes;
        labelProgresso.textContent = `${percentual}%`;
        barraProgresso.style.width = `${percentual}%`;
    };

    // Torna global para poder ser chamada do botão HTML gerado pelo mapa acima
    window.abrirOcorrenciaManual = function (patId, qrCode) {
        if (typeof preencherOcorrenciaRapida === 'function') {
            preencherOcorrenciaRapida(patId, qrCode);
        }
    }

    // Exportação em Excel Profissional (Usa ExcelJS para manter formatação do Template)
    window.finalizarAuditoria = async function () {
        if (!window.salasAuditadasNaSessao || Object.keys(window.salasAuditadasNaSessao).length === 0) {
            alert("Nenhuma sala foi auditada ainda.");
            return;
        }

        const btnExport = document.getElementById('btnExportFinal');
        if(btnExport) {
            btnExport.disabled = true;
            btnExport.querySelector('span').textContent = 'GERANDO RELATÓRIO...';
        }

        let todosItensSessao = [];
        for (const salaId in window.salasAuditadasNaSessao) {
            todosItensSessao = todosItensSessao.concat(window.salasAuditadasNaSessao[salaId]);
        }

        if (todosItensSessao.length === 0) {
            alert("Nenhum item encontrado para exportar.");
            if(btnExport) {
                btnExport.disabled = false;
                btnExport.querySelector('span').textContent = 'CONCLUIR E EXPORTAR EXCEL';
            }
            return;
        }

        try {
            console.log("Iniciando exportação com ExcelJS...");
            
            // 1. Busca o arquivo template original do servidor
            const response = await fetch('Patrimonio BLOCO C1 - BRUNO.xlsx');
            if (!response.ok) throw new Error("Template 'Patrimonio BLOCO C1 - BRUNO.xlsx' não encontrado no servidor.");
            const arrayBuffer = await response.arrayBuffer();

            // 2. Carrega o workbook usando ExcelJS
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(arrayBuffer);
            
            // Seleciona a primeira aba
            const worksheet = workbook.worksheets[0];

            // 3. Preenche os dados a partir da linha 5
            // De acordo com o modelo original:
            // Col A: LOCALIZ (Index 1)
            // Col B: NOME DO AMBIENTE (Index 2)
            // Col C: IMOB (Index 3)
            // Col D: Nº INVENTÁRIO (Index 4)
            // ... segue o mapeamento do seu modelo original
            
            let currentRow = 5;
            todosItensSessao.forEach(item => {
                const row = worksheet.getRow(currentRow);
                
                // Mapeamento baseado no seu arquivo original (indices 1-based no ExcelJS)
                const ambienteFull = `${item.codigo_unidade || ''} ${item.bloco || ''} ${item.sigla_sala || ''} ${item.nome_sala || ''}`.trim();
                const status = (typeof patrimonioFoiLidoNaSessao === 'function' && patrimonioFoiLidoNaSessao(item.numero_qrcode)) ? "Auditoria OK" : "Faltando";

                row.getCell(1).value = item.codigo_localizacao || "";      // A: LOCALIZ.
                row.getCell(2).value = ambienteFull;                      // B: NOME DO AMBIENTE
                row.getCell(3).value = "";                                // C: IMOB (Opcional)
                row.getCell(4).value = item.numero_qrcode;                // D: Nº INVENTÁRIO
                row.getCell(5).value = "";                                // E: DATA INCORP
                row.getCell(6).value = item.nome_descricao;               // F: DENOMINAÇÃO
                row.getCell(7).value = item.nome_professor || "";         // G: RESPONSÁVEL
                row.getCell(8).value = status;                            // H: STATUS/OCORRÊNCIA
                
                // Estilização básica das bordas para as novas linhas se necessário, 
                // mas o ExcelJS herda estilos se a linha já existir no template.
                row.commit();
                currentRow++;
            });

            // 4. Gera o buffer e dispara o download via FileSaver
            const buffer = await workbook.xlsx.writeBuffer();
            const dataStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
            saveAs(new Blob([buffer]), `Auditoria_Patrimonio_${dataStr}.xlsx`);

            console.log("Exportação concluída com sucesso!");

        } catch (err) {
            console.error("Erro na exportação ExcelJS:", err);
            alert("Erro ao gerar relatório profissional. Tentando exportação simples...");
            
            // Fallback para SheetJS (xlsx) simples caso o ExcelJS falhe
            try {
                const dadosExcel = todosItensSessao.map(item => ({
                    "Setor": item.nome_sala,
                    "Descrição": item.nome_descricao,
                    "QR Code": item.numero_qrcode,
                    "Responsável": item.nome_professor || "Não atribuído",
                    "Status": (typeof patrimonioFoiLidoNaSessao === 'function' && patrimonioFoiLidoNaSessao(item.numero_qrcode)) ? "Auditoria OK" : "Faltando"
                }));
                const wb = XLSX.utils.book_new();
                const ws = XLSX.utils.json_to_sheet(dadosExcel);
                XLSX.utils.book_append_sheet(wb, ws, "Auditoria");
                XLSX.writeFile(wb, `Auditoria_Simples_${new Date().getTime()}.xlsx`);
            } catch (e2) {
                alert("Falha crítica na exportação.");
            }
        } finally {
            if(btnExport) {
                btnExport.disabled = false;
                btnExport.querySelector('span').textContent = 'CONCLUIR E EXPORTAR EXCEL';
            }
        }
    };

    // ==========================================
    // FUNCIONALIDADE: OCORRÊNCIAS
    // ==========================================
    async function carregarDadosOcorrencias() {
        const selectSala = $('#selectSalaOcorrencia');
        const selectSalaDestino = $('#selectSalaDestinoOcorrencia');

        // Se já carregou salas, só popula
        const salas = window.listaSalasCache || await api.getSalas();
        window.listaSalasCache = salas;
        
        populateSelect('selectSalaOcorrencia', salas, 'id', 'nome_sala');
        populateSelect('selectSalaDestinoOcorrencia', salas, 'id', 'nome_sala', 'Selecione a sala de destino...');

        // Puxa sala salva
        const salaSalva = localStorage.getItem('usuario_sala_id');
        if (salaSalva) selectSala.value = salaSalva;
    }

    // Lógica para mostrar/esconder a sala de destino baseada no tipo de ocorrência
    const tipoOcorrenciaSelect = $('#tipoOcorrencia');
    if (tipoOcorrenciaSelect) {
        tipoOcorrenciaSelect.addEventListener('change', (e) => {
            const container = document.getElementById('containerSalaDestinoOcorrencia');
            console.log("Tipo de ocorrência alterado para:", e.target.value);
            if (e.target.value === 'Transferência') {
                container.classList.remove('hidden');
                console.log("Mostrando container de sala de destino");
            } else {
                container.classList.add('hidden');
                console.log("Escondendo container de sala de destino");
            }
        });
    } else {
        console.error("Elemento #tipoOcorrencia não encontrado!");
    }

    $('#ocorrenciaForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const patId = $('#selectPatrimonioOcorrencia').value;
        const salaId = $('#selectSalaOcorrencia').value;
        const tipo = $('#tipoOcorrencia').value;
        const desc = $('#descOcorrencia').value;
        const salaDestinoId = $('#selectSalaDestinoOcorrencia').value;

        if (!patId || !salaId || !tipo) {
            showMessage('ocorrenciaMessage', 'Preencha todos os campos obrigatórios.', 'error'); return;
        }

        if (tipo === 'Transferência' && !salaDestinoId) {
            showMessage('ocorrenciaMessage', 'Selecione a sala de destino para transferência.', 'error'); return;
        }

        const btn = e.target.querySelector('button');
        btn.disabled = true; btn.textContent = "Abrindo...";

        try {
            const res = await api.salvarOcorrencia(patId, salaId, tipo, desc, salaDestinoId);
            if (res.status === 'success') {
                showMessage('ocorrenciaMessage', res.message, 'success');
                $('#tipoOcorrencia').value = '';
                $('#descOcorrencia').value = '';
                document.getElementById('containerSalaDestinoOcorrencia').classList.add('hidden');
                // Limpa o select de patrimônio após o sucesso
                $('#selectPatrimonioOcorrencia').innerHTML = '<option value="">Leia o QR Code na aba principal...</option>';
            } else {
                showMessage('ocorrenciaMessage', res.message, 'error');
            }
        } catch (e) { showMessage('ocorrenciaMessage', 'Erro de conexão.', 'error'); }
        finally { btn.disabled = false; btn.textContent = "Abrir Ocorrência"; }
    });

    // ==========================================
    // FUNCIONALIDADE: EMPRÉSTIMOS
    // ==========================================
    async function carregarDadosEmprestimo() {
        const selectOrigem = $('#selectSalaEmprestimoOrigem');
        const selectDestino = $('#selectSalaEmprestimoDestino');
        const containerItens = $('#listaItensParaTransferir');

        // Carregar Salas
        const salas = window.listaSalasCache || await api.getSalas();
        window.listaSalasCache = salas;
        
        populateSelect('selectSalaEmprestimoOrigem', salas, 'id', 'nome_sala');
        populateSelect('selectSalaEmprestimoDestino', salas, 'id', 'nome_sala', 'Selecione a sala de destino...');

        // Tentar pré-selecionar a sala logada na ORIGEM
        const salaLogadaId = localStorage.getItem('usuario_sala_id');
        if (salaLogadaId) {
            selectOrigem.value = salaLogadaId;
            carregarItensParaTransferencia(salaLogadaId);
        }

        // Listener para mudar a lista de itens ao mudar a origem
        selectOrigem.addEventListener('change', (e) => {
            carregarItensParaTransferencia(e.target.value);
        });
    }

    async function carregarItensParaTransferencia(salaId) {
        const container = $('#listaItensParaTransferir');
        if (!salaId) {
            container.innerHTML = '<p class="text-muted" style="text-align: center;">Selecione a sala de origem.</p>';
            return;
        }

        container.innerHTML = '<div class="spinner-container-mini"><div class="spinner-mini"></div></div>';
        
        try {
            const itens = await api.getPatrimoniosSala(salaId);
            if (itens.length === 0) {
                container.innerHTML = '<p class="text-muted" style="text-align: center; padding: 10px;">Nenhum patrimônio encontrado nesta sala.</p>';
                return;
            }

            container.innerHTML = ''; // Limpa o loader
            
            itens.forEach(item => {
                const div = document.createElement('div');
                div.className = 'list-item-checkbox';
                div.style.cssText = 'display: flex; align-items: center; gap: 10px; padding: 8px; border-bottom: 1px solid rgba(0,0,0,0.05); cursor: pointer;';
                
                div.innerHTML = `
                    <input type="checkbox" name="patrimonio_ids[]" value="${item.id}" id="chk-item-${item.id}" style="width: 18px; height: 18px; cursor: pointer;">
                    <label for="chk-item-${item.id}" style="flex-grow: 1; display: flex; flex-direction: column; cursor: pointer;">
                        <strong style="font-size: 0.9rem;">${item.nome_descricao}</strong>
                        <span style="font-size: 0.75rem; color: var(--text-muted);">Cód: ${item.numero_qrcode} | Local: ${item.identificador_aux || 'N/A'}</span>
                    </label>
                `;
                
                // Toggle checkbox ao clicar na div
                div.addEventListener('click', (e) => {
                    if (e.target.tagName !== 'INPUT') {
                        const chk = div.querySelector('input');
                        chk.checked = !chk.checked;
                    }
                });

                container.appendChild(div);
            });
        } catch (error) {
            container.innerHTML = '<p class="text-danger" style="text-align: center;">Erro ao carregar itens.</p>';
        }
    }

    $('#emprestimoForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const origemId = $('#selectSalaEmprestimoOrigem').value;
        const destinoId = $('#selectSalaEmprestimoDestino').value;
        
        // Coletar itens selecionados
        const checkedBoxes = document.querySelectorAll('input[name="patrimonio_ids[]"]:checked');
        const idsSelecionados = Array.from(checkedBoxes).map(cb => cb.value);

        if (idsSelecionados.length === 0) {
            showMessage('emprestimoMessage', 'Selecione ao menos um equipamento para transferir.', 'error'); 
            return;
        }

        if (!destinoId) {
            showMessage('emprestimoMessage', 'Selecione o destino da transferência.', 'error'); 
            return;
        }

        if (destinoId === origemId) {
            showMessage('emprestimoMessage', 'Origem e destino não podem ser iguais.', 'error'); 
            return;
        }

        const btn = e.target.querySelector('button');
        btn.disabled = true; btn.textContent = "Processando transferência...";

        try {
            const res = await api.registrarEmprestimo(idsSelecionados, origemId, destinoId);
            if (res.status === 'success') {
                showMessage('emprestimoMessage', res.message, 'success');
                // Remove os itens processados da lista visual ou recarrega
                carregarItensParaTransferencia(origemId);
            } else {
                showMessage('emprestimoMessage', res.message, 'error');
            }
        } catch (e) { 
            console.error(e);
            showMessage('emprestimoMessage', 'Erro de conexão ao processar transferência.', 'error'); 
        } finally { 
            btn.disabled = false; 
            btn.textContent = "Concluir Transferência"; 
        }
    });

    // --- CADASTRO DE PATRIMÔNIO ---
    window.abrirModalCadastrarPatrimonio = async function() {
        const modal = document.getElementById('modalCadastrarPatrimonio');
        if (modal) modal.classList.remove('hidden');

        // Carregar Categorias e Salas
        try {
            const cats = await api.getCategorias();
            const salas = window.listaSalasCache || await api.getSalas();
            window.listaSalasCache = salas;

            populateSelect('reg_categoria', cats, 'id', 'nome', 'Selecione uma categoria...');
            populateSelect('reg_sala', salas, 'id', 'nome_sala', 'Selecione a sala de destino...');
            
            // Limpar mensagens e form
            const msgDiv = document.getElementById('cadPatrimonioMessage');
            if (msgDiv) msgDiv.innerHTML = '';
        } catch (error) {
            console.error("Erro ao carregar dados para o modal:", error);
        }
    };

    window.fecharModalCadastrarPatrimonio = function() {
        const modal = document.getElementById('modalCadastrarPatrimonio');
        if (modal) {
            modal.classList.add('hidden');
            const form = document.getElementById('formCadastrarPatrimonio');
            if (form) form.reset();
        }
    };

    const formCadPatrimonio = $('#formCadastrarPatrimonio');
    if (formCadPatrimonio) {
        formCadPatrimonio.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button');
            const msgDiv = 'cadPatrimonioMessage';

            const dados = {
                numero_qrcode: $('#reg_qrcode').value,
                nome_descricao: $('#reg_nome').value,
                categoria_id: $('#reg_categoria').value,
                sala_atual_id: $('#reg_sala').value
            };

            btn.disabled = true;
            btn.textContent = "Salvando...";

            try {
                const res = await api.cadastrarPatrimonio(dados);
                if (res.status === 'success') {
                    showMessage(msgDiv, res.message, 'success');
                    setTimeout(() => {
                        fecharModalCadastrarPatrimonio();
                        // Opcional: atualizar contador no dashboard se ele for implementado
                    }, 1500);
                } else {
                    showMessage(msgDiv, res.message, 'error');
                }
            } catch (err) {
                showMessage(msgDiv, "Erro ao processar cadastro.", 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = "Salvar Patrimônio";
            }
        });
    }

    // Inicia o polling de notificações...
    if (typeof window.iniciarPollingNotificacoes === 'function') {
        window.iniciarPollingNotificacoes();
    }
});
