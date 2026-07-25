import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const BASE = 'http://127.0.0.1:5173';
const CJK = /[぀-ゟ゠-ヿ一-龯]/;
const results = [];
const t = (name, pass, note='') => { results.push([pass?'PASS':'FAIL', name, note]); };

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 } });
const p = await ctx.newPage();
const pageErrors = [];
p.on('pageerror', e => pageErrors.push(e.message));
p.on('console', c => { if (c.type()==='error') pageErrors.push(c.text()); });

const views = ['Home','Beginner','Align','Knowledge','Map','Train','Explain','Review'];
const go = async (label) => {
  await p.locator('.navItem', { hasText: new RegExp('^'+label) }).first().click();
  await p.waitForTimeout(250);
};

// 8-2: every main screen renders in ja
await p.goto(BASE+'?lang=ja', { waitUntil: 'networkidle' });
for (const v of views) { await go(v); t(`ja renders ${v}`, await p.locator('.page').first().isVisible()); }

// 8-2: every main screen renders in en, with no Japanese leaking into chrome
await p.goto(BASE+'?lang=en', { waitUntil: 'networkidle' });
for (const v of views) {
  await go(v);
  const vis = await p.locator('.page').first().isVisible();
  // Exclude the language switcher (endonyms are intentional) and the notice CTA.
  const text = await p.evaluate(() => {
    const clone = document.querySelector('.appShell').cloneNode(true);
    clone.querySelectorAll('.languageSwitcher, .localeNoticeAction').forEach(n => n.remove());
    return clone.innerText;
  });
  t(`en renders ${v}`, vis);
  t(`en ${v} has no Japanese in chrome`, !CJK.test(text),
    CJK.test(text) ? text.match(/.{0,40}[぀-ゟ゠-ヿ一-龯].{0,40}/)[0] : '');
}

// 8-2: switching is immediate
await p.goto(BASE+'?lang=ja', { waitUntil: 'networkidle' });
const jaTitle = await p.locator('.homeHeroCopy h1').innerText();
await p.locator('.languageOption[lang=en]').click();
await p.waitForTimeout(150);
const enTitle = await p.locator('.homeHeroCopy h1').innerText();
t('switch applies immediately without reload', jaTitle !== enTitle && !CJK.test(enTitle));
t('html lang updates on switch', (await p.evaluate(()=>document.documentElement.lang)) === 'en');
t('document.title updates on switch', /human approval gates/.test(await p.title()));
t('meta description updates on switch',
  !CJK.test(await p.evaluate(()=>document.querySelector('meta[name=description]').content)));
t('?lang= is kept in the URL after switching', p.url().includes('lang=en'));

// 8-2: persists across reload
await p.goto(BASE, { waitUntil: 'networkidle' });
t('choice persists after reload without a query param',
  (await p.evaluate(()=>document.documentElement.lang)) === 'en');
t('localStorage holds the locale',
  (await p.evaluate(()=>localStorage.getItem('manufacturing-ai-cockpit-locale-v1'))) === 'en');

// 8-2: URL beats the stored value in both directions
await p.goto(BASE+'?lang=ja', { waitUntil: 'networkidle' });
t('?lang=ja overrides a stored en', (await p.evaluate(()=>document.documentElement.lang)) === 'ja');
await p.goto(BASE+'?lang=en', { waitUntil: 'networkidle' });
t('?lang=en overrides a stored ja', (await p.evaluate(()=>document.documentElement.lang)) === 'en');

// 8-2: an invalid lang falls back (stored is en here, so it must land on en not crash)
await p.goto(BASE+'?lang=klingon', { waitUntil: 'networkidle' });
t('invalid ?lang falls through to the stored choice',
  (await p.evaluate(()=>document.documentElement.lang)) === 'en');
// With nothing stored, the browser language legitimately outranks an invalid ?lang,
// so the true "fall back to Japanese" path needs an unsupported browser language too.
const frCtx = await b.newContext({ locale: 'fr-FR', viewport: { width: 1280, height: 900 } });
const fresh = await frCtx.newPage();
await fresh.goto(BASE+'?lang=zzz', { waitUntil: 'networkidle' });
t('invalid ?lang + unsupported browser language + nothing stored falls back to Japanese',
  (await fresh.evaluate(()=>document.documentElement.lang)) === 'ja');
const frBrowser = await frCtx.newPage();
await frBrowser.goto(BASE, { waitUntil: 'networkidle' });
t('an unsupported browser language alone falls back to Japanese',
  (await frBrowser.evaluate(()=>document.documentElement.lang)) === 'ja');
const enCtx = await b.newContext({ locale: 'en-GB', viewport: { width: 1280, height: 900 } });
const enBrowser = await enCtx.newPage();
await enBrowser.goto(BASE, { waitUntil: 'networkidle' });
t('an en-GB browser with nothing stored opens in English',
  (await enBrowser.evaluate(()=>document.documentElement.lang)) === 'en');
await frCtx.close(); await enCtx.close();

// 8-2: switcher keyboard operation
await p.goto(BASE+'?lang=ja', { waitUntil: 'networkidle' });
await p.locator('.languageOption[lang=ja]').focus();
t('selected option is the group tab stop',
  (await p.locator('.languageOption[lang=ja]').getAttribute('tabindex')) === '0');
await p.keyboard.press('ArrowRight');
await p.waitForTimeout(150);
t('ArrowRight moves the selection', (await p.evaluate(()=>document.documentElement.lang)) === 'en');
t('focus follows the selection',
  await p.locator('.languageOption[lang=en]').evaluate(el => el === document.activeElement));
await p.keyboard.press('ArrowLeft');
await p.waitForTimeout(150);
t('ArrowLeft moves back', (await p.evaluate(()=>document.documentElement.lang)) === 'ja');
await p.locator('.languageOption[lang=en]').focus();
await p.keyboard.press('Enter');
await p.waitForTimeout(150);
t('Enter selects an option', (await p.evaluate(()=>document.documentElement.lang)) === 'en');
t('aria-checked reflects the selection',
  (await p.locator('.languageOption[lang=en]').getAttribute('aria-checked')) === 'true');
t('group exposes a radiogroup role', await p.locator('[role=radiogroup]').count() > 0);

// 8-2: no horizontal overflow in English at three widths
for (const w of [390, 834, 1440]) {
  const vp = await ctx.newPage();
  await vp.setViewportSize({ width: w, height: 900 });
  await vp.goto(BASE+'?lang=en', { waitUntil: 'networkidle' });
  let worst = 0;
  for (const v of views) {
    await vp.locator(w <= 820 ? '.mobileTab' : '.navItem', { hasText: new RegExp('^'+v) }).first().click();
    await vp.waitForTimeout(200);
    const [sw, cw] = await vp.evaluate(()=>[document.documentElement.scrollWidth, document.documentElement.clientWidth]);
    worst = Math.max(worst, sw - cw);
  }
  t(`en layout holds at ${w}px with no horizontal overflow`, worst <= 0, `max overflow ${worst}px`);
  await vp.close();
}

// 8-3: regression — answer, explanation, next, weak, bookmark, progress, review vault
await p.goto(BASE+'?lang=ja', { waitUntil: 'networkidle' });
await go('Beginner');
await p.locator('.beginnerModeCard').first().click();
await p.waitForTimeout(400);
t('beginner session starts', await p.locator('.choiceCardList').isVisible());
await p.locator('.choiceCard').first().click();
await p.waitForTimeout(300);
t('answering shows the confirmation panel', await p.locator('.beginnerAnswerPanel, .answerPanel').first().isVisible().catch(()=>false)
  || (await p.getByText('解説').count()) > 0);
t('explanation text is shown', (await p.getByText('解説').count()) > 0);
await p.locator('button', { hasText: /^次へ$/ }).first().click();
await p.waitForTimeout(300);
t('next question advances', await p.locator('.choiceCardList').isVisible());
await p.locator('button', { hasText: /^後で復習$/ }).first().click();
await p.waitForTimeout(200);
const storedBeginner = await p.evaluate(()=>Object.keys(localStorage).filter(k=>k.includes('beginner')));
t('beginner progress written to localStorage', storedBeginner.length > 0, storedBeginner.join(','));

await go('Knowledge');
await p.locator('.conceptCard').first().click();
await p.waitForTimeout(150);
await p.locator('button', { hasText: /ブックマーク/ }).first().click();
await p.waitForTimeout(150);
t('bookmark toggles', (await p.locator('button', { hasText: /ブックマーク解除/ }).count()) > 0);
await p.locator('button', { hasText: /理解済みにする/ }).first().click();
await p.waitForTimeout(200);
t('concept completion updates the rail',
  (await p.locator('.railSummary strong').first().innerText()) !== '0/39');

await go('Explain');
await p.locator('.scoreButtons button').nth(2).click();
await p.waitForTimeout(150);
t('explain self-score records', (await p.locator('.scorePanel span').first().innerText()).includes('3'));

await go('Review');
t('review vault lists the bookmark', (await p.locator('.reviewItem').count()) > 0);

// progress survives a reload
await p.reload({ waitUntil: 'networkidle' });
await go('Review');
t('progress survives a reload', (await p.locator('.reviewItem').count()) > 0);

// 8-3: FUGU stays hidden when disabled
await go('Train');
t('FUGU panel hidden when the dev flag is off', (await p.locator('.fuguReviewPanel').count()) === 0);

t('no console or page errors during the run', pageErrors.length === 0, pageErrors.slice(0,3).join(' | '));

await b.close();

const fail = results.filter(r => r[0] === 'FAIL');
for (const [s, n, note] of results) console.log(`${s}  ${n}${note ? '  ('+note+')' : ''}`);
console.log(`\n${results.length - fail.length}/${results.length} passed`);
process.exit(fail.length ? 1 : 0);
