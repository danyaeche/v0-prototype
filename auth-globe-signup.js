// Signup hero — Stripe-style colorful particle globe on the dark card.
// A sphere of scattered dots colored violet → pink → coral → orange, slowly rotating,
// with colored signal arcs sweeping point-to-point. Globe overflows / is clipped by the card.
import * as THREE from 'three';

const host = document.getElementById('authHero');
if (host) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0, 11.5);
  camera.lookAt(0, 0.2, 0);

  const world = new THREE.Group();
  world.position.y = 0.2;
  world.rotation.z = 0.10;
  scene.add(world);

  const R = 3.0;                      // large so it overflows the panel

  // Stripe-ish gradient: violet → purple → pink → coral → orange
  const STOPS = [0x7a6cff, 0xa64dff, 0xe24bd6, 0xff4d8d, 0xff7a4d].map(h => new THREE.Color(h));
  const grad = t => { const x = Math.min(0.9999, Math.max(0, t)) * (STOPS.length - 1);
    const i = Math.floor(x); return STOPS[i].clone().lerp(STOPS[i + 1], x - i); };

  // ---- Particle sphere (Fibonacci) ----
  const COUNT = 2200;
  const base = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  const pos = new Float32Array(COUNT * 3);
  const col = new Float32Array(COUNT * 3);
  const alpha = new Float32Array(COUNT).fill(1);
  const sz = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    const y = 1 - (i / (COUNT - 1)) * 2;
    const rr = Math.sqrt(1 - y * y);
    const th = golden * i;
    const v = new THREE.Vector3(Math.cos(th) * rr, y, Math.sin(th) * rr);
    base.push(v);
    pos[i*3] = v.x * R; pos[i*3+1] = v.y * R; pos[i*3+2] = v.z * R;
    // color by longitude so the gradient wraps around the globe
    const lon = (Math.atan2(v.z, v.x) + Math.PI) / (2 * Math.PI);
    const c = grad(lon);
    col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b;
    sz[i] = 0.55 + Math.random() * 0.9;   // jitter for the scattered feel
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('pcolor', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('psize', new THREE.BufferAttribute(sz, 1));
  geo.setAttribute('alpha', new THREE.BufferAttribute(alpha, 1));

  const dotTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.5)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.beginPath(); x.arc(32, 32, 32, 0, Math.PI*2); x.fill();
    return new THREE.CanvasTexture(c);
  })();

  const dotMat = new THREE.ShaderMaterial({
    uniforms: { uTex: { value: dotTex }, uSize: { value: 7.0 * Math.min(devicePixelRatio, 2) } },
    transparent: true, depthWrite: false, blending: THREE.NormalBlending,
    vertexShader: `
      attribute float alpha; attribute float psize; attribute vec3 pcolor;
      varying float vA; varying vec3 vC; uniform float uSize;
      void main() {
        vA = alpha; vC = pcolor;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = uSize * psize * (1.0 / -mv.z) * 10.0;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform sampler2D uTex; varying float vA; varying vec3 vC;
      void main() { gl_FragColor = vec4(vC, texture2D(uTex, gl_PointCoord).a * vA); }`,
  });
  const dots = new THREE.Points(geo, dotMat);
  world.add(dots);

  // ---- Colored signal arcs sweeping point-to-point ----
  const SEG = 90, TAIL = 0.34, IPS = 6 * 6;
  const ringTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d'); x.strokeStyle = '#ffffff'; x.lineWidth = 5;
    x.beginPath(); x.arc(32, 32, 20, 0, Math.PI*2); x.stroke();
    return new THREE.CanvasTexture(c);
  })();
  function pick() { return base[(Math.random() * COUNT) | 0]; }
  function makeArc() {
    const o = { t: Math.random(), speed: 0.16 + Math.random() * 0.13 };
    const setup = () => {
      let a = pick(), b = pick(), guard = 0;
      while (a.distanceTo(b) < 1.3 && guard++ < 40) b = pick();
      o.a = a.clone().multiplyScalar(R); const bEnd = b.clone().multiplyScalar(R);
      const ctrl = o.a.clone().add(bEnd).multiplyScalar(0.5).setLength(R + R * (0.2 + Math.random() * 0.4));
      o.curve = new THREE.QuadraticBezierCurve3(o.a, ctrl, bEnd);
      const lon = (Math.atan2((a.z + b.z) / 2, (a.x + b.x) / 2) + Math.PI) / (2 * Math.PI);
      o.color = grad(lon);
      const g = new THREE.TubeGeometry(o.curve, SEG, 0.014, 6, false);
      if (o.mesh) { o.mesh.geometry.dispose(); o.mesh.geometry = g; o.mesh.material.color = o.color; }
      else { o.mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: o.color,
        transparent: true, opacity: 0.8, depthWrite: false }));
        world.add(o.mesh); }
      o.mesh.geometry.setDrawRange(0, 0);
      if (!o.node) { o.node = new THREE.Sprite(new THREE.SpriteMaterial({ map: ringTex,
        transparent: true, depthWrite: false, opacity: 0 }));
        o.node.scale.setScalar(0.32); world.add(o.node); }
      o.node.material.color = o.color; o.node.position.copy(o.a);
    };
    setup(); o.respawn = setup;
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

  const aAttr = geo.getAttribute('alpha'), arr = aAttr.array;
  const tmp = new THREE.Vector3();
  let last = performance.now(), frame = 0;
  (function animate() {
    requestAnimationFrame(animate);
    const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
    dots.rotation.y += 0.0024;

    if ((frame++ % 3) === 0) {
      const q = dots.quaternion;
      for (let i = 0; i < COUNT; i++) {
        tmp.copy(base[i]).applyQuaternion(q);
        const front = (tmp.z + 1) * 0.5;          // far side faint, front bright
        arr[i] = 0.16 + 0.84 * front * front;
      }
      aAttr.needsUpdate = true;
    }

    arcs.forEach(o => {
      o.t += o.speed * dt;
      if (o.t >= 1 + TAIL) { o.t = 0; o.respawn(); }
      const head = Math.min(1, o.t), tail = Math.max(0, o.t - TAIL);
      const start = Math.round(tail * SEG) * IPS;
      const count = Math.max(0, Math.round(head * SEG) * IPS - start);
      o.mesh.geometry.setDrawRange(start, count);
      const f = Math.sin(Math.min(1, o.t) * Math.PI);
      o.mesh.material.opacity = 0.75 * f;
      o.node.material.opacity = 0.9 * f;
    });
    renderer.render(scene, camera);
  })();
}
