// Shared sidebar — nav + workspace switcher for every brand page.
// v0 IA: Workspace → Project → RFQ → Parts → Revisions → (Comments + Quotes)
// Usage: <aside class="sidebar" data-active="projects|rfqs|parts|activity"></aside>
//        <script src="store.js"></script>   (before this, for the workspace switcher)
//        <script src="sidebar.js"></script>
(function () {
  var aside = document.querySelector('aside.sidebar[data-active]');
  if (!aside) return;
  var active = aside.getAttribute('data-active');
  var S = window.ChorusStore;
  var ws = (S && S.currentWorkspace()) || { id: 'simplyops', name: 'SimplyOps' };
  var allWs = (S && S.workspaces()) || [ws];

  // --- Ship the switcher styling with the JS so it can't go stale vs a cached stylesheet ---
  if (!document.getElementById('ws-style')) {
    var st = document.createElement('style');
    st.id = 'ws-style';
    st.textContent =
      '.ws-switch{position:relative;cursor:pointer}' +
      '.ws-switch .chev{transition:transform .16s ease}' +
      '.ws-switch.open .chev{transform:rotate(225deg)}' +
      '.ws-menu{position:absolute;left:0;right:0;top:calc(100% + 7px);background:#2a2a2a;border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:6px;box-shadow:0 14px 34px rgba(0,0,0,.5);z-index:40;opacity:0;transform:translateY(-6px);pointer-events:none;transition:opacity .15s ease,transform .15s ease}' +
      '.ws-switch.open .ws-menu{opacity:1;transform:translateY(0);pointer-events:auto}' +
      '.ws-menu .ws-menu-lbl{font-size:10px;line-height:1.2;letter-spacing:.1em;text-transform:uppercase;color:#6f6f6f;font-weight:600;padding:5px 9px 6px}' +
      '.ws-menu .ws-item{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:7px;cursor:pointer;text-decoration:none;color:#ededed}' +
      '.ws-menu .ws-item:hover{background:rgba(255,255,255,.08)}' +
      '.ws-menu .ws-item.on{background:rgba(70,199,159,.14)}' +
      '.ws-menu .ws-text{flex:1;min-width:0}' +
      '.ws-menu .ws-nm{display:block;font-size:13px;line-height:1.3;color:#ededed;font-weight:450}' +
      '.ws-menu .ws-item.on .ws-nm{color:#fff;font-weight:500}' +
      '.ws-menu .ws-sub{display:block;font-size:11px;line-height:1.3;color:#8a8a8a;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '.ws-menu .ws-chk{flex:none;color:#46c79f;font-size:13px}' +
      '.ws-menu .ws-new{display:block;padding:8px 10px;border-radius:7px;color:#46c79f;font-weight:500;font-size:13px;cursor:pointer;text-decoration:none}' +
      '.ws-menu .ws-new:hover{background:rgba(70,199,159,.1)}' +
      '.ws-menu .ws-div{height:1px;background:rgba(255,255,255,.09);margin:6px 4px}' +
      '.cmodal-bg{position:fixed;inset:0;background:rgba(20,20,20,.45);display:none;place-items:center;z-index:200}' +
      '.cmodal-bg.open{display:grid}' +
      '.cmodal{width:min(420px,92%);background:#fff;border-radius:14px;box-shadow:0 14px 36px rgba(20,20,20,.28);overflow:hidden}' +
      '.cmodal-head{padding:16px 18px;font-weight:600;font-size:15px;border-bottom:1px solid #e6e8e8}' +
      '.cmodal-body{padding:16px 18px;display:flex;flex-direction:column;gap:12px}' +
      '.cmodal-foot{padding:14px 18px;display:flex;gap:10px;justify-content:flex-end;border-top:1px solid #e6e8e8}' +
      '.nav-sep{height:1px;background:rgba(255,255,255,.08);margin:10px 14px 8px}' +
      '.nav--admin{margin-bottom:6px}';
    document.head.appendChild(st);
  }

  var nav = [
    ['overview', 'overview.html', 'Dashboard', '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.6"/><rect x="13.5" y="3.5" width="7" height="4" rx="1.5" stroke="currentColor" stroke-width="1.6"/><rect x="13.5" y="10.5" width="7" height="10" rx="1.5" stroke="currentColor" stroke-width="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.6"/>'],
    ['projects', 'projects.html', 'Projects', '<path d="M4 8a2 2 0 0 1 2-2h3l2 2h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>'],
    ['parts', 'parts-list.html', 'Parts', '<path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Z" stroke="currentColor" stroke-width="1.6"/><path d="M4 7.5 12 12l8-4.5M12 12v9" stroke="currentColor" stroke-width="1.6"/>'],
    ['issues', 'issues-list.html', 'Issues', '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="3.2" stroke="currentColor" stroke-width="1.6"/>'],
    ['activity', 'activity.html', 'Activity', '<path d="M4 12a8 8 0 1 0 8-8" stroke="currentColor" stroke-width="1.6"/><path d="M12 7v5l3 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'],
  ];
  var admin = [
    ['team', 'team.html', 'Team', '<circle cx="9" cy="8" r="3" stroke="currentColor" stroke-width="1.6"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M16 6.5a3 3 0 0 1 0 5.8M17.5 19a5.5 5.5 0 0 0-2-4.3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'],
    ['magiclinks', 'magic-links.html', 'Magic links', '<path d="M9 12a4 4 0 0 1 4-4h3a4 4 0 0 1 0 8h-1M15 12a4 4 0 0 1-4 4H8a4 4 0 0 1 0-8h1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'],
    ['settings', 'settings.html', 'Settings', '<circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.6"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'],
  ];

  function renderNav(items) {
    return items.map(function (n) {
      return '<a href="' + n[1] + '"' + (n[0] === active ? ' class="active"' : '') +
        '><svg viewBox="0 0 24 24" fill="none">' + n[3] + '</svg>' + n[2] + '</a>';
    }).join('');
  }
  var navHtml = renderNav(nav);
  var adminHtml = renderNav(admin);

  var wsItems = allWs.map(function (w) {
    return '<a class="ws-item' + (w.id === ws.id ? ' on' : '') + '" data-ws="' + w.id + '">' +
      '<span class="ws-text"><span class="ws-nm">' + w.name + '</span>' +
      (w.sub ? '<span class="ws-sub">' + w.sub + '</span>' : '') + '</span>' +
      (w.id === ws.id ? '<span class="ws-chk">✓</span>' : '') + '</a>';
  }).join('');

  aside.innerHTML =
    '<a class="brand brand--light" href="overview.html">' +
      '<img src="logo.png" class="mark" alt="Chorus" /> chorus</a>' +
    '<div class="ws-label">Workspace</div>' +
    '<div class="ws-switch" id="wsSwitch">' +
      '<span id="wsName">' + ws.name + '</span><span class="chev"></span>' +
      '<div class="ws-menu" id="wsMenu">' +
        '<div class="ws-menu-lbl">Switch workspace</div>' + wsItems +
        '<div class="ws-div"></div><a class="ws-new" id="wsNew">+ Create workspace</a>' +
      '</div>' +
    '</div>' +
    '<nav class="nav">' + navHtml + '</nav>' +
    '<div class="spacer"></div>' +
    '<div class="nav-sep"></div>' +
    '<nav class="nav nav--admin">' + adminHtml + '</nav>' +
    '<div class="user">' +
      '<div class="avatar">MK</div>' +
      '<div class="meta"><div class="n">Mathieu Kury</div><div class="e">mkury@simplyops.com</div></div>' +
      '<a href="login.html" class="signout" title="Sign out"><svg viewBox="0 0 24 24" width="15" height="15" fill="none"><path d="M9 4H5v16h4M15 8l4 4-4 4M19 12H9" stroke="#9a9a9a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></a>' +
    '</div>';

  // ---- switcher behaviour ----
  var sw = document.getElementById('wsSwitch');
  if (sw) {
    sw.addEventListener('click', function (e) {
      if (e.target.closest('.ws-item') || e.target.closest('.ws-new')) return;
      sw.classList.toggle('open');
    });
    document.addEventListener('click', function (e) { if (!sw.contains(e.target)) sw.classList.remove('open'); });
    Array.prototype.forEach.call(aside.querySelectorAll('.ws-item[data-ws]'), function (it) {
      it.addEventListener('click', function (e) {
        e.stopPropagation();
        if (S) { S.setWorkspace(it.getAttribute('data-ws')); location.href = 'overview.html'; }
      });
    });
    var nw = document.getElementById('wsNew');
    if (nw) nw.addEventListener('click', function (e) { e.stopPropagation(); openWsModal(); });
  }

  function openWsModal() {
    var bg = document.getElementById('wsModalBg');
    if (!bg) {
      bg = document.createElement('div');
      bg.className = 'cmodal-bg'; bg.id = 'wsModalBg';
      bg.innerHTML =
        '<div class="cmodal">' +
          '<div class="cmodal-head">Create workspace</div>' +
          '<div class="cmodal-body">' +
            '<div class="field"><label>Workspace name</label><input class="input" id="wsInName" placeholder="e.g. SimplyOps" /></div>' +
            '<div class="field"><label>Description <span class="muted" style="font-weight:400">· optional</span></label><input class="input" id="wsInSub" placeholder="Ops & DFM consultancy" /></div>' +
          '</div>' +
          '<div class="cmodal-foot"><button class="btn" id="wsInCancel">Cancel</button><button class="btn btn--primary" id="wsInCreate">Create &amp; switch</button></div>' +
        '</div>';
      document.body.appendChild(bg);
      bg.addEventListener('click', function (e) { if (e.target === bg) bg.classList.remove('open'); });
      document.getElementById('wsInCancel').addEventListener('click', function () { bg.classList.remove('open'); });
      document.getElementById('wsInCreate').addEventListener('click', function () {
        var name = document.getElementById('wsInName').value.trim();
        if (!name) { document.getElementById('wsInName').focus(); return; }
        if (S) S.addWorkspace({ name: name, sub: document.getElementById('wsInSub').value.trim() });
        location.href = 'overview.html';
      });
    }
    if (sw) sw.classList.remove('open');
    bg.classList.add('open');
    setTimeout(function () { var i = document.getElementById('wsInName'); if (i) i.focus(); }, 30);
  }
})();
