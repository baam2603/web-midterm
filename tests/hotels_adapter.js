const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
(async () => {
  const city = { hotels: [{ id: 'same-slug', zones: ['forest'], streets: ['Demo street'], amenities: ['pool'] }] };
  const context = { URL, DOMException, console: { info() {} }, document: { currentScript: { src: 'https://example.invalid/common/hotels-api.js' } },
    window: { CITY_DATA: { dalat: city }, AMENITIES: { breakfast: {}, lake: {}, pool: {} } },
    fetch: async () => ({ ok: true, json: async () => ({ status: 'success', data: [{ slug: 'same-slug', name: 'SQL hotel', zones: ['center'], filter_amenities: ['breakfast', 'lake'], amenities: [], price_per_night: 900000 }] }) }) };
  vm.runInNewContext(fs.readFileSync('common/hotels-api.js', 'utf8'), context);
  await context.window.HotelAPI.loadCity('dalat');
  assert.equal(city.hotels[0].zones.join(','), 'center');
  assert.equal(city.hotels[0].streets.length, 0);
  assert.equal(city.hotels[0].amenities.join(','), 'breakfast,lake');
  const previous = city.hotels;
  const controller = new AbortController();
  const pending = context.window.HotelAPI.loadCity('dalat', {}, controller.signal);
  controller.abort();
  await assert.rejects(pending, { name: 'AbortError' });
  assert.equal(city.hotels, previous);
  console.log('PASS SQL filter metadata replaces demo attributes; aborted requests cannot overwrite catalog');
})().catch((error) => { console.error(error); process.exitCode = 1; });
