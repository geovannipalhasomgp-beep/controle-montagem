// DADOS SALVOS NO NAVEGADOR
let estoque = JSON.parse(localStorage.getItem('estoquePeças')) || {};
let historico = JSON.parse(localStorage.getItem('historicoServicos')) || [];
let pecasDoServicoAtual = [];

// DEFINIR DATA ATUAL NO INPUT AO CARREGAR
document.addEventListener('DOMContentLoaded', () => {
    const inputData = document.getElementById('dataServico');
    if (inputData) inputData.valueAsDate = new Date();
    renderizarEstoque();
    renderizarHistorico();
});

// 1. GERENCIAMENTO DE ESTOQUE
function renderizarEstoque() {
    const lista = document.getElementById('listaEstoque');
    const selectPeca = document.getElementById('selectPecaEstoque');
    
    if (lista) lista.innerHTML = '';
    if (selectPeca) selectPeca.innerHTML = '<option value="">-- Selecione uma Peça --</option>';

    for (let peca in estoque) {
        const qtd = estoque[peca];
        let status = '<span style="color: #00f3ff;">OK</span>';
        
        if (qtd <= 1) {
            status = '<span style="color: #ff0055; font-weight: bold; text-shadow: 0 0 8px #ff0055;">⚠️ PEDIR COMPRA</span>';
        }

        if (lista) {
            lista.innerHTML += `
                <tr>
                    <td><b>${peca}</b></td>
                    <td>${qtd} un</td>
                    <td>${status}</td>
                    <td><button class="btn-deletar" onclick="removerEstoque('${peca}')">🗑️</button></td>
                </tr>
            `;
        }

        if (selectPeca) {
            selectPeca.innerHTML += `<option value="${peca}">${peca} (Disp: ${qtd})</option>`;
        }
    }

    localStorage.setItem('estoquePeças', JSON.stringify(estoque));
}

function adicionarEstoque() {
    const inputNome = document.getElementById('nomePecaEstoque');
    const inputQtd = document.getElementById('qtdPecaEstoque');
    
    const nome = inputNome.value.trim().toUpperCase();
    const qtd = parseInt(inputQtd.value);

    if (!nome || isNaN(qtd) || qtd < 0) {
        alert("Digite o nome da peça e uma quantidade válida.");
        return;
    }

    // Soma se já existir ou cria novo
    estoque[nome] = (estoque[nome] || 0) + qtd;
    
    inputNome.value = '';
    inputQtd.value = '';
    
    renderizarEstoque();
    alert(`Peça "${nome}" salva com sucesso no estoque!`);
}

function removerEstoque(peca) {
    if (confirm(`Deseja remover a peça "${peca}" do estoque?`)) {
        delete estoque[peca];
        renderizarEstoque();
    }
}

// 2. ADICIONAR PEÇA AO SERVIÇO ATUAL
function adicionarPecaServico() {
    const selectPeca = document.getElementById('selectPecaEstoque');
    const inputQtd = document.getElementById('qtdUsoPeca');
    
    const peca = selectPeca.value;
    const qtd = parseInt(inputQtd.value);

    if (!peca) {
        alert("Selecione uma peça da lista do estoque.");
        return;
    }

    if (isNaN(qtd) || qtd <= 0) {
        alert("Digite uma quantidade válida.");
        return;
    }

    if (qtd > estoque[peca]) {
        alert(`Quantidade indisponível! Estoque atual de ${peca}: ${estoque[peca]} un.`);
        return;
    }

    pecasDoServicoAtual.push({ nome: peca, qtd: qtd });
    inputQtd.value = 1;
    selectPeca.value = '';
    
    renderizarPecasServicoTemp();
}

function renderizarPecasServicoTemp() {
    const tabela = document.getElementById('listaPecasTemp');
    if (!tabela) return;
    
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

// 3. SALVAR SERVIÇO E DAR BAIXA AUTOMÁTICA
function salvarServico() {
    const prefixo = document.getElementById('prefixo').value.trim().toUpperCase();
    const data = document.getElementById('dataServico').value;

    if (!prefixo || !data) {
        alert("Preencha o Prefixo e a Data do Serviço.");
        return;
    }

    if (pecasDoServicoAtual.length === 0) {
        alert("Adicione pelo menos uma peça antes de salvar.");
        return;
    }

    let alertasCompra = [];

    // Dar baixa no estoque
    pecasDoServicoAtual.forEach(item => {
        if (estoque[item.nome] !== undefined) {
            estoque[item.nome] -= item.qtd;
            
            if (estoque[item.nome] <= 1) {
                alertasCompra.push(`${item.nome} (Restam: ${estoque[item.nome]} un)`);
            }
        }
    });

    // Gravar no histórico
    historico.push({
        id: Date.now(),
        prefixo: prefixo,
        data: data,
        pecas: [...pecasDoServicoAtual]
    });

    localStorage.setItem('historicoServicos', JSON.stringify(historico));

    if (alertasCompra.length > 0) {
        alert(`✅ Serviço registrado com sucesso!\n\n⚠️ ALERTA DE COMPRA:\nAs seguintes peças estão terminando:\n- ${alertasCompra.join('\n- ')}`);
    } else {
        alert("✅ Serviço registrado e baixa efetuada no estoque!");
    }

    // Limpar campos
    document.getElementById('prefixo').value = '';
    pecasDoServicoAtual = [];
    renderizarPecasServicoTemp();
    renderizarEstoque();
    renderizarHistorico();
}

// 4. HISTÓRICO E BUSCA
function renderizarHistorico(listaParaExibir = historico) {
    const tabela = document.getElementById('listaHistorico');
    if (!tabela) return;
    
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
    if (confirm("Deseja apagar este registro do histórico?")) {
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

// 5. RELATÓRIO PDF
function gerarPDF() {
    if (historico.length === 0) {
        alert("Nenhum histórico para exportar.");
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
