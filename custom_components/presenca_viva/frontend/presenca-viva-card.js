/* Presença Viva 1.0.1 — local, dependency-free Home Assistant card. */
(() => {
  "use strict";
  const LABELS = { available: "Disponível", away: "Ausente", do_not_disturb: "Não perturbe", unavailable: "Indisponível", in_transit: "Em trânsito", listening: "Ouvindo música" };
  const ICONS = { available: "mdi:home-account", away: "mdi:home-export-outline", do_not_disturb: "mdi:minus-circle", unavailable: "mdi:account-off", in_transit: "mdi:walk", listening: "mdi:headphones" };
  const MODES = ["Automático", ...Object.values(LABELS)];
  const DEFAULT_BASE = "/presenca_viva";
  const normal = v => String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const safeURL = value => {
    if (!value) return "";
    try {
      const url = new URL(String(value), location.origin);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch { return ""; }
  };
  function statusKey(raw) {
    if (LABELS[raw]) return raw;
    const key = normal(raw);
    for (const [id, label] of Object.entries(LABELS)) if (normal(label) === key) return id;
    if (key === "home" || key === "on") return "available";
    if (key === "not_home" || key === "off") return "away";
    if (key === "playing") return "listening";
    return "unavailable";
  }
  const CSS = `
    :host{display:block;--pv-accent:#86edc1;--pv-start:#0873b3;--pv-end:#044777;font-family:var(--paper-font-body1_-_font-family,system-ui,sans-serif)}
    *{box-sizing:border-box}[hidden]{display:none!important}
    ha-card{display:block;position:relative;overflow:hidden;border:1px solid rgba(255,255,255,.22);border-radius:var(--ha-card-border-radius,28px);background:#086ca9;color:#fff;box-shadow:var(--ha-card-box-shadow,0 12px 32px #042a4926)}
    .stage{position:relative;height:var(--pv-height,500px);min-height:300px;isolation:isolate;background:radial-gradient(ellipse at 50% 48%,#83e3ef80,transparent 62%),linear-gradient(160deg,var(--pv-start),var(--pv-end));transition:background-color .7s ease}
    .stage[data-status=away]{--pv-accent:#ffe292;--pv-start:#248bbb;--pv-end:#234b79}
    .stage[data-status=do_not_disturb]{--pv-accent:#ffc0ce;--pv-start:#4766a4;--pv-end:#512c63}
    .stage[data-status=unavailable]{--pv-accent:#dce4ed;--pv-start:#547186;--pv-end:#263b52}
    .stage[data-status=in_transit]{--pv-accent:#99e9ff;--pv-start:#087db2;--pv-end:#135672}
    .stage[data-status=listening]{--pv-accent:#e3c6ff;--pv-start:#245fa5;--pv-end:#393477}
    .stage[data-background=night]{--pv-start:#122947;--pv-end:#0b1930}
    .stage[data-background=system]{--pv-start:var(--primary-color,#0873b3);--pv-end:var(--secondary-background-color,#044777)}
    .glow{position:absolute;inset:17% 12% 10%;border-radius:50%;background:radial-gradient(ellipse,#c9f5ff36,transparent 66%);animation:pv-glow 6s ease-in-out infinite;pointer-events:none}
    .stars{position:absolute;inset:0;opacity:.6;pointer-events:none}
    .star{position:absolute;width:3px;height:3px;border-radius:50%;background:#e0faff;box-shadow:0 0 8px #e0faff;animation:pv-star 4s ease-in-out infinite}
    .star:nth-child(3n){width:8px;height:8px;clip-path:polygon(50% 0,60% 40%,100% 50%,60% 60%,50% 100%,40% 60%,0 50%,40% 40%);box-shadow:none}
    .ground{position:absolute;height:17%;bottom:0;left:-8%;right:-8%;background:linear-gradient(180deg,#dbe9f12b,#7e9dad56);transform:skewY(-5deg);transform-origin:left top;border-top:1px solid #ffffff28;pointer-events:none}
    .shadow{position:absolute;width:45%;height:4%;bottom:8%;left:27.5%;border-radius:50%;background:#08243e50;filter:blur(5px);pointer-events:none}
    .figure{position:absolute;inset:70px 5% 36px;transform-origin:50% 91%;animation:pv-idle 5s ease-in-out infinite;pointer-events:none}
    .character{position:absolute;width:100%;height:100%;object-fit:contain;object-position:center bottom;opacity:0;transition:opacity .45s ease;filter:drop-shadow(0 5px 3px #09284924)}
    .character.visible{opacity:1}
    .stage[data-status=listening] .figure{animation:pv-music .85s ease-in-out infinite}
    .stage[data-status=in_transit] .figure{animation:pv-transit 1.8s ease-in-out infinite}
    .stage[data-status=away] .figure{animation:pv-idle 6s ease-in-out infinite}
    .stage[data-status=unavailable] .figure{filter:saturate(.7);animation:none}
    .stage[data-status=do_not_disturb] .glow{background:radial-gradient(ellipse,#f7a2c84d,transparent 66%)}
    .identity{position:absolute;top:20px;left:20px;right:65px;z-index:3}
    .name{display:block;margin:0 0 7px;padding:0;border:0;background:none;color:#fff;text-align:left;font-family:inherit;font-weight:700;font-size:22px;line-height:1.15;letter-spacing:-.5px;max-width:100%;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;text-shadow:0 2px 6px #04335640;cursor:pointer}
    .status{display:inline-flex;align-items:center;gap:7px;max-width:100%;font-size:12px;font-weight:650;color:#12324c;background:#f5fbffff;border:1px solid #ffffffb3;padding:7px 11px;border-radius:30px;box-shadow:0 3px 12px #062c4220;cursor:pointer}
    .dot{width:7px;height:7px;flex:none;border-radius:50%;background:var(--pv-accent);box-shadow:0 0 0 2px #153f5520}
    .status-label{overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
    ha-icon{--mdc-icon-size:18px;display:inline-flex}
    .mode-tag{margin-left:3px;font-size:9px;letter-spacing:.5px;color:#46637c}
    .control{position:absolute;z-index:3;right:16px;top:20px;width:36px;height:36px;border-radius:50%;border:1px solid #ffffff66;background:#15486a5e;color:#fff;display:grid;place-items:center;cursor:pointer}
    button:focus-visible{outline:3px solid #fff;outline-offset:3px}
    .metrics{position:absolute;bottom:15px;left:16px;right:16px;display:flex;gap:8px;z-index:3;flex-wrap:wrap}
    .metric{display:flex;align-items:center;gap:5px;font-size:12px;font-weight:600;background:#173d607d;border:1px solid #ffffff33;border-radius:16px;padding:6px 9px;max-width:100%}
    .music{position:absolute;left:18px;right:18px;bottom:54px;z-index:3;display:flex;align-items:center;gap:8px;font-size:12px}
    .song{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 6px #123a64;min-width:0}
    .equalizer{display:flex;align-items:center;gap:3px;height:18px}
    .equalizer i{display:block;width:3px;height:10px;border-radius:2px;background:var(--pv-accent);animation:pv-eq .9s ease-in-out infinite}
    .equalizer i:nth-child(2){animation-delay:-.35s}.equalizer i:nth-child(3){animation-delay:-.6s}.equalizer i:nth-child(4){animation-delay:-.15s}
    .notice{position:absolute;left:16px;right:16px;bottom:16px;z-index:5;background:#103554e6;border:1px solid #ffffff50;border-radius:14px;padding:10px 12px;font-size:12px;line-height:1.4}
    .sheet{position:absolute;inset:0;z-index:6;background:#09243ced;backdrop-filter:blur(12px);padding:22px;display:flex;flex-direction:column;justify-content:center;gap:15px}
    .sheet h3{margin:0;font-size:22px;letter-spacing:-.5px}.sheet p{margin:0;color:#c2d9ec;font-size:13px;line-height:1.5}
    .choices{display:grid;grid-template-columns:1fr 1fr;gap:9px}
    .choice{min-height:46px;border:1px solid #ffffff33;border-radius:13px;padding:9px 10px;color:#fff;background:#ffffff0d;font-family:inherit;font-weight:600;font-size:12px;line-height:1.3;cursor:pointer}
    .choice:first-child{grid-column:1/-1}.choice.selected{background:#fff;color:#183450;border-color:#fff}
    .close{border:0;border-radius:13px;padding:12px;color:#e2eff9;background:#ffffff1c;font-family:inherit;font-weight:600;font-size:13px;cursor:pointer}
    .stage.paused *{animation-play-state:paused!important}
    .stage.no-motion *{animation:none!important;transition:none!important}
    @keyframes pv-idle{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
    @keyframes pv-music{0%,100%{transform:rotate(-.8deg) translateY(0)}50%{transform:rotate(.8deg) translateY(-2px)}}
    @keyframes pv-transit{0%,100%{transform:translateX(-4px) translateY(0)}50%{transform:translateX(4px) translateY(-3px)}}
    @keyframes pv-glow{0%,100%{opacity:.6;transform:scale(1)}50%{opacity:1;transform:scale(1.08)}}
    @keyframes pv-star{0%,100%{opacity:.25;transform:scale(.85)}50%{opacity:.9;transform:scale(1.15)}}
    @keyframes pv-eq{0%,100%{transform:scaleY(.45)}50%{transform:scaleY(1.5)}}
    @media(prefers-reduced-motion:reduce){.stage *{animation:none!important;transition:none!important}}
  `;

  class PresencaVivaCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.shadowRoot.innerHTML = `<style>${CSS}</style><ha-card><div class="stage"><div class="glow"></div><div class="stars" aria-hidden="true"></div><div class="ground"></div><div class="shadow"></div><div class="figure"><img class="character" alt="" decoding="async"><img class="character" alt="" decoding="async"></div><div class="identity"><button class="name" type="button"></button><button class="status" type="button"><span class="dot"></span><span class="status-label" aria-live="polite"></span><span class="mode-tag"></span></button></div><button class="control" type="button" aria-label="Alterar estado" title="Alterar estado"><ha-icon icon="mdi:tune-variant"></ha-icon></button><div class="metrics" hidden></div><div class="music" hidden><span class="equalizer" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="song"></span></div><div class="notice" role="status" hidden></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Alterar estado" hidden><h3>Como você está?</h3><p>Automático acompanha os sensores. Os outros modos fixam o estado escolhido.</p><div class="choices"></div><p class="service-error" role="alert" hidden></p><button class="close" type="button">Voltar ao card</button></div></div></ha-card>`;
      this.$ = selector => this.shadowRoot.querySelector(selector);
      this._activeImage = 0;
      this._imageGeneration = 0;
      for (let i = 0; i < 15; i++) {
        const star = document.createElement("i"); star.className = "star";
        star.style.cssText = `left:${8 + (i * 31) % 84}%;top:${14 + (i * 17) % 64}%;animation-delay:-${i * .43}s`;
        this.$(".stars").append(star);
      }
      this.$(".control").addEventListener("click", () => this._openModes());
      this.$(".close").addEventListener("click", () => this._closeModes());
      this.$(".name").addEventListener("click", () => this._moreInfo());
      this.$(".status").addEventListener("click", () => this._moreInfo());
      this.$(".sheet").addEventListener("keydown", event => {
        if (event.key === "Escape") this._closeModes();
        if (event.key === "Tab") {
          const nodes = [...this.$(".sheet").querySelectorAll("button:not(:disabled)")];
          if (event.shiftKey && this.shadowRoot.activeElement === nodes[0]) { event.preventDefault(); nodes.at(-1).focus(); }
          else if (!event.shiftKey && this.shadowRoot.activeElement === nodes.at(-1)) { event.preventDefault(); nodes[0].focus(); }
        }
      });
      this._visibilityChanged = () => this._pause();
    }
    static getConfigElement() { return document.createElement("presenca-viva-card-editor"); }
    static getStubConfig(hass) {
      const entity = Object.values(hass?.states || {}).find(s => s.entity_id.startsWith("sensor.") && s.attributes?.presenca_viva);
      return { entity: entity?.entity_id || "", name: entity?.attributes?.name || "Maicon", height: 500, animations: true, show_controls: true, show_metrics: false, show_music: false };
    }
    getCardSize() { return Math.ceil((this._config?.height || 500) / 50); }
    getGridOptions() { return { columns: 12, min_columns: 6, rows: "auto" }; }
    setConfig(config) {
      if (!config || typeof config !== "object") throw new Error("Configuração inválida");
      this._config = { height: 500, animations: true, show_controls: true, show_metrics: false, show_music: false, background: "blue", ...config };
      this._signature = null;
      this._render();
    }
    set hass(hass) { this._hass = hass; this._render(); }
    get hass() { return this._hass; }
    connectedCallback() {
      document.addEventListener("visibilitychange", this._visibilityChanged);
      if (!this._observer) this._observer = new IntersectionObserver(entries => { this._inView = entries[0].isIntersecting; this._pause(); });
      this._observer.observe(this);
      this._pause(); this._render();
    }
    disconnectedCallback() { this._observer?.disconnect(); document.removeEventListener("visibilitychange", this._visibilityChanged); }
    _pause() { this.$(".stage").classList.toggle("paused", document.hidden || this._inView === false); }
    _render() {
      if (!this._config) return;
      const c = this._config;
      const entity = this._hass?.states?.[c.entity];
      const a = entity?.attributes || {};
      const state = c.status ? statusKey(c.status) : entity ? statusKey(entity.state) : c.entity ? "unavailable" : "available";
      this._modeEntity = c.mode_entity || a.mode_entity;
      const mode = this._hass?.states?.[this._modeEntity]?.state || a.mode || "Automático";
      const media = this._hass?.states?.[c.media_player_entity || a.media_player_entity];
      const battery = this._hass?.states?.[c.battery_entity || a.battery_entity];
      const steps = this._hass?.states?.[c.steps_entity || a.steps_entity];
      const signature = JSON.stringify([c, entity?.state, a, mode, media?.state, media?.attributes?.media_title, media?.attributes?.media_artist, battery?.state, steps?.state]);
      if (signature === this._signature) return;
      this._signature = signature;
      const stage = this.$(".stage");
      stage.dataset.status = state; stage.dataset.background = c.background;
      stage.classList.toggle("no-motion", c.animations === false);
      stage.style.setProperty("--pv-height", `${Math.max(300, Math.min(900, Number(c.height) || 500))}px`);
      const name = c.name || a.name || a.friendly_name?.replace(/\s+Estado$/, "") || "Maicon";
      this.$(".name").textContent = name;
      this.$(".status-label").textContent = LABELS[state];
      this.$(".status").title = a.reason || LABELS[state];
      this.$(".mode-tag").textContent = c.status ? "FIXO" : mode === "Automático" ? "AUTO" : "MANUAL";
      this.$(".control").hidden = !c.show_controls || !this._modeEntity;
      const headphones = c.headphones ?? a.headphones ?? true;
      const file = state === "listening" ? "available" : state === "available" && !headphones ? "available_no_headphones" : state;
      const image = safeURL(c.images?.[state] || `${String(c.asset_base || a.asset_base || DEFAULT_BASE).replace(/\/$/, "")}/assets/${file}.webp`);
      this._loadImage(image, `${name}, ${LABELS[state]}`);
      this._notice = !c.entity && !c.status ? "Escolha a entidade Estado da integração no editor do card." : c.entity && !entity && !c.status ? "Entidade não encontrada. Escolha a entidade Estado no editor." : "";
      this._showNotice();
      this.$(".metrics").replaceChildren();
      const addMetric = (stateObj, icon, suffix) => {
        if (!stateObj || ["unknown", "unavailable"].includes(stateObj.state)) return;
        const number = Number(stateObj.state);
        if (!Number.isFinite(number)) return;
        const chip = document.createElement("span"); chip.className = "metric";
        const glyph = document.createElement("ha-icon"); glyph.setAttribute("icon", icon);
        chip.append(glyph, document.createTextNode(`${number.toLocaleString("pt-BR")}${suffix}`));
        this.$(".metrics").append(chip);
      };
      if (c.show_metrics) { addMetric(battery, "mdi:battery", "%"); addMetric(steps, "mdi:shoe-print", " passos"); }
      this.$(".metrics").hidden = !this.$(".metrics").childElementCount;
      this.$(".music").hidden = !c.show_music || media?.state !== "playing";
      this.$(".music").style.bottom = this.$(".metrics").hidden ? "18px" : "56px";
      this.$(".song").textContent = [media?.attributes?.media_title, media?.attributes?.media_artist].filter(Boolean).join(" · ") || "Ouvindo música";
      if (!this.$(".sheet").hidden) this._renderModes(mode);
    }
    _showNotice() {
      const notice = this._notice || this._imageError || "";
      this.$(".notice").textContent = notice; this.$(".notice").hidden = !notice;
    }
    _loadImage(url, alt) {
      if (url === this._imageURL) { this.shadowRoot.querySelectorAll(".character").forEach(img => img.alt = alt); return; }
      this._imageURL = url;
      const generation = ++this._imageGeneration;
      const imgs = this.shadowRoot.querySelectorAll(".character");
      const next = 1 - this._activeImage; const img = imgs[next];
      img.classList.remove("visible"); img.alt = alt;
      img.onload = () => {
        if (generation !== this._imageGeneration) return;
        this._imageError = ""; this._showNotice();
        img.classList.add("visible"); imgs[this._activeImage].classList.remove("visible"); this._activeImage = next;
      };
      img.onerror = () => {
        if (generation !== this._imageGeneration) return;
        this._imageError = "Imagem não carregou. Confira os arquivos da integração e o caminho das imagens."; this._showNotice();
      };
      if (url) img.src = url; else { this._imageError = "Caminho de imagem inválido."; this._showNotice(); }
    }
    _moreInfo() {
      if (!this._config.entity) return;
      this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: this._config.entity }, bubbles: true, composed: true }));
    }
    _openModes() {
      if (!this._modeEntity) return;
      const mode = this._hass?.states?.[this._modeEntity]?.state || "Automático";
      this._renderModes(mode); this.$(".service-error").hidden = true; this.$(".sheet").hidden = false;
      this.$(".choices button")?.focus();
    }
    _closeModes() { this.$(".sheet").hidden = true; this.$(".control").focus(); }
    _renderModes(current) {
      const choices = this.$(".choices");
      if (!choices.childElementCount) for (const option of MODES) {
        const button = document.createElement("button"); button.className = "choice"; button.type = "button";
        button.textContent = option; button.dataset.option = option;
        button.addEventListener("click", () => this._chooseMode(option)); choices.append(button);
      }
      choices.querySelectorAll("button").forEach(button => {
        button.classList.toggle("selected", button.dataset.option === current);
        button.setAttribute("aria-pressed", String(button.dataset.option === current));
      });
    }
    async _chooseMode(option) {
      if (this._sending || !this._hass?.callService || !this._modeEntity) return;
      this._sending = true;
      const buttons = this.$(".choices").querySelectorAll("button"); buttons.forEach(b => b.disabled = true);
      try {
        await this._hass.callService("select", "select_option", { entity_id: this._modeEntity, option });
        this._closeModes();
      } catch (error) {
        this.$(".service-error").textContent = `Não foi possível alterar o estado: ${error?.message || "confira suas permissões"}`;
        this.$(".service-error").hidden = false;
      } finally { this._sending = false; buttons.forEach(b => b.disabled = false); }
    }
  }

  class PresencaVivaEditor extends HTMLElement {
    constructor() { super(); this.attachShadow({ mode: "open" }); }
    setConfig(config) {
      this._config = { ...config };
      if (this._built) this.shadowRoot.querySelectorAll("[data-key]").forEach(input => {
        const key = input.dataset.key;
        if (input.type === "checkbox") input.checked = this._config[key] ?? ["animations", "show_controls", "headphones"].includes(key);
        else input.value = this._config[key] ?? (key === "height" ? 500 : key === "background" ? "blue" : "");
      });
      this._render();
    }
    set hass(hass) { this._hass = hass; this._render(); }
    _render() {
      if (!this._config || !this._hass || this._built) return;
      this._built = true;
      this.shadowRoot.innerHTML = `<style>:host{display:block;font-family:system-ui,sans-serif}.fields{display:grid;gap:15px}label{display:grid;gap:6px;font-size:13px;color:var(--primary-text-color)}input,select{box-sizing:border-box;width:100%;padding:11px 12px;border:1px solid var(--divider-color,#8885);border-radius:10px;background:var(--card-background-color,#fff);color:var(--primary-text-color,#222);font:14px system-ui}input[type=checkbox]{width:18px;height:18px;margin:0}.check{display:flex;align-items:center;gap:10px}p{color:var(--secondary-text-color,#666);font-size:12px;line-height:1.5;margin:4px 0}.heading{font-weight:700;font-size:16px}</style><div class="fields"></div>`;
      const fields = this.shadowRoot.querySelector(".fields");
      const hint = document.createElement("p"); hint.textContent = "Escolha o sensor Estado criado pela integração Presença Viva. As outras entidades são opcionais e podem vir automaticamente da integração."; fields.append(hint);
      const field = (key, label, kind, options) => {
        const wrapper = document.createElement("label"); wrapper.append(document.createTextNode(label));
        const input = document.createElement(kind === "select" ? "select" : "input");
        input.dataset.key = key;
        if (kind === "select") for (const [value, text] of options) { const option = document.createElement("option"); option.value = value; option.textContent = text; input.append(option); }
        else input.type = kind;
        if (kind === "checkbox") { wrapper.className = "check"; input.checked = this._config[key] ?? ["animations", "show_controls", "headphones"].includes(key); wrapper.prepend(input); }
        else { input.value = this._config[key] ?? (key === "height" ? 500 : key === "background" ? "blue" : ""); wrapper.append(input); }
        if (kind === "number") { input.min = "300"; input.max = "900"; input.step = "10"; }
        input.addEventListener("change", () => {
          const next = { ...this._config, type: "custom:presenca-viva-card" };
          const value = kind === "checkbox" ? input.checked : kind === "number" ? Math.max(300, Math.min(900, Number(input.value) || 500)) : input.value;
          if (value === "") delete next[key]; else next[key] = value;
          this._config = next;
          this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: next }, bubbles: true, composed: true }));
        }); fields.append(wrapper);
      };
      const entities = domain => [["", "Usar automaticamente / nenhum"], ...Object.entries(this._hass.states).filter(([id]) => id.startsWith(domain + ".")).sort(([a],[b]) => a.localeCompare(b)).map(([id,s]) => [id, `${s.attributes?.friendly_name || id} (${id})`])];
      field("entity", "Entidade Estado", "select", entities("sensor"));
      field("name", "Nome no card", "text");
      field("mode_entity", "Seletor Modo (opcional)", "select", entities("select"));
      field("height", "Altura do card em pixels", "number");
      field("background", "Fundo", "select", [["blue", "Azul da referência"], ["night", "Azul escuro"], ["system", "Cores do tema do Home Assistant"]]);
      field("animations", "Animações leves", "checkbox");
      field("headphones", "Fones no estado Disponível", "checkbox");
      field("show_controls", "Botão para alterar o estado", "checkbox");
      field("show_metrics", "Mostrar bateria e passos", "checkbox");
      field("show_music", "Mostrar a música atual", "checkbox");
      field("battery_entity", "Sensor de bateria (opcional)", "select", entities("sensor"));
      field("steps_entity", "Sensor de passos (opcional)", "select", entities("sensor"));
      field("media_player_entity", "Reprodutor de música (opcional)", "select", entities("media_player"));
    }
  }
  if (!customElements.get("presenca-viva-card")) customElements.define("presenca-viva-card", PresencaVivaCard);
  if (!customElements.get("presenca-viva-card-editor")) customElements.define("presenca-viva-card-editor", PresencaVivaEditor);
  window.customCards = window.customCards || [];
  if (!window.customCards.some(card => card.type === "presenca-viva-card")) window.customCards.push({
    type: "presenca-viva-card", name: "Presença Viva", preview: true,
    documentationURL: "https://github.com/Douglaslopes24/Card-usuario",
    description: "Personagem animado com seis estados, modo manual e sensores locais.",
    getEntitySuggestion: (hass, entityId) => hass.states[entityId]?.attributes?.presenca_viva ? { config: { type: "custom:presenca-viva-card", entity: entityId } } : null,
  });
})();
