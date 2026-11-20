import { db } from "./firebase.js";

import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const dataInput = document.getElementById("data");
dataInput.value = new Date().toLocaleDateString("pt-BR");

let filtroAtual = "Todos";
let registros = [];

document.getElementById("medicao1")
    .addEventListener("input", atualizarCalculo);

document.getElementById("medicao2")
    .addEventListener("input", atualizarCalculo);

function atualizarCalculo() {

    const medicao1 = parseFloat(
        document.getElementById("medicao1").value.replace(",", ".")
    );

    const medicao2 = parseFloat(
        document.getElementById("medicao2").value.replace(",", ".")
    );

    if (isNaN(medicao1) || isNaN(medicao2)) {

        document.getElementById("resultado").innerHTML =
            "Diferença: -";

        document.getElementById("status").innerHTML =
            "Status: -";

        return;
    }

  const diferencaMm = Math.abs(medicao1 - medicao2);
const diferencaPol = diferencaMm / 25.4;

document.getElementById("resultado").innerHTML =
    `Diferença: ${diferencaMm.toFixed(2)} mm (${diferencaPol.toFixed(2)} pol)`;


    let status = "";

 if (diferencaPol > 2) {
    status = "🔴 Refugo";
} else if (diferencaPol > 1.51 ) {
    status = "🟡 Retrabalho";
} else {
    status = "✅ Aprovado";
}

    document.getElementById("status").innerHTML =
        `Status: ${status}`;
}

async function salvarMedicao() {

    const data =
        document.getElementById("data").value;

    const turno =
        document.getElementById("turno").value;

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

const diferencaMm =
    Math.abs(medicao1 - medicao2);

const diferencaPol =
    diferencaMm / 25.4;

    let status = "";

    if (diferencaPol > 2) {
        status = "Refugo";
    } else if (diferencaPol >= 1.51) {
        status = "Retrabalho";
    } else {
        status = "Aprovado";
    }

    try {

        await addDoc(
            collection(db, "tubos"),
            {
                data,
                turno,
                medicao1,
                medicao2,
               diferencaMm: diferencaMm.toFixed(2),
               diferencaPol: diferencaPol.toFixed(3),
                status,
                criadoEm: new Date()
            }
        );

        document.getElementById("medicao1").value = "";
        document.getElementById("medicao2").value = "";

        document.getElementById("resultado").innerHTML =
            "Diferença: -";

        document.getElementById("status").innerHTML =
            "Status: -";

        carregarRegistros();

    } catch (erro) {

        console.error(erro);

        alert("Erro ao salvar no Firestore.");
    }
}

async function carregarRegistros() {

    const historico =
        document.getElementById("historico");

    historico.innerHTML = "";

    registros = [];

    const snapshot =
        await getDocs(collection(db, "tubos"));

    snapshot.forEach(item => {

        registros.push({
            id: item.id,
            ...item.data()
        });

    });

    let aprovados = 0;
    let retrabalho = 0;
    let refugo = 0;

    registros.forEach(registro => {

        if (registro.status === "Aprovado")
            aprovados++;

        if (registro.status === "Retrabalho")
            retrabalho++;

        if (registro.status === "Refugo")
            refugo++;

        if (
            filtroAtual !== "Todos" &&
            registro.status !== filtroAtual
        ) {
            return;
        }

        let classe = "";

        if (registro.status === "Aprovado")
            classe = "aprovado";

        if (registro.status === "Retrabalho")
            classe = "retrabalho";

        if (registro.status === "Refugo")
            classe = "refugo";

        const div = document.createElement("div");

        div.className = `registro ${classe}`;

        div.innerHTML = `
            <strong>${registro.status}</strong><br>
            📅 Data: ${registro.data}<br>
            👷 Turno: ${registro.turno}<br>
            📏 Medição 1: ${registro.medicao1}"<br>
            📏 Medição 2: ${registro.medicao2}"<br>
           ➖ Diferença: ${registro.diferencaMm} mm (${registro.diferencaPol} pol)<br>

            <button class="excluir"
                onclick="excluir('${registro.id}')">
                🗑️ Excluir
            </button>
        `;

        historico.appendChild(div);

    });

    document.getElementById("aprovados").innerText =
        aprovados;

    document.getElementById("retrabalho").innerText =
        retrabalho;

    document.getElementById("refugo").innerText =
        refugo;
}

async function excluir(id) {

    if (!confirm("Deseja excluir este registro?")) {
        return;
    }

    await deleteDoc(
        doc(db, "tubos", id)
    );

    carregarRegistros();
}

function filtrar(status) {

    filtroAtual = status;

    carregarRegistros();
}

function exportarPDF() {

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
                retrabalho: 0,
                refugo: 0
            };
        }

        if (r.status === "Aprovado") {
            agrupados[chave].aprovado++;
        }
        else if (r.status === "Retrabalho") {
            agrupados[chave].retrabalho++;
        }
        else if (r.status === "Refugo") {
            agrupados[chave].refugo++;
        }
    });

    let totalAprovado = 0;
    let totalRetrabalho = 0;
    let totalRefugo = 0;

    const linhas =
        Object.values(agrupados).map(item => {

            totalAprovado += item.aprovado;
            totalRetrabalho += item.retrabalho;
            totalRefugo += item.refugo;

            return [
                item.data,
                item.turno,
                item.aprovado,
                item.retrabalho,
                item.refugo
            ];
        });

    linhas.push([
        "TOTAL",
        "",
        totalAprovado,
        totalRetrabalho,
        totalRefugo
    ]);

    doc.setFontSize(16);

    doc.text(
        "RELATÓRIO DE TUBOS",
        14,
        15
    );

    doc.autoTable({
        startY: 25,
        head: [[
            "Data",
            "Turno",
            "Aprovado",
            "Retrabalho",
            "Refugo"
        ]],
        body: linhas,
        theme: "grid",
        headStyles: {
            fillColor: [0, 102, 204]
        }
    });

    doc.save("Relatorio_Tubos.pdf");
}

window.salvarMedicao = salvarMedicao;
window.excluir = excluir;
window.filtrar = filtrar;
window.exportarPDF = exportarPDF;

carregarRegistros();