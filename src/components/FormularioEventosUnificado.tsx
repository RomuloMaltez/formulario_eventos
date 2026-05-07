"use client";

import { useMemo, useState } from "react";
import { jsPDF } from "jspdf";

type TipoProcesso =
  | ""
  | "requerimento_autorizacao_evento"
  | "comunicado_evento"
  | "termo_responsabilidade"
  | "interdicao_via_carnaval";

type PorteEvento = "" | "Pequeno" | "Médio" | "Grande";
type SimNao = "" | "Sim" | "Não";
type EnquadramentoDispensa =
  | ""
  | "estabelecimento_licenciado"
  | "administracao_publica";

type IngressoItem = {
  id: string;
  tipo: string;
  numeracao: string;
  notaFiscal: string;
  quantidade: string;
  valorUnitario: string;
};

type PontoVenda = {
  id: string;
  responsavel: string;
  endereco: string;
  telefone: string;
};

type FormState = {
  tipoProcesso: TipoProcesso;

  instituicaoPromotora: string;
  cnpj: string;
  inscricaoMunicipal: string;
  telefone: string;
  email: string;

  logradouro: string;
  numero: string;
  bairro: string;
  complemento: string;
  cep: string;

  nomeEvento: string;
  localEvento: string;
  datasEvento: string;
  horarioInicio: string;
  horarioTermino: string;
  publicoEstimado: string;
  porteEvento: PorteEvento;
  descricaoEvento: string;
  produtosServicos: string;
  estacionamento: string;
  trajetoEvento: string;

  interdicaoVia: SimNao;
  estruturaMontada: SimNao;
  enquadramentoDispensa: EnquadramentoDispensa;

  responsavelNome: string;
  responsavelCpf: string;
  responsavelRg: string;

  aceiteDeclaracao: boolean;
  aceiteLimpezaConservacao: boolean;

  ingressos: IngressoItem[];
  pontosVenda: PontoVenda[];
};

const PROCESSOS: Array<{ value: TipoProcesso; label: string }> = [
  {
    value: "requerimento_autorizacao_evento",
    label:
      "Requerimento para Autorização de Evento / Licença para Localização Temporária",
  },
  { value: "comunicado_evento", label: "Comunicado de Evento" },
  {
    value: "termo_responsabilidade",
    label: "Termo de Responsabilidade e Compromisso",
  },
  {
    value: "interdicao_via_carnaval",
    label: "Interdição de Via Pública / Carnaval",
  },
];

const initialState: FormState = {
  tipoProcesso: "",

  instituicaoPromotora: "",
  cnpj: "",
  inscricaoMunicipal: "",
  telefone: "",
  email: "",

  logradouro: "",
  numero: "",
  bairro: "",
  complemento: "",
  cep: "",

  nomeEvento: "",
  localEvento: "",
  datasEvento: "",
  horarioInicio: "",
  horarioTermino: "",
  publicoEstimado: "",
  porteEvento: "",
  descricaoEvento: "",
  produtosServicos: "",
  estacionamento: "",
  trajetoEvento: "",

  interdicaoVia: "",
  estruturaMontada: "",
  enquadramentoDispensa: "",

  responsavelNome: "",
  responsavelCpf: "",
  responsavelRg: "",

  aceiteDeclaracao: false,
  aceiteLimpezaConservacao: false,

  ingressos: [
    {
      id: cryptoSafeId(),
      tipo: "",
      numeracao: "",
      notaFiscal: "",
      quantidade: "",
      valorUnitario: "",
    },
  ],
  pontosVenda: [
    { id: cryptoSafeId(), responsavel: "", endereco: "", telefone: "" },
  ],
};

function cryptoSafeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function formatCpf(value: string) {
  const digits = digitsOnly(value).slice(0, 11);
  let v = digits;
  v = v.replace(/(\d{3})(\d)/, "$1.$2");
  v = v.replace(/(\d{3})(\d)/, "$1.$2");
  v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  return v;
}

function formatCnpj(value: string) {
  const digits = digitsOnly(value).slice(0, 14);
  let v = digits;
  v = v.replace(/^(\d{2})(\d)/, "$1.$2");
  v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
  v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
  v = v.replace(/(\d{4})(\d)/, "$1-$2");
  return v;
}

function formatCpfCnpj(value: string) {
  const digits = digitsOnly(value);
  return digits.length <= 11 ? formatCpf(digits) : formatCnpj(digits);
}

function formatCep(value: string) {
  const digits = digitsOnly(value).slice(0, 8);
  return digits.replace(/(\d{5})(\d)/, "$1-$2");
}

function formatTelefone(value: string) {
  const digits = digitsOnly(value).slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;

  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);

  if (rest.length >= 9)
    return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5, 9)}`;
  if (rest.length >= 8)
    return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4, 8)}`;
  return `(${ddd}) ${rest}`;
}

function isValidCpfLength(value: string) {
  return digitsOnly(value).length === 11;
}

function isValidCnpjLength(value: string) {
  return digitsOnly(value).length === 14;
}

function isValidPhoneBR(value: string) {
  const len = digitsOnly(value).length;
  return len === 10 || len === 11;
}

function isValidCep(value: string) {
  return digitsOnly(value).length === 8;
}

function parsePublico(value: string) {
  const onlyDigits = digitsOnly(value);
  return onlyDigits ? Number(onlyDigits) : 0;
}

function formatCurrencyBR(value: string) {
  const normalized = value.replace(/[^\d,.-]/g, "").replace(",", ".");
  const num = Number(normalized);
  if (Number.isNaN(num)) return "R$ 0,00";
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function dataExtensoPVH() {
  const meses = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];

  const date = new Date();
  return `Porto Velho, ${date.getDate()} de ${meses[date.getMonth()]} de ${date.getFullYear()}`;
}

function splitLongText(text: string, maxLength = 1800) {
  const clean = text.trim();
  if (!clean) return [""];

  const paragraphs = clean.split(/\n+/).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;

    if (candidate.length <= maxLength) {
      current = candidate;
      continue;
    }

    if (current) {
      chunks.push(current);
      current = "";
    }

    if (paragraph.length <= maxLength) {
      current = paragraph;
      continue;
    }

    for (let i = 0; i < paragraph.length; i += maxLength) {
      chunks.push(paragraph.slice(i, i + maxLength));
    }
  }

  if (current) chunks.push(current);

  return chunks.length ? chunks : [""];
}

function SectionCard({
  title,
  children,
  muted = false,
}: {
  title: string;
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <section
      className={`mb-8 overflow-hidden rounded-lg border border-gray-200 ${
        muted ? "bg-[#f5f5f5]" : "bg-white"
      }`}
    >
      <h5
        className={`px-4 py-2 text-sm font-bold md:text-base ${
          muted ? "bg-gray-200 text-[#1e3a5f]" : "bg-[#f5f5f5] text-[#1e3a5f]"
        }`}
      >
        {title}
      </h5>
      {children}
    </section>
  );
}

function InputField({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  readOnly = false,
  invalid = false,
  required = false,
  className = "",
  inputClassName = "",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  type?: string;
  placeholder?: string;
  readOnly?: boolean;
  invalid?: boolean;
  required?: boolean;
  className?: string;
  inputClassName?: string;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={`mb-1 block text-sm font-semibold ${
          invalid ? "text-red-700" : "text-gray-700"
        }`}
      >
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-red-500">
            *
          </span>
        )}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`w-full rounded border px-3 py-2 text-sm outline-none transition ${
          readOnly ? "cursor-not-allowed bg-gray-100" : "bg-white"
        } ${
          invalid
            ? "border-red-400 bg-red-50"
            : "border-gray-300 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/10"
        } ${inputClassName}`}
      />
    </div>
  );
}

function TextAreaField({
  id,
  label,
  value,
  onChange,
  placeholder,
  invalid = false,
  required = false,
  rows = 6,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  placeholder?: string;
  invalid?: boolean;
  required?: boolean;
  rows?: number;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className={`mb-1 block text-sm font-semibold ${
          invalid ? "text-red-700" : "text-gray-700"
        }`}
      >
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-red-500">
            *
          </span>
        )}
      </label>
      <textarea
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        className={`w-full rounded border px-3 py-2 text-sm outline-none transition ${
          invalid
            ? "border-red-400 bg-red-50"
            : "border-gray-300 bg-white focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/10"
        }`}
      />
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  invalid = false,
  required = false,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  invalid?: boolean;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className={`mb-1 block text-sm font-semibold ${
          invalid ? "text-red-700" : "text-gray-700"
        }`}
      >
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-red-500">
            *
          </span>
        )}
      </label>
      <select
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        className={`w-full rounded border px-3 py-2 text-sm outline-none transition ${
          invalid
            ? "border-red-400 bg-red-50"
            : "border-gray-300 bg-white focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/10"
        }`}
      >
        {children}
      </select>
    </div>
  );
}

function CheckField({
  id,
  checked,
  label,
  onChange,
  invalid = false,
  required = false,
}: {
  id: string;
  checked: boolean;
  label: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  invalid?: boolean;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-start gap-3 rounded border px-3 py-3 text-sm ${
        invalid ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50"
      }`}
    >
      <input
        id={id}
        name={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-0.5 h-4 w-4 accent-[#70B643]"
      />
      <span className="text-gray-700">
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-red-500">
            *
          </span>
        )}
      </span>
    </label>
  );
}

function processLabel(tipo: TipoProcesso) {
  return PROCESSOS.find((item) => item.value === tipo)?.label ?? "-";
}

const EMAIL_DESTINO = "plantao.eventos.dfit@gmail.com";

function getDocumentosNecessarios(form: FormState) {
  const publico = parsePublico(form.publicoEstimado);
  const docs: string[] = [];

  const add = (...items: string[]) => {
    for (const item of items) {
      if (item && !docs.includes(item)) docs.push(item);
    }
  };

  if (form.tipoProcesso === "requerimento_autorizacao_evento") {
    add(
      "Requerimento específico do evento.",
      "Documento do local do evento: contrato de locação, termo de anuência, autorização equivalente ou cessão/permuta quando espaço público.",
      "Comprovante de inscrição e situação cadastral do CNPJ.",
      "Documento oficial do representante legal.",
      "Certidão Negativa de Tributos Municipais atualizada.",
      "Projeto do evento com nome, data, horário, local, descrição, produtos/serviços e opções de estacionamento.",
      "Contrato com artistas ou atrações, quando houver.",
      "Taxa de abertura de processo quitada.",
    );

    if (form.estruturaMontada === "Sim") {
      add("Croqui da área/local especificando a estrutura a ser montada.");
    }

    if (form.interdicaoVia === "Sim") {
      add(
        "Termo de Responsabilidade e Compromisso assinado pelo promotor/responsável.",
      );
      add(
        "Documentação complementar para interdição de via pública / SEMTRAN.",
      );
    }

    if (
      publico >= 1000 ||
      form.porteEvento === "Médio" ||
      form.porteEvento === "Grande"
    ) {
      add("Contrato de ambulância para público a partir de 1000 pessoas.");
    }

    if (form.porteEvento === "Médio" || form.porteEvento === "Grande") {
      add(
        "Contrato com Bombeiro Civil.",
        "Pedido de policiamento ostensivo quando realizado em logradouro público.",
      );
    }
  }

  if (form.tipoProcesso === "comunicado_evento") {
    add(
      "Projeto do evento com nome, data, horário, local, descrição, produtos/serviços e opções de estacionamento.",
      "Contrato com artistas ou atrações, quando houver.",
    );

    if (publico >= 1000) {
      add("Contrato de ambulância para público a partir de 1000 pessoas.");
    }

    if (form.porteEvento === "Médio" || form.porteEvento === "Grande") {
      add("Contrato com Bombeiro Civil.");
    }

    if (form.enquadramentoDispensa === "estabelecimento_licenciado") {
      add(
        "Atos constitutivos da instituição promotora.",
        "Alvará da Licença de Localização e Funcionamento.",
        "Certidão Negativa de Tributos Municipais do promotor de evento.",
        "Documento oficial do representante legal.",
      );
    }

    if (form.enquadramentoDispensa === "administracao_publica") {
      add(
        "Lei de criação do órgão/promotor público.",
        "Ato de nomeação ou procuração do representante legal.",
        "Croqui da área/local quando houver estrutura.",
        "Protocolo de AVCIP, quando houver estrutura temporária.",
      );
    }

    if (form.interdicaoVia === "Sim") {
      add(
        "Autorização Administrativa de Interdição de Via Pública da SEMTRAN.",
        "Pedido de policiamento ostensivo quando realizado em logradouro público.",
      );
    }
  }

  if (form.tipoProcesso === "termo_responsabilidade") {
    add(
      "Assinatura do promotor/responsável pelo evento.",
      "Dados do evento preenchidos integralmente.",
      "Uso aplicável quando o evento ocorrer em espaço, via ou logradouro público.",
    );
  }

  if (form.tipoProcesso === "interdicao_via_carnaval") {
    add(
      "Comprovante de situação cadastral do CNPJ da entidade promotora.",
      "Certidão de registro da ata de assembleia com diretoria atual.",
      "RG e CPF do representante legal.",
      "Certidão Negativa de Tributos Municipais.",
      "Projeto do evento com histórico, objetivo, descrição, data, horário, local e trajeto.",
      "Croqui do circuito.",
      "Alvará vigente da instituição promotora.",
      "Autorização Sanitária para Evento Temporário.",
      "Autorização Ambiental de Evento.",
      "Pedido de policiamento ostensivo.",
      "Taxa de abertura de processo quitada.",
    );

    if (publico >= 1000) {
      add(
        "Contrato com empresa especializada para fornecimento de ambulância.",
      );
    }

    add(
      "Contrato com empresa especializada para seguranças do evento.",
      "ART das estruturas temporárias e dos veículos com autorização especial de tráfego, quando houver.",
      "Protocolo do pedido de vistoria do Corpo de Bombeiros.",
      "Nota fiscal de aquisição de ingressos, abadás, kits e congêneres, quando houver.",
    );
  }

  if (form.estruturaMontada === "Sim") {
    add(
      "Detalhamento da estrutura montada: palco, barracas, geradores, arquibancadas ou similares.",
    );
  }

  return docs;
}

function addUniqueIfFilled(target: string[], value: string) {
  const clean = value.trim();
  if (clean && !target.includes(clean)) target.push(clean);
}

export default function FormularioEventosUnificado() {
  const [form, setForm] = useState<FormState>(initialState);
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showSendNotice, setShowSendNotice] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);

  const currentDate = useMemo(
    () => new Intl.DateTimeFormat("pt-BR").format(new Date()),
    [],
  );

  const dataExtenso = useMemo(() => dataExtensoPVH(), []);

  const documentosNecessarios = useMemo(
    () => getDocumentosNecessarios(form),
    [form],
  );

  const totalIngressos = useMemo(() => {
    return form.ingressos.reduce((acc, item) => {
      const quantidade =
        Number(item.quantidade.replace(/\./g, "").replace(",", ".")) || 0;
      const valor =
        Number(item.valorUnitario.replace(/\./g, "").replace(",", ".")) || 0;
      return acc + quantidade * valor;
    }, 0);
  }, [form.ingressos]);

  const descricaoCompleta = useMemo(() => {
    const parts: string[] = [];
    addUniqueIfFilled(parts, form.descricaoEvento);
    if (form.produtosServicos.trim()) {
      parts.push(
        `Produtos/serviços ofertados: ${form.produtosServicos.trim()}`,
      );
    }
    if (form.estacionamento.trim()) {
      parts.push(`Estacionamento/logística: ${form.estacionamento.trim()}`);
    }
    if (form.trajetoEvento.trim()) {
      parts.push(`Trajeto/circuito: ${form.trajetoEvento.trim()}`);
    }
    return parts.join("\n\n");
  }, [
    form.descricaoEvento,
    form.produtosServicos,
    form.estacionamento,
    form.trajetoEvento,
  ]);

  const descricaoChunks = useMemo(
    () => splitLongText(descricaoCompleta, 1700),
    [descricaoCompleta],
  );

  function isInvalidField(field: string) {
    return invalidFields.includes(field);
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => ({ ...prev, [name]: checked }));
      return;
    }

    if (name === "cnpj") {
      updateField("cnpj", formatCnpj(value));
      return;
    }

    if (name === "responsavelCpf") {
      updateField("responsavelCpf", formatCpf(value));
      return;
    }

    if (
      name === "telefone" ||
      name === "telefoneResponsavel" ||
      name === "contadorTelefone"
    ) {
      setForm((prev) => ({ ...prev, [name]: formatTelefone(value) }));
      return;
    }

    if (name === "responsavelCpf" || name === "contadorCpf") {
      setForm((prev) => ({ ...prev, [name]: formatCpf(value) }));
      return;
    }

    if (name === "cep") {
      updateField("cep", formatCep(value));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleCheckboxChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: checked }));
  }

  function handleIngressoChange(
    id: string,
    field: keyof IngressoItem,
    value: string,
  ) {
    setForm((prev) => ({
      ...prev,
      ingressos: prev.ingressos.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    }));
  }

  function handlePontoVendaChange(
    id: string,
    field: keyof PontoVenda,
    value: string,
  ) {
    const nextValue = field === "telefone" ? formatTelefone(value) : value;

    setForm((prev) => ({
      ...prev,
      pontosVenda: prev.pontosVenda.map((item) =>
        item.id === id ? { ...item, [field]: nextValue } : item,
      ),
    }));
  }

  function addIngresso() {
    setForm((prev) => ({
      ...prev,
      ingressos: [
        ...prev.ingressos,
        {
          id: cryptoSafeId(),
          tipo: "",
          numeracao: "",
          notaFiscal: "",
          quantidade: "",
          valorUnitario: "",
        },
      ],
    }));
  }

  function removeIngresso(id: string) {
    setForm((prev) => ({
      ...prev,
      ingressos:
        prev.ingressos.length > 1
          ? prev.ingressos.filter((item) => item.id !== id)
          : prev.ingressos,
    }));
  }

  function addPontoVenda() {
    setForm((prev) => ({
      ...prev,
      pontosVenda: [
        ...prev.pontosVenda,
        { id: cryptoSafeId(), responsavel: "", endereco: "", telefone: "" },
      ],
    }));
  }

  function removePontoVenda(id: string) {
    setForm((prev) => ({
      ...prev,
      pontosVenda:
        prev.pontosVenda.length > 1
          ? prev.pontosVenda.filter((item) => item.id !== id)
          : prev.pontosVenda,
    }));
  }

  function scrollToFirstError(fieldIds: string[]) {
    const first = fieldIds[0];
    if (!first) return;

    const el = document.getElementById(first);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      if ("focus" in el && typeof (el as HTMLElement).focus === "function") {
        (el as HTMLElement).focus();
      }
    }
  }

  function validateForm() {
    const errors: string[] = [];
    const fields: string[] = [];
    const emailRegex = /^\S+@\S+\.\S+$/;
    const publico = parsePublico(form.publicoEstimado);

    function addFieldError(field: string, message: string) {
      errors.push(message);
      fields.push(field);
    }

    function required(field: keyof FormState, label: string) {
      const value = form[field];
      if (typeof value === "string" && !value.trim()) {
        addFieldError(String(field), `O campo "${label}" é obrigatório.`);
      }
    }

    required("tipoProcesso", "Tipo de processo");

    {
      required("instituicaoPromotora", "Instituição promotora");
      required("cnpj", "CNPJ");
      required("telefone", "Telefone");
      required("email", "E-mail");
      required("logradouro", "Logradouro");
      required("numero", "Número");
      required("bairro", "Bairro");
      required("nomeEvento", "Nome do evento");
      required("localEvento", "Local do evento");
      required("datasEvento", "Data(s) do evento");
      required("horarioInicio", "Horário de início");
      required("horarioTermino", "Horário de término");
      required("publicoEstimado", "Público estimado");
      required("responsavelNome", "Nome do responsável");
      required("responsavelCpf", "CPF do responsável");

      if (
        form.tipoProcesso === "requerimento_autorizacao_evento" ||
        form.tipoProcesso === "interdicao_via_carnaval"
      ) {
        required("inscricaoMunicipal", "Inscrição municipal");
        required("responsavelRg", "RG do responsável legal");
        required("porteEvento", "Porte do evento");
        required("interdicaoVia", "Interdição de via pública");
        required("estruturaMontada", "Estrutura montada");
      }

      if (form.tipoProcesso === "comunicado_evento") {
        required("porteEvento", "Porte do evento");
        required("interdicaoVia", "Interdição de via pública");
        required("estruturaMontada", "Estrutura montada");
        required("enquadramentoDispensa", "Enquadramento da dispensa");
      }

      if (
        form.tipoProcesso === "interdicao_via_carnaval" &&
        !form.trajetoEvento.trim()
      ) {
        addFieldError(
          "trajetoEvento",
          'O campo "Trajeto/circuito" é obrigatório para interdição de via.',
        );
      }

      if (
        form.tipoProcesso === "termo_responsabilidade" &&
        !form.aceiteLimpezaConservacao
      ) {
        addFieldError(
          "aceiteLimpezaConservacao",
          "Marque o aceite de responsabilidade sobre limpeza, conservação e ressarcimento ao espaço público.",
        );
      }

      if (!form.aceiteDeclaracao) {
        addFieldError(
          "aceiteDeclaracao",
          "Marque o aceite de veracidade das informações.",
        );
      }
      if (form.email.trim() && !emailRegex.test(form.email.trim())) {
        addFieldError("email", '"E-mail" não é um e-mail válido.');
      }
      if (form.cnpj.trim() && !isValidCnpjLength(form.cnpj)) {
        addFieldError("cnpj", '"CNPJ" deve conter 14 dígitos.');
      }
      if (form.telefone.trim() && !isValidPhoneBR(form.telefone)) {
        addFieldError("telefone", '"Telefone" deve conter 10 ou 11 dígitos.');
      }
      if (form.cep.trim() && !isValidCep(form.cep)) {
        addFieldError("cep", '"CEP" deve conter 8 dígitos.');
      }
      if (
        form.responsavelCpf.trim() &&
        !isValidCpfLength(form.responsavelCpf)
      ) {
        addFieldError(
          "responsavelCpf",
          '"CPF do responsável" deve conter 11 dígitos.',
        );
      }
      if (publico <= 0) {
        addFieldError(
          "publicoEstimado",
          '"Público estimado" deve ser maior que zero.',
        );
      }

      const processoTemComercializacao =
        form.tipoProcesso === "requerimento_autorizacao_evento" ||
        form.tipoProcesso === "interdicao_via_carnaval";

      if (processoTemComercializacao) {
        const temAlgumIngressoPreenchido = form.ingressos.some((item) =>
          [
            item.tipo,
            item.numeracao,
            item.notaFiscal,
            item.quantidade,
            item.valorUnitario,
          ].some((part) => part.trim()),
        );

        if (temAlgumIngressoPreenchido) {
          form.ingressos.forEach((item, index) => {
            const prefix = `Ingresso ${index + 1}`;
            if (!item.tipo.trim())
              addFieldError(
                `ingresso-tipo-${item.id}`,
                `${prefix}: informe o tipo.`,
              );
            if (!item.quantidade.trim())
              addFieldError(
                `ingresso-quantidade-${item.id}`,
                `${prefix}: informe a quantidade.`,
              );
            if (!item.valorUnitario.trim())
              addFieldError(
                `ingresso-valor-${item.id}`,
                `${prefix}: informe o valor unitário.`,
              );
          });
        }
      }
    }

    const uniqueFields = [...new Set(fields)];
    setInvalidFields(uniqueFields);
    setValidationErrors(errors);

    if (errors.length > 0) {
      requestAnimationFrame(() => scrollToFirstError(uniqueFields));
      return false;
    }

    return true;
  }

  async function generatePdf() {
    if (!validateForm() || isGeneratingPdf) return;

    try {
      setIsGeneratingPdf(true);

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const PAGE_W = 210;
      const CONTENT_X = 18;
      const CONTENT_W = 174;
      const BODY_START_Y = 40;
      const BODY_MAX_Y = 274;
      const BOX_HEADER_H = 7;
      const BOX_PADDING_X = 3;
      const BOX_PADDING_TOP = 4;
      const BOX_PADDING_BOTTOM = 3;
      const BOX_TEXT_LINE_H = 4.7;
      const BOX_GAP = 3;

      const COLOR_BLUE = [30, 58, 95] as const;
      const COLOR_GREEN = [112, 182, 67] as const;
      const COLOR_TEXT = [36, 52, 76] as const;
      const COLOR_MUTED = [107, 114, 128] as const;
      const COLOR_BORDER = [216, 221, 230] as const;

      let cursorY = BODY_START_Y;

      const safe = (value: string) => (value.trim() ? value.trim() : "-");
      const splitText = (text: string, width: number) =>
        doc.splitTextToSize(text, width) as string[];

      const drawPageBase = () => {
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, 210, 297, "F");

        doc.setFont("helvetica", "bold");
        doc.setTextColor(...COLOR_BLUE);
        doc.setFontSize(13.5);
        doc.text("PREFEITURA MUNICIPAL DE PORTO VELHO", PAGE_W / 2, 18, {
          align: "center",
        });

        doc.setFontSize(10.5);
        doc.text("SECRETARIA MUNICIPAL DE FAZENDA", PAGE_W / 2, 23, {
          align: "center",
        });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...COLOR_MUTED);
        doc.text("Formulário Web Unificado de Eventos", PAGE_W / 2, 27, {
          align: "center",
        });

        doc.setDrawColor(...COLOR_GREEN);
        doc.setLineWidth(0.6);
        doc.line(CONTENT_X, 31, CONTENT_X + CONTENT_W, 31);

        doc.setDrawColor(...COLOR_BORDER);
        doc.setLineWidth(0.2);
        doc.line(CONTENT_X, 280, CONTENT_X + CONTENT_W, 280);

        doc.setFontSize(8);
        doc.setTextColor(...COLOR_MUTED);
        doc.text(
          `Documento gerado eletronicamente em ${currentDate}`,
          CONTENT_X + CONTENT_W,
          285,
          {
            align: "right",
          },
        );

        cursorY = BODY_START_Y;
      };

      const newPage = () => {
        doc.addPage();
        drawPageBase();
      };

      const ensureSpace = (needed: number) => {
        if (cursorY + needed > BODY_MAX_Y) newPage();
      };

      const drawSectionContainer = (
        boxY: number,
        boxH: number,
        title: string,
      ) => {
        doc.setFillColor(...COLOR_BLUE);
        doc.rect(CONTENT_X, boxY, CONTENT_W, BOX_HEADER_H, "F");
        doc.setDrawColor(...COLOR_BORDER);
        doc.setLineWidth(0.35);
        doc.rect(CONTENT_X, boxY, CONTENT_W, boxH);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text(title, CONTENT_X + 3, boxY + 4.7);
        doc.setTextColor(...COLOR_TEXT);
      };

      const addMainTitle = (title: string, subtitle?: string) => {
        ensureSpace(12);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(...COLOR_GREEN);
        doc.text(title, PAGE_W / 2, cursorY, { align: "center" });
        cursorY += 6;

        if (subtitle) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(...COLOR_TEXT);
          doc.text(subtitle, PAGE_W / 2, cursorY, { align: "center" });
          cursorY += 6;
        }
      };

      const addBoxedFieldsSection = (
        title: string,
        fields: Array<[string, string]>,
      ) => {
        const innerX = CONTENT_X + BOX_PADDING_X;
        const innerW = CONTENT_W - BOX_PADDING_X * 2;

        const prepared = fields.map(([label, value]) =>
          splitText(`${label} ${safe(value)}`, innerW),
        );
        const boxH =
          BOX_HEADER_H +
          BOX_PADDING_TOP +
          BOX_PADDING_BOTTOM +
          prepared.reduce(
            (sum, lines) => sum + lines.length * BOX_TEXT_LINE_H + 1,
            0,
          );

        ensureSpace(boxH + BOX_GAP);
        const boxY = cursorY;
        drawSectionContainer(boxY, boxH, title);

        let y = boxY + BOX_HEADER_H + BOX_PADDING_TOP + 1.5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10.2);
        doc.setTextColor(...COLOR_TEXT);

        for (const lines of prepared) {
          for (const line of lines) {
            doc.text(line, innerX, y);
            y += BOX_TEXT_LINE_H;
          }
          y += 1;
        }

        cursorY = boxY + boxH + BOX_GAP;
      };

      const addBoxedParagraphSection = (title: string, text: string) => {
        const innerX = CONTENT_X + BOX_PADDING_X;
        const innerW = CONTENT_W - BOX_PADDING_X * 2;
        const lines = splitText(safe(text), innerW);
        let start = 0;
        let nextTitle = title;

        while (start < lines.length) {
          let available = BODY_MAX_Y - cursorY;
          let maxLines = Math.floor(
            (available - BOX_HEADER_H - BOX_PADDING_TOP - BOX_PADDING_BOTTOM) /
              BOX_TEXT_LINE_H,
          );

          if (maxLines < 2) {
            newPage();
            continue;
          }

          const slice = lines.slice(start, start + maxLines);
          const boxH =
            BOX_HEADER_H +
            BOX_PADDING_TOP +
            BOX_PADDING_BOTTOM +
            slice.length * BOX_TEXT_LINE_H;

          const boxY = cursorY;
          drawSectionContainer(boxY, boxH, nextTitle);

          let y = boxY + BOX_HEADER_H + BOX_PADDING_TOP + 1.5;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10.2);
          doc.setTextColor(...COLOR_TEXT);
          for (const line of slice) {
            doc.text(line, innerX, y);
            y += BOX_TEXT_LINE_H;
          }

          cursorY = boxY + boxH + BOX_GAP;
          start += slice.length;
          nextTitle = `${title} (CONTINUAÇÃO)`;

          if (start < lines.length) newPage();
        }
      };

      const addBulletListSection = (title: string, items: string[]) => {
        const innerX = CONTENT_X + BOX_PADDING_X;
        const innerW = CONTENT_W - BOX_PADDING_X * 2 - 4;
        const prepared = items.map((item) => splitText(item, innerW));
        let idx = 0;
        let nextTitle = title;

        while (idx < prepared.length) {
          let remaining = BODY_MAX_Y - cursorY;
          let used = BOX_HEADER_H + BOX_PADDING_TOP + BOX_PADDING_BOTTOM;
          const pageItems: string[][] = [];

          while (idx < prepared.length) {
            const blockH = prepared[idx].length * BOX_TEXT_LINE_H + 1.2;
            if (pageItems.length === 0 && used + blockH > remaining) {
              newPage();
              remaining = BODY_MAX_Y - cursorY;
              used = BOX_HEADER_H + BOX_PADDING_TOP + BOX_PADDING_BOTTOM;
              continue;
            }
            if (pageItems.length > 0 && used + blockH > remaining) break;
            pageItems.push(prepared[idx]);
            used += blockH;
            idx += 1;
          }

          const boxY = cursorY;
          drawSectionContainer(boxY, used, nextTitle);

          let y = boxY + BOX_HEADER_H + BOX_PADDING_TOP + 1.5;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(...COLOR_TEXT);

          for (const lines of pageItems) {
            if (!lines.length) continue;
            doc.text("•", innerX, y);
            doc.text(lines[0], innerX + 4, y);
            y += BOX_TEXT_LINE_H;
            for (let i = 1; i < lines.length; i += 1) {
              doc.text(lines[i], innerX + 4, y);
              y += BOX_TEXT_LINE_H;
            }
            y += 1.2;
          }

          cursorY = boxY + used + BOX_GAP;
          nextTitle = `${title} (CONTINUAÇÃO)`;
        }
      };

      const addSignatureBlock = (signatoryLabel: string, cpf: string) => {
        const boxH = 60;

        if (cursorY + boxH + BOX_GAP > BODY_MAX_Y) {
          newPage();
        }

        const boxY = cursorY;
        drawSectionContainer(boxY, boxH, "ASSINATURA");

        let y = boxY + BOX_HEADER_H + BOX_PADDING_TOP + 2;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10.2);
        doc.setTextColor(...COLOR_TEXT);

        doc.text("Nestes termos, pede deferimento.", PAGE_W / 2, y, {
          align: "center",
        });
        y += 5.5;

        doc.text(dataExtenso, PAGE_W / 2, y, {
          align: "center",
        });

        const lineY = boxY + 31;
        const lineStartX = PAGE_W / 2 - 40;
        const lineEndX = PAGE_W / 2 + 40;

        doc.setDrawColor(...COLOR_BLUE);
        doc.setLineWidth(0.3);
        doc.line(lineStartX, lineY, lineEndX, lineY);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.2);
        doc.text(signatoryLabel, PAGE_W / 2, lineY + 6, {
          align: "center",
        });

        doc.setFont("helvetica", "normal");
        doc.text(`CPF nº ${safe(cpf)}`, PAGE_W / 2, lineY + 11, {
          align: "center",
        });

        doc.setFont("helvetica", "italic");
        doc.setFontSize(8.5);
        doc.setTextColor(...COLOR_MUTED);
        doc.text(
          "Aceita-se assinatura eletrônica. Para assinar pelo Gov.br, acesse:",
          PAGE_W / 2,
          lineY + 18,
          { align: "center" },
        );
        doc.setTextColor(...COLOR_BLUE);
        const govBrUrl = "https://www.gov.br/pt-br/servicos/assinatura-eletronica";
        doc.textWithLink(govBrUrl, PAGE_W / 2, lineY + 22, {
          align: "center",
          url: govBrUrl,
        });
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...COLOR_TEXT);

        cursorY = boxY + boxH + BOX_GAP;
      };

      drawPageBase();

      {
        addMainTitle(
          "FORMULÁRIO UNIFICADO DE EVENTOS",
          processLabel(form.tipoProcesso),
        );

        addBoxedFieldsSection("TIPO DE PROCESSO", [
          ["Processo selecionado:", processLabel(form.tipoProcesso)],
        ]);

        addBoxedFieldsSection("1. DADOS DO PROMOTOR", [
          ["Instituição promotora:", form.instituicaoPromotora],
          ["CNPJ:", form.cnpj],
          ["Inscrição municipal:", form.inscricaoMunicipal],
          ["Telefone:", form.telefone],
          ["E-mail:", form.email],
          ["Logradouro:", form.logradouro],
          ["Número:", form.numero],
          ["Bairro:", form.bairro],
          ["Complemento:", form.complemento],
          ["CEP:", form.cep],
        ]);

        const dadosEventoFields: Array<[string, string]> = [
          ["Nome do evento:", form.nomeEvento],
          ["Local:", form.localEvento],
          ["Data(s):", form.datasEvento],
          ["Horário de início:", form.horarioInicio],
          ["Horário de término:", form.horarioTermino],
          ["Público estimado:", form.publicoEstimado],
          ["Porte:", form.porteEvento],
          ["Interdição de via:", form.interdicaoVia],
          ["Estrutura montada:", form.estruturaMontada],
        ];

        if (form.tipoProcesso === "requerimento_autorizacao_evento") {
          dadosEventoFields.unshift([
            "Modalidade:",
            "Evento Temporário (Licença para Localização Temporária)",
          ]);
        }

        addBoxedFieldsSection("2. DADOS DO EVENTO", dadosEventoFields);

        addBoxedParagraphSection(
          "3. DESCRIÇÃO E LOGÍSTICA",
          descricaoChunks.join("\n\n"),
        );

        addBoxedFieldsSection("4. RESPONSÁVEL LEGAL", [
          ["Nome:", form.responsavelNome],
          ["CPF:", form.responsavelCpf],
          ["RG:", form.responsavelRg],
          [
            "Enquadramento da dispensa:",
            form.enquadramentoDispensa === "estabelecimento_licenciado"
              ? "Evento realizado em estabelecimento licenciado"
              : form.enquadramentoDispensa === "administracao_publica"
                ? "Evento promovido por iniciativa da Administração Pública"
                : "-",
          ],
        ]);

        if (
          form.tipoProcesso === "requerimento_autorizacao_evento" ||
          form.tipoProcesso === "interdicao_via_carnaval"
        ) {
          const ingressosPreenchidos = form.ingressos.filter((item) =>
            [
              item.tipo,
              item.numeracao,
              item.notaFiscal,
              item.quantidade,
              item.valorUnitario,
            ].some((part) => part.trim()),
          );

          if (ingressosPreenchidos.length > 0) {
            addBulletListSection(
              "5. COMERCIALIZAÇÃO",
              ingressosPreenchidos.map(
                (item, index) =>
                  `Item ${index + 1}: tipo ${safe(item.tipo)} | numeração ${safe(item.numeracao)} | nota fiscal ${safe(item.notaFiscal)} | quantidade ${safe(item.quantidade)} | valor unitário ${safe(item.valorUnitario)}`,
              ),
            );

            addBoxedFieldsSection("5.1 TOTAL DE COMERCIALIZAÇÃO", [
              [
                "Valor total estimado:",
                formatCurrencyBR(String(totalIngressos)),
              ],
            ]);
          }

          const pontosPreenchidos = form.pontosVenda.filter((item) =>
            [item.responsavel, item.endereco, item.telefone].some((part) =>
              part.trim(),
            ),
          );

          if (pontosPreenchidos.length > 0) {
            addBulletListSection(
              "5.2 PONTOS DE VENDA",
              pontosPreenchidos.map(
                (item, index) =>
                  `Ponto ${index + 1}: responsável ${safe(item.responsavel)} | endereço ${safe(item.endereco)} | telefone ${safe(item.telefone)}`,
              ),
            );
          }
        }

        addBulletListSection(
          "6. DOCUMENTOS NECESSÁRIOS",
          documentosNecessarios,
        );

        addBoxedFieldsSection("7. DECLARAÇÕES", [
          [
            "Aceite de veracidade das informações:",
            form.aceiteDeclaracao ? "Sim" : "Não",
          ],
          [
            "Aceite de limpeza, conservação e ressarcimento:",
            form.aceiteLimpezaConservacao ? "Sim" : "Não",
          ],
        ]);

        addSignatureBlock("Responsável pelo evento", form.responsavelCpf);
      }

      const fileDate = new Date().toISOString().slice(0, 10);
      doc.save(`formulario-eventos-unificado-${fileDate}.pdf`);
      setEmailCopied(false);
      setShowSendNotice(true);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Não foi possível gerar o PDF. Tente novamente.");
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  const exibirComercializacao =
    form.tipoProcesso === "requerimento_autorizacao_evento" ||
    form.tipoProcesso === "interdicao_via_carnaval";

  const exibirEnquadramentoDispensa = form.tipoProcesso === "comunicado_evento";
  const exibirAceiteLimpeza = form.tipoProcesso === "termo_responsabilidade";

  const requiresInscricaoMunRg =
    form.tipoProcesso === "requerimento_autorizacao_evento" ||
    form.tipoProcesso === "interdicao_via_carnaval";
  const requiresPorteEvento =
    requiresInscricaoMunRg || form.tipoProcesso === "comunicado_evento";
  const requiresTrajeto = form.tipoProcesso === "interdicao_via_carnaval";

  async function handleCopyEmail() {
    try {
      await navigator.clipboard.writeText(EMAIL_DESTINO);
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2500);
    } catch {
      setEmailCopied(false);
    }
  }

  return (
    <>
      {showSendNotice && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="send-notice-title"
        >
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl">
            <h2
              id="send-notice-title"
              className="mb-2 text-lg font-bold text-[#1e3a5f]"
            >
              PDF gerado com sucesso
            </h2>
            <p className="mb-4 text-sm leading-6 text-gray-700">
              O arquivo foi baixado para o seu computador. Envie-o em anexo,{" "}
              <strong>
                junto com toda a documentação necessária listada no formulário
              </strong>
              , para o e-mail do plantão de eventos:
            </p>
            <div className="mb-4 rounded-md border border-[#1e3a5f]/20 bg-[#f5f9ff] p-3 text-center">
              <p className="break-all text-base font-semibold text-[#1e3a5f]">
                {EMAIL_DESTINO}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleCopyEmail}
                className="rounded-full border border-[#1e3a5f] px-5 py-2 text-sm font-bold text-[#1e3a5f] transition hover:bg-[#1e3a5f] hover:text-white"
              >
                {emailCopied ? "E-mail copiado!" : "Copiar e-mail"}
              </button>
              <button
                type="button"
                onClick={() => setShowSendNotice(false)}
                className="rounded-full bg-[#70B643] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#5ea637]"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {isGeneratingPdf && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80">
          <div className="text-center text-white">
            <div className="mx-auto mb-5 h-14 w-14 animate-spin rounded-full border-[5px] border-white/30 border-t-[#70B643]" />
            <h2 className="text-xl font-bold">Gerando PDF...</h2>
            <p className="mt-2 text-sm text-white/80">
              Por favor, aguarde alguns instantes
            </p>
          </div>
        </div>
      )}

      <section className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-lg md:p-10">
          {validationErrors.length > 0 && (
            <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4">
              <p className="mb-2 font-bold text-red-700">
                Corrija os seguintes erros:
              </p>
              <ul className="ml-5 list-disc text-sm text-red-600">
                {validationErrors.map((error, index) => (
                  <li key={`${error}-${index}`}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <h4 className="mb-8 text-center text-xl font-bold text-[#70B643] md:text-2xl">
            FORMULÁRIO UNIFICADO DE EVENTOS - SEMEC
          </h4>

          <p className="mb-6 text-sm leading-6 text-gray-700 md:text-base">
            Preencha os dados principais do evento e selecione o tipo de
            processo desejado.
          </p>

          <SectionCard title="TIPO DE PROCESSO">
            <div className="p-4">
              <SelectField
                id="tipoProcesso"
                label="Selecione o processo desejado"
                value={form.tipoProcesso}
                onChange={handleSelectChange}
                invalid={isInvalidField("tipoProcesso")}
                required
              >
                <option value="" disabled>
                  Selecione o processo
                </option>
                {PROCESSOS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </SelectField>

              {form.tipoProcesso && (
                <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-4">
                  <p className="mb-2 text-sm font-bold text-[#1e3a5f]">
                    Documentos necessários:
                  </p>
                  <ul className="ml-5 list-disc space-y-1 text-sm text-gray-700">
                    {documentosNecessarios.map((doc, idx) => (
                      <li key={`${doc}-${idx}`}>{doc}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </SectionCard>

              <SectionCard title="1. DADOS DO PROMOTOR DO EVENTO">
                <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
                  <InputField
                    id="instituicaoPromotora"
                    label="Instituição promotora"
                    value={form.instituicaoPromotora}
                    onChange={handleChange}
                    placeholder="Nome da instituição, empresa, entidade ou promotor"
                    invalid={isInvalidField("instituicaoPromotora")}
                    required
                    className="md:col-span-2"
                  />

                  <InputField
                    id="cnpj"
                    label="CNPJ"
                    value={form.cnpj}
                    onChange={handleChange}
                    placeholder="00.000.000/0000-00"
                    invalid={isInvalidField("cnpj")}
                    required
                  />

                  <InputField
                    id="inscricaoMunicipal"
                    label="Inscrição municipal"
                    value={form.inscricaoMunicipal}
                    onChange={handleChange}
                    placeholder="Informe quando aplicável"
                    invalid={isInvalidField("inscricaoMunicipal")}
                    required={requiresInscricaoMunRg}
                  />

                  <InputField
                    id="telefone"
                    label="Telefone"
                    value={form.telefone}
                    onChange={handleChange}
                    placeholder="(00) 00000-0000"
                    invalid={isInvalidField("telefone")}
                    required
                  />

                  <InputField
                    id="email"
                    label="E-mail"
                    value={form.email}
                    onChange={handleChange}
                    type="email"
                    placeholder="exemplo@email.com"
                    invalid={isInvalidField("email")}
                    required
                  />

                  <InputField
                    id="logradouro"
                    label="Logradouro"
                    value={form.logradouro}
                    onChange={handleChange}
                    placeholder="Rua, avenida, travessa..."
                    invalid={isInvalidField("logradouro")}
                    required
                    className="md:col-span-2"
                  />

                  <InputField
                    id="numero"
                    label="Número"
                    value={form.numero}
                    onChange={handleChange}
                    placeholder="Número"
                    invalid={isInvalidField("numero")}
                    required
                  />

                  <InputField
                    id="bairro"
                    label="Bairro"
                    value={form.bairro}
                    onChange={handleChange}
                    placeholder="Bairro"
                    invalid={isInvalidField("bairro")}
                    required
                  />

                  <InputField
                    id="complemento"
                    label="Complemento"
                    value={form.complemento}
                    onChange={handleChange}
                    placeholder="Sala, bloco, referência..."
                  />

                  <InputField
                    id="cep"
                    label="CEP"
                    value={form.cep}
                    onChange={handleChange}
                    placeholder="00000-000"
                    invalid={isInvalidField("cep")}
                  />
                </div>
              </SectionCard>

              <SectionCard title="2. DADOS DO EVENTO">
                <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
                  <InputField
                    id="nomeEvento"
                    label="Nome do evento"
                    value={form.nomeEvento}
                    onChange={handleChange}
                    placeholder="Digite o nome do evento"
                    invalid={isInvalidField("nomeEvento")}
                    required
                    className="md:col-span-2"
                  />

                  <InputField
                    id="localEvento"
                    label="Local do evento"
                    value={form.localEvento}
                    onChange={handleChange}
                    placeholder="Local completo"
                    invalid={isInvalidField("localEvento")}
                    required
                    className="md:col-span-2"
                  />

                  <InputField
                    id="datasEvento"
                    label="Data(s) do evento"
                    value={form.datasEvento}
                    onChange={handleChange}
                    placeholder="Ex.: 10/04/2026 ou 10 a 12/04/2026"
                    invalid={isInvalidField("datasEvento")}
                    required
                  />

                  <InputField
                    id="publicoEstimado"
                    label="Público estimado"
                    value={form.publicoEstimado}
                    onChange={handleChange}
                    placeholder="Ex.: 1500"
                    invalid={isInvalidField("publicoEstimado")}
                    required
                  />

                  <InputField
                    id="horarioInicio"
                    label="Horário de início"
                    value={form.horarioInicio}
                    onChange={handleChange}
                    placeholder="Ex.: 18:00"
                    invalid={isInvalidField("horarioInicio")}
                    required
                  />

                  <InputField
                    id="horarioTermino"
                    label="Horário de término"
                    value={form.horarioTermino}
                    onChange={handleChange}
                    placeholder="Ex.: 23:59"
                    invalid={isInvalidField("horarioTermino")}
                    required
                  />

                  <SelectField
                    id="porteEvento"
                    label="Porte do evento"
                    value={form.porteEvento}
                    onChange={handleSelectChange}
                    invalid={isInvalidField("porteEvento")}
                    required={requiresPorteEvento}
                  >
                    <option value="">Selecione</option>
                    <option value="Pequeno">Pequeno</option>
                    <option value="Médio">Médio</option>
                    <option value="Grande">Grande</option>
                  </SelectField>

                  <SelectField
                    id="interdicaoVia"
                    label="Interdição de via pública"
                    value={form.interdicaoVia}
                    onChange={handleSelectChange}
                    invalid={isInvalidField("interdicaoVia")}
                    required={requiresPorteEvento}
                  >
                    <option value="">Selecione</option>
                    <option value="Sim">Sim</option>
                    <option value="Não">Não</option>
                  </SelectField>

                  <SelectField
                    id="estruturaMontada"
                    label="Estrutura montada"
                    value={form.estruturaMontada}
                    onChange={handleSelectChange}
                    invalid={isInvalidField("estruturaMontada")}
                    required={requiresPorteEvento}
                  >
                    <option value="">Selecione</option>
                    <option value="Sim">Sim</option>
                    <option value="Não">Não</option>
                  </SelectField>

                  {exibirEnquadramentoDispensa && (
                    <SelectField
                      id="enquadramentoDispensa"
                      label="Enquadramento da dispensa"
                      value={form.enquadramentoDispensa}
                      onChange={handleSelectChange}
                      invalid={isInvalidField("enquadramentoDispensa")}
                      required
                    >
                      <option value="">Selecione</option>
                      <option value="estabelecimento_licenciado">
                        Evento realizado em estabelecimento licenciado
                      </option>
                      <option value="administracao_publica">
                        Evento promovido por iniciativa da Administração Pública
                      </option>
                    </SelectField>
                  )}
                </div>
              </SectionCard>

              <SectionCard title="3. DESCRIÇÃO, LOGÍSTICA E ESTRUTURA">
                <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <TextAreaField
                      id="descricaoEvento"
                      label="Descrição do evento"
                      value={form.descricaoEvento}
                      onChange={handleChange}
                      placeholder="Explique o objetivo, a dinâmica e a programação do evento"
                      rows={6}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <TextAreaField
                      id="produtosServicos"
                      label="Produtos ofertados e serviços realizados"
                      value={form.produtosServicos}
                      onChange={handleChange}
                      placeholder="Ex.: venda de bebidas, praça de alimentação, área kids, apresentações musicais"
                      rows={4}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <TextAreaField
                      id="estacionamento"
                      label="Estacionamento e logística de circulação"
                      value={form.estacionamento}
                      onChange={handleChange}
                      placeholder="Explique como será o acesso, a trafegabilidade e a capacidade de estacionamento"
                      rows={4}
                    />
                  </div>

                  {(form.tipoProcesso === "interdicao_via_carnaval" ||
                    form.interdicaoVia === "Sim") && (
                    <div className="md:col-span-2">
                      <TextAreaField
                        id="trajetoEvento"
                        label="Trajeto / circuito / trecho da interdição"
                        value={form.trajetoEvento}
                        onChange={handleChange}
                        placeholder="Descreva o circuito, trajeto ou trecho da via pública afetado"
                        invalid={isInvalidField("trajetoEvento")}
                        required={requiresTrajeto}
                        rows={4}
                      />
                    </div>
                  )}
                </div>
              </SectionCard>

              {exibirComercializacao && (
                <SectionCard title="4. COMERCIALIZAÇÃO - INGRESSOS / ABADÁS / KITS / SIMILARES">
                  <div className="space-y-4 p-4">
                    {form.ingressos.map((item, index) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-sm font-bold text-[#1e3a5f]">
                            Item {index + 1}
                          </p>
                          {form.ingressos.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeIngresso(item.id)}
                              className="text-sm font-semibold text-red-600 transition hover:opacity-80"
                            >
                              Remover
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                          <InputField
                            id={`ingresso-tipo-${item.id}`}
                            label="Tipo"
                            value={item.tipo}
                            onChange={(e) =>
                              handleIngressoChange(
                                item.id,
                                "tipo",
                                e.target.value,
                              )
                            }
                            placeholder="Ex.: inteira"
                            invalid={isInvalidField(`ingresso-tipo-${item.id}`)}
                          />

                          <InputField
                            id={`ingresso-numeracao-${item.id}`}
                            label="Numeração"
                            value={item.numeracao}
                            onChange={(e) =>
                              handleIngressoChange(
                                item.id,
                                "numeracao",
                                e.target.value,
                              )
                            }
                            placeholder="Faixa ou sequência"
                          />

                          <InputField
                            id={`ingresso-nota-${item.id}`}
                            label="Nota fiscal"
                            value={item.notaFiscal}
                            onChange={(e) =>
                              handleIngressoChange(
                                item.id,
                                "notaFiscal",
                                e.target.value,
                              )
                            }
                            placeholder="NF de confecção"
                          />

                          <InputField
                            id={`ingresso-quantidade-${item.id}`}
                            label="Quantidade"
                            value={item.quantidade}
                            onChange={(e) =>
                              handleIngressoChange(
                                item.id,
                                "quantidade",
                                e.target.value,
                              )
                            }
                            placeholder="0"
                            invalid={isInvalidField(
                              `ingresso-quantidade-${item.id}`,
                            )}
                          />

                          <InputField
                            id={`ingresso-valor-${item.id}`}
                            label="Valor unitário (R$)"
                            value={item.valorUnitario}
                            onChange={(e) =>
                              handleIngressoChange(
                                item.id,
                                "valorUnitario",
                                e.target.value,
                              )
                            }
                            placeholder="0,00"
                            invalid={isInvalidField(
                              `ingresso-valor-${item.id}`,
                            )}
                          />
                        </div>
                      </div>
                    ))}

                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <button
                        type="button"
                        onClick={addIngresso}
                        className="rounded-full border border-[#1e3a5f] px-5 py-2 text-sm font-bold text-[#1e3a5f] transition hover:bg-[#1e3a5f] hover:text-white"
                      >
                        Adicionar item de comercialização
                      </button>

                      <p className="text-sm font-semibold text-gray-700">
                        Total estimado:{" "}
                        <span className="text-[#1e3a5f]">
                          {formatCurrencyBR(String(totalIngressos))}
                        </span>
                      </p>
                    </div>
                  </div>
                </SectionCard>
              )}

              {exibirComercializacao && (
                <SectionCard title="5. PONTOS DE VENDA">
                  <div className="space-y-4 p-4">
                    {form.pontosVenda.map((item, index) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-sm font-bold text-[#1e3a5f]">
                            Ponto {index + 1}
                          </p>
                          {form.pontosVenda.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removePontoVenda(item.id)}
                              className="text-sm font-semibold text-red-600 transition hover:opacity-80"
                            >
                              Remover
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                          <InputField
                            id={`ponto-responsavel-${item.id}`}
                            label="Responsável"
                            value={item.responsavel}
                            onChange={(e) =>
                              handlePontoVendaChange(
                                item.id,
                                "responsavel",
                                e.target.value,
                              )
                            }
                            placeholder="Nome do responsável"
                          />

                          <InputField
                            id={`ponto-endereco-${item.id}`}
                            label="Endereço"
                            value={item.endereco}
                            onChange={(e) =>
                              handlePontoVendaChange(
                                item.id,
                                "endereco",
                                e.target.value,
                              )
                            }
                            placeholder="Endereço do ponto"
                          />

                          <InputField
                            id={`ponto-telefone-${item.id}`}
                            label="Telefone"
                            value={item.telefone}
                            onChange={(e) =>
                              handlePontoVendaChange(
                                item.id,
                                "telefone",
                                e.target.value,
                              )
                            }
                            placeholder="(00) 00000-0000"
                          />
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addPontoVenda}
                      className="rounded-full border border-[#1e3a5f] px-5 py-2 text-sm font-bold text-[#1e3a5f] transition hover:bg-[#1e3a5f] hover:text-white"
                    >
                      Adicionar ponto de venda
                    </button>
                  </div>
                </SectionCard>
              )}

              <SectionCard title="6. IDENTIFICAÇÃO DO RESPONSÁVEL LEGAL">
                <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
                  <InputField
                    id="responsavelNome"
                    label="Nome do responsável"
                    value={form.responsavelNome}
                    onChange={handleChange}
                    placeholder="Nome completo do responsável pelo evento"
                    invalid={isInvalidField("responsavelNome")}
                    required
                    className="md:col-span-2"
                  />

                  <InputField
                    id="responsavelCpf"
                    label="CPF"
                    value={form.responsavelCpf}
                    onChange={handleChange}
                    placeholder="000.000.000-00"
                    invalid={isInvalidField("responsavelCpf")}
                    required
                  />

                  <InputField
                    id="responsavelRg"
                    label="RG"
                    value={form.responsavelRg}
                    onChange={handleChange}
                    placeholder="Documento de identidade"
                    invalid={isInvalidField("responsavelRg")}
                    required={requiresInscricaoMunRg}
                  />
                </div>
              </SectionCard>
          <SectionCard title="7. DECLARAÇÕES E RESPONSABILIDADES" muted>
            <div className="space-y-4 p-4">
              <CheckField
                id="aceiteDeclaracao"
                label="Declaro que a veracidade das informações prestadas é de minha inteira responsabilidade."
                checked={form.aceiteDeclaracao}
                onChange={handleCheckboxChange}
                invalid={isInvalidField("aceiteDeclaracao")}
                required
              />

              {exibirAceiteLimpeza && (
                <CheckField
                  id="aceiteLimpezaConservacao"
                  label="Declaro que me responsabilizo pela limpeza, conservação do espaço/via/logradouro público e pelo ressarcimento de danos, quando houver."
                  checked={form.aceiteLimpezaConservacao}
                  onChange={handleCheckboxChange}
                  invalid={isInvalidField("aceiteLimpezaConservacao")}
                  required
                />
              )}
            </div>
          </SectionCard>

          <SectionCard title="ASSINATURA" muted>
            <div className="p-4">
              <p className="mb-4 text-sm text-gray-700">
                Responsável pelo evento.
              </p>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <InputField
                  id="responsavelCpf"
                  label="CPF do responsável"
                  value={form.responsavelCpf}
                  onChange={handleChange}
                  placeholder="000.000.000-00"
                  invalid={isInvalidField("responsavelCpf")}
                  required
                />

                <InputField
                  id="responsavelNome"
                  label="Nome do responsável"
                  value={form.responsavelNome}
                  onChange={handleChange}
                  placeholder="Nome completo"
                  invalid={isInvalidField("responsavelNome")}
                  required
                />
              </div>

              <p className="mt-6 text-right text-sm text-gray-700">
                {dataExtenso}
              </p>
            </div>
          </SectionCard>

          <div className="mb-4 space-y-1 text-center text-xs text-gray-500">
            <p>Documento gerado eletronicamente em {currentDate}</p>
          </div>

          <div className="mb-6 rounded-md border border-[#1e3a5f]/20 bg-[#f5f9ff] p-4 text-sm leading-6 text-gray-700">
            <p className="mb-1 font-bold text-[#1e3a5f]">
              Importante: envio ao plantão de eventos
            </p>
            <p>
              Após gerar o PDF, envie-o em anexo,{" "}
              <strong>
                junto com toda a documentação necessária listada acima
              </strong>
              , para o e-mail:
            </p>
            <p className="mt-2 break-all font-semibold text-[#1e3a5f]">
              {EMAIL_DESTINO}
            </p>
          </div>

          <div className="pb-4 text-center">
            <button
              type="button"
              onClick={generatePdf}
              className="rounded-full bg-[#70B643] px-8 py-3 font-bold text-white shadow-lg transition duration-300 ease-in-out hover:scale-[1.02] hover:bg-[#5ea637] focus:outline-none focus:ring-2 focus:ring-[#70B643]/50"
            >
              Gerar e Imprimir PDF
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
