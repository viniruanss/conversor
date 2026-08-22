function csvParaJson(csv: string): object[] {
  const linhas = csv.split("\n");
  const cabecalhos = (linhas[0] ?? "").split(",");
  const linhasDeDados = linhas.slice(1);
 
  const objetos = linhasDeDados.map((linha) => {
    const valores = linha.split(",");
 
    return cabecalhos.reduce<Record<string, string>>((obj, cabecalho, index) => {
      obj[cabecalho] = valores[index] ?? "";
      return obj;
    }, {});
  });
 
  return objetos;
}
 
function pegarSaudacao(): string {
  const horaAtual = new Date().getHours();
  if (horaAtual > 4 && horaAtual < 12) {
    return "Bom dia!";
  } else if (horaAtual >= 12 && horaAtual < 18) {
    return "Boa tarde!";
  } else {
    return "Boa noite!";
  }
}
 
function jsonParaCsv(json: Record<string, string>[]): string {
  if (json.length === 0) return "";
 
  const cabecalhos = Object.keys(json[0] ?? {});
  const linhas = json.map((obj) => cabecalhos.map((cabecalho) => obj[cabecalho] ?? "").join(","));
  return [cabecalhos.join(","), ...linhas].join("\n");
}
 
function xmlParaJson(xml: string): object[] {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xml, "application/xml");
  const registros = Array.from(xmlDoc.getElementsByTagName("registro"));
  const objetos = registros.map((registro) => {
    const objeto = Array.from(registro.children).reduce<Record<string, string>>((obj, filho) => {
      obj[filho.tagName] = filho.textContent ?? "";
      return obj;
    }, {});
 
    return objeto;
  });
 
  return objetos;
}
 
function jsonParaXml(json: Record<string, string>[]): string {
  const registros = json
    .map((obj) => `<registro>${Object.entries(obj).map(([chave, valor]) => `<${chave}>${valor}</${chave}>`).join("")}</registro>`)
    .join("");
 
  return `<registros>${registros}</registros>`;
}
 
function gerarNomeArquivo(nomeOriginal: string, novoFormato: string): string {
  const partes = nomeOriginal.split(".");
  partes.pop();
  partes.push(novoFormato);
  return partes.join(".");
}
 
const fileInput = document.querySelector<HTMLInputElement>("#fileInput");
const botaoBaixar = document.querySelector<HTMLButtonElement>("#btnBaixar");
const resultado = document.querySelector<HTMLPreElement>("#resultado");
const blocoResultado = document.querySelector<HTMLDivElement>("#blocoResultado");
const arquivoSelecionadoBloco = document.querySelector<HTMLDivElement>("#arquivoSelecionado");
const nomeArquivoSelecionadoSpan = document.querySelector<HTMLSpanElement>("#nomeArquivoSelecionado");
 
let textoConvertido = "";
let nomeArquivoConvertido = "";
let tipoMimeConvertido = "";
 
function pegarTipoMime(formato: string): string {
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
 
function baixarArquivo(conteudo: string, nomeArquivo: string, tipoMime: string): void {
  const blob = new Blob([conteudo], { type: tipoMime });
  const url = URL.createObjectURL(blob);
 
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  link.click();
 
  URL.revokeObjectURL(url);
}
 
const toast = document.querySelector<HTMLDivElement>("#toast");
const toastMensagem = document.querySelector<HTMLSpanElement>("#toastMensagem");
let toastTimeoutId: ReturnType<typeof setTimeout> | undefined;
 
function mostrarToast(mensagem: string): void {
  if (!toast || !toastMensagem) return;
 
  toastMensagem.textContent = mensagem;
  toast.classList.remove("hidden");
 
  if (toastTimeoutId) {
    clearTimeout(toastTimeoutId);
  }
 
  toastTimeoutId = setTimeout(() => {
    toast.classList.add("hidden");
  }, 3500);
}
 
function processarArquivo(arquivo: File): void {
  if (arquivoSelecionadoBloco && nomeArquivoSelecionadoSpan) {
    nomeArquivoSelecionadoSpan.textContent = arquivo.name;
    arquivoSelecionadoBloco.classList.remove("hidden");
    arquivoSelecionadoBloco.classList.add("flex");
  }
 
  const reader = new FileReader();
 
  reader.addEventListener("load", () => {
    const conteudo = reader.result as string;
    if (!resultado) return;
 
    const conversao = `${formatoEntradaEscolhido}-${formatoSaidaEscolhida}`;
 
    switch (conversao) {
      case "csv-json":
        textoConvertido = JSON.stringify(csvParaJson(conteudo), null, 2);
        break;
      case "csv-xml":
        textoConvertido = jsonParaXml(csvParaJson(conteudo) as Record<string, string>[]);
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
        textoConvertido = jsonParaCsv(xmlParaJson(conteudo) as Record<string, string>[]);
        break;
      default:
        mostrarToast(`Conversão de "${formatoEntradaEscolhido}" para "${formatoSaidaEscolhida}" não é suportada.`);
        return;
    }
 
    resultado.textContent = textoConvertido;
    blocoResultado?.classList.remove("hidden");
    blocoResultado?.classList.add("flex");
 
    nomeArquivoConvertido = gerarNomeArquivo(arquivo.name, formatoSaidaEscolhida || "txt");
    tipoMimeConvertido = pegarTipoMime(formatoSaidaEscolhida);
 
    if (botaoBaixar) {
      botaoBaixar.disabled = false;
    }
 
    mostrarToast("Conversão concluída! Já pode baixar o arquivo.");
  });
 
  reader.readAsText(arquivo);
}
 
fileInput?.addEventListener("change", () => {
  const arquivo = fileInput?.files?.[0];
  if (!arquivo) return;
 
  processarArquivo(arquivo);
});
 
botaoBaixar?.addEventListener("click", () => {
  baixarArquivo(textoConvertido, nomeArquivoConvertido, tipoMimeConvertido);
});
 
const btnAbrirModal = document.querySelector<HTMLButtonElement>("#btnAbrirModal");
const modalOverlay = document.querySelector<HTMLDivElement>("#modalOverlay");
const btnFecharModal = document.querySelector<HTMLButtonElement>("#btnFecharModal");
const opcoesConversao = document.querySelectorAll<HTMLButtonElement>(".opcaoConversao");
const badgeConversaoEscolhida = document.querySelector<HTMLDivElement>("#badgeConversaoEscolhida");
 
let formatoEntradaEscolhido = "";
let formatoSaidaEscolhida = "";
 
function conversaoFoiEscolhida(): boolean {
  return formatoEntradaEscolhido !== "" && formatoSaidaEscolhida !== "";
}
 
function atualizarBadgeConversao(): void {
  if (!badgeConversaoEscolhida) return;
 
  badgeConversaoEscolhida.textContent = `${formatoEntradaEscolhido.toUpperCase()} → ${formatoSaidaEscolhida.toUpperCase()}`;
  badgeConversaoEscolhida.classList.remove("hidden");
  badgeConversaoEscolhida.classList.add("flex");
}
 
btnAbrirModal?.addEventListener("click", () => {
  modalOverlay?.classList.remove("hidden");
});
 
btnFecharModal?.addEventListener("click", () => {
  modalOverlay?.classList.add("hidden");
});
 
modalOverlay?.addEventListener("click", (event) => {
  if (event.target === modalOverlay) {
    modalOverlay.classList.add("hidden");
  }
});
 
opcoesConversao.forEach((botao) => {
  botao.addEventListener("click", () => {
    formatoEntradaEscolhido = botao.dataset.entrada ?? "";
    formatoSaidaEscolhida = botao.dataset.saida ?? "";
 
    atualizarBadgeConversao();
    modalOverlay?.classList.add("hidden");
    fileInput?.click();
  });
});
 
const elementoSaudacao = document.querySelector<HTMLHeadingElement>("#saudacao");
if (elementoSaudacao) {
  elementoSaudacao.textContent = `Olá, ${pegarSaudacao()}`;
}
 
const areaDrop = document.querySelector<HTMLDivElement>("#areaDrop");
 
areaDrop?.addEventListener("click", () => {
  if (!conversaoFoiEscolhida()) {
    mostrarToast("Escolha o tipo de conversão antes de selecionar o arquivo.");
    modalOverlay?.classList.remove("hidden");
    return;
  }
  fileInput?.click();
});
 
areaDrop?.addEventListener("dragover", (event) => {
  event.preventDefault();
  areaDrop.classList.add("border-indigo-400", "bg-indigo-50/50");
});
 
areaDrop?.addEventListener("dragleave", () => {
  areaDrop.classList.remove("border-indigo-400", "bg-indigo-50/50");
});
 
areaDrop?.addEventListener("drop", (event) => {
  event.preventDefault();
  areaDrop.classList.remove("border-indigo-400", "bg-indigo-50/50");
 
  const arquivo = event.dataTransfer?.files?.[0];
  if (!arquivo) return;
 
  if (!conversaoFoiEscolhida()) {
    mostrarToast("Escolha o tipo de conversão antes de soltar o arquivo!");
    modalOverlay?.classList.remove("hidden");
    return;
  }
 
  processarArquivo(arquivo);
});
