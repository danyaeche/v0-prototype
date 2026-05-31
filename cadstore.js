// Tiny IndexedDB handoff for CAD files (no size cap, stores the Blob directly).
// Used by the Parts "Upload CAD" button (put) and the viewer (take).
(function () {
  var DB = 'also-cad', STORE = 'files', KEY = 'pending';

  function openDB() {
    return new Promise(function (res, rej) {
      var r = indexedDB.open(DB, 1);
      r.onupgradeneeded = function () { r.result.createObjectStore(STORE); };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
    });
  }

  function putCad(name, blob) {
    return openDB().then(function (db) {
      return new Promise(function (res, rej) {
        var tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put({ name: name, blob: blob }, KEY);
        tx.oncomplete = function () { res(); };
        tx.onerror = function () { rej(tx.error); };
      });
    });
  }

  // Returns {name, blob} or null, and clears the record so it loads once.
  function takeCad() {
    return openDB().then(function (db) {
      return new Promise(function (res, rej) {
        var tx = db.transaction(STORE, 'readwrite');
        var store = tx.objectStore(STORE);
        var g = store.get(KEY);
        g.onsuccess = function () { store.delete(KEY); res(g.result || null); };
        g.onerror = function () { rej(g.error); };
      });
    });
  }

  window.CadStore = { putCad: putCad, takeCad: takeCad };
})();
