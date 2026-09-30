# Validação da versão 1.0.0

Executada em 30/09/2026, em ambiente de teste isolado.

Para a publicação, as ilustrações passaram para WebP (640 × 960 pixels),
com as mesmas poses. O código de seleção de estados e a integração mantêm
o comportamento validado abaixo. A troca de formato foi conferida por
validação dos arquivos, dos caminhos e da sintaxe do JavaScript.

## Integração

**30 testes aprovados** com Home Assistant Core **2026.9.4**, frontend
**20260826.7**, Python **3.14.7** e
`pytest-homeassistant-custom-component` **0.13.367**.

Foram conferidos:

- Fluxo de configuração e rejeição de nome vazio.
- Criação das entidades Estado e Modo.
- Mudança por eventos de pessoa, Não perturbe e atividade.
- Prioridade dos estados e tratamento de fontes sem dados.
- Mudança manual pela ação padrão `select.select_option`.
- Volta do modo manual para Automático.
- Recuperação do modo manual ao recarregar a integração.
- Recuperação do modo manual a partir do cache de uma inicialização anterior.
- Alteração de opções com recarregamento e desvinculação de sensores.
- Dois perfis compartilhando o registro de arquivos estáticos.
- Respostas HTTP 200 para o JavaScript e as imagens.
- Registro do módulo adicional no frontend.

## Card

Teste no Chromium Headless **134.0.6998.35** com Playwright **1.51.1**.
Prévia utiliza o componente entregue e entidades simuladas.

Conferidos os seis estados, carregamento das imagens, opção com/sem fones,
troca manual, mensagem de erro de permissão, bateria, passos, título da música,
editor visual, proteção contra registro duplicado, texto literal sem injeção
de HTML, movimento reduzido e desligamento das animações.

Layout conferido em telas de **1080 × 1000** e **360 × 1000** pixels.
Não houve erro JavaScript nem rolagem horizontal na tela de celular.
As capturas de tela mostram a execução do card real na prévia.

## Limites da validação

Não houve conexão com o servidor Home Assistant do usuário, nem instalação
ou publicação no GitHub. A versão mínima anunciada (2026.1) é um alvo de
compatibilidade, não um resultado de teste. Cast, sensores específicos do
celular e outras versões do Home Assistant não foram testados.
Os estados de atividade e Não perturbe precisam corresponder aos valores
listados no README. A animação é feita sobre ilustrações estáticas por CSS.

## Reproduzir

Em um ambiente de desenvolvimento com Python compatível com o Home Assistant:

```bash
python -m venv .venv
.venv/bin/pip install -r requirements-dev.txt
.venv/bin/python -m pytest tests -q
```

Para a conferência visual, instale Playwright e Chromium em um ambiente Node,
então execute `tests/card-browser.cjs` a partir desta pasta.
Use `PLAYWRIGHT_MODULE` quando a instalação estiver fora do projeto.
