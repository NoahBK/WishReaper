'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  validAppId, parseAppIds, parseWishlist, indexFamily, classify
} = require('../WishReaper.user.js');

const me = '76561198000000001';
const sibling = '76561198000000002';
const wanted = { response: { items: [{ appid: 3669870 }, { appid: 123 }, { appid: 555 }] } };

test('AppIDs must be positive uint32 values', () => {
  assert.equal(validAppId('3669870'), 3669870);
  assert.equal(validAppId('0'), null);
  assert.equal(validAppId('4294967296'), null);
  assert.equal(validAppId('not-a-number'), null);
});

test('manual entries parse store links and numeric AppIDs once', () => {
  assert.deepEqual(parseAppIds('https://store.steampowered.com/app/3669870/CONTROL_Resonant/ 123,123'), [123,3669870]);
});

test('full wishlist includes the offscreen CONTROL Resonant AppID', () => {
  assert.equal(parseWishlist(wanted).has(3669870), true);
});

test('invalid and duplicate wishlist entries are rejected', () => {
  assert.throws(() => parseWishlist({ response: {} }), /unexpected wishlist/);
  assert.throws(() => parseWishlist({ response: { items: [{ appid: -1 }] } }), /invalid AppID/);
  assert.throws(() => parseWishlist({ response: { items: [{ appid: 1 }, { appid: 1 }] } }), /duplicate/);
});

test('owned, family, excluded and missing matches are not confused', () => {
  const family = indexFamily([
    { appid: 3669870, name: 'CONTROL Resonant', owner_steamids: [sibling], exclude_reason: 0 },
    { appid: 123, owner_steamids: [me], exclude_reason: 2 },
    { appid: 555, owner_steamids: [sibling], exclude_reason: 3 }
  ], me);
  const wishlist = parseWishlist(wanted);
  assert.equal(classify(3669870, wishlist, family), 'Family access');
  assert.equal(classify(123, wishlist, family), 'Owned');
  assert.match(classify(555, wishlist, family), /excluded/);
  assert.equal(classify(777, wishlist, family), 'Not on wishlist');
  assert.equal(classify(777, new Set([777]), family), 'Not returned by Steam Families');
});

test('multiple family owners and excluded records preserve eligible access', () => {
  const family = indexFamily([
    { appid: 3669870, owner_steamids: [sibling], exclude_reason: 2 },
    { appid: 3669870, owner_steamids: [me, sibling], exclude_reason: 0 }
  ], me);
  assert.equal(classify(3669870, parseWishlist(wanted), family), 'Owned and family access');
});

test('unknown ownership cannot silently qualify a game for removal', () => {
  const family = indexFamily([{ appid: 3669870, name: 'CONTROL Resonant', exclude_reason: 0 }], me);
  assert.equal(classify(3669870, parseWishlist(wanted), family), 'Ownership not confirmed');
});

test('automatic discovery does not depend on a diagnostic AppID preset', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const script = fs.readFileSync(path.join(__dirname, '..', 'WishReaper.user.js'), 'utf8');
  assert.doesNotMatch(script, /TARGET_APPID|diagnosisInput\.value\s*=/);
  assert.match(script, /addMatches\(wishlist\)/);
  assert.match(script, /diagnosisInput\.placeholder\s*=\s*'AppID'/);
});

test('Gist metadata uses stable links for install and updates', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const script = fs.readFileSync(path.join(__dirname, '..', 'WishReaper.user.js'), 'utf8');
  const gistRaw = 'https://gist.githubusercontent.com/NoahBK/555e821c91b5cdc4fa1a9b3cf5f6f1ce/raw/WishReaper.user.js';
  assert.match(script, /^\/\/ @downloadURL\s+(.+)$/m);
  assert.match(script, /^\/\/ @updateURL\s+(.+)$/m);
  const download = script.match(/^\/\/ @downloadURL\s+(.+)$/m)[1].trim();
  const update = script.match(/^\/\/ @updateURL\s+(.+)$/m)[1].trim();
  assert.equal(download, gistRaw);
  assert.equal(update, gistRaw);
});
