import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = name => JSON.parse(fs.readFileSync(path.join(root, 'data', name), 'utf8'));
const source = read('daily_grades_2027.json');
const targets = read('feishu_targets_2027.json');
const baseline2026 = fs.readFileSync(path.join(root, 'data/feishu_targets_2026.json'), 'utf8');
const catalogPath = path.join(root, 'data/target_years.js');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8').replace(/^window\.TARGET_YEARS\s*=\s*/, '').replace(/;\s*$/, ''));
const round = n => Math.round((n + Number.EPSILON) * 100) / 100;
assert.equal(source.year, 2027);
assert.equal(source.status, 'finalized');
assert.equal(targets.year, 2027);
assert.deepEqual(catalog.years['2026'], JSON.parse(baseline2026));

for (const city of Object.values(source.cities)) {
  assert.equal(city.days.length, 365);
  assert.equal(new Set(city.days.map(d => d.date)).size, 365);
  city.days.forEach((day, i) => {
    assert.equal(day.date, new Date(Date.UTC(2027, 0, i + 1)).toISOString().slice(0, 10));
    assert.equal(typeof city.coefficients[day.label], 'number');
  });
}

let daysUpdated = 0;
for (const store of targets.records) {
  const city = source.cities[store.cityType];
  assert.ok(city, `Missing city classification: ${store.storeName}`);
  for (const [month, entry] of Object.entries(store.monthly)) {
    const days = city.days.filter(day => day.date.slice(5, 7) === month);
    assert.equal(round(days.reduce((sum, day) => sum + city.coefficients[day.label], 0)), entry.sourceCoefficient);
    assert.equal(entry.multiplier, 1, '2026 temporary Z adjustments must not enter 2027');
    assert.equal(entry.appliedZ, entry.zValue);
    entry.dailyPlan = {
      status: 'confirmed', note: '', startDate: entry.dailyPlan.startDate,
      sourceUrl: source.sourceUrl, cityType: store.cityType, sourceStatus: source.status,
      days: days.map(day => ({
        day: Number(day.date.slice(8)), date: day.date, label: day.label,
        dayType: day.type, coefficient: city.coefficients[day.label], multiplier: 1,
        appliedZ: entry.zValue, target: round(entry.zValue * city.coefficients[day.label])
      }))
    };
    const total = round(entry.dailyPlan.days.reduce((sum, day) => sum + day.target, 0));
    assert.ok(Math.abs(total - entry.targetRevenue) < 0.011, `${store.storeName} ${month}: ${total} != ${entry.targetRevenue}`);
    daysUpdated += days.length;
  }
}
assert.equal(daysUpdated, 22 * 365);
for (const brand of targets.brands) brand.records = targets.records.filter(r => r.brandId === brand.id);
targets.dailyGradeSource = { url: source.sourceUrl, year: 2027, capturedAt: source.capturedAt, status: source.status };
catalog.years['2027'] = targets;
catalog.version = '2026-09-29-target-years-4';
fs.writeFileSync(path.join(root, 'data/feishu_targets_2027.json'), JSON.stringify(targets));
fs.writeFileSync(catalogPath, `window.TARGET_YEARS = ${JSON.stringify(catalog)};\n`);
assert.equal(fs.readFileSync(path.join(root, 'data/feishu_targets_2026.json'), 'utf8'), baseline2026);
console.log(`Verified ${daysUpdated} daily targets, 264 monthly totals; 2026 unchanged.`);
