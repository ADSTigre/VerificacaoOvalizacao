// Data atual em PT-BR
const dataInput = document.getElementById("data");
dataInput.value = new Date().toLocaleDateString("pt-BR");

let filtroAtual = "Todos";

// Eventos para calcular automaticamente
document.getElementById("medicao1").addEventListener("input", atualizarCalculo);
document.getElementById("medicao2").addEventListener("input", atualizarCalculo);

function atualizarCalculo() {

    const medicao1 = parseFloat(
        document.getElementById("medicao1").value.replace(",", ".")
    );

    const medicao2 = parseFloat(
        document.getElementById("medicao2").value.replace(",", ".")
    );

    if (isNaN(medicao1) || isNaN(medicao2)) {
        document.getElementById("resultado").innerHTML = "Diferença: -";
        document.getElementById("status").innerHTML = "Status: -";
        return;
    }

    const diferenca = Math.abs(medicao1 - medicao2);

    document.getElementById("resultado").innerHTML =
        `Diferença: ${diferenca.toFixed(2)} pol`;

    let status = "";

    if (diferenca > 2) {
        status = "🔴 Refugo";
    } else if (diferenca >= 1.5) {
        status = "🟡 Retrabalho";
    } else {
        status = "✅ Aprovado";
    }

    document.getElementById("status").innerHTML =
        `Status: ${status}`;
}

function salvarMedicao() {

    const data = document.getElementById("data").value;
    const turno = document.getElementById("turno").value;

    const medicao1 = parseFloat(
        document.getElementById("medicao1").value.replace(",", ".")
    );

    const medicao2 = parseFloat(
        document.getElementById("medicao2").value.replace(",", ".")
    );

    if (isNaN(medicao1) || isNaN(medicao2)) {
        alert("Informe as duas medições.");
        return;
    }

    const diferenca = Math.abs(medicao1 - medicao2);

    let status = "";

    if (diferenca > 2) {
        status = "Refugo";
    } else if (diferenca >= 1.5) {
        status = "Retrabalho";
    } else {
        status = "Aprovado";
    }

    const registro = {
        data,
        turno,
        medicao1,
        medicao2,
        diferenca: diferenca.toFixed(2),
        status
    };

    const registros =
        JSON.parse(localStorage.getItem("tubos")) || [];

    registros.push(registro);

    localStorage.setItem(
        "tubos",
        JSON.stringify(registros)
    );

    document.getElementById("medicao1").value = "";
    document.getElementById("medicao2").value = "";

    document.getElementById("resultado").innerHTML = "Diferença: -";
    document.getElementById("status").innerHTML = "Status: -";

    carregarRegistros();
}

function carregarRegistros() {

    const historico = document.getElementById("historico");
    historico.innerHTML = "";

    const registros =
        JSON.parse(localStorage.getItem("tubos")) || [];

    let aprovados = 0;
    let retrabalho = 0;
    let refugo = 0;

    registros.forEach((registro, index) => {

        if (registro.status === "Aprovado") aprovados++;
        if (registro.status === "Retrabalho") retrabalho++;
        if (registro.status === "Refugo") refugo++;

        if (
            filtroAtual !== "Todos" &&
            registro.status !== filtroAtual
        ) {
            return;
        }

        let classe = "";

        if (registro.status === "Aprovado") classe = "aprovado";
        if (registro.status === "Retrabalho") classe = "retrabalho";
        if (registro.status === "Refugo") classe = "refugo";

        const div = document.createElement("div");

        div.className = `registro ${classe}`;

        div.innerHTML = `
            <strong>${registro.status}</strong><br>
            📅 Data: ${registro.data}<br>
            👷 Turno: ${registro.turno}<br>
            📏 Medição 1: ${registro.medicao1}"<br>
            📏 Medição 2: ${registro.medicao2}"<br>
            ➖ Diferença: ${registro.diferenca}"<br><br>

            <button class="excluir"
                onclick="excluir(${index})">
                🗑️ Excluir
            </button>
        `;

        historico.appendChild(div);
    });

    document.getElementById("aprovados").innerText = aprovados;
    document.getElementById("retrabalho").innerText = retrabalho;
    document.getElementById("refugo").innerText = refugo;
}

function excluir(index) {

    if (!confirm("Deseja excluir este registro?")) {
        return;
    }

    const registros =
        JSON.parse(localStorage.getItem("tubos")) || [];

    registros.splice(index, 1);

    localStorage.setItem(
        "tubos",
        JSON.stringify(registros)
    );

    carregarRegistros();
}

function filtrar(status) {

    filtroAtual = status;

    carregarRegistros();
}

function exportarPDF() {
    const registros =
        JSON.parse(localStorage.getItem("tubos")) || [];

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("landscape");

    const agrupados = {};

    registros.forEach(r => {
        const chave = `${r.data}|${r.turno}`;

        if (!agrupados[chave]) {
            agrupados[chave] = {
                data: r.data,
                turno: r.turno,
                aprovado: 0,
                analise: 0,
                reprovado: 0
            };
        }

    if (r.status === "Aprovado") {
    agrupados[chave].aprovado++;
} else if (r.status === "Retrabalho") {
    agrupados[chave].analise++;
} else if (r.status === "Refugo") {
    agrupados[chave].reprovado++;
}

    });

    let totalAprovado = 0;
    let totalAnalise = 0;
    let totalReprovado = 0;

    const linhas = Object.values(agrupados).map(item => {

        totalAprovado += item.aprovado;
        totalAnalise += item.analise;
        totalReprovado += item.reprovado;

        return [
            item.data,
            item.turno,
            item.aprovado,
            item.analise,
            item.reprovado
        ];
    });

    linhas.push([
        "TOTAL",
        "",
        totalAprovado,
        totalAnalise,
        totalReprovado
    ]);

    doc.setFontSize(16);
    doc.text("RELATÓRIO DE TUBOS", 14, 15);

    doc.autoTable({
        startY: 25,
        head: [[
            "Data",
            "Turno",
            "Aprovado",
            "Em Análise",
            "Reprovado"
        ]],
        body: linhas,
        theme: "grid",
        headStyles: {
            fillColor: [0, 102, 204]
        }
    });

    doc.save("Relatorio_Tubos.pdf");
}


carregarRegistros();