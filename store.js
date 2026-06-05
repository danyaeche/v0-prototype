// Tiny client-side store for the Chorus v0 prototype.
// Persists workspaces, created projects, parts, and magic links in localStorage
// so the create-flows (new workspace · new project → CAD → parts → magic link)
// feel real as you navigate between pages. Prototype-only — no backend.
//
// Hierarchy: Workspace → Project → RFQ → Part → Revision → (Comments + Quotes)
(function () {
  var KEY = 'chorus.v0';
  var SEED_WS = [
    { id: 'simplyops', name: 'SimplyOps', sub: 'Ops & DFM', seeded: true },
    { id: 'also', name: 'ALSO', sub: 'Micromobility brand', seeded: true }
  ];
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }

  window.ChorusStore = {
    // ---- workspaces ----
    workspaces: function () { return SEED_WS.concat(load().workspaces || []); },
    currentWorkspace: function () {
      var d = load(), id = d.currentWs || 'simplyops', all = this.workspaces();
      return all.filter(function (w) { return w.id === id; })[0] || all[0];
    },
    setWorkspace: function (id) { var d = load(); d.currentWs = id; save(d); },
    addWorkspace: function (w) {
      var d = load(); d.workspaces = d.workspaces || [];
      w.id = 'ws' + Date.now(); w.created = true;
      d.workspaces.push(w); d.currentWs = w.id; save(d); return w;
    },
    // ---- projects (tagged with the workspace they were created in) ----
    projects: function () { return load().projects || []; },
    projectsForCurrentWs: function () {
      var ws = this.currentWorkspace().id;
      return this.projects().filter(function (p) { return (p.ws || 'simplyops') === ws; });
    },
    addProject: function (p) {
      var d = load(); d.projects = d.projects || [];
      p.ws = (d.currentWs || 'simplyops');
      d.projects.push(p); save(d); return p;
    },
    // ---- magic links ----
    links: function () { return load().links || []; },
    addLink: function (l) { var d = load(); d.links = d.links || []; d.links.push(l); save(d); return l; },
    latestLink: function () { var l = this.links(); return l.length ? l[l.length - 1] : null; },
    // ---- RFQs (each is a single-part or assembly item under a project) ----
    rfqs: function () { return load().rfqs || []; },
    rfqsForProject: function (projName) { return this.rfqs().filter(function (r) { return r.projectName === projName; }); },
    addRFQ: function (r) { var d = load(); d.rfqs = d.rfqs || []; r.ws = (d.currentWs || 'simplyops'); d.rfqs.push(r); save(d); return r; },
    // ---- parts ----
    parts: function () { return load().parts || []; },
    addPart: function (p) { var d = load(); d.parts = d.parts || []; d.parts.push(p); save(d); return p; },
    reset: function () { save({}); }
  };
})();
