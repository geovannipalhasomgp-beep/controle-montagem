// LISTA FIXA DE PEÇAS DE ARRANQUE E ALTERNADOR (NÃO PRECISA DIGITAR)
const CATALAGO_PECAS = [
    // Arranque
    "BENDIX (PINHÃO)",
    "AUTOMÁTICO DO ARRANQUE",
    "RELÉ DO AUTOMÁTICO",
    "INDUZIDO (ARRANQUE)",
    "PORTA ESCOVAS (ARRANQUE)",
    "BOBINA DE CAMPO",
    "MANCAL DIANTEIRO",
    "MANCAL TRASEIRO",
    // Alternador
    "REGULADOR DE VOLTAGEM",
    "PLACA DE DIODOS (RETIFICADORA)",
    "ROTOR (ALTERNADOR)",
    "ESTATOR (ALTERNADOR)",
    "ROLAMENTO DIANTEIRO",
    "ROLAMENTO TRASEIRO",
    "POLIA DO ALTERNADOR",
    "PORTA ESCOVAS (ALTERNADOR)"
];

let estoque = JSON.parse(localStorage.getItem('estoquePeças')) || {};
let historico = JSON.parse(localStorage.getItem('historicoServicos')) || [];
let pecasDoServicoAtual = [];

document.addEventListener('DOMContentLoaded', () => {
    const inputData = document.getElementById('dataServico');
    if (inputData) inputData.valueAsDate = new Date();
    
    carregarOpcoesCadastro();
    renderizarEstoque();
    renderizarHistorico();
});

// Preenche o menu com as peças pré-definidas
function carregarOpcoesCadastro() {
    const select = document.getElementById('selectPecaCadastro');
    if (!select) return;

    select.innerHTML = '<option value="">-- Selecione a Peça --</option>';
    CATALAGO_PECAS.forEach(peca => {
        select.innerHTML += `<option value="${peca}">${peca}</option>`;
    });
}

function adicionarEstoque() {
    const select = document.getElementById('selectPecaCadastro');
    const inputQtd = document.getElementById('qtdPecaEstoque');
    
    const peca = select.value;
    const qtd = parseInt(inputQtd.value);

    if (!peca) {
        alert("Selecione uma peça da lista!");
        return;
    }

    if (isNaN(qtd) || qtd <= 0) {
        alert("Informe uma quantidade válida!");
        return;
    }

    estoque[peca] = (estoque[peca] || 0) + qtd;
    inputQtd.value = 1;
    select.value = '';
    
    renderizarEstoque();
}

function renderizarEstoque() {
    const lista = document.getElementById('listaEstoque');
    const selectServico = document.getElementById('selectPecaServico');
    
    if (lista) lista.innerHTML = '';
    if (selectServico) selectServico.innerHTML = '<option value="">-- Selecione uma Peça --</option>';

    for (let peca in estoque) {
        const qtd = estoque[peca];
        let status = '<span class="badge-ok">OK</span>';
        
        if (qtd <= 1) {
            status = '<span class="badge-alerta">⚠️ COMPRAR</span>';
        }

        if (lista && qtd > 0) {
            lista.innerHTML += `
                <tr>
                    <td><b>${peca}</b></td>
                    <td>${qtd} un</td>
                    <td>${status}</td>
                </tr>
            `;
        }

        if (selectServico && qtd > 0) {
            selectServico.innerHTML += `<option value="${peca}">${peca} (${qtd} em estoque)</option>`;
        }
    }

    localStorage.setItem('estoquePeças', JSON.stringify(estoque));
}

function adicionarPecaServico() {
    const select = document.getElementById('selectPecaServico');
    const inputQtd = document.getElementById('qtdUsoPeca');
    
    const peca = select.value;
    const qtd = parseInt(inputQtd.value);

    if (!peca) {
        alert("Selecione uma peça disponível!");
        return;
    }

    if (isNaN(qtd) || qtd <= 0) {
        alert("Informe uma quantidade válida.");
        return;
    }

    if (qtd > estoque[peca]) {
        alert(`Estoque insuficiente! Você tem apenas ${estoque[peca]} unidade(s).`);
        return;
    }

    pecasDoServicoAtual.push({ nome: peca, qtd: qtd });
    inputQtd.value = 1;
    select.value = '';
    
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
                <td><button class="btn-danger" onclick="removerPecaServicoTemp(${index})">🗑️</button></td>
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
        alert("Informe o Prefixo e a Data.");
        return;
    }

    if (pecasDoServicoAtual.length === 0) {
        alert("Inclua pelo menos uma peça.");
        return;
    }

    let alertasCompra = [];

    pecasDoServicoAtual.forEach(item => {
        if (estoque[item.nome] !== undefined) {
            estoque[item.nome] -= item.qtd;
            
            if (estoque[item.nome] <= 1) {
                alertasCompra.push(`${item.nome} (Restante: ${estoque[item.nome]} un)`);
            }
        }
    });

    historico.push({
        id: Date.now(),
        prefixo: prefixo,
        data: data,
        pecas: [...pecasDoServicoAtual]
    });

    localStorage.setItem('historicoServicos', JSON.stringify(historico));

    if (alertasCompra.length > 0) {
        alert(`Serviço salvo com sucesso!\n\n⚠️ ALERTA DE COMPRA:\nEstoque crítico para:\n- ${alertasCompra.join('\n- ')}`);
    } else {
        alert("Serviço registrado e estoque atualizado!");
    }

    document.getElementById('prefixo').value = '';
    pecasDoServicoAtual = [];
    renderizarPecasServicoTemp();
    renderizarEstoque();
    renderizarHistorico();
}

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
                <td><button class="btn-danger" onclick="removerHistorico(${item.id})">🗑️</button></td>
            </tr>
        `;
    });
}

function removerHistorico(id) {
    if (confirm("Apagar registro do histórico?")) {
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
        headStyles: { fillColor: [52, 73, 94] }
    });

    doc.save(`relatorio_montagens_${new Date().toISOString().slice(0,10)}.pdf`);
}
