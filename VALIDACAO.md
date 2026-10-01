# Validação da versão 1.0.1

## Correção do carregamento do card · 01/10/2026

**35 testes aprovados** com Home Assistant Core **2026.9.4**, Python
**3.14.7** e `pytest-homeassistant-custom-component` **0.13.367**.
Resultado: `35 passed in 1.26s`.

O JavaScript e os arquivos estáticos agora são registrados no carregamento
da integração, antes da criação do perfil. O card também é registrado como
módulo na coleção de Recursos do Lovelace em modo armazenamento. URLs
antigas desse mesmo recurso local são atualizadas para `?v=1.0.1`, preservando
o ID e os demais recursos. A lista de recursos YAML permanece intacta.

Os cinco testes novos conferem:

- Recurso e JavaScript acessíveis por HTTP antes de configurar um perfil.
- Atualização de um recurso manual antigo, sem duplicação nem alteração
  de outro card.
- Vários perfis compartilhando um único recurso.
- Preservação dos recursos YAML com o módulo adicional disponível.
- Perfil e módulo continuando disponíveis se o registro em Recursos falhar.

A sintaxe do JavaScript foi verificada com `node --check`. A lógica e a
aparência do card permanecem iguais; somente a identificação da versão
mudou no JavaScript. O script de teste visual foi atualizado para o caminho
WebP da pose sem fones e o tipo de conteúdo `image/webp`.

Uma nova execução visual não foi concluída nesta revisão: o download do
navegador retornou HTML em vez do arquivo ZIP. Os resultados visuais abaixo
são os da validação anterior, enquanto os 35 testes de integração e a
verificação de sintaxe acima foram executados nesta versão.

Não houve acesso ao servidor Home Assistant do usuário. A captura enviada
mostra o componente ausente no frontend, mas não permite distinguir sozinha
entre integração ainda não configurada, recurso ausente e cache do cliente.
O README contém os passos de instalação e de verificação do recurso.

## Validação anterior · versão 1.0.0

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

Não houve conexão nem instalação no servidor Home Assistant do usuário.
O código foi publicado no GitHub. A versão mínima anunciada (2026.1) é um alvo de
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
