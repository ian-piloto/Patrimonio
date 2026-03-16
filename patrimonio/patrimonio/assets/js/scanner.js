// Controle do leitor de QR Code usando a biblioteca html5-qrcode

let html5QrcodeScanner = null;

function onScanSuccess(decodedText, decodedResult) {
    // Parar temporariamente o scanner
    if (html5QrcodeScanner) {
        html5QrcodeScanner.pause(true);
    }

    console.log(`QR Code Lido: ${decodedText}`);
    processarLeituraQR(decodedText);
}

function onScanFailure(error) {
    // ignorado - a biblioteca dispara isso muitas vezes até achar o código
}

function initQRScanner() {
    const readerElement = document.getElementById("reader");
    if (!readerElement) return; // Só inicializa na tela que tem scanner

    // Configuração focada em leitura mais rápida e flexível
    const config = {
        fps: 20, // Aumentado para 20 frames por segundo para identificar o código mais rápido
        qrbox: function (viewfinderWidth, viewfinderHeight) {
            // Cria a caixa de foco com tamanho 70% relativo ao tamanho da tela do celular/PC
            let minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
            let qrboxSize = Math.floor(minEdgeSize * 0.7);
            return {
                width: qrboxSize,
                height: qrboxSize
            };
        },
        aspectRatio: 1.0,
        disableFlip: false, // Permite ler o código mesmo se estiver espelhado pela câmera
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
    };

    html5QrcodeScanner = new Html5Qrcode("reader");

    // Tenta usar a câmera de trás
    html5QrcodeScanner.start(
        { facingMode: "environment" },
        config,
        onScanSuccess,
        onScanFailure
    ).then(() => {
        document.getElementById('btnToggleScanner').style.display = 'block';
        atualizarBotaoScannerUI(true);
    }).catch(err => {
        console.error("Erro ao iniciar a câmera traseira, tentando default.", err);
        // Fallback default
        html5QrcodeScanner.start(
            { facingMode: "user" },
            config,
            onScanSuccess,
            onScanFailure
        ).then(() => {
            document.getElementById('btnToggleScanner').style.display = 'block';
            atualizarBotaoScannerUI(true);
        }).catch(e => {
            readerElement.innerHTML = `<div class="p-3 text-center text-danger">Não foi possível acessar a câmera do dispositivo. Verifique as permissões.</div>`;
        });
    });
}

// Variáveis para guardar dados do fluxo da modal
let tempPatrimonioId = null;
let tempQrCode = null;

// Armazena os QR Codes já lidos na sessão atual da sala
let patrimoniosEscaneadosNaSessao = new Set();

// Torna global para resetar via app.js ao trocar de sala
window.resetarPatrimoniosEscaneados = function () {
    patrimoniosEscaneadosNaSessao.clear();
}

window.patrimonioFoiLidoNaSessao = function (qrcode) {
    return patrimoniosEscaneadosNaSessao.has(qrcode);
}

// Processa o código encontrado na API do banco de dados 
async function processarLeituraQR(qrcodeStr) {
    const resBox = document.getElementById('scanResult');
    const selectSalaScanner = document.getElementById('selectSalaScanner');
    const salaSelecionadaId = selectSalaScanner.value;

    if (!salaSelecionadaId) {
        alert("Por favor, selecione a 'Sala da Auditoria' antes de ler um QR Code.");
        retomarLeitura();
        return;
    }

    // Alerta de Leitura Duplicada
    if (patrimoniosEscaneadosNaSessao.has(qrcodeStr)) {
        alert(`O QR Code ${qrcodeStr} já foi auditado nesta sessão!`);
        retomarLeitura();
        return;
    }

    resBox.classList.remove('hidden');
    resBox.innerHTML = `<div class="text-center"><div class="spinner"></div><p>Verificando patrimônio...</p></div>`;

    try {
        const response = await api.buscarPatrimonioPorQR(qrcodeStr);
        resBox.classList.add('hidden'); // Ocultar o box normal, vamos usar as modais

        if (response.status === 'success') {
            const p = response.data;

            // Lógica da Auditoria de Sala
            if (p.sala_atual_id == salaSelecionadaId) {
                // Marca como escaneado na sessão
                patrimoniosEscaneadosNaSessao.add(qrcodeStr);

                // Atualiza UI da lista de auditoria
                atualizarItemNaLista(qrcodeStr);

                // Atualiza o painel de resumo (Real-time)
                const itensSala = window.salasAuditadasNaSessao[salaSelecionadaId] || [];
                const lidosCount = itensSala.filter(item => patrimoniosEscaneadosNaSessao.has(item.numero_qrcode)).length;
                if (typeof atualizarPainelAuditoriaUI === 'function') {
                    atualizarPainelAuditoriaUI(itensSala.length, lidosCount);
                }

                mostrarModalAuditoria(true, p);
            } else {
                mostrarModalAuditoria(false, p);
            }
        } else {
            // Se não encontrou no banco
            document.getElementById('modalAuditoria').classList.remove('hidden');
            document.getElementById('modalIcon').className = 'modal-icon error';
            document.getElementById('modalIcon').innerHTML = '<i class="bi bi-x-circle-fill"></i>';
            document.getElementById('modalTitle').textContent = 'QR Code Não Encontrado';
            document.getElementById('modalTitle').style.color = 'var(--senai-red)';
            document.getElementById('modalText').innerHTML = `
                <div style="font-size:1.15rem; font-weight:700; color:var(--text-main); margin-bottom:10px;">
                    <i class="bi bi-qr-code"></i> ${qrcodeStr}
                </div>
                Esta etiqueta não está registrada no banco de dados do sistema.`;
            document.getElementById('btnAcaoModal').classList.add('hidden');

            // Exibir opção de cadastro Apenas se admin
            const btnCad = document.getElementById('btnCadastrarNovoModal');
            if (btnCad) {
                if (window.usuarioTipo === 'admin') {
                    btnCad.classList.remove('hidden');
                } else {
                    btnCad.classList.add('restricted-access');
                    const textAviso = document.createElement('p');
                    textAviso.innerHTML = `<small class="text-danger mt-2 d-block">Apenas administradores podem cadastrar novos patrimônios.</small>`;
                    document.getElementById('modalText').appendChild(textAviso);
                }
            }
            tempQrCode = qrcodeStr;
        }
    } catch (e) {
        resBox.classList.remove('hidden');
        resBox.innerHTML = `<p class="text-danger">Erro de conexão.</p><button class="btn-primary w-100 mt-2" onclick="retomarLeitura()">Tentar Novamente</button>`;
    }
}

function mostrarModalAuditoria(isCorreta, patrimonio) {
    const modal = document.getElementById('modalAuditoria');
    const icon = document.getElementById('modalIcon');
    const title = document.getElementById('modalTitle');
    const text = document.getElementById('modalText');
    const btnOcorrencia = document.getElementById('btnAcaoModal');

    modal.classList.remove('hidden');

    if (isCorreta) {
        icon.className = 'modal-icon success';
        icon.innerHTML = '<i class="bi bi-check-circle-fill"></i>';
        title.textContent = 'Sala Correta!';
        title.style.color = 'var(--success)';
        text.innerHTML = `
            <div style="font-size:1.15rem; font-weight:700; color:var(--text-main); margin-bottom:10px;">
                <i class="bi bi-qr-code"></i> ${patrimonio.numero_qrcode}
            </div>
            O equipamento <b>${patrimonio.nome_descricao}</b> pertence a esta sala. Tudo certo!`;
        btnOcorrencia.classList.add('hidden');
    } else {
        icon.className = 'modal-icon error';
        icon.innerHTML = '<i class="bi bi-exclamation-triangle-fill"></i>';
        title.textContent = 'Sala Incorreta!';
        title.style.color = 'var(--senai-red)';
        text.innerHTML = `
            <div style="font-size:1.15rem; font-weight:700; color:var(--senai-red); margin-bottom:10px;">
                <i class="bi bi-qr-code"></i> ${patrimonio.numero_qrcode}
            </div>
            O equipamento <b>${patrimonio.nome_descricao}</b> deveria estar na sala <b>${patrimonio.nome_sala}</b>.<br><br>Deseja abrir uma ocorrência informando que o encontrou aqui?`;

        // Permite que qualquer usuário (professor ou admin) abra a ocorrência de item fora da sala
        btnOcorrencia.classList.remove('hidden');

        // Salva para poder abrir a ocorrência depois
        tempPatrimonioId = patrimonio.id;
        tempQrCode = patrimonio.numero_qrcode;
    }
}

function fecharModalAuditoria() {
    document.getElementById('modalAuditoria').classList.add('hidden');
    // Reinicia botões
    document.getElementById('btnAcaoModal').classList.add('hidden');
    const btnCad = document.getElementById('btnCadastrarNovoModal');
    if (btnCad) btnCad.classList.add('hidden');

    retomarLeitura();
}

function atualizarItemNaLista(qrcodeStr) {
    const itemDiv = document.getElementById(`audit-item-${qrcodeStr}`);
    if (itemDiv) {
        itemDiv.classList.add('checked');
        const statusDiv = itemDiv.querySelector('.item-status');
        if (statusDiv) {
            statusDiv.innerHTML = '<i class="bi bi-check-circle-fill"></i>';
        }
    }
}

function redirecionarParaCadastro() {
    if (!tempQrCode) return;

    // Fecha a modal
    document.getElementById('modalAuditoria').classList.add('hidden');
    // Limpa estado da modal
    document.getElementById('btnAcaoModal').classList.add('hidden');
    const btnCad = document.getElementById('btnCadastrarNovoModal');
    if (btnCad) btnCad.classList.add('hidden');

    // Troca para a aba de cadastro
    if (typeof switchTab === 'function') {
        switchTab('tab-cadastro');

        // Preenche o campo de QR Code
        const inputQr = document.getElementById('cadQrcode');
        if (inputQr) {
            inputQr.value = tempQrCode;
            // Foca no próximo campo importante ou destaca o preenchimento
            const inputNome = document.getElementById('cadNome');
            if (inputNome) inputNome.focus();
        }
    }
}

function abrirOcorrenciaViaModal() {
    fecharModalAuditoria();
    if (tempPatrimonioId && tempQrCode) {
        preencherOcorrenciaRapida(tempPatrimonioId, tempQrCode);
    }
}

function retomarLeitura() {
    document.getElementById('scanResult').classList.add('hidden');
    if (html5QrcodeScanner) {
        // 3 = PAUSED
        if (html5QrcodeScanner.getState() === 3) {
            html5QrcodeScanner.resume();
            atualizarBotaoScannerUI(true);
        }
    }
}

// Atalho do QR Code pra aba "Ocorrências"
function preencherOcorrenciaRapida(patId, qrCode) {
    // Troca de aba programaticamente
    switchTab('tab-ocorrencias');

    // Atualiza o select de patrimônios na aba Ocorrencia
    const selectPat = document.getElementById('selectPatrimonioOcorrencia');
    if (selectPat) {
        selectPat.innerHTML = `<option value="${patId}" selected>[LIDO] ${qrCode}</option>`;
    }

    // Preenche a sala e a descrição com a sala que estava scaneando
    const selectSalaScaneada = document.getElementById('selectSalaScanner').value;
    if (selectSalaScaneada) {
        document.getElementById('selectSalaOcorrencia').value = selectSalaScaneada;
    }

    document.getElementById('descOcorrencia').value = "O equipamento foi encontrado nesta sala durante uma auditoria de QR Code, porém seu registro indica outra sala.";
}

// Controla o botão Pausar/Retomar
function toggleScanner() {
    if (!html5QrcodeScanner) return;

    const state = html5QrcodeScanner.getState();
    if (state === 2) { // SCANNING
        html5QrcodeScanner.pause(true);
        atualizarBotaoScannerUI(false);
    } else if (state === 3) { // PAUSED
        html5QrcodeScanner.resume();
        atualizarBotaoScannerUI(true);
    }
}

// Submeter via digitação manual
function submeterQRManual() {
    const inputField = document.getElementById('inputManualQR');
    if (!inputField) return;

    const qrValue = inputField.value.trim().toUpperCase();
    if (qrValue === "") {
        alert("Por favor, digite algum código primeiro.");
        return;
    }

    // Chama o ecossistema pronto, simulando que a camera leu
    processarLeituraQR(qrValue);

    // Zera o input para facilitar a proxima digitação
    inputField.value = "";
    inputField.focus();
}

// Atualiza visual do botão
function atualizarBotaoScannerUI(isScanning) {
    const btn = document.getElementById('btnToggleScanner');
    if (!btn) return;

    if (isScanning) {
        btn.innerHTML = '<i class="bi bi-pause-circle"></i> Pausar Leitor';
        btn.classList.replace('btn-warning', 'btn-primary');
    } else {
        btn.innerHTML = '<i class="bi bi-play-circle"></i> Retomar Leitor';
        btn.classList.replace('btn-primary', 'btn-warning');
    }
}
