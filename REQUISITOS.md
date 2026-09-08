# Insulin Tracker — Documento de Requisitos

> Documento de contexto do projeto. É a fonte única de verdade sobre **o que** o sistema faz e **por quê**.
> Decisões de implementação detalhadas (nomes de componentes, estrutura de pastas) não pertencem aqui.

| Campo | Valor |
| --- | --- |
| Projeto | Insulin Tracker (nome provisório — ver [Pendências](#12-pendências-e-questões-em-aberto)) |
| Versão do documento | 1.2 |
| Data | 2026-09-08 |
| Origem | Entrevista de levantamento de requisitos com o solicitante (2 rodadas) |
| Status | Requisitos aprovados para MVP; desenvolvimento não iniciado |

---

## 1. Visão geral

Aplicação web pessoal para **registrar e acompanhar medições diárias de glicemia**, complementadas por
pressão arterial, peso e anexos de exames laboratoriais.

O usuário final é o **pai do solicitante**, diagnosticado com diabetes há aproximadamente 2 anos, em
tratamento com **medicação oral diária** (não usa insulina). Hoje ele **não faz nenhum registro** das
medições — o histórico se perde entre uma consulta e outra.

**Problema central:** ausência de histórico. Sem registro, não há como perceber tendências nem levar
informação estruturada para as consultas médicas.

**Proposta de valor:**
1. Registrar a medição diária em poucos segundos, sem fricção.
2. Transformar registros isolados em tendência visível (semana, mês, trimestre).
3. Produzir um relatório em PDF pronto para a consulta médica.

**Critério de sucesso:** o usuário registra a medição matinal na maioria dos dias por conta própria e
leva um relatório do período para a próxima consulta.

---

## 2. Personas e papéis

### 2.1 Persona principal — "O Paciente"

| Atributo | Valor |
| --- | --- |
| Idade | 40+ anos |
| Familiaridade com tecnologia | Moderada — usa smartphone e notebook, mas não explora interfaces complexas |
| Condição | Diabetes (tipo não confirmado — ver [Pendências](#12-pendências-e-questões-em-aberto)) |
| Tempo de diagnóstico | ~2 anos |
| Tratamento | Medicação oral diária |
| Aparelho de medição | Glicosímetro de ponta de dedo (sem sensor contínuo) |
| Rotina de medição | 1 medição por dia, pela manhã, **em jejum** |
| Limitações | Nenhuma limitação visual ou motora; prefere fonte ligeiramente maior |
| Dispositivos | Notebook e celular, via navegador |

**Implicações de design:** o caminho para registrar uma medição precisa ser o elemento mais visível e
mais curto do sistema. Nada essencial pode depender de descoberta ou de menus aninhados.

### 2.2 Persona secundária — "O Acompanhante"

O solicitante (filho). Desenvolve e mantém a aplicação. Quer **poder consultar os dados quando
necessário**, mas não é usuário ativo: não registra medições no dia a dia e não recebe alertas.

### 2.3 Modelo de papéis

| Papel | Permissões |
| --- | --- |
| `paciente` | Leitura e escrita de todos os próprios dados; configura preferências e faixas-alvo |
| `acompanhante` | **Somente leitura** dos dados do paciente vinculado; gera relatórios |

Os dois papéis enxergam **o mesmo conjunto de dados** (os do paciente). Não existem conjuntos de dados
separados por usuário.

---

## 3. Escopo

### 3.1 Dentro do escopo (MVP)

- Autenticação por e-mail e senha, com sessão persistente.
- Registro, edição e exclusão de medições de glicemia.
- Registro de pressão arterial e peso.
- Dashboard com indicadores e atalho de registro.
- Histórico navegável e filtrável.
- Gráficos de tendência por período (7 dias, 30 dias, 90 dias, 12 meses).
- Alerta visual para valores fora da faixa configurada.
- Faixas-alvo e limites de alerta configuráveis.
- Seção "Exames laboratoriais" para anexar arquivos.
- Exportação de relatório em PDF por período.
- Alternância entre tema claro e escuro.
- Layout responsivo (celular, tablet, notebook).

### 3.2 Fora do escopo (MVP)

| Item | Motivo / destino |
| --- | --- |
| Contagem de carboidratos e registro de refeições | Não necessário agora; reavaliar no longo prazo |
| Lembretes e notificações | Prioridade baixa declarada → Fase 2 |
| Funcionamento offline com sincronização | Desejável, não essencial → Fase 2 |
| Instalação como PWA (ícone na tela inicial) | "Neste primeiro momento, acessível via navegador" → Fase 2 |
| Registro de doses de insulina | Paciente não usa insulina |
| Extração de valores de dentro dos PDFs de exame | Anexos são apenas arquivos, sem digitação de valores |
| Importação de histórico antigo | Confirmado: começar do zero |
| Integração com glicosímetro ou sensor contínuo | Aparelho não possui conectividade |
| Múltiplos pacientes / uso por terceiros | Sistema é de uso familiar, 2 contas |
| Tela de aviso legal / disclaimer médico | Dispensada explicitamente pelo solicitante |

---

## 4. Glossário

| Termo | Definição |
| --- | --- |
| **Glicemia** | Concentração de glicose no sangue, medida em **mg/dL** (padrão brasileiro) |
| **Jejum** | Medição feita ao acordar, antes da primeira refeição. Contexto padrão deste app |
| **Faixa-alvo** | Intervalo de glicemia considerado adequado. Configurável. Padrão inicial: **100–150 mg/dL** |
| **Hipoglicemia** | Glicemia abaixo do limite inferior de alerta. Padrão inicial: **< 70 mg/dL** |
| **Hiperglicemia** | Glicemia acima do limite superior de alerta. Padrão inicial: **> 180 mg/dL** |
| **Tempo na faixa** | Percentual de medições de um período que ficaram dentro da faixa-alvo |
| **HbA1c** | Hemoglobina glicada — exame laboratorial periódico. Neste app, apenas anexo |
| **Contexto da medição** | Momento em que a medição foi feita (jejum, pré-refeição, pós-refeição, antes de dormir, aleatória) |

> **Nota sobre faixas:** os valores padrão acima são apenas *defaults de fábrica*. O sistema não
> prescreve valores clínicos — todos são editáveis nas configurações para refletir a orientação médica.

---

## 5. Modelo de domínio

```
usuario (paciente | acompanhante)
   │
   ├── medicao_glicemia   (valor, contexto, data/hora, observação)
   ├── medicao_pressao    (sistólica, diastólica, pulso, data/hora, observação)
   ├── medicao_peso       (peso, data/hora, observação)
   ├── exame_anexo        (arquivo, nome, data do exame)
   └── configuracoes      (faixas-alvo, limites de alerta, tema)
```

### 5.1 Entidades

**`medicao_glicemia`**

| Campo | Tipo | Obrigatório | Observações |
| --- | --- | --- | --- |
| `valor` | inteiro (mg/dL) | sim | Faixa aceita para entrada: 20–600 |
| `contexto` | enum | sim | Padrão: `jejum` |
| `medido_em` | data/hora | sim | Preenchido automaticamente com o agora; editável |
| `observacao` | texto | não | Campo livre e curto |

**`medicao_pressao`**

| Campo | Tipo | Obrigatório | Observações |
| --- | --- | --- | --- |
| `sistolica` | inteiro (mmHg) | sim | Faixa aceita: 60–260 |
| `diastolica` | inteiro (mmHg) | sim | Faixa aceita: 30–160 |
| `pulso` | inteiro (bpm) | não | Faixa aceita: 30–220 |
| `medido_em` | data/hora | sim | Padrão: agora, editável |
| `observacao` | texto | não | |

**`medicao_peso`**

| Campo | Tipo | Obrigatório | Observações |
| --- | --- | --- | --- |
| `peso_kg` | decimal (1 casa) | sim | Faixa aceita: 20,0–300,0 |
| `medido_em` | data/hora | sim | Padrão: agora, editável |
| `observacao` | texto | não | |

**`exame_anexo`**

| Campo | Tipo | Obrigatório | Observações |
| --- | --- | --- | --- |
| `arquivo` | PDF ou imagem | sim | Limite de 10 MB por arquivo |
| `nome` | texto | sim | Padrão: nome do arquivo enviado, editável |
| `data_exame` | data | sim | Padrão: data do envio, editável |

**`configuracoes`** (registro único por paciente)

| Campo | Padrão |
| --- | --- |
| `glicemia_alvo_min` / `glicemia_alvo_max` | 100 / 150 mg/dL |
| `alerta_baixo` / `alerta_alto` | 70 / 180 mg/dL |
| `pressao_alvo_sistolica` / `pressao_alvo_diastolica` | 130 / 80 mmHg |
| `tema` | Segue o sistema operacional |

---

## 6. Requisitos funcionais

Prioridade em MoSCoW: **M** = obrigatório no MVP, **S** = importante, **C** = desejável, **W** = fora do MVP.

### 6.1 Autenticação e contas — `RF-AUT`

| ID | Requisito | Prio |
| --- | --- | --- |
| RF-AUT-01 | Login com e-mail e senha | M |
| RF-AUT-02 | Sessão persistente: o usuário permanece logado entre visitas e ao fechar o navegador, sem precisar autenticar a cada acesso | M |
| RF-AUT-03 | Recuperação de senha por e-mail | M |
| RF-AUT-04 | Logout explícito | M |
| RF-AUT-05 | Contas são **provisionadas manualmente** pelo administrador; não há cadastro público aberto | M |
| RF-AUT-06 | O papel `acompanhante` tem acesso somente leitura, imposto no banco de dados e não apenas na interface | M |

### 6.2 Registro de glicemia — `RF-GLI`

| ID | Requisito | Prio |
| --- | --- | --- |
| RF-GLI-01 | Registrar uma medição informando o valor em mg/dL | M |
| RF-GLI-02 | O contexto vem pré-selecionado como **jejum**, com opção de trocar entre jejum, pré-refeição, pós-refeição, antes de dormir e aleatória | M |
| RF-GLI-03 | Data e hora são preenchidas automaticamente com o momento atual e permanecem editáveis para registro retroativo | M |
| RF-GLI-04 | Campo de observação opcional | M |
| RF-GLI-05 | O registro deve ser concluível em **no máximo 3 interações** a partir do dashboard: abrir → digitar valor → salvar | M |
| RF-GLI-06 | Ao digitar o valor, a interface indica imediatamente sua classificação (baixo / dentro da faixa / alto) por cor e texto, **antes** de salvar | M |
| RF-GLI-07 | Validar a faixa de entrada e pedir confirmação para valores fisiologicamente improváveis, sem bloquear o registro | S |
| RF-GLI-08 | Editar e excluir medições já registradas, com confirmação na exclusão | M |
| RF-GLI-09 | Sinalizar quando já existe medição registrada no mesmo dia e contexto, sem impedir o novo registro | C |

### 6.3 Pressão arterial e peso — `RF-BIO`

| ID | Requisito | Prio |
| --- | --- | --- |
| RF-BIO-01 | Registrar pressão arterial com sistólica, diastólica e pulso opcional, conforme exibido no aparelho | M |
| RF-BIO-02 | Registrar peso em kg | M |
| RF-BIO-03 | Editar e excluir registros de pressão e peso | M |
| RF-BIO-04 | Ambos são de registro esporádico: nada no sistema deve pressupor frequência diária nem cobrar o preenchimento | M |
| RF-BIO-05 | Acompanhar a variação de peso e de pressão em gráfico ao longo do tempo | M |
| RF-BIO-06 | Indicar visualmente pressão acima da faixa-alvo configurada | S |

### 6.4 Dashboard — `RF-DSH`

Tela inicial após o login. Deve responder "como estou?" em uma olhada e oferecer o registro do dia.

| ID | Requisito | Prio |
| --- | --- | --- |
| RF-DSH-01 | Ação primária de **registrar medição** em destaque visual, acima da dobra em qualquer dispositivo | M |
| RF-DSH-02 | Última medição de glicemia: valor, classificação por cor e há quanto tempo foi feita | M |
| RF-DSH-03 | Média de glicemia dos últimos 7 e dos últimos 30 dias | M |
| RF-DSH-04 | Tempo na faixa dos últimos 30 dias, em percentual | M |
| RF-DSH-05 | Minigráfico de tendência dos últimos 30 dias | M |
| RF-DSH-06 | Último peso e última pressão registrados, com a respectiva data | M |
| RF-DSH-07 | Aviso discreto quando não há registro de glicemia há mais de 2 dias | C |
| RF-DSH-08 | Estado inicial (sem dados): orientar o primeiro registro em vez de exibir cartões vazios | M |

### 6.5 Histórico — `RF-HIS`

| ID | Requisito | Prio |
| --- | --- | --- |
| RF-HIS-01 | Listar todas as medições em ordem cronológica decrescente | M |
| RF-HIS-02 | Filtrar por período e por tipo de registro (glicemia, pressão, peso) | M |
| RF-HIS-03 | Cada item mostra valor, classificação por cor, contexto, data/hora e observação | M |
| RF-HIS-04 | Editar ou excluir um registro diretamente da lista | M |
| RF-HIS-05 | Paginação ou carregamento incremental para históricos longos | S |

### 6.6 Gráficos e tendências — `RF-GRA`

| ID | Requisito | Prio |
| --- | --- | --- |
| RF-GRA-01 | Gráfico de linha da glicemia ao longo do tempo | M |
| RF-GRA-02 | Seleção de período: 7 dias, 30 dias, 90 dias (trimestre) e 12 meses | M |
| RF-GRA-03 | Exibir a faixa-alvo como banda sombreada no fundo do gráfico | M |
| RF-GRA-04 | Resumo estatístico do período: média, mínimo, máximo, número de medições e tempo na faixa | M |
| RF-GRA-05 | Em períodos longos, agregar por semana ou mês para manter o gráfico legível | S |
| RF-GRA-06 | Gráficos de peso e de pressão arterial, com a mesma seleção de período | M |
| RF-GRA-07 | Comparar a média do período atual com a do período anterior, indicando a direção da tendência | C |

### 6.7 Exames laboratoriais — `RF-EXA`

Seção de **arquivos**, não de dados estruturados. Nenhum valor de exame é digitado.

| ID | Requisito | Prio |
| --- | --- | --- |
| RF-EXA-01 | Enviar arquivos de exame em PDF ou imagem | S |
| RF-EXA-02 | Cada anexo tem nome editável e data do exame | S |
| RF-EXA-03 | Listar os anexos ordenados pela data do exame, do mais recente para o mais antigo | S |
| RF-EXA-04 | Visualizar e baixar um anexo | S |
| RF-EXA-05 | Excluir um anexo, com confirmação | S |
| RF-EXA-06 | O envio deve ser simples e tolerante: seleção pelo explorador de arquivos ou pela câmera do celular, com feedback claro de progresso e de erro | S |

### 6.8 Relatório em PDF — `RF-REL`

| ID | Requisito | Prio |
| --- | --- | --- |
| RF-REL-01 | Gerar relatório em PDF para um período escolhido, com atalhos para 30, 90 e 180 dias | M |
| RF-REL-02 | Cabeçalho com nome do paciente, período coberto e data de geração | M |
| RF-REL-03 | Resumo de glicemia: média, mínimo, máximo, total de medições e tempo na faixa | M |
| RF-REL-04 | Gráfico de tendência da glicemia no período | M |
| RF-REL-05 | Tabela completa das medições de glicemia do período | M |
| RF-REL-06 | Histórico de pressão arterial e de peso do período | M |
| RF-REL-07 | Lista dos exames laboratoriais anexados no período, com nome e data — como índice de referência, sem os valores | M |
| RF-REL-08 | Formato adequado para impressão em A4 e legível em papel | M |

### 6.9 Configurações — `RF-CFG`

| ID | Requisito | Prio |
| --- | --- | --- |
| RF-CFG-01 | Configurar a faixa-alvo de glicemia (mínimo e máximo) | M |
| RF-CFG-02 | Configurar os limites de alerta de hipo e hiperglicemia | M |
| RF-CFG-03 | Configurar a faixa-alvo de pressão arterial | S |
| RF-CFG-04 | Alternar entre tema claro e escuro, com a preferência persistida | M |
| RF-CFG-05 | Toda faixa configurável exibe seu valor padrão e permite retornar a ele | C |

### 6.10 Alertas — `RF-ALE`

| ID | Requisito | Prio |
| --- | --- | --- |
| RF-ALE-01 | Ao registrar um valor fora dos limites de alerta, exibir aviso visual imediato na tela | M |
| RF-ALE-02 | Os limites que disparam o alerta são os configurados em RF-CFG-02 | M |
| RF-ALE-03 | O alerta **informa e nunca bloqueia** o registro, e não sugere qualquer conduta ou dose | M |
| RF-ALE-04 | Valores fora da faixa aparecem destacados no histórico, nos gráficos e no relatório | M |

---

## 7. Requisitos não funcionais

### 7.1 Usabilidade e acessibilidade — `RNF-USA`

| ID | Requisito |
| --- | --- |
| RNF-USA-01 | Fonte base de **17–18px**, acima do padrão de 16px, conforme preferência do usuário |
| RNF-USA-02 | Contraste mínimo WCAG 2.1 nível AA (4,5:1 para texto) nos dois temas |
| RNF-USA-03 | Alvos de toque de no mínimo 44×44px em telas sensíveis ao toque |
| RNF-USA-04 | Campos numéricos abrem o teclado numérico no celular |
| RNF-USA-05 | Cor nunca é o único indicador de estado — sempre acompanhada de texto ou ícone |
| RNF-USA-06 | Navegação principal plana: nenhuma função essencial a mais de 2 níveis do dashboard |
| RNF-USA-07 | Mensagens de erro em linguagem comum, sem jargão técnico e sem códigos de erro |
| RNF-USA-08 | Toda ação destrutiva exige confirmação |

### 7.2 Responsividade — `RNF-RES`

| ID | Requisito |
| --- | --- |
| RNF-RES-01 | Layout funcional de 320px a 2560px de largura |
| RNF-RES-02 | Abordagem *mobile-first*; o celular é o cenário de uso mais frequente do registro diário |
| RNF-RES-03 | Gráficos e tabelas se adaptam ao espaço disponível; tabelas largas rolam horizontalmente dentro do próprio contêiner, nunca a página inteira |
| RNF-RES-04 | Navegação inferior no celular e lateral ou superior em telas grandes |

### 7.3 Localização — `RNF-LOC`

| ID | Requisito |
| --- | --- |
| RNF-LOC-01 | Idioma único: **português do Brasil**. Sem infraestrutura de tradução |
| RNF-LOC-02 | Unidade de glicemia: **mg/dL** apenas |
| RNF-LOC-03 | Datas em `DD/MM/AAAA` e horas em formato 24h |
| RNF-LOC-04 | Fuso horário `America/Sao_Paulo`; decimais com vírgula |

### 7.4 Desempenho — `RNF-DES`

| ID | Requisito |
| --- | --- |
| RNF-DES-01 | Dashboard interativo em até 2,5s em conexão 4G |
| RNF-DES-02 | Salvar uma medição responde em até 1s percebido, com feedback otimista na interface |
| RNF-DES-03 | Gráficos permanecem fluidos com até 5 anos de registros diários (~1800 pontos) |

### 7.5 Segurança e privacidade — `RNF-SEG`

| ID | Requisito |
| --- | --- |
| RNF-SEG-01 | Dados de saúde: acesso restrito às duas contas autorizadas |
| RNF-SEG-02 | Isolamento imposto no banco via *Row Level Security*, não apenas na interface |
| RNF-SEG-03 | Arquivos de exame em bucket privado, servidos por URL assinada e temporária |
| RNF-SEG-04 | HTTPS obrigatório em todo o tráfego |
| RNF-SEG-05 | Chaves de serviço nunca embarcadas no front-end; apenas a chave pública anônima |
| RNF-SEG-06 | Alinhamento aos princípios da LGPD: finalidade determinada, dados mínimos necessários e possibilidade de exclusão a pedido |

### 7.6 Confiabilidade — `RNF-CON`

| ID | Requisito |
| --- | --- |
| RNF-CON-01 | Nenhum dado registrado pode ser perdido silenciosamente: falha ao salvar sempre gera erro visível e preserva o que foi digitado |
| RNF-CON-02 | Backup do banco de dados conforme o plano de hospedagem contratado |
| RNF-CON-03 | Exportação dos dados em CSV como saída de emergência e garantia contra aprisionamento |

### 7.7 Custo e manutenção — `RNF-CUS`

| ID | Requisito |
| --- | --- |
| RNF-CUS-01 | Operar integralmente dentro de planos gratuitos |
| RNF-CUS-02 | Stack mantida por uma pessoa só, com tecnologias que o mantenedor já domina |
| RNF-CUS-03 | Sem dependências pagas ou com licença restritiva |

---

## 8. Decisões técnicas

Decisões tomadas com base nas respostas da entrevista. Cada uma registra a alternativa descartada.

### 8.1 Stack

| Camada | Escolha | Justificativa |
| --- | --- | --- |
| Front-end | **React** com Vite e TypeScript | Solicitado explicitamente; o mantenedor consegue dar manutenção |
| Estilo | **Tailwind CSS** | Solicitado explicitamente |
| Back-end e banco | **Supabase** (PostgreSQL, Auth, Storage) | Solicitado; plano gratuito cobre autenticação, banco e arquivos sem servidor próprio |
| Gráficos | Biblioteca React de gráficos (ex.: Recharts) | Responsividade nativa e volume de dados modesto |
| PDF | Geração no cliente | Evita servidor dedicado; mantém o custo zero |
| Hospedagem | **Vercel** | Definido pelo solicitante. Plano gratuito, deploy contínuo a partir do Git, HTTPS e subdomínio inclusos |
| Versionamento | **Git, com repositório no GitHub** | Definido pelo solicitante. Integra diretamente com o deploy automático da Vercel |

> **TypeScript:** não foi solicitado, mas é adotado como decisão técnica. Valores clínicos, unidades e
> faixas se beneficiam de tipos explícitos, e o custo de manutenção é baixo para quem já usa React.

### 8.2 Arquitetura

- **Sem back-end próprio.** O front-end fala direto com o Supabase; a segurança vive nas políticas RLS
  do banco. Elimina servidor a manter e reduz o custo a zero.
- **Um único paciente.** O acompanhante é vinculado ao paciente por uma tabela de ligação. O modelo não
  tenta ser multi-inquilino.
- **Fuso e datas.** Timestamps armazenados em UTC e exibidos em `America/Sao_Paulo`. Agregações diárias
  usam o dia local, não o UTC — caso contrário uma medição da manhã pode cair no dia errado.

### 8.3 Autenticação

E-mail e senha, com sessão persistida no navegador e renovação automática de token (RF-AUT-02). O link
mágico foi descartado a pedido: exigiria abrir o e-mail a cada acesso.

Não há tela de cadastro público. As duas contas são criadas manualmente pelo administrador.

### 8.4 Decisões pendentes de insumo do solicitante

| Tema | Situação |
| --- | --- |
| Domínio (DNS) | Não definido. O app roda no subdomínio `.vercel.app` até que exista um domínio próprio |

### 8.5 Versionamento e fluxo de trabalho

Repositório: `viniciusRadtke/insulin-tracker` no GitHub. Branch padrão: **`main`**.

#### Fluxo de branches

Nada é commitado diretamente na `main`. Todo trabalho segue o ciclo:

```
main ──┬── feature/glucose-reading-form ──→ PR ──→ review ──→ merge ──→ main
       └── fix/timezone-daily-aggregation ──→ PR ──→ review ──→ merge ──→ main
```

1. Criar uma branch a partir da `main` atualizada.
2. Commitar de forma incremental na branch.
3. Abrir um Pull Request com descrição clara.
4. **Revisão obrigatória pelo mantenedor** (solicitante) antes do merge.
5. Merge na `main`, que dispara o deploy de produção na Vercel.

A `main` é protegida por convenção: representa o que está em produção e deve estar sempre estável.

#### Nomenclatura de branches

`<tipo>/<descrição-em-kebab-case>`, em inglês. O tipo corresponde à tag predominante dos commits:

```
feature/glucose-reading-form
fix/timezone-daily-aggregation
refactor/extract-chart-period-selector
docs/requirements-document
chore/setup-supabase-client
```

#### Pull Requests

- **Título:** mesmo formato da mensagem de commit — `[TAG] Short imperative description`.
- **Descrição** em português, cobrindo:
  - **O que muda** — resumo objetivo da alteração.
  - **Por quê** — problema resolvido ou requisito atendido, referenciando o ID (ex.: `RF-GLI-05`).
  - **Como testar** — passos para o revisor validar.
  - **Pendências** — o que ficou de fora e por quê, se aplicável.
- Um PR resolve **um assunto**. PRs que misturam funcionalidade, refatoração e ajuste visual são
  divididos.
- PRs pequenos: quanto menor o diff, mais eficaz a revisão.
- A Vercel gera um *preview deploy* por PR; o link deve ser usado na validação antes do merge.

#### Commits

- **Pequenos e frequentes.** Cada commit representa uma unidade coerente de trabalho e deixa a
  aplicação em estado funcional. Não se acumulam dias de trabalho em um único commit.
- **Idioma:** todas as mensagens de commit em **inglês técnico**, com o verbo no imperativo.
- **Formato:** `[TAG] Short imperative description`

| Tag | Uso |
| --- | --- |
| `[FEATURE]` | Nova funcionalidade voltada ao usuário |
| `[FIX]` | Correção de defeito |
| `[REFACTOR]` | Mudança de estrutura sem alteração de comportamento |
| `[STYLE]` | Ajustes de layout, espaçamento e aparência |
| `[DOCUMENTATION]` | Documentação, README, comentários |
| `[CHORE]` | Dependências, configuração, tarefas de build |
| `[TEST]` | Criação ou ajuste de testes |
| `[PERFORMANCE]` | Otimizações de desempenho |

Exemplos:

```
[FEATURE] Add glucose reading form with target range validation
[FIX] Correct daily aggregation to use local timezone instead of UTC
[DOCUMENTATION] Fix one misspelling on README.md
[CHORE] Configure Supabase client and environment variables
```

Regras da mensagem:

1. Assunto com no máximo 72 caracteres, sem ponto final.
2. Imperativo: `Add`, `Fix`, `Remove`, `Update` — nunca `Added` ou `Adding`.
3. Descrever **o que** mudou e, quando não for evidente, **por quê** — no corpo do commit, separado do
   assunto por uma linha em branco.
4. Sem emojis em mensagens de commit.

---

## 9. Diretrizes de interface

### 9.1 Estrutura de navegação

```
Dashboard  (inicial)
├── Registrar          → glicemia | pressão | peso
├── Histórico          → lista filtrável
├── Gráficos           → glicemia | pressão | peso, por período
├── Exames             → anexos laboratoriais
├── Relatório          → geração de PDF
└── Configurações      → faixas, alertas, tema, conta
```

No celular: barra de navegação inferior com os 4 destinos mais usados (Dashboard, Registrar, Histórico,
Gráficos); os demais ficam em "Mais". Em telas grandes: navegação lateral persistente.

### 9.2 Linguagem visual dos valores

| Estado | Condição | Tratamento |
| --- | --- | --- |
| Baixo | abaixo do `alerta_baixo` | Cor de alerta + rótulo "Baixo" + ícone |
| Abaixo do alvo | entre o `alerta_baixo` e o `glicemia_alvo_min` | Cor de atenção + rótulo "Abaixo do alvo" |
| Na faixa | dentro da faixa-alvo | Cor positiva + rótulo "Na faixa" |
| Acima do alvo | entre o `glicemia_alvo_max` e o `alerta_alto` | Cor de atenção + rótulo "Acima do alvo" |
| Alto | acima do `alerta_alto` | Cor de alerta + rótulo "Alto" + ícone |

Cores devem funcionar nos dois temas e permanecer distinguíveis para as formas comuns de daltonismo —
por isso o rótulo textual é obrigatório em todos os estados (RNF-USA-05).

### 9.3 Princípios

1. **O registro é a função principal.** Tudo o mais é consulta. A hierarquia visual deve refletir isso.
2. **Números grandes, rótulos pequenos.** O valor é o conteúdo; o rótulo é contexto.
3. **Nada de jargão.** "Tempo na faixa", não "TIR". "Média dos últimos 30 dias", não "média móvel".
4. **Informar, nunca prescrever.** O app mostra o que foi medido e classifica em relação à faixa
   configurada pelo próprio usuário. Não recomenda conduta, dose ou mudança de tratamento.
5. **Sobriedade.** É um registro de saúde consultado em consultas médicas, não um produto de
   entretenimento. A interface deve parecer um instrumento discreto e confiável.

### 9.4 Sobriedade visual — restrições obrigatórias

A interface **não pode** exibir os maneirismos visuais típicos de geração automática. Esta é uma
restrição de aceitação, não uma preferência estética: material gerado com essa aparência transmite
descuido e compromete a confiança em um app de saúde.

**Proibido:**

| Elemento | Regra |
| --- | --- |
| Emojis na interface | **Proibidos** — em títulos, botões, rótulos, cartões, estados vazios e mensagens |
| Emojis como ícones | **Proibidos** — usar uma biblioteca de ícones vetoriais consistente (ex.: Lucide), monocromática e alinhada ao texto |
| Gradientes decorativos | Proibidos, especialmente roxo/violeta para índigo e os degradês vibrantes de fundo |
| Texto com preenchimento em gradiente | Proibido |
| Cartões com brilho, `glow` ou sombras coloridas | Proibidos — sombras neutras, sutis e apenas quando indicarem elevação real |
| Fundos com padrões, malhas ou "blobs" | Proibidos |
| Animações de entrada em elementos de conteúdo | Proibidas — transições apenas em resposta a ação do usuário |
| Ícones ou emojis dentro do texto corrido | Proibidos |
| Linguagem promocional ou entusiasmada | Proibida — sem exclamações, sem "Parabéns!", sem elogios ao usuário por registrar medições |

**Diretriz positiva:**

- Paleta neutra e restrita: tons de cinza como base; cor reservada **exclusivamente** para a
  classificação clínica dos valores (§9.2) e para a ação primária.
- Uma única família tipográfica, com hierarquia construída por tamanho e peso, não por cor.
- Espaço em branco generoso no lugar de bordas, caixas e divisores.
- Densidade de informação alta e ornamento baixo: cada elemento na tela precisa carregar dado ou
  habilitar uma ação.
- Textos curtos, diretos e descritivos. "Nenhuma medição registrada" em vez de "Ops! Nada por aqui
  ainda".

> Esta restrição vale para a interface. As mensagens de commit e a documentação seguem a mesma regra
> quanto a emojis.

---

## 10. Roadmap

### Fase 1 — MVP

Todos os requisitos de prioridade **M**. Entrega uma aplicação já completa em si: registrar, consultar,
visualizar tendências e gerar o relatório da consulta.

1. Fundação: projeto, Supabase, esquema do banco, RLS, autenticação
2. Registro e histórico de glicemia
3. Dashboard
4. Pressão arterial e peso
5. Gráficos e configurações
6. Relatório em PDF

### Fase 2 — Pós-MVP

Prioridade **S** e **C**, mais o que foi adiado:

- Exames laboratoriais (anexos) — **primeiro item da fase**
- Lembretes de medição e de medicação
- PWA instalável, com ícone na tela inicial
- Funcionamento offline com sincronização
- Comparação entre períodos e agregações de tendência
- Exportação em CSV

### Fase 3 — A avaliar

Só entram se houver demanda real de uso:

- Registro de refeições e contagem de carboidratos
- Estimativa de HbA1c a partir das medições — **com ressalva:** a estimativa pressupõe medições ao longo
  de todo o dia. Com apenas uma medição matinal em jejum, o número seria enganoso e é melhor não exibi-lo
- Acesso do acompanhante por notificação de valores fora da faixa

---

## 11. Riscos

| Risco | Impacto | Mitigação |
| --- | --- | --- |
| Abandono do registro diário após as primeiras semanas | Alto — sem dados, o app perde a razão de existir | Registro em 3 interações (RF-GLI-05); dashboard que devolve valor imediato; lembretes na Fase 2 |
| Faixas-alvo padrão não correspondem à orientação médica real | Médio — classificação enganosa | Todas as faixas configuráveis (RF-CFG); padrões apresentados como ponto de partida, nunca como recomendação |
| Tipo de diabetes não confirmado | Baixo no MVP | Escopo atual não depende disso; confirmar antes da Fase 3 |
| Perda de dados por falha de rede no momento do registro | Alto — quebra a confiança no app | RNF-CON-01: erro visível e formulário preservado |
| Limites do plano gratuito do Supabase | Baixo | Volume estimado: ~400 registros/ano e poucos MB de anexos, muito abaixo dos limites |
| Projeto pausado por inatividade no plano gratuito do Supabase | Médio | Verificar a política de pausa por inatividade do plano vigente antes do deploy |

---

## 12. Pendências e questões em aberto

| # | Pendência | Responsável | Bloqueia |
| --- | --- | --- | --- |
| P-01 | Confirmar o tipo de diabetes com o paciente ou o médico | Solicitante | Nada no MVP |
| P-02 | Confirmar as faixas-alvo prescritas pelo médico | Solicitante | Nada — configurável |
| P-03 | Definir o domínio (DNS) | Solicitante | Deploy em domínio próprio |
| ~~P-04~~ | ~~Escolher o provedor de hospedagem~~ — resolvida em 2026-09-08: Vercel | — | — |
| P-05 | Definir o nome do produto exibido na interface (hoje: "Insulin Tracker", nome do repositório — impreciso, já que o paciente não usa insulina) | Solicitante | Interface e relatório |
| P-06 | Confirmar se o relatório deve trazer os anexos de exame como índice de nomes e datas (decisão adotada) ou de outra forma | Solicitante | RF-REL-07 |

---

## 13. Histórico de revisões

| Versão | Data | Alterações |
| --- | --- | --- |
| 1.0 | 2026-09-08 | Versão inicial, consolidando as duas rodadas da entrevista de requisitos |
| 1.1 | 2026-09-08 | Vercel e GitHub fechados como decisão (§8.1); convenção de commits e fluxo de versionamento (§8.5); restrições de sobriedade visual (§9.4) |
| 1.2 | 2026-09-08 | Fluxo de branches, nomenclatura e regras de Pull Request com revisão obrigatória (§8.5) |
