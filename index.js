const THREE = require('three');
const createAudioAnalyser = require('web-audio-analyser');
const shader = require('./modules/waveform.shader');
const Displacer = require('./modules/displacer');
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

const AUDIO_RESOLUTION = 64;
const HEIGHT_SEGMENT = AUDIO_RESOLUTION + 1;
const RADIAL_SEGMENT = 16;
const HEIGHT = 10;
const geometry = new THREE.CylinderBufferGeometry(0, 0, HEIGHT, RADIAL_SEGMENT, HEIGHT_SEGMENT, true);

// store and pass wave displacement in an array
const displacer = new Displacer(geometry);
geometry.addAttribute('displacement', new THREE.BufferAttribute(displacer.getDisplacements(), 1));

window.displacer = displacer;

const mesh = new THREE.Mesh(geometry, material);

const orbitViewer = createOrbitViewer({
  clearColor: 0x000000,
  clearAlpha: 1.0,
  fov: 65,
  position: new THREE.Vector3(0, 0, 5),
});

orbitViewer.scene.add(mesh);


let analyser;
let audioAvailable = false;
let wf = new Uint8Array(AUDIO_RESOLUTION);
navigator.mediaDevices.getUserMedia({ audio: true })
  .then((stream) => {
    analyser = createAudioAnalyser(stream, { audible: false });
    analyser.analyser.fftSize = AUDIO_RESOLUTION * 2;
    audioAvailable = true;
  })
  .catch((err) => {
  /* handle the error */
    console.error('couldnt access mic');
    console.error(err);
  });

function updateWaveform() {
  if (!audioAvailable) return;
  wf = analyser.waveform(wf);
  for (let i = 0; i < wf.length; i += 1) {
    displacer.displaceRing(i, wf[i]);
  }
}

let time = 0;
function tick(dt) {
  time += dt;
  mesh.material.uniforms.time.value = time / 1000;
  updateWaveform();
  geometry.attributes.displacement.needsUpdate = true;
}
orbitViewer.on('tick', tick);
