const shader = require('./foo.shader');
const THREE = require('three');

const material = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 1.0 },
    color: { value: new THREE.Vector3(1, 0, 0) },
  },

  vertexShader: shader.vertex,
  fragmentShader: shader.fragment,
});

shader.on('change', () => {
  // Mark shader for recompilation
  material.vertexShader = shader.vertex;
  material.fragmentShader = shader.fragment;
  material.needsUpdate = true;
});

const geometry = new THREE.SphereGeometry(1, 8, 8);

const mesh = new THREE.Mesh(geometry, material);

const scene = new THREE.Scene();
scene.add(mesh);
const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
const container = document.createElement('div');
document.body.appendChild(container);
container.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10000);
camera.position.set(0, 0, 5);
camera.lookAt(new THREE.Vector3());

function tick(time) {
  mesh.material.uniforms.time.value = time / 1000;
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
