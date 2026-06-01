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
  camera.position.set(0, 0, 10);
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

  // ---- Satellites on thin tilted orbit rings ----
  const ringMat = (o) => new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: o });
  const orbits = [
    { r: R * 1.42, tiltX: 1.25, tiltY: 0.15, speed: 0.55, size: 0.075, phase: 0,   ringOp: 0.18 },
    { r: R * 1.68, tiltX: 0.95, tiltY: -0.5, speed: -0.4, size: 0.06,  phase: 2.2, ringOp: 0.12 },
    { r: R * 1.95, tiltX: 1.4,  tiltY: 0.6,  speed: 0.3,  size: 0.05,  phase: 4.1, ringOp: 0.08 },
  ];
  const satMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const sats = orbits.map(o => {
    const ring = new THREE.Group();
    ring.rotation.x = o.tiltX; ring.rotation.y = o.tiltY;
    const c = new THREE.EllipseCurve(0, 0, o.r, o.r, 0, Math.PI * 2);
    const pts = c.getPoints(140).map(p => new THREE.Vector3(p.x, p.y, 0));
    ring.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), ringMat(o.ringOp)));
    const sat = new THREE.Mesh(new THREE.SphereGeometry(o.size, 18, 14), satMat);
    ring.add(sat);
    world.add(ring);
    return { ...o, sat };
  });

  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host);
  resize();

  const start = performance.now();
  (function animate() {
    requestAnimationFrame(animate);
    const t = (performance.now() - start) / 1000;
    globe.rotation.y += 0.004;                 // slow globe spin
    sats.forEach(o => {
      const a = o.phase + t * o.speed;
      o.sat.position.set(Math.cos(a) * o.r, Math.sin(a) * o.r, 0);
    });
    renderer.render(scene, camera);
  })();
}
