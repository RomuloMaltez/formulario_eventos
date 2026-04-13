# 📄 Formulário de Eventos Unificado

Um sistema web desenvolvido para simplificar e unificar as burocracias na organização de eventos. A aplicação centraliza a coleta de dados e automatiza a geração de documentos legais (em PDF) necessários para dar entrada em secretarias municipais (SEMTRAN, SEMUR, SEMUSA, etc.).

## 🎯 Objetivo do Projeto

O objetivo é proporcionar uma interface amigável onde o produtor de eventos ou responsável legal preenche os dados do evento apenas uma vez e seleciona qual tipo de processo deseja gerar. O sistema cuida de formatar os dados, listar os documentos obrigatórios em anexo e exportar o requerimento preenchido pronto para impressão e assinatura.

## ✨ Principais Funcionalidades

- **Múltiplos Tipos de Processos:** 
  - Requerimento para Autorização de Evento
  - Comunicado de Evento
  - Termo de Responsabilidade e Compromisso
  - Interdição de Via Pública / Carnaval
  - Cadastro de Licença de Localização e Funcionamento
- **Geração Automática de PDFs:** Integração nativa com `jsPDF` para processar os dados do formulário e gerar os ofícios formatados na hora.
- **Validação Inteligente:** Máscaras de input dinâmicas para CNPJ, CPF, CEP e Telefones.
- **Lista de Documentação Exigida:** O sistema entende as necessidades do evento (ex: porte, estrutura montada, interdição de via) e lista dinamicamente exatamente quais documentos deverão ser anexados ao processo.

## 🛠️ Tecnologias Utilizadas

- **[Next.js](https://nextjs.org/)** (App Router)
- **[React](https://react.dev/)**
- **[TypeScript](https://www.typescriptlang.org/)**
- **[Tailwind CSS v4](https://tailwindcss.com/)** para estilização
- **[jsPDF](https://github.com/parallax/jsPDF)** para geração de documentos do lado do cliente
- **[Lucide React](https://lucide.dev/)** para ícones otimizados

## 🚀 Como Executar o Projeto

Para visualizar a aplicação em seu ambiente local, siga os passos:

1. Instale as dependências:
```bash
npm install
# ou
yarn install
# ou
pnpm install
```

2. Inicie o servidor de desenvolvimento:
```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
```

3. Abra [http://localhost:3000](http://localhost:3000) no seu navegador para ver o resultado.
