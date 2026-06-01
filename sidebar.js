// Shared sidebar — canonical, fully-wired nav for every workspace page.
// Usage: <aside class="sidebar" data-active="overview|parts|suppliers|activity"></aside>
//        <script src="sidebar.js"></script>
(function () {
  var aside = document.querySelector('aside.sidebar[data-active]');
  if (!aside) return;
  var active = aside.getAttribute('data-active');

  var nav = [
    ['overview',  'overview.html',  'Overview',  '<path d="M4 13h7V4H4zM13 20h7v-9h-7zM13 4v5h7V4zM4 20h7v-5H4z" stroke="currentColor" stroke-width="1.6"/>'],
    ['parts',     'parts.html',     'Parts',     '<path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Z" stroke="currentColor" stroke-width="1.6"/><path d="M4 7.5 12 12l8-4.5M12 12v9" stroke="currentColor" stroke-width="1.6"/>'],
    ['suppliers', 'suppliers.html', 'Suppliers', '<circle cx="9" cy="8" r="3" stroke="currentColor" stroke-width="1.6"/><path d="M4 19c0-3 2.2-5 5-5s5 2 5 5M15 11h5M17 8v6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'],
    ['activity',  'activity.html',  'Activity',  '<path d="M4 12a8 8 0 1 0 8-8" stroke="currentColor" stroke-width="1.6"/><path d="M12 7v5l3 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'],
  ];

  var navHtml = nav.map(function (n) {
    return '<a href="' + n[1] + '"' + (n[0] === active ? ' class="active"' : '') +
      '><svg viewBox="0 0 24 24" fill="none">' + n[3] + '</svg>' + n[2] + '</a>';
  }).join('');

  aside.innerHTML =
    '<a class="brand brand--light" href="overview.html">' +
      '<img src="logo.png" class="mark" alt="Chorus" /> chorus</a>' +
    '<div class="ws-label">Workspace</div>' +
    '<div class="ws-switch">ALSO · SimplyOps <span class="chev"></span></div>' +
    '<nav class="nav">' + navHtml + '</nav>' +
    '<div class="spacer"></div>' +
    '<a class="nav-settings" href="settings.html"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.6"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>Settings</a>' +
    '<div class="user">' +
      '<div class="avatar">MK</div>' +
      '<div class="meta"><div class="n">Mathieu Kury</div><div class="e">mkury@also.com</div></div>' +
      '<a href="login.html" class="signout" title="Sign out"><svg viewBox="0 0 24 24" width="15" height="15" fill="none"><path d="M9 4H5v16h4M15 8l4 4-4 4M19 12H9" stroke="#9a9a9a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></a>' +
    '</div>';
})();
