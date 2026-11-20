import { db } from "./firebase.js";

import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
let idEdicao = null;
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
    
    const observacao =
    document.getElementById("observacao").value.trim();

    const medicao1 = parseFloat(
        document.getElementById("medicao1").value.replace(",", ".")
    );

    const medicao2 = parseFloat(
        document.getElementById("medicao2").value.replace(",", ".")
    );

    document.getElementById("observacao").value = "";
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
const observacao =
    document.getElementById("observacao").value.trim();
       const dados = {
    data,
    turno,
    medicao1,
    medicao2,
    diferencaMm: diferencaMm.toFixed(2),
    diferencaPol: diferencaPol.toFixed(3),
    observacao,
    status
};

if (idEdicao) {

    await updateDoc(
        doc(db, "tubos", idEdicao),
        dados
    );

    idEdicao = null;

} else {

    dados.criadoEm = new Date();

    await addDoc(
        collection(db, "tubos"),
        dados
    );
}

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
            📏 Medição 1: ${registro.medicao1} mm<br>
📏 Medição 2: ${registro.medicao2} mm<br>
           ➖ Diferença: ${registro.diferencaMm} mm (${registro.diferencaPol} pol)<br>
           📝 Observação:
           ${registro.observacao
           ? registro.observacao
           : "Sem observação"}<br>
            <button class="editar"
    onclick="editarRegistro('${registro.id}')">
    ✏️ Editar
</button>

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

function editarRegistro(id) {

    const registro = registros.find(r => r.id === id);

    if (!registro) return;

    document.getElementById("data").value =
        registro.data;

    document.getElementById("turno").value =
        registro.turno;

    document.getElementById("medicao1").value =
        registro.medicao1;

    document.getElementById("medicao2").value =
        registro.medicao2;

    document.getElementById("observacao").value =
        registro.observacao || "";

    idEdicao = id;

    atualizarCalculo();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


function exportarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "mm", "a4");

    let aprovados = 0;
    let retrabalho = 0;
    let refugo = 0;

    registros.forEach(r => {
        if (r.status === "Aprovado") aprovados++;
        if (r.status === "Retrabalho") retrabalho++;
        if (r.status === "Refugo") refugo++;
    });

    let pagina = 1;

    const desenharCabecalho = () => {
        doc.setFontSize(16);
        doc.setFont(undefined, "bold");
        doc.text("RELATÓRIO DE INSPEÇÃO DE TUBOS", 105, 15, {
            align: "center"
        });

        doc.setFontSize(9);
        doc.setFont(undefined, "normal");

        const dataGeracao = new Date().toLocaleString("pt-BR");

        doc.text(`Gerado em: ${dataGeracao}`, 10, 25);

        doc.setFillColor(220, 255, 220);
        doc.rect(10, 30, 40, 8, "F");
        doc.text(`Aprovados: ${aprovados}`, 13, 35);

        doc.setFillColor(255, 245, 180);
        doc.rect(60, 30, 40, 8, "F");
        doc.text(`Retrabalho: ${retrabalho}`, 63, 35);

        doc.setFillColor(255, 210, 210);
        doc.rect(110, 30, 40, 8, "F");
        doc.text(`Refugo: ${refugo}`, 113, 35);
    };

    desenharCabecalho();

registros.forEach((registro, indice) => {

    const posicaoPagina = indice % 12;

    if (indice > 0 && posicaoPagina === 0) {
        doc.addPage();
        desenharCabecalho();
    }

    const coluna = posicaoPagina % 3;
    const linha = Math.floor(posicaoPagina / 3);

    const x = 8 + (coluna * 65);
    const y = 45 + (linha * 56);

    let cor = [230, 255, 230];

    if (registro.status === "Retrabalho") {
        cor = [255, 248, 200];
    }

    if (registro.status === "Refugo") {
        cor = [255, 220, 220];
    }

    doc.setFillColor(...cor);
    doc.setDrawColor(180);

    doc.roundedRect(
        x,
        y,
        58,
        48,
        3,
        3,
        "FD"
    );

    // TÍTULO
    doc.setFont(undefined, "bold");
    doc.setFontSize(10);

    doc.text(
        registro.status.toUpperCase(),
        x + 29,
        y + 6,
        { align: "center" }
    );

    // DADOS
    doc.setFont(undefined, "normal");
    doc.setFontSize(8);

    doc.text(
        `Data: ${registro.data}`,
        x + 29,
        y + 13,
        { align: "center" }
    );

    doc.text(
        `Turno: ${registro.turno}`,
        x + 29,
        y + 19,
        { align: "center" }
    );

    doc.text(
        `M1: ${registro.medicao1} mm`,
        x + 29,
        y + 25,
        { align: "center" }
    );

    doc.text(
        `M2: ${registro.medicao2} mm`,
        x + 29,
        y + 31,
        { align: "center" }
    );

    doc.text(
        `Dif: ${registro.diferencaMm} mm`,
        x + 29,
        y + 37,
        { align: "center" }
    );

    doc.text(
        `(${registro.diferencaPol} pol)`,
        x + 29,
        y + 42,
        { align: "center" }
    );

    const observacao =
        registro.observacao?.trim()
            ? registro.observacao
            : "Sem observação";

    const obs = doc.splitTextToSize(
        observacao,
        48
    );

    doc.setFontSize(7);

    doc.text(
        obs.slice(0, 1),
        x + 29,
        y + 47,
        { align: "center" }
    );

});

const paginas = doc.getNumberOfPages();

    for (let i = 1; i <= paginas; i++) {
        doc.setPage(i);

        doc.setFontSize(8);

        doc.text(
            `Página ${i} de ${paginas}`,
            170,
            290
        );

        doc.text(
            "Sistema de Controle de Tubos",
            10,
            290
        );
    }

    doc.save("Relatorio_Tubos.pdf");
}
window.salvarMedicao = salvarMedicao;
window.excluir = excluir;
window.filtrar = filtrar;
window.exportarPDF = exportarPDF;
window.editarRegistro = editarRegistro;
carregarRegistros();