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
        // Marca como lidas ao abrir
        await api.marcarNotificacoesLidas();
        // Atualiza badge para 0
        atualizarBadgeNotificacoes(0);
        // Recarrega para mostrar como lidas
        await carregarNotificacoes();
    };

    window.fecharModalNotificacoes = function() {
        const modal = document.getElementById('modalNotificacoes');
        if (modal) {
            modal.classList.add('hidden');
        }
    };

    // Fechar modal clicando fora
    document.addEventListener('click', (e) => {
        const modal = document.getElementById('modalNotificacoes');
        if (modal && e.target === modal) {
            fecharModalNotificacoes();
        }
    });

    async function carregarNotificacoes() {
        const lista = document.getElementById('listaNotificacoes');
        if (!lista) return;

        try {
            const notificacoes = await api.getNotificacoes();

            if (notificacoes.length === 0) {
                lista.innerHTML = `
                    <div class="notificacao-vazia">
                        <i class="bi bi-bell-slash" style="font-size: 2.5rem; display: block; margin-bottom: 15px; color: #ccc;"></i>
                        Nenhuma notificação no momento.
                    </div>`;
                return;
            }

            const naoLidas = notificacoes.filter(n => !n.lida).length;
            atualizarBadgeNotificacoes(naoLidas);

            lista.innerHTML = notificacoes.map(n => {
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
    async function carregarDadosSala() {
        const select = $('#selectSalaVincular');
        select.innerHTML = '<option>Carregando...</option>';

        try {
            const salas = await api.getSalas();
            // Salva global para outras abas
            window.listaSalasCache = salas;
            populateSelect('selectSalaVincular', salas, 'id', 'nome_sala', 'Selecionar sua Sala');

            // Tenta pegar a sala atual se o usuario ja escolheu antes na sessao local (simulação persistência frontend)
            const salaSalva = localStorage.getItem('usuario_sala_id');
            if (salaSalva) {
                select.value = salaSalva;
                carregarPatrimoniosSalaAtual(salaSalva);
            }
        } catch (e) {
            console.error(e);
        }
    }

    $('#criarSalaForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const nomeSala = $('#inputNovaSala').value.trim();
        const btn = e.target.querySelector('button');

        if (!nomeSala) return;

        btn.disabled = true; btn.textContent = "Criando...";
        try {
            const res = await api.cadastrarSala(nomeSala);
            if (res.status === 'success') {
                showMessage('criarSalaMessage', res.message, 'success');
                $('#inputNovaSala').value = '';

                // Força recarregamento da lista de salas globalmente
                const salas = await api.getSalas();
                window.listaSalasCache = salas;

                // Recarrega o select da tela de vínculo
                populateSelect('selectSalaVincular', salas, 'id', 'nome_sala', 'Selecionar sua Sala');
                // Se o usuário tentar auditar ou abrir ocorrência logo em seguida, o select também tem que refletir a nova sala!
                if (document.getElementById('selectSalaScanner')) populateSelect('selectSalaScanner', salas, 'id', 'nome_sala', 'Selecione a sala em que você está');
                if (document.getElementById('selectSalaOcorrencia')) populateSelect('selectSalaOcorrencia', salas, 'id', 'nome_sala');

            } else {
                showMessage('criarSalaMessage', res.message, 'error');
            }
        } catch (e) {
            showMessage('criarSalaMessage', 'Erro de conexão.', 'error');
        } finally {
            btn.disabled = false; btn.textContent = "Criar Sala";
        }
    });

    $('#vincularSalaForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const salaSelect = $('#selectSalaVincular');
        const salaId = salaSelect.value;
        const btn = e.target.querySelector('button');

        if (!salaId) return;

        btn.disabled = true; btn.textContent = "Salvando...";
        try {
            // Professor_id simulado como 1 no app se não tiver var de sessão no JS
            const res = await api.vincularSala(salaId, 1);
            if (res.status === 'success') {
                showMessage('vincularMessage', 'Vínculo salvo com sucesso!', 'success');
                localStorage.setItem('usuario_sala_id', salaId);
                localStorage.setItem('usuario_sala_nome', salaSelect.options[salaSelect.selectedIndex].text);
                carregarPatrimoniosSalaAtual(salaId);
            } else {
                showMessage('vincularMessage', res.message, 'error');
            }
        } catch (e) {
            showMessage('vincularMessage', 'Erro de conexão.', 'error');
        } finally {
            btn.disabled = false; btn.textContent = "Salvar Vínculo";
        }
    });

    async function carregarPatrimoniosSalaAtual(salaId) {
        const container = $('#listaPatrimoniosSala');
        container.innerHTML = '<div class="spinner text-center"></div>';
        try {
            const itens = await api.getPatrimoniosSala(salaId);
            if (itens.length === 0) {
                container.innerHTML = '<p class="text-muted">Nenhum patrimônio cadastrado nesta sala.</p>';
                return;
            }

            container.innerHTML = itens.map(item => `
                <div class="list-item">
                    <span class="list-item-badge">${item.numero_qrcode}</span>
                    <strong class="mt-2">${item.nome_descricao}</strong>
                    <span class="text-muted">Cat: ${item.categoria}</span>
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

    // Exportação em Excel (Conclusão de Auditoria)
    window.finalizarAuditoria = async function () {
        if (!window.salasAuditadasNaSessao || Object.keys(window.salasAuditadasNaSessao).length === 0) {
            alert("Nenhuma sala foi auditada ainda.");
            return;
        }

        const btnExport = document.getElementById('btnExportFinal');
        if(btnExport) {
            btnExport.disabled = true;
            btnExport.querySelector('span').textContent = 'GERANDO...';
        }

        const agora = new Date();
        const dataStr = agora.toLocaleDateString('pt-BR');
        const horaStr = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        let todosItensSessao = [];
        for (const salaId in window.salasAuditadasNaSessao) {
            todosItensSessao = todosItensSessao.concat(window.salasAuditadasNaSessao[salaId]);
        }

        if (todosItensSessao.length === 0) return;

        // Gerar Excel usando o template do usuário (PATRIMONIO_FORMATADO.xlsx)
        try {
            // Busca o arquivo template no servidor localmente para o frontend usar
            const response = await fetch('PATRIMONIO_FORMATADO.xlsx');
            if (!response.ok) throw new Error("Template não encontrado.");
            const arrayBuffer = await response.arrayBuffer();
            
            // Lê o template
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Montar array of arrays (AOA) para anexar a partir da linha 5
            const dadosEmFormatoDeArray = todosItensSessao.map(item => {
                const status = (typeof patrimonioFoiLidoNaSessao === 'function' && patrimonioFoiLidoNaSessao(item.numero_qrcode)) ? "Auditoria OK" : "Faltando";
                return [
                    "20770001", // Default template col
                    "2077",     // Default
                    "00",       // Default
                    "01",       // Default
                    "", "", "", // Espaços Vazios (Merged cols)
                    item.numero_qrcode, // N INVENTÁRIO (Índice H - 7)
                    "",
                    dataStr, // DATA INCORP (Índice J - 9)
                    item.nome_descricao, // DENOMINAÇÃO (Índice K - 10)
                    item.nome_professor || "Sem Prof.", // RESPONSAVEL (Índice L - 11)
                    status, // OCORRÊNCIA/STATUS (Índice M - 12)
                    item.nome_sala, // EXTRA (Sala Destino)
                    "" // Disp
                ];
            });

            // Adicionar os dados no sheet a partir da célula A5 (linha index 4)
            XLSX.utils.sheet_add_aoa(worksheet, dadosEmFormatoDeArray, { origin: "A5" });

            // Salvar
            XLSX.writeFile(workbook, `Auditoria_Patrimonio_${dataStr.replace(/\//g, '-')}.xlsx`);
            
        } catch (err) {
            console.error("Erro ao usar template Excel, fazendo fallback para tabela simples:", err);
            // Fallback original
            const dadosExcel = todosItensSessao.map(item => ({
                "Sala": item.nome_sala,
                "Equipamento": item.nome_descricao,
                "QR Code": item.numero_qrcode,
                "Prof. Responsável": item.nome_professor || "Não atribuído",
                "Data": dataStr,
                "Hora": horaStr,
                "Status": (typeof patrimonioFoiLidoNaSessao === 'function' && patrimonioFoiLidoNaSessao(item.numero_qrcode)) ? "Presente" : "Faltando"
            }));
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(dadosExcel);
            worksheet['!cols'] = [{ wch: 25 }, { wch: 35 }, { wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 10 }, { wch: 15 }];
            XLSX.utils.book_append_sheet(workbook, worksheet, "Auditoria");
            XLSX.writeFile(workbook, `Auditoria_Patrimonio_${dataStr.replace(/\//g, '-')}.xlsx`);
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
        const selectDestino = $('#selectSalaEmprestimoDestino');
        const selectPat = $('#selectPatrimonioEmprestimo');

        if (window.listaSalasCache) {
            populateSelect('selectSalaEmprestimoDestino', window.listaSalasCache, 'id', 'nome_sala');
        } else {
            const salas = await api.getSalas();
            window.listaSalasCache = salas;
            populateSelect('selectSalaEmprestimoDestino', salas, 'id', 'nome_sala');
        }

        const salaSalva = localStorage.getItem('usuario_sala_id');
        if (salaSalva) {
            // Caregar os patrimonios que estão DE FATO na minha sala, para eu só poder emprestar o que é meu
            const itens = await api.getPatrimoniosSala(salaSalva);
            populateSelect('selectPatrimonioEmprestimo', itens, 'id', 'nome_descricao', 'Selecione o que deseja transferir');
        } else {
            selectPat.innerHTML = '<option value="">Selecione primeiro uma Sala na aba "Salas"</option>';
        }
    }

    $('#emprestimoForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const patId = $('#selectPatrimonioEmprestimo').value;
        const destinoId = $('#selectSalaEmprestimoDestino').value;
        const origemId = localStorage.getItem('usuario_sala_id'); // Sala Logada

        if (!patId || !destinoId || !origemId) {
            showMessage('emprestimoMessage', 'Preencha patrimônio, destino e vincule sua sala primeiramente.', 'error'); return;
        }

        if (destinoId === origemId) {
            showMessage('emprestimoMessage', 'Não é possível transferir para a mesma sala.', 'error'); return;
        }

        const btn = e.target.querySelector('button');
        btn.disabled = true; btn.textContent = "Transferindo...";

        try {
            const res = await api.registrarEmprestimo(patId, origemId, destinoId);
            if (res.status === 'success') {
                showMessage('emprestimoMessage', res.message, 'success');
                // Remove o item do select da minha sala, pois já foi doado
                const optToDel = document.querySelector(`#selectPatrimonioEmprestimo option[value="${patId}"]`);
                if (optToDel) optToDel.remove();
            } else {
                showMessage('emprestimoMessage', res.message, 'error');
            }
        } catch (e) { showMessage('emprestimoMessage', 'Erro de conexão.', 'error'); }
        finally { btn.disabled = false; btn.textContent = "Transferir Equipamento"; }
    });

    // Inicia o polling de notificações se o usuário já estiver logado (e a função injetada pelo auth.js falhou por ordem de load)
    if (typeof window.iniciarPollingNotificacoes === 'function') {
        window.iniciarPollingNotificacoes();
    }
});
