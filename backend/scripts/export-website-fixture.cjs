/*
 * Copies the website's sample data (the mock*.ts files under frontend/app/lib) into
 * prisma/fixtures/website-demo.json, so `SEED_DEMO=true npm run db:seed` fills the database with the
 * same cars, articles, dealers, stock and leads the website showed before it was connected.
 * Only reads the website files; never changes them.
 *
 *   node scripts/export-website-fixture.cjs [path/to/frontend]
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const ts = require('typescript');

// The website is the repository root (backend/ sits inside it); a side-by-side ../frontend folder also works.
const defaultFrontend = [path.join(__dirname, '..', '..'), path.join(__dirname, '..', '..', 'frontend')].find((dir) => fs.existsSync(path.join(dir, 'app', 'lib', 'cars', 'mockCars.ts')));
const frontend = path.resolve(process.argv[2] ?? defaultFrontend ?? '.');
const lib = path.join(frontend, 'app', 'lib');
const out = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-fixture-'));
const files = ['cars/search.ts', 'cars/mockCars.ts', 'articles/mockArticles.ts', 'dashboard/mockData.ts'];

const toPosix = (value) => value.split(path.sep).join('/');

for (const file of files) {
  const source = fs.readFileSync(path.join(lib, file), 'utf8');
  const target = path.join(out, file.replace(/\.ts$/, '.js'));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  let { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  // "@/app/lib/x" → relative path inside the temporary copy.
  outputText = outputText.replace(/require\("@\/app\/lib\/([^"]+)"\)/g, (_, rest) => {
    let relative = toPosix(path.relative(path.dirname(target), path.join(out, rest)));
    if (!relative.startsWith('.')) relative = `./${relative}`;
    return `require(${JSON.stringify(relative)})`;
  });
  fs.writeFileSync(target, outputText);
}

const { mockCars } = require(path.join(out, 'cars', 'mockCars.js'));
const { mockArticles, mockCategories } = require(path.join(out, 'articles', 'mockArticles.js'));
const dashboard = require(path.join(out, 'dashboard', 'mockData.js'));

const fixture = {
  source: 'frontend/app/lib (sample data the website used before the API was connected)',
  cars: mockCars,
  articleCategories: mockCategories,
  articles: mockArticles,
  dealers: dashboard.mockDealers,
  dealerStats: dashboard.mockDealerStats,
  inventory: dashboard.mockInventory,
  leads: dashboard.mockLeads,
  staff: dashboard.mockStaff,
};
const target = path.join(__dirname, '..', 'prisma', 'fixtures', 'website-demo.json');
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, `${JSON.stringify(fixture, null, 1)}\n`);
fs.rmSync(out, { recursive: true, force: true });
console.log(
  `Wrote ${toPosix(path.relative(process.cwd(), target))}: ${mockCars.length} cars, ${mockArticles.length} articles, ${fixture.dealers.length} dealers, ${fixture.inventory.length} stock rows, ${fixture.leads.length} leads`,
);
