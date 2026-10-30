/* ---------- start ---------- */
(async () => {
  const get = async f => { try { return await (await fetch(f)).json(); } catch { return null; } };
  const [icons, pages] = await Promise.all([get('icons.json'), get('pages.json')]);
  ICONS = icons || {}; PAGES = pages || [];
  ALL = PICTURES.map(p => ({ id: p.id, name: p.name, cat: 'My drawings', svg: mine(p) })).concat(PAGES);
  fillIcons();
  drawCoins();
  route();
})();
// installable and offline: sw.js beside this page
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js', { scope: './' }).catch(() => {}));
}
