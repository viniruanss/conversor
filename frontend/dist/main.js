function csvParaJson(csv) {
    const linhas = csv.split("\n");
    const cabecalhos = (linhas[0] ?? "").split(",");
    const linhasDeDados = linhas.slice(1);
    const objetos = linhasDeDados.map((linha) => {
        const valores = linha.split(",");
        return cabecalhos.reduce((obj, cabecalho, index) => {
            obj[cabecalho] = valores[index] ?? "";
            return obj;
        }, {});
    });
    return objetos;
}
function pegarSaudacao() {
    const horaAtual = new Date().getHours();
    if (horaAtual > 4 && horaAtual < 12) {
        return "Bom dia!";
    }
    else if (horaAtual >= 12 && horaAtual < 18) {
        return "Boa tarde!";
    }
    else {
        return "Boa noite!";
    }
}
function pegarExtensao(nomeArquivo) {
    const partes = nomeArquivo.split(".");
    const extensao = partes.pop()?.toLowerCase() ?? "";
    return extensao;
}
function jsonParaCsv(json) {
    if (json.length === 0)
        return "";
    const cabecalhos = Object.keys(json[0] ?? {});
    const linhas = json.map((obj) => cabecalhos.map((cabecalho) => obj[cabecalho] ?? "").join(","));
    return [cabecalhos.join(","), ...linhas].join("\n");
}
function xmlParaJson(xml) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, "application/xml");
    const registros = Array.from(xmlDoc.getElementsByTagName("registro"));
    const objetos = registros.map((registro) => {
        const objeto = Array.from(registro.children).reduce((obj, filho) => {
            obj[filho.tagName] = filho.textContent ?? "";
            return obj;
        }, {});
        return objeto;
    });
    return objetos;
}
function jsonParaXml(json) {
    const registros = json
        .map((obj) => `<registro>${Object.entries(obj).map(([chave, valor]) => `<${chave}>${valor}</${chave}>`).join("")}</registro>`)
        .join("");
    return `<registros>${registros}</registros>`;
}
function gerarNomeArquivo(nomeOriginal, novoFormato) {
    const partes = nomeOriginal.split(".");
    partes.pop();
    partes.push(novoFormato);
    return partes.join(".");
}
const fileInput = document.querySelector("#fileInput");
const botaoConverter = document.querySelector("#btnConverter");
const botaoBaixar = document.querySelector("#btnBaixar");
const resultado = document.querySelector("#resultado");
const formatoSaida = document.querySelector("#formatoSaida");
let textoConvertido = "";
let nomeArquivoConvertido = "";
let tipoMimeConvertido = "";
function pegarTipoMime(formato) {
    switch (formato) {
        case "json":
            return "application/json";
        case "csv":
            return "text/csv";
        case "xml":
            return "application/xml";
        default:
            return "text/plain";
    }
}
function baixarArquivo(conteudo, nomeArquivo, tipoMime) {
    const blob = new Blob([conteudo], { type: tipoMime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = nomeArquivo;
    link.click();
    URL.revokeObjectURL(url);
}
botaoConverter?.addEventListener("click", () => {
    const arquivo = fileInput?.files?.[0];
    if (!arquivo) {
        alert("Selecione um arquivo primeiro!");
        return;
    }
    const formatoEntrada = pegarExtensao(arquivo.name);
    const reader = new FileReader();
    reader.addEventListener("load", () => {
        const conteudo = reader.result;
        if (!resultado)
            return;
        const conversao = `${formatoEntrada}-${formatoSaida?.value}`;
        switch (conversao) {
            case "csv-json":
                textoConvertido = JSON.stringify(csvParaJson(conteudo), null, 2);
                break;
            case "csv-xml":
                textoConvertido = jsonParaXml(csvParaJson(conteudo));
                break;
            case "json-csv":
                textoConvertido = jsonParaCsv(JSON.parse(conteudo));
                break;
            case "json-xml":
                textoConvertido = jsonParaXml(JSON.parse(conteudo));
                break;
            case "xml-json":
                textoConvertido = JSON.stringify(xmlParaJson(conteudo), null, 2);
                break;
            case "xml-csv":
                textoConvertido = jsonParaCsv(xmlParaJson(conteudo));
                break;
            default:
                alert(`Conversão de "${formatoEntrada}" para "${formatoSaida?.value}" não é suportada.`);
                return;
        }
        resultado.textContent = textoConvertido;
        nomeArquivoConvertido = gerarNomeArquivo(arquivo.name, formatoSaida?.value ?? "txt");
        tipoMimeConvertido = pegarTipoMime(formatoSaida?.value ?? "");
        if (botaoBaixar) {
            botaoBaixar.disabled = false;
        }
    });
    reader.readAsText(arquivo);
});
botaoBaixar?.addEventListener("click", () => {
    baixarArquivo(textoConvertido, nomeArquivoConvertido, tipoMimeConvertido);
});
export {};
//# sourceMappingURL=main.js.map