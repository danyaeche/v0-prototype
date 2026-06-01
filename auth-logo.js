// Auth hero — a minimal dotted particle globe with a couple of thin orbital arcs,
// slowly rotating. Light particles on the dark panel, fading toward shadow at the back.
import * as THREE from 'three';

const host = document.getElementById('authHero');
if (host) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0.5, 0);

  const world = new THREE.Group();
  world.position.y = 0.65;
  world.rotation.z = 0.22;
  scene.add(world);

  const R = 2.0;

  // ---- Dotted globe: points distributed evenly on a sphere (Fibonacci) ----
  const COUNT = 1400;
  const pos = new Float32Array(COUNT * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < COUNT; i++) {
    const y = 1 - (i / (COUNT - 1)) * 2;      // 1..-1
    const r = Math.sqrt(1 - y * y);
    const th = golden * i;
    pos[i*3]   = Math.cos(th) * r * R;
    pos[i*3+1] = y * R;
    pos[i*3+2] = Math.sin(th) * r * R;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

  // soft round sprite for each dot
  const sprite = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.5)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.beginPath(); x.arc(32, 32, 32, 0, Math.PI*2); x.fill();
    return new THREE.CanvasTexture(c);
  })();

  const dots = new THREE.Points(geo, new THREE.PointsMaterial({
    map: sprite, size: 0.05, transparent: true, opacity: 0.9,
    depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
  }));
  world.add(dots);

  // ---- A few thin orbital arcs ----
  function arc(radius, tiltX, tiltY, opacity) {
    const c = new THREE.EllipseCurve(0, 0, radius, radius, 0, Math.PI * 2);
    const pts = c.getPoints(160).map(p => new THREE.Vector3(p.x, p.y, 0));
    const line = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity })
    );
    line.rotation.x = tiltX; line.rotation.y = tiltY;
    return line;
  }
  const ringA = arc(R * 1.32, 1.28, 0.15, 0.22);
  const ringB = arc(R * 1.5,  1.05, -0.4, 0.14);
  world.add(ringA, ringB);

  // one small satellite riding ring A
  const sat = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  ringA.add(sat);

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
    dots.rotation.y += 0.0035;          // slow globe spin
    ringA.rotation.z += 0.0015;
    const a = t * 0.5;                   // satellite travels its ring
    sat.position.set(Math.cos(a) * R * 1.32, Math.sin(a) * R * 1.32, 0);
    renderer.render(scene, camera);
  })();
}
