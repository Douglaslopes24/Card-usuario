/* Run from the project root with PLAYWRIGHT_MODULE pointing to playwright. */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const output = process.env.PRESENCA_QA_DIR || path.resolve(root, 'qa');
fs.mkdirSync(output, {recursive:true});
const mime = {'.html':'text/html','.js':'text/javascript','.png':'image/png','.webp':'image/webp','.json':'application/json'};
const server = http.createServer((req,res)=>{
  const filename = path.resolve(root, '.' + decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!filename.startsWith(root + path.sep) || !fs.existsSync(filename) || fs.statSync(filename).isDirectory()){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',mime[path.extname(filename)] || 'text/plain'); fs.createReadStream(filename).pipe(res);
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser = await chromium.launch({headless:true,args:['--no-sandbox']});
  try{
    const page = await browser.newPage({viewport:{width:1080,height:1000},deviceScaleFactor:1});
    const errors=[]; page.on('pageerror',e=>errors.push(e.message));
    const origin='http://127.0.0.1:'+server.address().port;
    await page.goto(origin+'/preview.html');
    const card=page.locator('#card');
    await page.waitForFunction(()=>document.querySelector('#card').shadowRoot.querySelector('.character.visible')?.naturalWidth>0);
    const labels={available:'Disponível',away:'Ausente',do_not_disturb:'Não perturbe',unavailable:'Indisponível',in_transit:'Em trânsito',listening:'Ouvindo música'};
    for(const [state,label] of Object.entries(labels)){
      await page.evaluate(key=>window.previewSetState(key),state);
      await page.waitForFunction(label=>document.querySelector('#card').shadowRoot.querySelector('.status-label').textContent===label,label);
      await page.waitForFunction(()=>{const c=document.querySelector('#card');return !c._imageError && c.shadowRoot.querySelector('.character.visible')?.src===c._imageURL && c.shadowRoot.querySelector('.character.visible').naturalWidth>0;});
      await page.waitForTimeout(500);
      await card.screenshot({path:path.join(output,state+'.png')});
    }
    await page.evaluate(()=>window.previewSetState('available'));
    await page.locator('#headphones').uncheck();
    await page.waitForFunction(()=>document.querySelector('#card').shadowRoot.querySelector('.character.visible')?.src.endsWith('available_no_headphones.webp'));
    await page.locator('#headphones').check();
    await card.locator('.control').click();
    await card.getByRole('button',{name:'Não perturbe',exact:true}).click();
    assert.equal(await card.locator('.status-label').textContent(),'Não perturbe');
    assert.equal(await card.locator('.mode-tag').textContent(),'MANUAL');
    assert.equal(await card.locator('.sheet').isVisible(),false);
    await page.evaluate(()=>{document.querySelector('#card').hass.callService=async()=>{throw Error('Permissão de teste');};});
    await card.locator('.control').click();
    await card.getByRole('button',{name:'Disponível',exact:true}).click();
    assert.match(await card.locator('.service-error').textContent(),/Permissão de teste/);
    await card.getByRole('button',{name:'Voltar ao card'}).click();
    await page.evaluate(()=>window.previewRefresh());
    await page.locator('#metrics').check();
    assert.match(await card.locator('.metrics').textContent(),/88%/);
    assert.match(await card.locator('.metrics').textContent(),/582 passos/);
    await page.locator('#music').check();await page.evaluate(()=>window.previewSetState('listening'));
    assert.match(await card.locator('.song').textContent(),/Simple Minds/);
    await page.evaluate(()=>{
      const c=document.querySelector('#card'); const e=customElements.get('presenca-viva-card').getConfigElement();
      e.setConfig({type:'custom:presenca-viva-card',entity:'sensor.maicon_estado',name:'Maicon'});e.hass=c.hass;
      e.addEventListener('config-changed',ev=>window.lastEditorConfig=ev.detail.config);e.id='editor';document.body.append(e);
    });
    await page.locator('#editor').locator('[data-key=name]').fill('Maicon Douglas');
    await page.locator('#editor').locator('[data-key=name]').dispatchEvent('change');
    assert.equal(await page.evaluate(()=>window.lastEditorConfig.name),'Maicon Douglas');
    await page.evaluate(()=>{const e=document.querySelector('#editor');e.setConfig({...e._config,name:'Outro nome'});});
    assert.equal(await page.locator('#editor').locator('[data-key=name]').inputValue(),'Outro nome');
    await page.evaluate(()=>document.querySelector('#editor').remove());
    await page.addScriptTag({url:origin+'/custom_components/presenca_viva/frontend/presenca-viva-card.js'});
    assert.equal(await page.evaluate(()=>window.customCards.filter(c=>c.type==='presenca-viva-card').length),1);
    await page.evaluate(()=>{const c=document.querySelector('#card');c.setConfig({...c._config,name:'<img src=x onerror=alert(1)>'});});
    assert.equal(await card.locator('.name img').count(),0);
    await page.evaluate(()=>window.previewRefresh());
    await page.emulateMedia({reducedMotion:'reduce'});
    assert.equal(await card.locator('.figure').evaluate(el=>getComputedStyle(el).animationName),'none');
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.locator('#motion').uncheck();
    assert.equal(await card.locator('.figure').evaluate(el=>getComputedStyle(el).animationName),'none');
    await page.locator('#motion').check();await page.locator('#metrics').uncheck();await page.locator('#music').uncheck();
    await page.evaluate(()=>window.previewSetState('available'));
    await page.waitForTimeout(700);
    await page.screenshot({path:path.join(output,'preview-desktop.png'),fullPage:true});
    await page.setViewportSize({width:360,height:1000});
    await page.waitForTimeout(300);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
    await card.screenshot({path:path.join(output,'preview-mobile.png')});
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({status:'passed',states:6,checks:['image loading','headphones toggle','manual service','service error','metrics','music','visual editor','duplicate module','text escaping','reduced motion','animation toggle','mobile layout'],output}));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
