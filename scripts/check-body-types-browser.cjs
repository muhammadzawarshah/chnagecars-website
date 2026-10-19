// PLAYWRIGHT_MODULE=/path/to/playwright node scripts/check-body-types-browser.cjs
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const definitions = require('../backend/src/modules/web/body-types.json');
const expected = ['Boat', 'Caravan', 'Convertible', 'Coupé', 'Double Cab Bakkie', 'Extended Cab', 'Hatchback', 'Minibus', 'Motorbike', 'MPV', 'Panel Van', 'Sedan', 'Single Cab Bakkie', 'Station Wagon', 'SUV'];
const output = 'backend/docs/body-type-verification';
fs.mkdirSync(output, { recursive: true });
const results = [];
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  let mode = 'normal';
  const requests = [];
  await page.route('**/api/vehicles/facets?*', route => {
    requests.push(new URL(route.request().url()).searchParams.get('category'));
    if (mode === 'failure') return route.fulfill({status:502,json:{message:'Controlled API failure'}});
    return route.fulfill({json:{total:mode === 'empty' ? 0 : 20, ranges:{},categories:mode === 'empty' ? [] : definitions.flatMap(type=>type.slugs.map(slug=>({slug,count:1})))}});
  });
  const sheet = () => page.locator('[class*="z-901"]');
  const names = () => sheet().locator('li').evaluateAll(items => items.slice(1).map(item => item.children[1].textContent));
  async function open(width=390) {
    await page.setViewportSize({width,height:900});
    const facetsResponse = page.waitForResponse(response=>response.url().includes('/api/vehicles/facets?'));
    const response = await page.goto(process.env.BODY_TYPES_TEST_URL || 'http://127.0.0.1:3100/search/filters',{waitUntil:'domcontentloaded'});
    assert.equal(response.status(),200);
    await page.getByRole('button',{name:'Body Type(s)',exact:true}).click();
    await sheet().waitFor();
    await facetsResponse;
  }
  async function check(name, fn) {
    try {const response = await fn();results.push({check:results.length+1,name,status:'PASS',response});}
    catch(error) {results.push({check:results.length+1,name,status:'FAIL',response:error.message});}
    console.log(JSON.stringify(results.at(-1)));
  }
  try {
    await check('Desktop: exact 15 labels and order',async()=>{
      await open(1440);assert.deepEqual(await names(),expected);
      await page.screenshot({path:`${output}/desktop.png`,fullPage:true});return 'HTTP 200; all 15 exact labels in requested order at 1440px.';
    });
    await check('Mobile: identical 15 labels and order',async()=>{
      await open();assert.deepEqual(await names(),expected);
      await page.screenshot({path:`${output}/mobile.png`,fullPage:true});return 'HTTP 200; identical labels/order at 390px.';
    });
    await check('Zero matching vehicles',async()=>{
      mode='empty';await open();assert.deepEqual(await names(),expected);
      const text=await sheet().innerText();assert.equal((text.match(/\(0\)/g)||[]).length,15);return 'All 15 options remain visible with (0); no fabricated counts.';
    });
    await check('Facet API failure',async()=>{
      mode='failure';await open();assert.deepEqual(await names(),expected);return 'Controlled HTTP 502; all 15 options remain selectable; no page crash.';
    });
    mode='normal';
    await check('Multiple body types combine category aliases',async()=>{
      await open();await sheet().getByText('Extended Cab',{exact:true}).click();await sheet().getByText('SUV',{exact:true}).click();
      const response=page.waitForResponse(r=>r.url().includes('/api/vehicles/facets?')&&new URL(r.url()).searchParams.has('category'));
      await sheet().getByRole('button',{name:'Apply Filters',exact:true}).click();
      const url=new URL((await response).url());assert.equal(url.searchParams.get('category'),'king-cabs,super-cabs,suvs,crossovers');
      return `HTTP 200; category=${url.searchParams.get('category')}`;
    });
    for(const name of expected) await check(`Select and map ${name}`,async()=>{
      await open();await sheet().getByText(name,{exact:true}).click();
      const response=page.waitForResponse(r=>r.url().includes('/api/vehicles/facets?')&&new URL(r.url()).searchParams.has('category'));
      await sheet().getByRole('button',{name:'Apply Filters',exact:true}).click();
      const r=await response;const category=new URL(r.url()).searchParams.get('category');
      assert.equal(category,definitions.find(type=>type.label===name).slugs.join(','));
      await page.getByRole('button',{name,exact:true}).waitFor();
      return `HTTP ${r.status()}; selected label=${name}; category=${category}`;
    });
    assert.equal(results.length,20);
  } finally {
    fs.writeFileSync(`${output}/results.json`,JSON.stringify({timestamp:new Date().toISOString(),browser:'Chromium headless',target:process.env.BODY_TYPES_TEST_URL||'http://127.0.0.1:3100/search/filters',mode:'Actual local frontend with controlled facet API responses; not live inventory verification',pageErrors:errors,results},null,2)+'\n');
    await browser.close();
  }
  if(results.some(result=>result.status==='FAIL')||errors.length) process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1});
