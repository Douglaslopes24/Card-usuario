# Presença Viva · Home Assistant

![Prévia do card](previews/preview-mobile.webp)

Integração local e card personalizado com o personagem da sua referência.
O pacote inclui seis ilustrações com fundo transparente: disponível com fones,
disponível sem fones, ausente, não perturbe, indisponível e em trânsito com fones.
O estado Ouvindo música usa a imagem com fones e uma animação diferente.

As faixas superiores e inferiores da imagem original foram removidas.
O nome e o indicador de estado são elementos reais do card. Bateria, passos
e música ficam desativados por padrão e podem ser ativados no editor.

## Instalação manual

1. Extraia este ZIP no computador ou celular.
2. Copie a pasta **`custom_components/presenca_viva`** para a pasta
   **`/config/custom_components/presenca_viva`** no Home Assistant, usando
   File editor, Studio Code Server, Samba ou outro acesso aos arquivos.
   A pasta final precisa conter `manifest.json`, `__init__.py` e `frontend`.
   Copie a pasta inteira, incluindo imagens e traduções.
3. Reinicie o Home Assistant por **Configurações → Sistema → Reiniciar**.
4. Abra **Configurações → Dispositivos e serviços → Adicionar integração**.
   Pesquise **Presença Viva**.
5. Informe o nome do perfil. A seleção de pessoa, atividade, não perturbe,
   música, bateria e passos é opcional. Você pode começar somente com o nome.
6. Atualize a página do painel; no aplicativo, feche e abra a tela do painel.
7. Edite o painel, clique em **Adicionar cartão** e procure **Presença Viva**.
   No editor visual, escolha o sensor **Estado** criado pela integração.

O card é servido assim que a integração é carregada. O módulo é registrado
automaticamente no frontend e também em **Recursos** dos painéis com recursos
em modo armazenamento. Em painéis com recursos em YAML, a lista do usuário
é preservada e o módulo adicional continua disponível no frontend padrão.
Home Assistant **2026.1 ou posterior** é o alvo deste pacote. A validação
automatizada foi executada em **2026.9.4**; a versão mínima não foi testada.

## Instalação pelo HACS

1. Abra **HACS → menu ⋮ → Repositórios personalizados**.
2. Adicione **`https://github.com/Douglaslopes24/Card-usuario`**, categoria
   **Integração**.
3. Procure **Presença Viva** no HACS e baixe.
4. Reinicie o Home Assistant e adicione a integração **Presença Viva** em
   **Configurações → Dispositivos e serviços → Adicionar integração**.
   Baixar pelo HACS instala os arquivos; esta etapa configura o perfil e
   carrega a integração. Crie o perfil com o nome **Maicon**, por exemplo.
5. Atualize o painel e adicione o cartão **Presença Viva**. O JavaScript do
   card vem junto com a integração e é registrado automaticamente, inclusive
   na lista de Recursos dos painéis em modo armazenamento.

Este é um repositório personalizado; a integração não faz parte do catálogo
oficial do HACS. Seu sensor Estado é escolhido no editor visual do card.

## Se o card não aparecer

A mensagem **Custom element doesn't exist: presenca-viva-card** significa que
o navegador ainda não registrou o componente do card. O YAML do cartão não
resolve o carregamento do JavaScript. Siga estas etapas:

1. No HACS, abra **Presença Viva → menu ⋮ → Baixar novamente** e selecione
   **main** se a versão aparecer como opção. A correção está na **1.0.1**.
   Na instalação manual, substitua a pasta inteira da integração pela atual.
2. Reinicie o Home Assistant. Confira se **Presença Viva** já aparece em
   **Configurações → Dispositivos e serviços**. Se ainda não foi configurada,
   use **Adicionar integração → Presença Viva** e crie o perfil.
3. Atualize completamente a página do painel (`Ctrl+F5` no computador) ou
   limpe o cache do frontend no aplicativo Companion e reabra o painel.
4. Se a mensagem continuar, abra **Configurações → Painéis → menu ⋮ → Recursos**.
   Adicione ou edite o recurso do Presença Viva, com:
   - URL: `/presenca_viva/presenca-viva-card.js?v=1.0.1`
   - Tipo: **Módulo JavaScript**
   A tela de Recursos pode exigir o modo avançado no seu perfil.
   Depois atualize a página novamente.

Abra o caminho do recurso no mesmo endereço do seu Home Assistant para
conferir o download. Ele deve mostrar JavaScript. Se retornar **404**, a
integração não está servindo os arquivos: confirme que foi configurada e
verifique seus logs em **Configurações → Sistema → Logs**. Confira também
`/config/custom_components/presenca_viva/manifest.json` e a pasta
`frontend/assets`, que deve conter as seis imagens `.webp`.

Para recursos em YAML, declare em `configuration.yaml`:

```yaml
lovelace:
  resources:
    - url: /presenca_viva/presenca-viva-card.js?v=1.0.1
      type: module
```

Se já existe uma seção `lovelace:`, acrescente o recurso nela, sem duplicar
a seção. Reinicie ou recarregue os recursos YAML e atualize o painel.

O registro do componente tem proteção contra carregamento duplicado.
O recurso manual também é útil em clientes que não carregam módulos extras,
como algumas configurações de Cast; esses clientes não foram testados.

Na versão 1.0.1, o registro em Recursos é criado automaticamente e recursos
antigos com o mesmo caminho local são atualizados para a nova versão.
Outros cartões e os recursos declarados em YAML são preservados.

## Configuração do card

O editor visual atende à configuração normal. Para usar YAML, comece com
`examples/card.yaml` e troque a entidade de exemplo pela sua.
O Home Assistant define os IDs com base no nome e no idioma; pode acrescentar
um sufixo se já existir uma entidade com esse nome.
Você encontra os IDs reais na página do dispositivo criado pela integração.

```yaml
type: custom:presenca-viva-card
entity: sensor.maicon_estado
name: Maicon
height: 500
animations: true
show_controls: true
show_metrics: false
show_music: false
```

| Opção | Padrão | O que faz |
| --- | --- | --- |
| `entity` | Sensor detectado no editor | Sensor Estado da integração |
| `name` | Nome do perfil | Nome mostrado no card |
| `height` | `500` | Altura entre 300 e 900 pixels |
| `animations` | `true` | Animação do personagem e do fundo |
| `headphones` | Configuração da integração | Fones no estado Disponível |
| `background` | `blue` | `blue`, `night` ou `system` |
| `show_controls` | `true` | Botão para escolher o modo |
| `show_metrics` | `false` | Bateria e passos, se vinculados |
| `show_music` | `false` | Título e artista, se o reprodutor estiver tocando |
| `mode_entity` | Detectado no sensor Estado | Seletor Modo da integração |
| `battery_entity` | Configuração da integração | Outra entidade de bateria |
| `steps_entity` | Configuração da integração | Outra entidade de passos |
| `media_player_entity` | Configuração da integração | Outro reprodutor para exibir a música |

Não é necessário repetir as entidades opcionais no card quando já foram
escolhidas na integração. O reprodutor escolhido no card só altera a exibição;
para influenciar o estado Automático, escolha o reprodutor na integração.

## Estados e modo Automático

O seletor **Modo** oferece Automático e seis estados manuais. Um estado manual
permanece fixo até você voltar para Automático, inclusive após reiniciar.
Você pode mudar pelo botão do card, pela entidade Modo ou com a ação
`select.select_option`. Isso muda o perfil no Home Assistant; não ativa o
Não perturbe do Android nem muda configurações do celular.

A prioridade automática é:

1. Pessoa vinculada sem dados (`unknown`, `unavailable` ou entidade ausente):
   **Indisponível**.
2. Não perturbe ativo: **Não perturbe**.
3. Sensor de trânsito/atividade indicando movimento: **Em trânsito**.
4. Pessoa fora da zona Casa: **Ausente**.
5. Reprodutor vinculado em `playing`: **Ouvindo música**.
6. Pessoa na zona Casa: **Disponível**.

Sem pessoa vinculada, o perfil fica Disponível e pode ser controlado
manualmente. Os demais sensores opcionais ainda podem alterar o estado.
Uma falha só na bateria ou nos passos não torna a pessoa Indisponível.

| Entrada | Estados reconhecidos como ativos |
| --- | --- |
| Não perturbe | `on`, `true`, `1`, `enabled`, `active`, `priority_only`, `alarms_only`, `total_silence`, `Não perturbe` |
| Trânsito/atividade | Os booleanos ativos acima, `in_vehicle`, `in vehicle`, `on_bicycle`, `on bicycle`, `walking`, `running`, `automotive`, `cycling`, `Em trânsito`, `in_transit` |
| Música | `playing` |
| Casa | `home` na entidade de pessoa/rastreador |

No app Companion, habilite os sensores que você quer usar e conceda as
permissões correspondentes. Os nomes e a disponibilidade variam por celular.
Para valores de atividade diferentes, crie um sensor de modelo ou um
`input_boolean` e vincule-o na integração.

## Personalização das imagens

As seis imagens estão em `custom_components/presenca_viva/frontend/assets`.
No repositório, o card usa versões WebP para reduzir o tamanho do download.
Você pode usar as ilustrações separadamente em outros cards.
Para indicar outras imagens neste card, use caminhos locais em `images:`:

```yaml
images:
  available: /local/meu_personagem/disponivel.png
  away: /local/meu_personagem/ausente.png
  do_not_disturb: /local/meu_personagem/nao_perturbe.png
  unavailable: /local/meu_personagem/indisponivel.png
  in_transit: /local/meu_personagem/transito.png
  listening: /local/meu_personagem/musica.png
```

Os arquivos de `/local/` correspondem a `/config/www/`.
O editor visual não inclui a substituição avançada de imagens; use YAML.
`headphones: false` só muda a pose Disponível. Em trânsito e Ouvindo música
mantêm os fones, conforme a referência escolhida.

## Animações e funcionamento local

As ilustrações são estáticas. CSS cria balanço, pulsação, deslocamento leve
e transição de opacidade. Não há vídeo nem animação articulada de caminhada.
As animações respeitam a preferência de movimento reduzido do sistema e
pausam quando o card fica fora da tela ou a aba fica oculta.
O card não usa bibliotecas, fontes ou scripts de servidores externos.
A integração reage às mudanças dos sensores sem consultas periódicas.
Somente fontes que você selecionar são acompanhadas.

## Prévia e repositório

`preview.html` demonstra o mesmo componente com sensores simulados.
Abra no navegador de um computador, ou sirva a pasta localmente:

```bash
python3 -m http.server 8124
```

Então acesse `http://localhost:8124/preview.html`.
Nenhum comando da prévia altera o seu Home Assistant.

O código está em [Douglaslopes24/Card-usuario](https://github.com/Douglaslopes24/Card-usuario).
O repositório inclui `hacs.json`, a integração e o card com as imagens.
Use a instalação pelo HACS como repositório personalizado ou a cópia manual.

## Validação

Consulte `VALIDACAO.md` para os resultados da versão entregue.
Os testes de Python usam `pytest-homeassistant-custom-component` e um
ambiente isolado do Home Assistant. O teste do card usa Playwright.
A instalação no seu servidor ainda precisa ser feita por você.

Referências oficiais usadas no desenvolvimento:

- [Cards personalizados](https://developers.home-assistant.io/docs/frontend/custom-ui/custom-card/)
- [Fluxo de configuração](https://developers.home-assistant.io/docs/core/integration/config_flow/)
- [Opções e recarregamento](https://developers.home-assistant.io/docs/core/integration/options_flow/)
- [Arquivos estáticos assíncronos](https://developers.home-assistant.io/blog/2024/06/18/async_register_static_paths/)
- [Sensores](https://developers.home-assistant.io/docs/core/entity/sensor/)
