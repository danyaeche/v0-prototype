// Signup hero — a Stripe-style dotted particle globe: a dense sphere of small dots,
// slowly rotating, back hemisphere dimmed for depth, with a few thin signal arcs.
import * as THREE from 'three';

const host = document.getElementById('authHero');
if (host) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0, 15);
  camera.lookAt(0, 0.5, 0);

  const world = new THREE.Group();
  world.position.y = 0.6;
  world.rotation.z = 0.16;
  scene.add(world);

  const R = 2.2;

  // ---- Dotted particle sphere (Fibonacci distribution) ----
  const COUNT = 2600;
  const base = [];                                  // unit-sphere directions
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < COUNT; i++) {
    const y = 1 - (i / (COUNT - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = golden * i;
    base.push(new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r));
  }
  const pos = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    pos[i*3] = base[i].x * R; pos[i*3+1] = base[i].y * R; pos[i*3+2] = base[i].z * R;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const alpha = new Float32Array(COUNT).fill(1);
  geo.setAttribute('alpha', new THREE.BufferAttribute(alpha, 1));

  // soft round sprite for each dot
  const dotTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.45, 'rgba(255,255,255,0.6)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.beginPath(); x.arc(32, 32, 32, 0, Math.PI*2); x.fill();
    return new THREE.CanvasTexture(c);
  })();

  // per-point alpha (so back hemisphere can fade) via a tiny ShaderMaterial
  const dotMat = new THREE.ShaderMaterial({
    uniforms: { uTex: { value: dotTex }, uSize: { value: 14.0 * Math.min(devicePixelRatio, 2) },
                uColor: { value: new THREE.Color(0xdfe8ff) } },
    transparent: true, depthWrite: false,
    vertexShader: `
      attribute float alpha; varying float vA; uniform float uSize;
      void main() {
        vA = alpha;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = uSize * (1.0 / -mv.z) * 10.0;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform sampler2D uTex; uniform vec3 uColor; varying float vA;
      void main() {
        vec4 t = texture2D(uTex, gl_PointCoord);
        gl_FragColor = vec4(uColor, t.a * vA);
      }`,
  });
  const dots = new THREE.Points(geo, dotMat);
  world.add(dots);

  // ---- A few thin signal arcs between surface points ----
  const SEG = 80, TAIL = 0.3;
  const ARC_COLOR = 0xcdd9ff;
  function newCurve() {
    const a = base[(Math.random() * COUNT) | 0].clone().multiplyScalar(R);
    let b = base[(Math.random() * COUNT) | 0].clone().multiplyScalar(R);
    while (a.distanceTo(b) < R) b = base[(Math.random() * COUNT) | 0].clone().multiplyScalar(R);
    const ctrl = a.clone().add(b).multiplyScalar(0.5).setLength(R + R * (0.3 + Math.random() * 0.5));
    return new THREE.QuadraticBezierCurve3(a, ctrl, b);
  }
  function makeArc() {
    const o = { curve: newCurve(), t: Math.random(), speed: 0.16 + Math.random() * 0.14 };
    const build = () => {
      const g = new THREE.TubeGeometry(o.curve, SEG, 0.012, 6, false);
      if (o.mesh) { o.mesh.geometry.dispose(); o.mesh.geometry = g; }
      else o.mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: ARC_COLOR,
        transparent: true, opacity: 0.4, depthWrite: false }));
      o.mesh.geometry.setDrawRange(0, 0);
      if (!o.mesh.parent) world.add(o.mesh);
    };
    build();
    o.respawn = () => { o.curve = newCurve(); build(); };
    return o;
  }
  const arcs = Array.from({ length: 7 }, makeArc);

  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host);
  resize();

  const aAttr = geo.getAttribute('alpha');
  const tmp = new THREE.Vector3();
  let last = performance.now();
  (function animate() {
    requestAnimationFrame(animate);
    const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
    dots.rotation.y += 0.0026;                 // slow globe spin

    // fade dots on the far hemisphere (depth) for a real 3D read
    const m = dots.matrixWorld; dots.updateMatrixWorld();
    for (let i = 0; i < COUNT; i++) {
      tmp.copy(base[i]).applyQuaternion(dots.quaternion);
      aAttr.array[i] = 0.18 + 0.82 * Math.max(0, (tmp.z + 1) / 2); // front bright, back faint
    }
    aAttr.needsUpdate = true;

    arcs.forEach(o => {
      o.t += o.speed * dt;
      if (o.t >= 1 + TAIL) { o.t = 0; o.respawn(); }
      const head = Math.min(1, o.t), tail = Math.max(0, o.t - TAIL);
      const ips = 6 * 6;
      const start = Math.round(tail * SEG) * ips;
      const count = Math.max(0, Math.round(head * SEG) * ips - start);
      o.mesh.geometry.setDrawRange(start, count);
      o.mesh.material.opacity = 0.4 * Math.sin(Math.min(1, o.t) * Math.PI);
    });
    renderer.render(scene, camera);
  })();
}
