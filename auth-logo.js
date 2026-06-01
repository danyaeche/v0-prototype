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

  // ---- Signal arcs: bigger/longer/slower trails that emanate, bow high & return (same as signup) ----
  const SEG = 140, TAIL = 0.6, RAD = 6, IPS = RAD * 6;
  const ARC_COLOR = 0xe6ecec;     // soft white-grey

  const ringTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d'); x.strokeStyle = '#ffffff'; x.lineWidth = 5;
    x.beginPath(); x.arc(32, 32, 20, 0, Math.PI*2); x.stroke();
    return new THREE.CanvasTexture(c);
  })();
  function randPt() {             // random point on the unit sphere → scaled to R
    const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    return new THREE.Vector3(Math.cos(th) * s, u, Math.sin(th) * s).multiplyScalar(R);
  }
  function makeArc() {
    const o = { t: Math.random(), speed: 0.075 + Math.random() * 0.05 };   // slower cadence
    const setup = () => {
      let a = randPt(), b = randPt(), guard = 0;
      // wide spans so the arc travels far across the globe (more curvature)
      while (a.distanceTo(b) < R * 1.2 && guard++ < 80) b = randPt();
      o.a = a.clone(); const bEnd = b.clone();
      // big lift → arc bows high above the surface
      const ctrl = o.a.clone().add(bEnd).multiplyScalar(0.5).setLength(R + R * (0.9 + Math.random() * 0.7));
      o.curve = new THREE.QuadraticBezierCurve3(o.a, ctrl, bEnd);
      const g = new THREE.TubeGeometry(o.curve, SEG, 0.012, RAD, false);
      if (o.mesh) { o.mesh.geometry.dispose(); o.mesh.geometry = g; }
      else { o.mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: ARC_COLOR,
        transparent: true, opacity: 0.5, depthWrite: false })); world.add(o.mesh); }
      o.mesh.geometry.setDrawRange(0, 0);
      if (!o.node) { o.node = new THREE.Sprite(new THREE.SpriteMaterial({ map: ringTex, color: ARC_COLOR,
        transparent: true, depthWrite: false, opacity: 0 })); o.node.scale.setScalar(0.16); world.add(o.node); }
      o.node.position.copy(o.a);
      if (!o.endNode) { o.endNode = new THREE.Sprite(new THREE.SpriteMaterial({ map: ringTex, color: ARC_COLOR,
        transparent: true, depthWrite: false, opacity: 0 })); o.endNode.scale.setScalar(0.16); world.add(o.endNode); }
      o.endNode.position.copy(bEnd);
    };
    setup(); o.respawn = setup;
    return o;
  }
  const arcs = Array.from({ length: 8 }, makeArc);

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
      const head = Math.min(1, o.t), tail = Math.max(0, o.t - TAIL);
      const start = Math.round(tail * SEG) * IPS;
      const count = Math.max(0, Math.round(head * SEG) * IPS - start);
      o.mesh.geometry.setDrawRange(start, count);
      const f = Math.sin(Math.min(1, o.t) * Math.PI);
      o.mesh.material.opacity = 0.5 * f;
      o.node.material.opacity = 0.7 * f * Math.max(0, 1 - o.t * 1.4);   // source fades as it leaves
      o.endNode.material.opacity = (o.t > 0.82) ? 0.7 * f : 0;          // destination on arrival
    });
    renderer.render(scene, camera);
  })();
}
