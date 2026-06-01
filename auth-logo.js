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

  // ---- Signal arcs: bright tube trails that emanate from the surface, bulge out, return ----
  const SEG = 90;                 // tubular segments along each arc
  const RAD = 8;                  // radial segments of the tube
  const IPS = RAD * 6;            // index entries per tubular segment (for drawRange)
  const TAIL = 0.34;              // fraction of the arc lit at once (the moving "comet")
  const ARC_COLOR = 0xcfe0e0;     // soft, dim white-grey (not a bright glow)

  function randPt() {             // random point on the unit sphere → scaled to R
    const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    return new THREE.Vector3(Math.cos(th) * s, u, Math.sin(th) * s).multiplyScalar(R);
  }
  function newCurve() {
    let a = randPt(), b = randPt();
    while (a.distanceTo(b) < R) b = randPt();            // ensure a real span
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const ctrl = mid.setLength(R + R * (0.55 + Math.random() * 0.7));
    return new THREE.QuadraticBezierCurve3(a, ctrl, b);
  }

  // glowing round sprite for the comet head
  const dotTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(230,238,238,0.85)');
    g.addColorStop(0.4, 'rgba(207,224,224,0.5)');
    g.addColorStop(1, 'rgba(207,224,224,0)');
    x.fillStyle = g; x.beginPath(); x.arc(32, 32, 32, 0, Math.PI*2); x.fill();
    return new THREE.CanvasTexture(c);
  })();

  function makeArc() {
    const o = { curve: newCurve(), t: Math.random(), speed: 0.18 + Math.random() * 0.14, mesh: null };
    const rebuild = () => {
      const geo = new THREE.TubeGeometry(o.curve, SEG, 0.03, RAD, false);
      if (o.mesh) { o.mesh.geometry.dispose(); o.mesh.geometry = geo; }
      else {
        const mat = new THREE.MeshBasicMaterial({ color: ARC_COLOR, transparent: true,
          opacity: 0.4, depthWrite: false });
        o.mesh = new THREE.Mesh(geo, mat); world.add(o.mesh);
      }
      o.mesh.geometry.setDrawRange(0, 0);
    };
    rebuild();
    // small soft head dot (no additive glow)
    o.head = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, color: ARC_COLOR,
      transparent: true, depthWrite: false, opacity: 0 }));
    o.head.scale.setScalar(0.26);
    world.add(o.head);
    o.respawn = () => { o.curve = newCurve(); rebuild(); };
    return o;
  }
  const arcs = Array.from({ length: 14 }, makeArc);

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
      const start = Math.round(tail * SEG) * IPS;
      const count = Math.max(0, Math.round(head * SEG) * IPS - start);
      o.mesh.geometry.setDrawRange(start, count);
      o.mesh.material.opacity = 0.42 * Math.sin(Math.min(1, o.t) * Math.PI);
      // soft head rides the leading tip
      if (head < 1) {
        o.head.position.copy(o.curve.getPoint(head));
        o.head.material.opacity = 0.5 * Math.sin(head * Math.PI);
      } else {
        o.head.material.opacity = 0;
      }
    });
    renderer.render(scene, camera);
  })();
}
