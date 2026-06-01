// Shared: render every .thumb-img[data-model] as a real 3D metallic CAD model (Three.js → PNG).
// Include on any page with:
//   <script type="importmap">{ "imports": { "three": "./vendor/three/build/three.module.js", "three/addons/": "./vendor/three/addons/" } }</script>
//   <script type="module" src="thumbnails.js"></script>
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';

const SIZE = 192;
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(SIZE, SIZE);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
camera.position.set(2.7, 1.9, 3.5); camera.lookAt(0, 0, 0);
scene.add(new THREE.AmbientLight(0xffffff, 0.3));
const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(3, 5, 4); scene.add(key);

const alu = new THREE.MeshStandardMaterial({ color: 0xc2c8c5, metalness: 0.95, roughness: 0.34 });
const holder = new THREE.Group(); holder.rotation.set(0.2, 0.5, 0); scene.add(holder);

const cyl = (r, h, seg = 28) => new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), alu);

const MODELS = {
  saddle() {
    const g = new THREE.Group();
    const top = new THREE.Mesh(new THREE.SphereGeometry(1.2, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), alu);
    top.scale.set(1.45, 0.5, 1); g.add(top);
    const post = cyl(0.22, 1.2); post.position.y = -0.55; g.add(post);
    return g;
  },
  hub() {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.34, 24, 48), alu));
    const axle = cyl(0.5, 1.5, 32); axle.rotation.x = Math.PI / 2; g.add(axle);
    return g;
  },
  bracket() {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.5, 1.5), alu));
    [-0.8, 0.8].forEach(x => { const b = cyl(0.3, 1.1); b.position.set(x, 0.6, 0); g.add(b); });
    return g;
  },
  fork() {
    const g = new THREE.Group();
    const a = cyl(0.38, 2.2); a.position.set(-0.5, -0.2, 0); a.rotation.z = 0.5; g.add(a);
    const b = cyl(0.38, 2.2); b.position.set(0.5, -0.2, 0); b.rotation.z = -0.5; g.add(b);
    const j = cyl(0.45, 0.7); j.position.set(0, 1.0, 0); g.add(j);
    return g;
  },
  fallback() { const m = cyl(0.5, 2.6, 32); m.rotation.z = Math.PI / 2; return m; },
  tube() {
    return new Promise(res => new STLLoader().load(
      'models/top-tube-assembly.stl',
      geo => { geo.computeVertexNormals(); res(new THREE.Mesh(geo, alu)); },
      undefined, () => res(MODELS.fallback())
    ));
  },
};

function fit(obj) {
  const box = new THREE.Box3().setFromObject(obj);
  const c = box.getCenter(new THREE.Vector3());
  const r = box.getBoundingSphere(new THREE.Sphere()).radius || 1;
  obj.position.sub(c);
  const wrap = new THREE.Group(); wrap.add(obj); wrap.scale.setScalar(1.75 / r);
  holder.clear(); holder.add(wrap);
}

(async () => {
  for (const img of document.querySelectorAll('.thumb-img[data-model]')) {
    const build = MODELS[img.dataset.model] || MODELS.fallback;
    try {
      const obj = await build();
      fit(obj);
      renderer.render(scene, camera);
      img.src = renderer.domElement.toDataURL('image/png');
    } catch (e) { /* leave blank on failure */ }
  }
})();
