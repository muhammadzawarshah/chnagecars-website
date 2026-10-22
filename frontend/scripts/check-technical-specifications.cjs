// Run with: node scripts/check-technical-specifications.cjs
const fs = require('node:fs');
const assert = require('node:assert/strict');
const ts = require('typescript');
const compile = (file) => {
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  const mod = { exports: {} };
  const localRequire = id => {
    const path = require('node:path');
    if (id.startsWith('@/')) return require(path.resolve(id.slice(2)));
    if (id.startsWith('.')) {
      const target = path.resolve(path.dirname(file), id);
      return target.endsWith('.json') ? require(target) : compile(target + '.ts');
    }
    return require(id);
  };
  new Function('exports', 'require', 'module', output)(mod.exports, localRequire, mod);
  return mod.exports;
};
const { technicalSpecificationGroups: groups } = compile('app/lib/cars/technical-specifications.ts');

const spec = { doors: 5, seats: 5, bodyType: 'SUV', colour: 'ARKONA WHITE', introductionDate: '2024-01-17', powerKw: 110, cylinders: 4, engineCapacityCc: 1395, turboSupercharged: 'T', fuelTankLitres: 50, frontTyreSize: '215/50 R18', rearTyreSize: '215/50 R18', drivenWheels: '4X2' };
const result = groups({ technicalSpecifications: spec });
assert.deepEqual(result.map(x => x.title), ['General', 'Engine', 'Handling']);
assert.deepEqual(result.flatMap(x => x.rows), [
  ['No of Doors', '5'], ['No of Seats', '5'], ['Body Type', 'SUV'], ['Colour', 'ARKONA WHITE'], ['Introduction Date', '17 January 2024'],
  ['Power Maximum', '110KW'], ['Engine Cylinders', '4'], ['Engine Capacity', '1395cc'], ['Turbo / Supercharged', 'T'], ['Fuel Tank Size', '50L'],
  ['Front Tyres', '215/50 R18'], ['Rear Tyres', '215/50 R18'], ['Driven Wheels', '4X2'],
]);
assert(groups({}).flatMap(x => x.rows).every(([, value]) => value === 'Not available'));
assert.equal(groups({ technicalSpecifications: { introductionDate: '2024-02-31' } })[0].rows[4][1], 'Not available');
const feedPath = '../backend/.local/dealertrade/stock-all.json';
if (fs.existsSync(feedPath)) {
  const rows = JSON.parse(fs.readFileSync(feedPath, 'utf8'));
  for (const row of rows.slice(0, 100)) {
    const spec = { powerKw: Number(row.kilowatts), engineCapacityCc: Number(row.engine_capacity), fuelTankLitres: Number(row.fuel_tank_size), frontTyreSize: row.front_tyre_size, drivenWheels: row.driven_wheels, introductionDate: row.introduction_date };
    const formatted = groups({ technicalSpecifications: spec });
    if (spec.engineCapacityCc > 0) assert.equal(formatted[1].rows[2][1], `${Number(row.engine_capacity)}cc`);
    if (spec.powerKw > 0) assert.equal(formatted[1].rows[0][1], `${Number(row.kilowatts)}KW`);
  }
  console.log('Verified formatting against 100 stored ChangeCars listings.');
}
console.log('All 13 labels, ordering, units and missing-value checks passed.');

assert.equal(groups({ technicalSpecifications: { bodyType: 'Coupé' } })[0].rows[2][1], 'Coupé');
assert.equal(groups({ technicalSpecifications: { bodyType: 'Double Cab Bakkie' } })[0].rows[2][1], 'Double Cab Bakkie');

for (const raw of ['single cab', 'SINGLE CAB BAKKIE', 'Single Cabe Bakie', 'single-cab-bakkie']) {
  assert.equal(groups({ technicalSpecifications: { bodyType: raw } })[0].rows[2][1], 'Single Cab Bakkie');
}
assert.equal(groups({ technicalSpecifications: { bodyType: 'mpv' } })[0].rows[2][1], 'MPV');
assert.equal(groups({ technicalSpecifications: { bodyType: 'suv' } })[0].rows[2][1], 'SUV');
