let pecasTemporarias = [];

// Elementos da Interface
const inputTipo = document.getElementById('tipo');
const inputPrefixo = document.getElementById('prefixo');
const inputDataServico = document.getElementById('data-servico');
const selectPeca = document.getElementById('peca');
const inputQuantidade = document.getElementById('quantidade');
const btnAddPeca = document.getElementById('btn-add-peca');
const listaPecasTemp = document.getElementById('lista-pecas-temp');
const btnSalvarServico = document.getElementById('btn-salvar-servico');
const tabelaHistoricoBody = document.querySelector('#tabela-historico tbody');
const inputBuscaPrefixo = document.getElementById('busca-prefixo');
const inputBuscaData = document.getElementById('busca-data');

// Preenche a data com hoje por padrão
document.addEventListener('DOMContentLoaded', () => {
    const hoje = new Date().toISOString().split('T')[0];
    inputDataServico.value = hoje;
    carregarHistorico();
});

// 1. ADICIONAR PEÇA À LISTA TEMPORÁRIA
btnAddPeca.addEventListener('click', () => {
    const peca = selectPeca.value;
    const qtd = parseInt(inputQuantidade.value);

    if (!peca) {
        alert('Por favor, selecione uma peça!');
        return;
    }

    if (!qtd || qtd <= 0) {
        alert('Informe uma quantidade válida!');
        return;
    }

    pecasTemporarias.push({ peca, quantidade: qtd });

    selectPeca.value = '';
    inputQuantidade.value = 1;

    atualizarListaTemporaria();
});

function atualizarListaTemporaria() {
    listaPecasTemp.innerHTML = '';

    if (pecasTemporarias.length === 0) {
        listaPecasTemp.innerHTML = '<li style="border-left:none; color: #787f91;">Nenhuma peça adicionada ainda.</li>';
        return;
    }

    pecasTemporarias.forEach((item, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span><strong>${item.quantidade}x</strong> ${item.peca}</span>
            <button type="button" onclick="removerPecaTemp(${index})" style="background:none; border:none; color:#ff4d6d; cursor:pointer; font-weight:bold;">✕</button>
        `;
        listaPecasTemp.appendChild(li);
    });
}

function removerPecaTemp(index) {
    pecasTemporarias.splice(index, 1);
    atualizarListaTemporaria();
}

// 2. SALVAR SERVIÇO COMPLETO
btnSalvarServico.addEventListener('click', () => {
    const tipo = inputTipo.value;
    const prefixo = inputPrefixo.value.trim();
    const data = inputDataServico.value;

    if (!prefixo) {
        alert('Por favor, preencha o Prefixo / Identificação.');
        return;
    }

    if (pecasTemporarias.length === 0) {
        alert('Adicione pelo menos uma peça antes de salvar o serviço!');
        return;
    }

    const resumoPecas = pecasTemporarias
        .map(p => `${p.quantidade}x ${p.peca}`)
        .join(', ');

    const novoRegistro = {
        id: Date.now(), // ID único baseado no horário
        data: data,
        tipo: tipo,
        prefixo: prefixo,
        pecas: resumoPecas
    };

    const historico = JSON.parse(localStorage.getItem('historicoServicos')) || [];
    historico.unshift(novoRegistro);
    localStorage.setItem('historicoServicos', JSON.stringify(historico));

    inputPrefixo.value = '';
    pecasTemporarias = [];
    atualizarListaTemporaria();

    carregarHistorico();
});

// 3. CARREGAR E EXIBIR HISTÓRICO
function carregarHistorico() {
    const historico = JSON.parse(localStorage.getItem('historicoServicos')) || [];
    const filtroPrefixo = inputBuscaPrefixo.value.toLowerCase().trim();
    const filtroData = inputBuscaData.value;

    tabelaHistoricoBody.innerHTML = '';

    const registrosFiltrados = historico.filter(item => {
        const bateuPrefixo = item.prefixo.toLowerCase().includes(filtroPrefixo);
        const bateuData = filtroData ? item.data === filtroData : true;
        return bateuPrefixo && bateuData;
    });

    if (registrosFiltrados.length === 0) {
        tabelaHistoricoBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: #787f91; padding: 20px;">
                    Nenhum registro encontrado.
                </td>
            </tr>
        `;
        return;
    }

    registrosFiltrados.forEach(item => {
        const [ano, mes, dia] = item.data.split('-');
        const dataFormatada = `${dia}/${mes}/${ano}`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${dataFormatada}</td>
            <td><strong>${item.tipo}</strong></td>
            <td style="color: #00bfff; font-weight: 600;">${item.prefixo}</td>
            <td>${item.pecas}</td>
            <td style="text-align: center;" class="coluna-acao">
                <button type="button" onclick="excluirRegistro(${item.id})" class="btn-deletar" title="Excluir Registro">
                    🗑️
                </button>
            </td>
        `;
        tabelaHistoricoBody.appendChild(tr);
    });
}

// 4. FUNÇÃO PARA EXCLUIR REGISTRO ERRADO
function excluirRegistro(id) {
    if (confirm('Tem certeza que deseja excluir este registro do histórico?')) {
        let historico = JSON.parse(localStorage.getItem('historicoServicos')) || [];
        // Filtra mantendo apenas os itens com ID diferente do selecionado
        historico = historico.filter(item => item.id !== id);
        localStorage.setItem('historicoServicos', JSON.stringify(historico));
        carregarHistorico(); // Atualiza a tabela na tela
    }
}

inputBuscaPrefixo.addEventListener('input', carregarHistorico);
inputBuscaData.addEventListener('change', carregarHistorico);

document.getElementById('btn-pdf').addEventListener('click', () => {
    window.print();
});