// utilitários gerais
const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

// Exibe mensagens em formulários
function showMessage(elementId, text, type = 'success') {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = text;
    el.className = `form-messages mt-2 msg-${type}`;

    // Apaga após 4 segundos se for sucesso
    if (type === 'success') {
        setTimeout(() => {
            el.textContent = '';
            el.className = 'form-messages mt-2';
        }, 4000);
    }
}

// Preenche um elemento <select> com dados
function populateSelect(selectId, data, idField = 'id', textField = 'nome', defaultText = 'Selecione uma opção') {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = `<option value="">${defaultText}</option>`;
    data.forEach(item => {
        const option = document.createElement('option');
        option.value = item[idField];

        // Se quisermos juntar o nome da sala + nome do professor (ex no select de salas)
        if (item.nome_professor) {
            option.textContent = `${item[textField]} (Prof. ${item.nome_professor})`;
        } else {
            option.textContent = item[textField];
        }

        select.appendChild(option);
    });
}
