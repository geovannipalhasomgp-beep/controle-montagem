let estoque = JSON.parse(localStorage.getItem('estoquePeças')) || {};
let historico = JSON.parse(localStorage.getItem('historicoServicos')) || [];
let pecasDoServicoAtual = [];

document.addEventListener('DOMContentLoaded', () => {
    const inputData = document.getElementById('dataServico');
    if (inputData) inputData.valueAsDate = new Date();
    renderizarEstoque();
    renderizarHistorico();
});

function renderizarEstoque() {
    const lista = document.getElementById('listaEstoque');
    const selectPeca = document.getElementById('selectPecaEstoque');
    
    if (lista) lista.innerHTML = '';
    if (selectPeca) selectPeca.innerHTML = '<option value="">-- Selecione --</option>';

    for (let peca in estoque) {
        const qtd = estoque[peca];
        let status = '<span class="badge-ok">OK</span>';
        
        if (qtd <= 1) {
            status = '<span class="badge-alerta">⚠️ COMPRAR</span>';
        }

        if (lista) {
            lista.innerHTML += `
                <tr>
                    <td><b>${peca}</b></td>
                    <td>${qtd} un</td>
                    <td>${status}</td>
                    <td><button class="btn-danger" onclick="removerEstoque('${peca}')">🗑️</button></td>
                </tr>
            `;
        }

        if (selectPeca) {
            selectPeca.innerHTML += `<option value="${peca}">${peca} (${qtd} em estoque)</option>`;
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
        alert("Preencha o nome da peça e uma quantidade válida.");
        return;
    }

    estoque[nome] = (estoque[nome] || 0) + qtd;
    
    inputNome.value = '';
    inputQtd.value = '';
    
    renderizarEstoque();
}

function removerEstoque(peca) {
    if (confirm(`Remover "${peca}" do estoque?`)) {
        delete estoque[peca];
        renderizarEstoque();
    }
}

function adicionarPecaServico() {
    const selectPeca = document.getElementById('selectPecaEstoque');
    const inputQtd = document.getElementById('qtdUsoPeca');
    
    const peca = selectPeca.value;
    const qtd = parseInt(inputQtd.value);

    if (!peca) {
        alert("Selecione uma peça da lista.");
        return;
    }

    if (isNaN(qtd) || qtd <= 0) {
        alert("Informe uma quantidade válida.");
        return;
    }

    if (qtd > estoque[peca]) {
        alert(`Estoque insuficiente! Disponível: ${estoque[peca]} un.`);
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
                alertasCompra.push(`${item.nome} (Sobra: ${estoque[item.nome]})`);
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
        alert(`Serviço salvo!\n\n⚠️ ALERTA DE REPOSIÇÃO:\nPeças com estoque baixo:\n- ${alertasCompra.join('\n- ')}`);
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
