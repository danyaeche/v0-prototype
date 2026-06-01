// Real-time 3D coil logo for the auth pages — renders the Chorus coil as actual
// 3D geometry (stacked tori forming a coil ball) and spins it slowly in space.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const host = document.getElementById('authHero');
if (host) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.05).texture;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 7.4);

  scene.add(new THREE.AmbientLight(0xffffff, 0.45));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(3, 5, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 1.1); rim.position.set(-5, -2, -4); scene.add(rim);

  // Soft off-white material so lighting reads the 3D form (pure-flat white would look 2D)
  const mat = new THREE.MeshStandardMaterial({ color: 0xf4f5f5, metalness: 0.35, roughness: 0.32 });

  // Build the coil ball: rings stacked along an axis, radius bulging in the middle.
  const rings = new THREE.Group();
  const N = 7, Rmax = 1.7, spread = 0.82, tube = 0.15;
  for (let i = 0; i < N; i++) {
    const t = (i + 0.5) / N;          // 0..1 across the coil
    const a = t * Math.PI;            // 0..PI
    const rr = Rmax * (0.42 + 0.58 * Math.sin(a));  // ring radius (smaller at the ends)
    const x = Rmax * Math.cos(a) * spread;          // position along the coil axis
    const m = new THREE.Mesh(new THREE.TorusGeometry(rr, tube, 24, 96), mat);
    m.rotation.y = Math.PI / 2;       // turn the hole to face along X (the coil axis)
    m.position.x = x;
    rings.add(m);
  }
  // Tilt to match the logo's "/" lean
  rings.rotation.z = 0.62;
  rings.rotation.x = 0.12;

  const spinner = new THREE.Group();
  spinner.add(rings);
  scene.add(spinner);

  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host);
  resize();

  // Gentle entrance scale-in
  let intro = 0;
  (function animate() {
    requestAnimationFrame(animate);
    intro = Math.min(1, intro + 0.018);
    const e = 1 - Math.pow(1 - intro, 3);     // ease-out cubic
    spinner.scale.setScalar(0.82 + 0.18 * e);
    spinner.rotation.y += 0.0075;             // slow continuous 3D spin
    spinner.position.y = Math.sin(performance.now() / 1400) * 0.12; // subtle float
    renderer.render(scene, camera);
  })();
}
