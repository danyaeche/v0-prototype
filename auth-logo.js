// Auth hero — a slowly spinning wireframe globe with orbiting satellites,
// rendered in white / shadow gradients on the dark panel.
import * as THREE from 'three';

const host = document.getElementById('authHero');
if (host) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 9.6);
  camera.lookAt(0, 0.6, 0);   // frame the globe slightly high, leaving room for the headline

  // soft directional light gives the satellites a white→shadow gradient
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(4, 5, 6); scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 0.5); fill.position.set(-6, -3, -4); scene.add(fill);

  const world = new THREE.Group();
  world.rotation.z = 0.35;          // slight tilt
  world.position.y = 0.8;           // lift into the open black space above the headline
  scene.add(world);

  // ---- Globe: latitude/longitude wireframe sphere ----
  const globe = new THREE.Group();
  const R = 2.0;
  const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.32 });
  // longitudes
  for (let i = 0; i < 12; i++) {
    const c = new THREE.EllipseCurve(0, 0, R, R, 0, Math.PI * 2);
    const pts = c.getPoints(96).map(p => new THREE.Vector3(p.x, p.y, 0));
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    const l = new THREE.LineLoop(g, lineMat);
    l.rotation.y = (i / 12) * Math.PI;
    globe.add(l);
  }
  // latitudes
  for (let j = 1; j < 7; j++) {
    const lat = (j / 7) * Math.PI - Math.PI / 2;
    const r = Math.cos(lat) * R, y = Math.sin(lat) * R;
    const c = new THREE.EllipseCurve(0, 0, r, r, 0, Math.PI * 2);
    const pts = c.getPoints(96).map(p => new THREE.Vector3(p.x, y, p.y));
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    globe.add(new THREE.LineLoop(g, lineMat));
  }
  // faint solid core so the front lines read brighter than the back
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(R * 0.985, 48, 32),
    new THREE.MeshStandardMaterial({ color: 0x0c0c0c, roughness: 1, metalness: 0,
      transparent: true, opacity: 0.92 })
  );
  globe.add(core);
  world.add(globe);

  // ---- Satellites: small spheres on tilted orbit rings ----
  const orbits = [
    { r: 3.1, tiltX: 1.15, tiltY: 0.2,  speed: 0.55, size: 0.16, phase: 0 },
    { r: 3.7, tiltX: 0.5,  tiltY: 1.1,  speed: -0.4, size: 0.13, phase: 2.1 },
    { r: 4.3, tiltX: 1.35, tiltY: -0.5, speed: 0.3,  size: 0.19, phase: 4.0 },
  ];
  const satMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, metalness: 0.1 });
  const sats = orbits.map(o => {
    const ring = new THREE.Group();
    ring.rotation.x = o.tiltX; ring.rotation.y = o.tiltY;
    // faint orbit path
    const c = new THREE.EllipseCurve(0, 0, o.r, o.r, 0, Math.PI * 2);
    const pts = c.getPoints(120).map(p => new THREE.Vector3(p.x, p.y, 0));
    const path = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12 })
    );
    ring.add(path);
    const sat = new THREE.Mesh(new THREE.SphereGeometry(o.size, 24, 16), satMat);
    ring.add(sat);
    world.add(ring);
    return { ...o, ring, sat };
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
    globe.rotation.y += 0.0045;                 // slow globe spin
    sats.forEach(o => {
      const a = o.phase + t * o.speed;
      o.sat.position.set(Math.cos(a) * o.r, Math.sin(a) * o.r, 0);
    });
    renderer.render(scene, camera);
  })();
}
