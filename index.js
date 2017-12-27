const shader = require('./waveform.shader');
const WaveformData = require('./waveformData');
const THREE = require('three');
const createOrbitViewer = require('three-orbit-viewer')(THREE);

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

const geometry = new THREE.CylinderBufferGeometry(1, 1, 1, 16, 65, true);

// store and pass wave displacement in an array
const waveformData = new WaveformData(geometry);
geometry.addAttribute('displacement', new THREE.BufferAttribute(waveformData.getDisplacements(), 1));

window.waveformData = waveformData;

const mesh = new THREE.Mesh(geometry, material);

const orbitViewer = createOrbitViewer({
  clearColor: 0x000000,
  clearAlpha: 1.0,
  fov: 65,
  position: new THREE.Vector3(0, 0, 5),
});

orbitViewer.scene.add(mesh);

let time = 0;
function tick(dt) {
  time += dt;
  mesh.material.uniforms.time.value = time / 1000;
  waveformData.update();
  geometry.attributes.displacement.needsUpdate = true;
}
orbitViewer.on('tick', tick);


for (let index = 0; index < 64; index += 1) {
  const displacement = (2 - Math.cos(index * (1 / 64) * Math.PI * 2) - 1) * 0.1;
  waveformData.displaceRing(index, displacement);
}
