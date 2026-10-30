// ==UserScript==
// @name         WishReaper - Steam Wishlist Cleaner
// @namespace    local.wishreaper
// @version      0.7.0
// @description  Audit the complete Steam wishlist against your owned and playable Steam Families games before removing selected entries.
// @match        https://store.steampowered.com/wishlist/id/Noah_BK*
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      api.steampowered.com
// @connect      store.steampowered.com
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const PROFILE_PATH = '/wishlist/id/Noah_BK';
  const PANEL_ID = 'wishreaper-panel';
  const LIMIT = 50000;
  const TARGET_APPID = 3669870; // CONTROL Resonant: default diagnostic only, never forced removal.

  function validAppId(value) {
    const n = Number(value);
    return Number.isSafeInteger(n) && n > 0 && n <= 4294967295 ? n : null;
  }

  function parseAppIds(value) {
    const text = Array.isArray(value) ? value.join('\n') : String(value || '');
    const ids = new Set();
    const tokens = text.match(/https?:\/\/[^\s,;]+|(?:^|[\s,;])\d+(?=$|[\s,;])/g) || [];
    for (const token of tokens) {
      const urlId = token.match(/\/app\/(\d+)(?:[/?#]|$)/i)?.[1];
      const rawId = urlId || (/^\d+$/.test(token.trim()) ? token.trim() : null);
      const id = validAppId(rawId);
      if (id) ids.add(id);
    }
    return [...ids].sort((a, b) => a - b);
  }

  function parseWishlist(data) {
    if (!data || !data.response || !Array.isArray(data.response.items)) {
      throw new Error('Steam returned an unexpected wishlist response. No removals are allowed.');
    }
    const ids = data.response.items.map(item => validAppId(item && item.appid));
    if (ids.some(id => !id)) throw new Error('A wishlist entry had an invalid AppID.');
    if (new Set(ids).size !== ids.length) throw new Error('Wishlist response contained duplicate AppIDs.');
    return new Set(ids);
  }

  function indexFamily(apps, steamId) {
    if (!Array.isArray(apps)) throw new Error('Steam returned an unexpected Steam Families response.');
    const map = new Map();
    for (const app of apps) {
      const id = validAppId(app && app.appid);
      if (!id) throw new Error('The Steam Families response contained an invalid AppID.');
      const owners = Array.isArray(app.owner_steamids) ? app.owner_steamids.map(String) : [];
      const existing = map.get(id) || { appId: id, name: '', owned: false, family: false, excluded: [], unknownOwner: false };
      existing.name = String(app.name || existing.name || '');
      const reason = Number(app.exclude_reason || 0);
      if (owners.includes(String(steamId))) existing.owned = true;
      if (owners.some(owner => owner !== String(steamId)) && reason === 0) existing.family = true;
      if (owners.length === 0 && reason === 0) existing.unknownOwner = true;
      if (reason !== 0) existing.excluded.push(reason);
      map.set(id, existing);
    }
    return map;
  }

  function classify(appId, wishlist, family) {
    if (!wishlist.has(appId)) return 'Not on wishlist';
    const app = family.get(appId);
    if (!app) return 'Not returned by Steam Families';
    if (app.owned && app.family) return 'Owned and family access';
    if (app.owned) return 'Owned';
    if (app.family) return 'Family access';
    if (app.excluded.length) return 'Family copy excluded (reason ' + [...new Set(app.excluded)].join(', ') + ')';
    return 'Ownership not confirmed';
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { validAppId, parseAppIds, parseWishlist, indexFamily, classify };
    return;
  }

  if (location.pathname.replace(/\/$/, '') !== PROFILE_PATH || !document.body || document.getElementById(PANEL_ID)) return;

  const steamPage = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
  let current = null;
  let busy = false;
  const selected = new Set();

  function config(name) {
    try {
      const raw = document.querySelector('#application_config')?.getAttribute(name);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  function jwtSteamId(token) {
    try {
      const part = token.split('.')[1];
      if (!part) return '';
      const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')));
      return /^\d{17}$/.test(String(payload.sub || '')) ? String(payload.sub) : '';
    } catch (_) {
      return '';
    }
  }

  function gmJson(path, params) {
    const query = new URLSearchParams(params || {});
    const url = 'https://api.steampowered.com/' + path + (query.size ? '?' + query.toString() : '');
    return new Promise((resolve, reject) => GM_xmlhttpRequest({
      method: 'GET', url, timeout: 30000,
      onload(res) {
        if (res.status !== 200) return reject(new Error('Steam Web API returned HTTP ' + res.status + '.'));
        try { resolve(JSON.parse(res.responseText)); }
        catch (_) { reject(new Error('Steam Web API returned invalid JSON.')); }
      },
      onerror() { reject(new Error('Could not contact the Steam Web API.')); },
      ontimeout() { reject(new Error('Steam Web API request timed out.')); }
    }));
  }

  async function tokenAndSteamId() {
    const userConfig = config('data-userinfo');
    const storeConfig = config('data-store_user_config');
    let token = String(storeConfig.webapi_token || '').trim();
    if (!token) {
      const response = await fetch('/pointssummary/ajaxgetasyncconfig', { credentials: 'same-origin' });
      if (!response.ok) throw new Error('Could not retrieve a Steam session token.');
      const data = await response.json();
      token = String(data?.data?.webapi_token || '').trim();
    }
    if (!token) throw new Error('Sign in to Steam to retrieve a Steam session token.');
    const fromPage = String(userConfig.steamid || steamPage.g_steamID || '').trim();
    const fromToken = jwtSteamId(token);
    if (fromPage && fromToken && fromPage !== fromToken) {
      throw new Error('Steam account mismatch. Refresh your Steam login before scanning.');
    }
    const steamId = fromPage || fromToken;
    if (!/^\d{17}$/.test(steamId)) {
      throw new Error('Could not verify the signed-in SteamID64. No removals are allowed.');
    }
    return { steamId, token };
  }

  function loadedTitles() {
    const titles = new Map();
    const rows = document.querySelectorAll('#wishlist_ctn .wishlist_row, #wishlist_ctn [id^="game_"]');
    for (const row of rows) {
      const anchor = row.querySelector('a[href*="/app/"]');
      const id = validAppId(anchor?.href.match(/\/app\/(\d+)/)?.[1] || row.id.match(/^game_(\d+)/)?.[1]);
      if (!id) continue;
      titles.set(id, row.querySelector('.title')?.textContent?.trim() || anchor?.textContent?.trim() || '');
    }
    return titles;
  }

  async function getWishlist(steamId) {
    const data = await gmJson('IWishlistService/GetWishlist/v1/', { steamid: steamId });
    const ids = parseWishlist(data);
    const count = await gmJson('IWishlistService/GetWishlistItemCount/v1/', { steamid: steamId });
    const expected = Number(count?.response?.count);
    if (!Number.isSafeInteger(expected) || expected < 0) {
      throw new Error('Could not verify the total wishlist count.');
    }
    if (ids.size !== expected) {
      throw new Error('Wishlist incomplete: received ' + ids.size + ' entries, Steam reports ' + expected + '.');
    }
    return ids;
  }

  async function getFamily(token) {
    const membership = await gmJson('IFamilyGroupsService/GetFamilyGroupForUser/v1/', {
      access_token: token, include_family_group_response: 'true'
    });
    const familyId = String(membership?.response?.family_groupid || '');
    if (!/^\d+$/.test(familyId) || familyId === '0') {
      throw new Error('Steam did not return an active Steam Family for this account.');
    }
    const response = await gmJson('IFamilyGroupsService/GetSharedLibraryApps/v1/', {
      access_token: token, family_groupid: familyId, include_own: 'true',
      include_excluded: 'true', include_free: 'false',
      include_non_games: 'true', max_apps: String(LIMIT), language: 'english'
    });
    if (!Array.isArray(response?.response?.apps)) {
      throw new Error('Steam did not return a valid family app list.');
    }
    if (response.response.apps.length >= LIMIT) {
      throw new Error('Family library reached the requested limit; the result may be incomplete.');
    }
    return response.response.apps;
  }

  function element(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = String(text);
    return el;
  }

  const style = element('style');
  style.textContent = '#wishreaper-panel{position:fixed;right:18px;bottom:18px;z-index:2147483647;width:min(560px,calc(100vw - 36px));max-height:85vh;overflow:auto;background:#172737;color:#dfeaf3;font:13px/1.45 Arial,sans-serif;border:1px solid #47718c;border-radius:12px;box-shadow:0 12px 45px #0009;padding:14px;box-sizing:border-box}#wishreaper-panel *{box-sizing:border-box}#wishreaper-panel h3{font-size:18px;margin:0 0 6px;color:#fff}#wishreaper-panel p{margin:7px 0}#wishreaper-panel button{background:#305978;color:white;border:1px solid #6086a4;border-radius:6px;padding:7px 10px;cursor:pointer;margin:3px 4px 3px 0}#wishreaper-panel button:disabled{opacity:.4;cursor:not-allowed}#wishreaper-panel input,#wishreaper-panel textarea{background:#0c1b29;color:white;border:1px solid #668097;border-radius:5px;padding:5px}#wishreaper-panel textarea{width:100%;min-height:46px}#wishreaper-panel .wr-row{display:flex;align-items:center;gap:8px;padding:7px 0;border-top:1px solid #344e63}#wishreaper-panel .wr-row label{flex:1}#wishreaper-panel a{color:#89ccfa}#wishreaper-panel .wr-muted{color:#a7bdca}#wishreaper-panel .wr-error{color:#ffa7a7;white-space:pre-wrap}';
  document.head.appendChild(style);

  const panel = element('section');
  panel.id = PANEL_ID;
  const title = element('h3', '', 'WishReaper 0.7.0');
  const summary = element('p', 'wr-muted', 'Nothing is removed without your selection and confirmation.');
  const actions = element('div');
  const scanButton = element('button', '', 'Scan complete wishlist');
  const closeButton = element('button', '', 'Hide');
  actions.append(scanButton, closeButton);
  const status = element('p', 'wr-muted', 'Ready.');
  const diagnostics = element('div');
  const diagnosisLabel = element('p', '', 'Check an AppID (CONTROL Resonant is prefilled):');
  const diagnosisInput = element('input');
  diagnosisInput.value = String(TARGET_APPID);
  diagnosisInput.placeholder = 'AppID';
  diagnosisInput.setAttribute('aria-label', 'Diagnose Steam AppID');
  const diagnoseButton = element('button', '', 'Diagnose');
  const diagnosisResult = element('p', 'wr-muted', 'Scan first to enable diagnostics.');
  diagnostics.append(diagnosisLabel, diagnosisInput, diagnoseButton, diagnosisResult);
  const manualLabel = element('p', '', 'Optional manual AppIDs or Steam app links (unverified matches):');
  const manualInput = element('textarea');
  manualInput.placeholder = 'One AppID or Steam store link per line';
  const manualButton = element('button', '', 'Add manual entries to preview');
  const list = element('div');
  const selectionActions = element('div');
  const chooseOwned = element('button', '', 'Select owned');
  const chooseFamily = element('button', '', 'Select family');
  const clearButton = element('button', '', 'Clear selection');
  const removeButton = element('button', '', 'Remove selected (0)');
  removeButton.disabled = true;
  selectionActions.append(chooseOwned, chooseFamily, clearButton, removeButton);
  selectionActions.hidden = true;
  panel.append(title, summary, actions, status, diagnostics, manualLabel, manualInput, manualButton, selectionActions, list);
  document.body.appendChild(panel);

  function message(value, error) {
    status.textContent = value;
    status.className = error ? 'wr-error' : 'wr-muted';
  }

  function nameFor(id) {
    return current?.titles.get(id) || current?.family.get(id)?.name || 'AppID ' + id;
  }

  function diagnostic(id) {
    if (!current) return 'Run a scan first.';
    if (!id) return 'Enter a valid numeric AppID.';
    const result = classify(id, current.wishlist, current.family);
    const owners = current.family.get(id);
    return nameFor(id) + ' (' + id + '): ' + result +
      (owners ? ' | Owners reported: ' + (owners.owned ? 'you' : 'not you') +
        ', family available: ' + (owners.family ? 'yes' : 'no') : '') + '.';
  }

  function draw() {
    list.replaceChildren();
    if (!current) return;
    const candidates = [...current.items.values()].sort((a, b) => a.title.localeCompare(b.title));
    summary.textContent = current.wishlist.size + ' wishlist items, ' + current.family.size +
      ' family-library AppIDs, ' + candidates.length + ' matches or manual entries. Only explicitly selected items can be removed.';
    selectionActions.hidden = candidates.length === 0;
    removeButton.disabled = busy || selected.size === 0;
    removeButton.textContent = 'Remove selected (' + selected.size + ')';
    for (const item of candidates) {
      const row = element('div', 'wr-row');
      const checkbox = element('input');
      checkbox.type = 'checkbox';
      checkbox.checked = selected.has(item.appId);
      checkbox.disabled = busy;
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) selected.add(item.appId); else selected.delete(item.appId);
        removeButton.disabled = busy || !selected.size;
        removeButton.textContent = 'Remove selected (' + selected.size + ')';
      });
      const label = element('label');
      const link = element('a', '', item.title);
      link.href = 'https://store.steampowered.com/app/' + item.appId + '/';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      label.append(link, element('div', 'wr-muted', 'AppID ' + item.appId + ' | ' + item.reason));
      row.append(checkbox, label);
      list.appendChild(row);
    }
  }

  function addMatches(ids) {
    for (const id of ids) {
      if (!current.wishlist.has(id)) continue;
      const reason = classify(id, current.wishlist, current.family);
      if (reason !== 'Owned' && reason !== 'Family access' && reason !== 'Owned and family access') continue;
      current.items.set(id, { appId: id, title: nameFor(id), reason });
    }
  }

  async function scan() {
    if (busy) return;
    busy = true;
    current = null;
    selected.clear();
    list.replaceChildren();
    selectionActions.hidden = true;
    scanButton.disabled = true;
    manualButton.disabled = true;
    message('Loading account, entire wishlist, and Steam Families library...');
    try {
      const { steamId, token } = await tokenAndSteamId();
      const wishlist = await getWishlist(steamId);
      const titles = loadedTitles();
      // A mismatch may indicate a different wishlist owner or stale page state.
      if ([...titles.keys()].some(id => !wishlist.has(id))) {
        throw new Error('Visible wishlist entries do not match the signed-in account. No removals allowed.');
      }
      // Page rows are labels only; Steam's API is the authoritative complete list.
      const apps = await getFamily(token);
      const family = indexFamily(apps, steamId);
      current = { steamId, wishlist, titles, family, items: new Map() };
      addMatches(wishlist);
      draw();
      diagnosisResult.textContent = diagnostic(validAppId(diagnosisInput.value));
      message('Scan complete. Review results before selecting any removals.');
    } catch (error) {
      message(error.message || 'Scan failed. No removals are allowed.', true);
      summary.textContent = 'Scan incomplete. No changes made.';
    } finally {
      busy = false;
      scanButton.disabled = false;
      manualButton.disabled = false;
      draw();
    }
  }

  function addManual() {
    if (!current || busy) return message('Complete a scan before adding manual entries.', true);
    for (const id of parseAppIds(manualInput.value)) {
      if (current.wishlist.has(id) && !current.items.has(id)) {
        current.items.set(id, { appId: id, title: nameFor(id), reason: 'Manual selection: access NOT verified' });
      }
    }
    draw();
  }

  function sessionId() {
    const fromPage = String(steamPage.g_sessionID || '');
    const cookie = document.cookie.match(/(?:^|;\s*)sessionid=([^;]+)/)?.[1] || '';
    return fromPage || decodeURIComponent(cookie);
  }

  async function removeFromWishlist(id, session) {
    const body = new URLSearchParams({ sessionid: session, appid: String(id) });
    const result = await fetch('/api/removefromwishlist', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: body.toString()
    });
    if (!result.ok) throw new Error('Steam removal returned HTTP ' + result.status + '.');
    const data = await result.json();
    if (!(data?.success === true || data?.success === 1 || data?.response?.success === true || data?.response?.success === 1)) {
      throw new Error('Steam did not confirm removal.');
    }
  }

  async function removeSelected() {
    if (!current || busy || !selected.size) return;
    const session = sessionId();
    if (!session) return message('Steam session ID unavailable. No removals made.', true);
    const items = [...selected].map(id => current.items.get(id)).filter(Boolean);
    const sample = items.slice(0, 20).map(item => item.title + ' (' + item.appId + ')').join('\n');
    if (!confirm('Remove ' + items.length + ' selected wishlist entries?\n\n' + sample +
      (items.length > 20 ? '\n...and ' + (items.length - 20) + ' more.' : '') +
      '\n\nFamily sharing can end. Unverified manual entries were not checked against library ownership.')) return;
    busy = true;
    scanButton.disabled = true;
    manualButton.disabled = true;
    removeButton.disabled = true;
    const accepted = [];
    const failed = [];
    try {
      const identity = await tokenAndSteamId();
      if (identity.steamId !== current.steamId) throw new Error('Steam account changed since scan.');
      const before = await getWishlist(current.steamId);
      if (items.some(item => !before.has(item.appId))) throw new Error('Wishlist changed since scan. Scan again.');
      for (const item of items) {
        try {
          await removeFromWishlist(item.appId, session);
          accepted.push(item.appId);
        } catch (error) {
          failed.push(item.appId + ': ' + error.message);
        }
        message('Removal requests processed: ' + (accepted.length + failed.length) + ' of ' + items.length + '.');
      }
      const remaining = await getWishlist(current.steamId);
      const verified = accepted.filter(id => !remaining.has(id));
      const stillPresent = accepted.filter(id => remaining.has(id));
      if (stillPresent.length) failed.push('Steam still lists these AppIDs: ' + stillPresent.join(', '));
      message(verified.length + ' confirmed removed, ' + failed.length + ' issue(s).' +
        (failed.length ? '\n' + failed.join('\n') : ''), Boolean(failed.length));
    } catch (error) {
      message('Stopped: ' + error.message + '. No further removal requests will be sent.', true);
    } finally {
      // A new scan is mandatory after any removal attempt.
      busy = false;
      current = null;
      selected.clear();
      scanButton.disabled = false;
      manualButton.disabled = false;
      selectionActions.hidden = true;
      list.replaceChildren();
      summary.textContent = 'Scan again to refresh Steam data before another removal.';
    }
  }

  scanButton.addEventListener('click', scan);
  diagnoseButton.addEventListener('click', () => { diagnosisResult.textContent = diagnostic(validAppId(diagnosisInput.value)); });
  manualButton.addEventListener('click', addManual);
  chooseOwned.addEventListener('click', () => { if (!current || busy) return; for (const item of current.items.values()) if (item.reason.includes('Owned')) selected.add(item.appId); draw(); });
  chooseFamily.addEventListener('click', () => { if (!current || busy) return; for (const item of current.items.values()) if (item.reason.includes('Family') || item.reason.includes('family access')) selected.add(item.appId); draw(); });
  clearButton.addEventListener('click', () => { if (busy) return; selected.clear(); draw(); });
  removeButton.addEventListener('click', removeSelected);
  closeButton.addEventListener('click', () => { panel.hidden = !panel.hidden; if (panel.hidden) { panel.hidden = false; panel.style.display = 'none'; const reopen = element('button', '', 'WishReaper'); reopen.style.cssText = 'position:fixed;bottom:18px;right:18px;z-index:2147483647;padding:10px 15px;background:#305978;color:#fff;border-radius:8px;border:1px solid #6086a4;cursor:pointer'; reopen.addEventListener('click', () => { reopen.remove(); panel.style.display = ''; }); document.body.appendChild(reopen); } });
})();
