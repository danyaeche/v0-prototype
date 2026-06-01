// Signup hero — Stripe-style dotted-Earth globe: dots placed only on the continents
// (sampled from a land/water mask), colored across a violet → pink → orange gradient by
// longitude, slowly rotating, overflowing the card, with colored signal arcs + ring nodes.
import * as THREE from 'three';

const host = document.getElementById('authHero');
if (host) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  // Stripe framing: full globe, large, centered horizontally, sitting slightly low so the
  // top curve shows in the upper third and the bottom bleeds off the panel.
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0, 12.5);
  camera.lookAt(0, -0.9, 0);

  const world = new THREE.Group();
  world.position.set(0, -0.9, 0);
  world.rotation.z = 0.06;
  scene.add(world);

  const R = 3.2;                       // big → overflows / clipped by the card

  // monochrome white → grey gradient (by longitude)
  const STOPS = [0xffffff, 0xe4e8e8, 0xbfc5c6, 0xd2d7d7, 0xeef1f1].map(h => new THREE.Color(h));
  const grad = t => { const x = Math.min(0.9999, Math.max(0, t)) * (STOPS.length - 1);
    const i = Math.floor(x); return STOPS[i].clone().lerp(STOPS[i + 1], x - i); };

  // local color lookup by world-space longitude for arcs (matches the dots)
  function colByLon(v) {
    const lon = (Math.atan2(v.z, v.x) + Math.PI) / (2 * Math.PI);
    return grad(lon);
  }

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
    uniforms: { uTex: { value: dotTex }, uSize: { value: 5.5 * Math.min(devicePixelRatio, 2) } },
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

  let dots, geo, base = [], COUNT = 0;
  const arcs = [];

  function build(isLand) {
    const CAND = 26000;
    const golden = Math.PI * (3 - Math.sqrt(5));
    const dir = [], cArr = [], sArr = [];
    for (let i = 0; i < CAND; i++) {
      const y = 1 - (i / (CAND - 1)) * 2;
      const rr = Math.sqrt(1 - y * y);
      const th = golden * i;
      const v = new THREE.Vector3(Math.cos(th) * rr, y, Math.sin(th) * rr);
      const u = 0.5 + Math.atan2(v.z, v.x) / (2 * Math.PI);
      const vv = 0.5 - Math.asin(v.y) / Math.PI;
      if (!isLand(u, vv)) continue;
      dir.push(v);
      const c = grad(u);                 // color by longitude
      cArr.push(c.r, c.g, c.b);
      sArr.push(0.5 + Math.random() * 0.7);
    }
    base = dir; COUNT = dir.length;
    const pos = new Float32Array(COUNT * 3);
    const alpha = new Float32Array(COUNT).fill(1);
    for (let i = 0; i < COUNT; i++) { pos[i*3]=dir[i].x*R; pos[i*3+1]=dir[i].y*R; pos[i*3+2]=dir[i].z*R; }
    geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('pcolor', new THREE.BufferAttribute(new Float32Array(cArr), 3));
    geo.setAttribute('psize', new THREE.BufferAttribute(new Float32Array(sArr), 1));
    geo.setAttribute('alpha', new THREE.BufferAttribute(alpha, 1));
    dots = new THREE.Points(geo, dotMat);
    world.add(dots);
    for (let i = 0; i < 6; i++) arcs.push(makeArc());
  }

  // ---- colored signal arcs + ring nodes ----
  const SEG = 96, TAIL = 0.34, IPS = 6 * 6;
  const ringTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d'); x.strokeStyle = '#ffffff'; x.lineWidth = 5;
    x.beginPath(); x.arc(32, 32, 20, 0, Math.PI*2); x.stroke();
    return new THREE.CanvasTexture(c);
  })();
  function pick() { return base[(Math.random() * COUNT) | 0]; }
  function makeArc() {
    const o = { t: Math.random(), speed: 0.15 + Math.random() * 0.12 };
    const setup = () => {
      let a = pick(), b = pick(), guard = 0;
      while (a.distanceTo(b) < 1.3 && guard++ < 40) b = pick();
      o.a = a.clone().multiplyScalar(R); const bEnd = b.clone().multiplyScalar(R);
      const ctrl = o.a.clone().add(bEnd).multiplyScalar(0.5).setLength(R + R * (0.22 + Math.random() * 0.4));
      o.curve = new THREE.QuadraticBezierCurve3(o.a, ctrl, bEnd);
      o.color = colByLon(a.clone().add(b).multiplyScalar(0.5));
      const g = new THREE.TubeGeometry(o.curve, SEG, 0.011, 6, false);
      if (o.mesh) { o.mesh.geometry.dispose(); o.mesh.geometry = g; o.mesh.material.color = o.color; }
      else { o.mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: o.color,
        transparent: true, opacity: 0.85, depthWrite: false })); world.add(o.mesh); }
      o.mesh.geometry.setDrawRange(0, 0);
      if (!o.node) { o.node = new THREE.Sprite(new THREE.SpriteMaterial({ map: ringTex,
        transparent: true, depthWrite: false, opacity: 0 })); o.node.scale.setScalar(0.3); world.add(o.node); }
      o.node.material.color = o.color; o.node.position.copy(o.a);
    };
    setup(); o.respawn = setup;
    return o;
  }

  // ---- load land mask, then build ----
  const img = new Image(); img.crossOrigin = 'anonymous';
  img.onload = () => {
    const cw = 1024, ch = 512;
    const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
    const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0, cw, ch);
    const data = cx.getImageData(0, 0, cw, ch).data;
    const isLand = (u, v) => {            // earth-water.png: land = dark
      const px = Math.min(cw - 1, Math.max(0, (u * cw) | 0));
      const py = Math.min(ch - 1, Math.max(0, (v * ch) | 0));
      const idx = (py * cw + px) * 4;
      return (data[idx] + data[idx+1] + data[idx+2]) / 3 < 110;
    };
    build(isLand);
  };
  img.onerror = () => build(() => true);
  img.src = 'assets/earth-water.png';

  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host);
  resize();

  const tmp = new THREE.Vector3();
  let last = performance.now(), frame = 0;
  (function animate() {
    requestAnimationFrame(animate);
    const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (dots) {
      dots.rotation.y += 0.0022;
      if ((frame++ % 2) === 0) {
        const q = dots.quaternion, arr = geo.getAttribute('alpha').array;
        for (let i = 0; i < COUNT; i++) {
          tmp.copy(base[i]).applyQuaternion(q);
          // front bright & fully visible; far side dimmed but still present (like the reference)
          const front = (tmp.z + 1) * 0.5;          // 0 back, 1 front
          arr[i] = 0.45 + 0.55 * front;
        }
        geo.getAttribute('alpha').needsUpdate = true;
      }
      arcs.forEach(o => {
        o.t += o.speed * dt;
        if (o.t >= 1 + TAIL) { o.t = 0; o.respawn(); }
        const head = Math.min(1, o.t), tail = Math.max(0, o.t - TAIL);
        const start = Math.round(tail * SEG) * IPS;
        const count = Math.max(0, Math.round(head * SEG) * IPS - start);
        o.mesh.geometry.setDrawRange(start, count);
        const f = Math.sin(Math.min(1, o.t) * Math.PI);
        o.mesh.material.opacity = 0.8 * f; o.node.material.opacity = 0.95 * f;
      });
    }
    renderer.render(scene, camera);
  })();
}
