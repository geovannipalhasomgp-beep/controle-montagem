// DADOS SALVOS NO LAVEGADOR (LOCALSTORAGE)
let estoque = JSON.parse(localStorage.getItem('estoquePeças')) || {};
let historico = JSON.parse(localStorage.getItem('historicoServicos')) || [];
let pecasDoServicoAtual = [];

// DEFINIR DATA ATUAL NO INPUT
document.getElementById('dataServico').valueAsDate = new Date();

// 1. GERENCIAMENTO DE ESTOQUE
function renderizarEstoque() {
    const lista = document.getElementById('listaEstoque');
    const selectPeca = document.getElementById('selectPecaEstoque');
    
    lista.innerHTML = '';
    selectPeca.innerHTML = '<option value="">-- Selecione uma Peça --</option>';

    for (let peca in estoque) {
        const qtd = estoque[peca];
        let status = '<span style="color: #00f3ff;">OK</span>';
        
        if (qtd <= 1) {
            status = '<span style="color: #ff0055; font-weight: bold; text-shadow: 0 0 8px #ff0055;">⚠️ PEDIR COMPRA</span>';
        }

        lista.innerHTML += `
            <tr>
                <td><b>${peca}</b></td>
                <td>${qtd} un</td>
                <td>${status}</td>
                <td><button class="btn-deletar" onclick="removerEstoque('${peca}')">🗑️</button></td>
            </tr>
        `;

        selectPeca.innerHTML += `<option value="${peca}">${peca} (Estoque: ${qtd})</option>`;
    }

    localStorage.setItem('estoquePeças', JSON.stringify(estoque));
}

function adicionarEstoque() {
    const nome = document.getElementById('nomePecaEstoque').value.trim().toUpperCase();
    const qtd = parseInt(document.getElementById('qtdPecaEstoque').value);

    if (!nome || isNaN(qtd)) {
        alert("Preencha o nome da peça e a quantidade corretamente!");
        return;
    }

    estoque[nome] = (estoque[nome] || 0) + qtd;
    document.getElementById('nomePecaEstoque').value = '';
    document.getElementById('qtdPecaEstoque').value = '';
    
    renderizarEstoque();
}

function removerEstoque(peca) {
    if (confirm(`Deseja remover a peça "${peca}" do estoque?`)) {
        delete estoque[peca];
        renderizarEstoque();
    }
}

// 2. REGISTRO DE SERVIÇOS
function adicionarPecaServico() {
    const peca = document.getElementById('selectPecaEstoque').value;
    const qtd = parseInt(document.getElementById('qtdUsoPeca').value);

    if (!peca || isNaN(qtd) || qtd <= 0) {
        alert("Selecione uma peça válida e informe uma quantidade maior que zero.");
        return;
    }

    if (qtd > estoque[peca]) {
        alert(`Quantidade indisponível no estoque! Estoque atual de ${peca}: ${estoque[peca]}`);
        return;
    }

    pecasDoServicoAtual.push({ nome: peca, qtd: qtd });
    document.getElementById('qtdUsoPeca').value = 1;
    renderizarPecasServicoTemp();
}

function renderizarPecasServicoTemp() {
    const tabela = document.getElementById('listaPecasTemp');
    tabela.innerHTML = '';

    pecasDoServicoAtual.forEach((item, index) => {
        tabela.innerHTML += `
            <tr>
                <td>${item.nome}</td>
                <td>${item.qtd} un</td>
                <td><button class="btn-deletar" onclick="removerPecaServicoTemp(${index})">🗑️</button></td>
            </tr>
        `;
    });
}

function removerPecaServicoTemp(index) {
    pecasDoServicoAtual.splice(index, 1);
    renderizarPecasServicoTemp();
}

function salvarServico() {
    const prefixo = document.getElementById('prefixo').value.trim().toUpperCase();
    const data = document.getElementById('dataServico').value;

    if (!prefixo || !data) {
        alert("Informe o Prefixo do equipamento e a Data do Serviço.");
        return;
    }

    if (pecasDoServicoAtual.length === 0) {
        alert("Adicione pelo menos uma peça ao serviço!");
        return;
    }

    // DAR BAIXA NO ESTOQUE E VERIFICAR ALERTA
    let alertasCompra = [];
    pecasDoServicoAtual.forEach(item => {
        if (estoque[item.nome] !== undefined) {
            estoque[item.nome] -= item.qtd;
            if (estoque[item.nome] <= 1) {
                alertasCompra.push(`${item.nome} (Sobra: ${estoque[item.nome]} un)`);
            }
        }
    });

    // REGISTRAR HISTÓRICO
    historico.push({
        id: Date.now(),
        prefixo: prefixo,
        data: data,
        pecas: [...pecasDoServicoAtual]
    });

    localStorage.setItem('historicoServicos', JSON.stringify(historico));

    // ALERTAS
    if (alertasCompra.length > 0) {
        alert(`⚠️ ATENÇÃO: ESTOQUE BAIXO!\n\nAs seguintes peças precisam de reposição urgente:\n- ${alertasCompra.join('\n- ')}`);
    } else {
        alert("Serviço e baixa de estoque registrados com sucesso!");
    }

    // LIMPAR CAMPOS
    document.getElementById('prefixo').value = '';
    pecasDoServicoAtual = [];
    renderizarPecasServicoTemp();
    renderizarEstoque();
    renderizarHistorico();
}

// 3. HISTÓRICO E BUSCA
function renderizarHistorico(listaParaExibir = historico) {
    const tabela = document.getElementById('listaHistorico');
    tabela.innerHTML = '';

    listaParaExibir.forEach(item => {
        const pecasTexto = item.pecas.map(p => `${p.nome} (${p.qtd}x)`).join(', ');
        const dataFormatada = item.data.split('-').reverse().join('/');

        tabela.innerHTML += `
            <tr>
                <td>${dataFormatada}</td>
                <td><b>${item.prefixo}</b></td>
                <td>${pecasTexto}</td>
                <td><button class="btn-deletar" onclick="removerHistorico(${item.id})">🗑️</button></td>
            </tr>
        `;
    });
}

function removerHistorico(id) {
    if (confirm("Deseja remover este histórico de registro?")) {
        historico = historico.filter(item => item.id !== id);
        localStorage.setItem('historicoServicos', JSON.stringify(historico));
        renderizarHistorico();
    }
}

function filtrarHistorico() {
    const busca = document.getElementById('busca').value.toLowerCase();
    const resultado = historico.filter(item => {
        const dataFormatada = item.data.split('-').reverse().join('/');
        return item.prefixo.toLowerCase().includes(busca) || dataFormatada.includes(busca);
    });
    renderizarHistorico(resultado);
}

// 4. GERADOR DE PDF
function gerarPDF() {
    if (historico.length === 0) {
        alert("Nenhum histórico disponível para gerar PDF.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("RELATÓRIO DE MONTAGENS E MANUTENÇÃO", 14, 15);

    const dadosTabela = historico.map(item => [
        item.data.split('-').reverse().join('/'),
        item.prefixo,
        item.pecas.map(p => `${p.nome} (${p.qtd}x)`).join('\n')
    ]);

    doc.autoTable({
        startY: 25,
        head: [['Data', 'Prefixo', 'Peças Utilizadas']],
        body: dadosTabela,
        theme: 'grid',
        headStyles: { fillColor: [8, 10, 16] }
    });

    doc.save(`relatorio_montagens_${new Date().toISOString().slice(0,10)}.pdf`);
}

// INICIALIZAR PÁGINA
document.addEventListener('DOMContentLoaded', () => {
    renderizarEstoque();
    renderizarHistorico();
});
