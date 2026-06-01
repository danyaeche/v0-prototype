// Auth hero — a large dotted-Earth globe: a dense constellation of monochrome (white→grey)
// dots placed only on the continents (sampled from a land/water mask), slowly rotating,
// scaled up so it overflows and is clipped by the dark card. A few faint signal arcs.
import * as THREE from 'three';

const host = document.getElementById('authHero');
if (host) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0, 11);          // closer → globe reads larger
  camera.lookAt(0, 0.2, 0);

  const world = new THREE.Group();
  world.position.y = 0.2;
  world.rotation.z = 0.12;
  scene.add(world);

  const R = 3.15;                          // big enough to overflow the panel

  // monochrome white → grey by longitude (subtle)
  const STOPS = [0xffffff, 0xd8dcdd, 0x9aa2a4, 0xc6cccd, 0xeef1f1].map(h => new THREE.Color(h));
  const grad = t => { const x = Math.min(0.9999, Math.max(0, t)) * (STOPS.length - 1);
    const i = Math.floor(x); return STOPS[i].clone().lerp(STOPS[i + 1], x - i); };

  let dots, geo, base = [], COUNT = 0;
  const arcs = [];

  function buildFrom(isLand) {
    // dense Fibonacci candidates; keep only those that land on a continent
    const CAND = 90000;
    const golden = Math.PI * (3 - Math.sqrt(5));
    const keptDir = [], keptCol = [], keptSz = [];
    for (let i = 0; i < CAND; i++) {
      const y = 1 - (i / (CAND - 1)) * 2;
      const rr = Math.sqrt(1 - y * y);
      const th = golden * i;
      const v = new THREE.Vector3(Math.cos(th) * rr, y, Math.sin(th) * rr);
      const u = 0.5 + Math.atan2(v.z, v.x) / (2 * Math.PI);
      const vv = 0.5 - Math.asin(v.y) / Math.PI;
      if (!isLand(u, vv)) continue;
      keptDir.push(v);
      const c = grad((Math.atan2(v.z, v.x) + Math.PI) / (2 * Math.PI));
      keptCol.push(c.r, c.g, c.b);
      keptSz.push(0.6 + Math.random() * 0.7);
    }
    base = keptDir; COUNT = keptDir.length;

    const pos = new Float32Array(COUNT * 3);
    const alpha = new Float32Array(COUNT).fill(1);
    for (let i = 0; i < COUNT; i++) {
      pos[i*3] = keptDir[i].x * R; pos[i*3+1] = keptDir[i].y * R; pos[i*3+2] = keptDir[i].z * R;
    }
    geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('pcolor', new THREE.BufferAttribute(new Float32Array(keptCol), 3));
    geo.setAttribute('psize', new THREE.BufferAttribute(new Float32Array(keptSz), 1));
    geo.setAttribute('alpha', new THREE.BufferAttribute(alpha, 1));

    dots = new THREE.Points(geo, dotMat);
    world.add(dots);

    // faint monochrome signal arcs after points exist
    for (let i = 0; i < 6; i++) arcs.push(makeArc());
  }

  // soft round sprite
  const dotTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.55)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.beginPath(); x.arc(32, 32, 32, 0, Math.PI*2); x.fill();
    return new THREE.CanvasTexture(c);
  })();

  const dotMat = new THREE.ShaderMaterial({
    uniforms: { uTex: { value: dotTex }, uSize: { value: 13.0 * Math.min(devicePixelRatio, 2) } },
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

  // ---- signal arcs (monochrome) ----
  const SEG = 90, TAIL = 0.32, IPS = 6 * 6;
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
      const ctrl = o.a.clone().add(bEnd).multiplyScalar(0.5).setLength(R + R * (0.18 + Math.random() * 0.35));
      o.curve = new THREE.QuadraticBezierCurve3(o.a, ctrl, bEnd);
      const g = new THREE.TubeGeometry(o.curve, SEG, 0.012, 6, false);
      if (o.mesh) { o.mesh.geometry.dispose(); o.mesh.geometry = g; }
      else { o.mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xe6ecec,
        transparent: true, opacity: 0.4, depthWrite: false })); world.add(o.mesh); }
      o.mesh.geometry.setDrawRange(0, 0);
      if (!o.node) { o.node = new THREE.Sprite(new THREE.SpriteMaterial({ map: ringTex,
        color: 0xcdd3d3, transparent: true, depthWrite: false, opacity: 0 }));
        o.node.scale.setScalar(0.3); world.add(o.node); }
      o.node.position.copy(o.a);
    };
    setup(); o.respawn = setup;
    return o;
  }

  // ---- load the land/water mask, then build ----
  const img = new Image(); img.crossOrigin = 'anonymous';
  img.onload = () => {
    const cw = 1024, ch = 512;
    const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
    const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0, cw, ch);
    const data = cx.getImageData(0, 0, cw, ch).data;
    // earth-water.png: water is bright (white), land is dark → land = low luminance
    const isLand = (u, v) => {
      const px = Math.min(cw - 1, Math.max(0, (u * cw) | 0));
      const py = Math.min(ch - 1, Math.max(0, (v * ch) | 0));
      const idx = (py * cw + px) * 4;
      const lum = (data[idx] + data[idx+1] + data[idx+2]) / 3;
      return lum < 110;     // dark = land
    };
    buildFrom(isLand);
  };
  img.onerror = () => buildFrom(() => true);   // fallback: full sphere
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
      if ((frame++ % 3) === 0) {
        const q = dots.quaternion, arr = geo.getAttribute('alpha').array;
        for (let i = 0; i < COUNT; i++) {
          tmp.copy(base[i]).applyQuaternion(q);
          const front = (tmp.z + 1) * 0.5;          // 0 back, 1 front
          arr[i] = 0.16 + 0.84 * front * front;     // far side faint, front bright
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
        o.mesh.material.opacity = 0.42 * f; o.node.material.opacity = 0.7 * f;
      });
    }
    renderer.render(scene, camera);
  })();
}
