// Auth hero — a clean latitude/longitude wireframe globe, slowly rotating,
// with a few satellites orbiting on thin tilted rings. White lines on the dark panel.
import * as THREE from 'three';

const host = document.getElementById('authHero');
if (host) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0, 16);
  camera.lookAt(0, 0.5, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(4, 5, 6); scene.add(key);

  const world = new THREE.Group();
  world.position.y = 0.6;
  world.rotation.z = 0.18;
  scene.add(world);

  const R = 2.05;
  const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.30 });

  // ---- Wireframe globe ----
  const globe = new THREE.Group();
  // longitudes (meridians)
  const MERIDIANS = 16;
  for (let i = 0; i < MERIDIANS; i++) {
    const c = new THREE.EllipseCurve(0, 0, R, R, 0, Math.PI * 2);
    const pts = c.getPoints(120).map(p => new THREE.Vector3(p.x, p.y, 0));
    const l = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), lineMat);
    l.rotation.y = (i / MERIDIANS) * Math.PI;
    globe.add(l);
  }
  // latitudes (parallels)
  const PARALLELS = 11;
  for (let j = 1; j < PARALLELS; j++) {
    const lat = (j / PARALLELS) * Math.PI - Math.PI / 2;
    const r = Math.cos(lat) * R, y = Math.sin(lat) * R;
    const c = new THREE.EllipseCurve(0, 0, r, r, 0, Math.PI * 2);
    const pts = c.getPoints(120).map(p => new THREE.Vector3(p.x, y, p.y));
    globe.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
  }
  // faint dark core so front lines read brighter than the back
  globe.add(new THREE.Mesh(
    new THREE.SphereGeometry(R * 0.99, 48, 32),
    new THREE.MeshBasicMaterial({ color: 0x0c0c0c, transparent: true, opacity: 0.78 })
  ));
  world.add(globe);

  // ---- Signal arcs: trails that emanate from the globe surface, bulge out, and return ----
  const SEG = 64;                 // points along each arc
  const TAIL = 0.32;              // fraction of the arc lit at once (the moving "comet")
  function randPt() {             // random point on the unit sphere → scaled to R
    const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    return new THREE.Vector3(Math.cos(th) * s, u, Math.sin(th) * s).multiplyScalar(R);
  }
  // quadratic bezier between two surface points, control point pushed outward
  function arcPoint(a, b, lift, t) {
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const ctrl = mid.clone().setLength(R + lift);
    const it = 1 - t;
    return a.clone().multiplyScalar(it * it)
      .add(ctrl.clone().multiplyScalar(2 * it * t))
      .add(b.clone().multiplyScalar(t * t));
  }
  function makeArc() {
    let a = randPt(), b = randPt();
    while (a.distanceTo(b) < R) b = randPt();      // ensure a real span
    const lift = R * (0.5 + Math.random() * 0.7);
    const path = [];
    for (let i = 0; i <= SEG; i++) path.push(arcPoint(a, b, lift, i / SEG));
    const geo = new THREE.BufferGeometry().setFromPoints(path);
    const mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
    const line = new THREE.Line(geo, mat);
    line.geometry.setDrawRange(0, 0);
    world.add(line);
    return { line, path, t: Math.random(), speed: 0.14 + Math.random() * 0.16,
             respawn() { a = randPt(); b = randPt();
               while (a.distanceTo(b) < R) b = randPt();
               const lf = R * (0.5 + Math.random() * 0.7);
               for (let i = 0; i <= SEG; i++) path[i].copy(arcPoint(a, b, lf, i / SEG));
               geo.setFromPoints(path); } };
  }
  const arcs = Array.from({ length: 5 }, makeArc);

  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host);
  resize();

  let last = performance.now();
  (function animate() {
    requestAnimationFrame(animate);
    const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
    globe.rotation.y += 0.004;                 // slow globe spin

    arcs.forEach(o => {
      o.t += o.speed * dt;
      if (o.t >= 1 + TAIL) { o.t = 0; o.respawn(); }   // returned to surface → new arc
      // a lit window [head-TAIL, head] sweeps from launch point back down to the surface
      const head = Math.min(1, o.t);
      const tail = Math.max(0, o.t - TAIL);
      const start = Math.round(tail * SEG);
      const count = Math.max(0, Math.round(head * SEG) - start);
      o.line.geometry.setDrawRange(start, count);
      // fade in as it leaves the surface, fade out as it returns
      o.line.material.opacity = 0.55 * Math.sin(Math.min(1, o.t) * Math.PI);
    });
    renderer.render(scene, camera);
  })();
}
