// Shared create-flows for the Chorus v0 prototype: New RFQ wizard + New Part modal.
// Persists to ChorusStore so created RFQs/parts feel real. Ships its own styles so
// it renders correctly regardless of a cached stylesheet.
// Usage: <script src="store.js"></script><script src="flows.js"></script>
//        buttons call Flows.newRFQ() / Flows.newPart()
(function () {
  var S = window.ChorusStore;
  if (!S) return;

  if (!document.getElementById('flows-style')) {
    var st = document.createElement('style');
    st.id = 'flows-style';
    st.textContent = [
      '.fl-bg{position:fixed;inset:0;background:rgba(20,20,20,.45);display:none;place-items:center;z-index:120}',
      '.fl-bg.open{display:grid}',
      '.fl-modal{width:min(560px,94%);background:#fff;border-radius:14px;box-shadow:0 18px 44px rgba(20,20,20,.3);overflow:hidden}',
      '.fl-head{display:flex;align-items:center;justify-content:space-between;padding:18px 20px 14px}',
      '.fl-head h3{margin:0;font-size:16px;font-weight:600;font-family:"Space Grotesk",Inter,sans-serif}',
      '.fl-x{width:28px;height:28px;border:0;background:transparent;color:#7a7a7a;font-size:18px;cursor:pointer;border-radius:6px}',
      '.fl-x:hover{background:#f1f1f1}',
      '.fl-steps{display:flex;gap:8px;padding:0 20px 14px;border-bottom:1px solid #e6e8e8}',
      '.fl-dot{font-size:11px;font-weight:600;color:#9a9a9a;background:#f1f1f1;padding:4px 10px;border-radius:999px}',
      '.fl-dot.on{color:#fff;background:#009571}',
      '.fl-body{padding:18px 20px;display:flex;flex-direction:column;gap:13px}',
      '.fl-body p{margin:0;font-size:13.5px;color:#444;line-height:1.5}',
      '.fl-foot{display:flex;align-items:center;gap:10px;padding:14px 20px;border-top:1px solid #e6e8e8}',
      '.fl-grow{flex:1}',
      '.fl-row2{display:grid;grid-template-columns:1fr 1fr;gap:12px}',
      '.fl-drop{display:flex;align-items:center;justify-content:center;gap:9px;border:1.5px dashed #d0d3d3;border-radius:10px;padding:18px;font-size:13px;color:#444;cursor:pointer;background:#fbfcfc}',
      '.fl-drop:hover{border-color:#009571;background:rgba(0,149,113,.03)}',
      '.fl-parts{display:flex;flex-direction:column;gap:8px}',
      '.fl-empty{font-size:12.5px;color:#7a7a7a;text-align:center;padding:10px}',
      '.fl-prow{display:flex;align-items:center;gap:10px;border:1px solid #e6e8e8;border-radius:8px;padding:8px 10px}',
      '.fl-prow .gw{flex:1;min-width:0}',
      '.fl-pname{width:100%;border:0;font-size:13px;font-weight:500;color:#1c1c1c;padding:0;outline:none;background:transparent}',
      '.fl-px{border:0;background:transparent;color:#9a9a9a;font-size:16px;cursor:pointer;width:24px;height:24px;border-radius:6px}',
      '.fl-px:hover{background:#f1f1f1}',
      '.fl-sum{font-size:13px;color:#444;background:#d6efe7;border-radius:8px;padding:11px 13px}',
      '.fl-sum b{color:#1c1c1c}',
      '.fl-check{width:46px;height:46px;border-radius:999px;background:#009571;color:#fff;display:grid;place-items:center;margin:6px auto 0}',
      '.fl-toast{position:fixed;bottom:22px;left:50%;transform:translateX(-50%);background:#1c1c1c;color:#fff;padding:11px 18px;border-radius:999px;font-size:13px;z-index:300;box-shadow:0 8px 24px rgba(0,0,0,.3)}'
    ].join('');
    document.head.appendChild(st);
  }

  var CUBE = '<svg viewBox="0 0 24 24" width="22" height="18" fill="none"><path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Z" stroke="#9aa3a1" stroke-width="1.4"/><path d="M4 7.5 12 12l8-4.5M12 12v9" stroke="#9aa3a1" stroke-width="1.4"/></svg>';
  function titleCase(f) { var b = f.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim(); return b ? b.charAt(0).toUpperCase() + b.slice(1) : 'New part'; }
  function esc(s) { return (s || '').replace(/"/g, '&quot;'); }
  function toast(msg) { var t = document.createElement('div'); t.className = 'fl-toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(function () { t.style.transition = 'opacity .4s'; t.style.opacity = '0'; setTimeout(function () { t.remove(); }, 400); }, 2400); }

  // ============================ NEW RFQ WIZARD ============================
  var rParts = [];
  function buildRFQ() {
    if (document.getElementById('flRfqBg')) return;
    var projs = ['TM-4 Bike Program', 'Cargo eBike'].concat(S.projects().map(function (p) { return p.name; }));
    var opts = projs.map(function (n) { return '<option>' + n + '</option>'; }).join('');
    var bg = document.createElement('div'); bg.className = 'fl-bg'; bg.id = 'flRfqBg';
    bg.innerHTML =
      '<div class="fl-modal">' +
        '<div class="fl-head"><h3>New RFQ</h3><button class="fl-x" data-close>×</button></div>' +
        '<div class="fl-steps"><span class="fl-dot on" data-s="1">1 · Details</span><span class="fl-dot" data-s="2">2 · Upload CAD → parts</span><span class="fl-dot" data-s="3">3 · Send to supplier</span></div>' +
        '<div class="fl-step" data-step="1"><div class="fl-body">' +
          '<div class="field"><label>RFQ name</label><input class="input" id="flRName" placeholder="e.g. TM-4 Frameset"></div>' +
          '<div class="fl-row2"><div class="field"><label>Type</label><div class="select-wrap"><select class="select" id="flRType"><option>Single part</option><option selected>Assembly</option><option>Entire product</option></select></div></div>' +
          '<div class="field"><label>Project</label><div class="select-wrap"><select class="select" id="flRProj">' + opts + '</select></div></div></div>' +
        '</div><div class="fl-foot"><span class="fl-grow"></span><button class="btn" data-close>Cancel</button><button class="btn btn--primary" data-next="2">Next: add parts</button></div></div>' +
        '<div class="fl-step" data-step="2" hidden><div class="fl-body">' +
          '<p>Upload CAD files — <b>each file becomes a Part</b> (Revision 1) in this RFQ.</p>' +
          '<label class="fl-drop"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 16V4m0 0L7 9m5-5 5 5M5 20h14" stroke="#1c1c1c" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg> Upload CAD files <span class="muted">(.step, .stl, .pdf)</span><input id="flRFiles" type="file" accept=".step,.stp,.stl,.pdf,.glb,.gltf,.obj" multiple hidden></label>' +
          '<div id="flRList" class="fl-parts"></div>' +
        '</div><div class="fl-foot"><button class="btn" data-next="1">Back</button><span class="fl-grow"></span><button class="btn btn--primary" id="flRToSend" data-next="3" disabled>Next: send to supplier</button></div></div>' +
        '<div class="fl-step" data-step="3" hidden><div class="fl-body">' +
          '<div class="field"><label>Supplier email</label><input class="input" id="flRSup" placeholder="benjamin.chen@hsinchu-precision.com"></div>' +
          '<div class="fl-sum" id="flRSum"></div>' +
          '<p class="muted" style="font-size:12px">A time-bounded magic link (14 days) is generated — no account needed for the supplier.</p>' +
        '</div><div class="fl-foot"><button class="btn" data-next="2">Back</button><span class="fl-grow"></span><button class="btn btn--primary" id="flRCreate">Create RFQ &amp; generate link</button></div></div>' +
        '<div class="fl-step" data-step="done" hidden><div class="fl-body" style="align-items:center">' +
          '<div class="fl-check"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
          '<h3 style="margin:8px 0 2px;font-family:Space Grotesk,Inter,sans-serif">RFQ created</h3><p id="flRDone" style="text-align:center"></p>' +
          '<div class="field" style="width:100%"><label>Magic link · expires in 14 days</label><div class="input-group"><span class="prefix" style="font-size:13px">🔗</span><input id="flRLink" readonly><button class="btn btn--sm" style="margin-left:8px" id="flRCopy">Copy</button></div></div>' +
        '</div><div class="fl-foot"><span class="fl-grow"></span><a class="btn" href="part-detail.html">Open RFQ</a><a class="btn btn--primary" href="magic-link-view.html">Open supplier view</a></div></div>' +
      '</div>';
    document.body.appendChild(bg);
    function q(s) { return bg.querySelector(s); }
    function close() { bg.classList.remove('open'); }
    function goto(s) { Array.prototype.forEach.call(bg.querySelectorAll('.fl-step'), function (el) { el.hidden = el.getAttribute('data-step') !== s; }); Array.prototype.forEach.call(bg.querySelectorAll('.fl-dot'), function (d) { d.classList.toggle('on', s === 'done' || (+d.getAttribute('data-s')) <= +s); }); }
    function next(s) { if (s === '2' && !q('#flRName').value.trim()) { q('#flRName').focus(); return; } if (s === '3') { var n = rParts.length; q('#flRSum').innerHTML = '<b>' + (q('#flRName').value || 'This RFQ') + '</b> (' + q('#flRType').value + ') · <b>' + n + ' part' + (n !== 1 ? 's' : '') + '</b> — sent to the supplier as one RFQ with its own DFM + quote.'; } goto(s); }
    function render() { var el = q('#flRList'); if (!rParts.length) { el.innerHTML = '<div class="fl-empty">No parts yet — upload one or more CAD files above.</div>'; } else { el.innerHTML = rParts.map(function (p, i) { return '<div class="fl-prow"><span class="thumb">' + CUBE + '</span><div class="gw"><input class="fl-pname" value="' + esc(p.name) + '" data-i="' + i + '"><div class="muted fs-12">' + p.number + ' · Rev 1 · ' + p.file + '</div></div><button class="fl-px" data-rm="' + i + '">×</button></div>'; }).join(''); Array.prototype.forEach.call(el.querySelectorAll('.fl-pname'), function (inp) { inp.addEventListener('input', function () { rParts[+inp.getAttribute('data-i')].name = inp.value; }); }); Array.prototype.forEach.call(el.querySelectorAll('[data-rm]'), function (b) { b.addEventListener('click', function () { rParts.splice(+b.getAttribute('data-rm'), 1); render(); }); }); } q('#flRToSend').disabled = rParts.length === 0; }
    bg.addEventListener('click', function (e) {
      if (e.target === bg || (e.target.hasAttribute && e.target.hasAttribute('data-close'))) { close(); return; }
      var n = e.target.getAttribute && e.target.getAttribute('data-next'); if (n) next(n);
    });
    q('#flRFiles').addEventListener('change', function (e) { Array.prototype.forEach.call(e.target.files, function (f) { rParts.push({ name: titleCase(f.name), number: 'P-' + (101 + rParts.length), file: f.name }); }); e.target.value = ''; render(); });
    q('#flRCopy').addEventListener('click', function () { var i = q('#flRLink'); i.select(); try { document.execCommand('copy'); } catch (e) {} });
    q('#flRCreate').addEventListener('click', function () {
      var name = q('#flRName').value.trim() || 'Untitled RFQ', type = q('#flRType').value, proj = q('#flRProj').value, sup = q('#flRSup').value.trim() || 'supplier@example.com';
      var token = Math.random().toString(36).slice(2, 10);
      S.addRFQ({ id: 'r' + Date.now(), name: name, type: type, projectName: proj, supplier: sup, parts: rParts.slice(), token: token, status: 'In DFM review' });
      S.addLink({ token: token, projectName: name, supplier: sup, parts: rParts.slice() });
      q('#flRLink').value = 'https://chorus-v0.app/r/' + token;
      var n = rParts.length;
      q('#flRDone').innerHTML = n + ' part' + (n !== 1 ? 's' : '') + ' in <b>' + name + '</b> (' + type + ') · magic link sent to ' + sup;
      goto('done');
    });
    bg._open = function () { rParts = []; render(); q('#flRName').value = ''; q('#flRSup').value = ''; goto('1'); bg.classList.add('open'); setTimeout(function () { q('#flRName').focus(); }, 30); };
  }

  // ============================ NEW PART MODAL ============================
  var pFile = null;
  function buildPart() {
    if (document.getElementById('flPartBg')) return;
    var bg = document.createElement('div'); bg.className = 'fl-bg'; bg.id = 'flPartBg';
    bg.innerHTML =
      '<div class="fl-modal" style="width:min(480px,94%)">' +
        '<div class="fl-head"><h3>New part</h3><button class="fl-x" data-close>×</button></div>' +
        '<div class="fl-body">' +
          '<p>A part carries its own revisions and DFM issues. Add its details and upload the package — the first upload becomes <b>Rev A</b>.</p>' +
          '<div class="fl-row2"><div class="field"><label>Part name</label><input class="input" id="flPName" placeholder="e.g. Charge-port cap"></div><div class="field"><label>Part number</label><input class="input" id="flPNum" placeholder="e.g. TM-4-2007"></div></div>' +
          '<div class="field"><label>Process</label><div class="select-wrap"><select class="select" id="flPRfq"><option>Injection Mold</option><option>CNC</option><option>Sheet Metal</option><option>Die Cast</option></select></div></div>' +
          '<label class="fl-drop"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 16V4m0 0L7 9m5-5 5 5M5 20h14" stroke="#1c1c1c" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg> <span id="flPTxt">Upload package → Rev A</span><input id="flPFile" type="file" accept=".step,.stp,.stl,.pdf,.glb,.gltf,.obj" hidden></label>' +
        '</div>' +
        '<div class="fl-foot"><span class="muted fs-12">Creates the part on Rev A</span><span class="fl-grow"></span><button class="btn" data-close>Cancel</button><button class="btn btn--primary" id="flPCreate">Create part</button></div>' +
      '</div>';
    document.body.appendChild(bg);
    function q(s) { return bg.querySelector(s); }
    bg.addEventListener('click', function (e) { if (e.target === bg || (e.target.hasAttribute && e.target.hasAttribute('data-close'))) bg.classList.remove('open'); });
    q('#flPFile').addEventListener('change', function (e) { pFile = e.target.files[0] || null; if (pFile) { q('#flPTxt').textContent = pFile.name; if (!q('#flPName').value) q('#flPName').value = titleCase(pFile.name); } });
    q('#flPCreate').addEventListener('click', function () {
      var name = q('#flPName').value.trim() || 'New part', num = q('#flPNum').value.trim() || ('TM-4-' + (1007 + S.parts().length));
      S.addPart({ id: 'p' + Date.now(), name: name, number: num, rfq: q('#flPRfq').value, file: pFile ? pFile.name : '' });
      bg.classList.remove('open');
      appendPartRow(name, num);
      toast(name + ' created on Rev A');
    });
    bg._open = function () { pFile = null; q('#flPName').value = ''; q('#flPNum').value = ''; q('#flPTxt').textContent = 'Upload package → Rev A'; bg.classList.add('open'); setTimeout(function () { q('#flPName').focus(); }, 30); };
  }
  function appendPartRow(name, num) {
    var firstRow = document.querySelector('table.tbl tbody tr');
    if (!firstRow || !firstRow.querySelector('.part-cell')) return;
    var n = firstRow.children.length;
    var tr = document.createElement('tr'); tr.className = 'clickable'; tr.onclick = function () { location.href = 'part-detail.html'; };
    var cells = '<td><div class="part-cell"><span class="thumb">' + CUBE + '</span><span><span class="pname">' + name + '</span><br><span class="pid">' + num + '</span></span></div></td><td>Rev A</td><td>Injection Mold</td><td><span class="badge badge--soft">New</span></td>';
    for (var i = 3; i < n; i++) cells += '<td class="muted">—</td>';
    tr.innerHTML = cells; firstRow.parentNode.insertBefore(tr, firstRow);
  }

  // ============================ render created RFQs into list/items tables ============================
  function renderCreatedRFQs() {
    var rfqsBody = document.getElementById('rfqsBody');
    var itemsBody = document.getElementById('itemsBody');
    if (!rfqsBody && !itemsBody) return;
    var curProj = (new URLSearchParams(location.search).get('p')) || 'TM-4 Bike Program';
    S.rfqs().forEach(function (r) {
      var parts = (r.parts || []).length;
      if (rfqsBody) {
        var tr = document.createElement('tr'); tr.className = 'clickable'; tr.onclick = function () { location.href = 'part-detail.html'; };
        tr.innerHTML = '<td><div><span class="rfq-name">' + r.name + '</span><br/><span class="rfq-sub">' + r.projectName + ' · ' + parts + ' part' + (parts !== 1 ? 's' : '') + '</span></div></td>' +
          '<td>' + (r.supplier ? r.supplier.split('@')[0] : '—') + '</td><td>Rev 1</td><td><span class="pill muted"><span class="dot"></span>0</span></td><td class="muted">—</td><td class="muted">just now</td><td><span class="badge badge--blue">In DFM review</span></td>';
        rfqsBody.insertBefore(tr, rfqsBody.firstChild);
      }
      if (itemsBody && r.projectName === curProj) {
        var tr2 = document.createElement('tr'); tr2.className = 'clickable'; tr2.onclick = function () { location.href = 'part-detail.html'; };
        tr2.innerHTML = '<td><div class="part-cell"><span class="thumb">' + CUBE + '</span><span><span class="pname">' + r.name + '</span><br/><span class="pid">' + parts + ' part' + (parts !== 1 ? 's' : '') + ' · ' + (r.supplier ? r.supplier.split('@')[0] : 'no supplier') + '</span></span></div></td>' +
          '<td><span class="badge badge--soft">' + r.type + '</span></td><td><span class="pill muted"><span class="dot"></span>0</span></td><td><span class="badge badge--blue">In DFM review</span></td><td style="text-align:right" class="muted">Pending</td>';
        itemsBody.insertBefore(tr2, itemsBody.firstChild);
      }
    });
  }

  window.Flows = {
    newRFQ: function () { buildRFQ(); document.getElementById('flRfqBg')._open(); },
    newPart: function () { buildPart(); document.getElementById('flPartBg')._open(); }
  };
  renderCreatedRFQs();
})();
