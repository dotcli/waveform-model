const THREE = require('three');
const shader = require('./modules/waveform.shader');
const Displacer = require('./modules/displacer');
const Recorder = require('./modules/recorder');
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

const RECORDING_DURATION = 5;
const SEGMENT_RESOLUTION = 256;
const HEIGHT_SEGMENT = SEGMENT_RESOLUTION + 1;
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


let audioAvailable = false;
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(() => {
    audioAvailable = true;
  })
  .catch((err) => {
  /* handle the error */
    console.error('couldnt access mic');
    console.error(err);
  });

/**
 * sample the shape of audio
 * @param {AudioBuffer} buf
 */
function sampleAudioBuffer(buf) {
  const bufferData = buf.getChannelData(0);
  const chunkSize = bufferData.length / SEGMENT_RESOLUTION;
  const audioSamples = [];
  let prevSample = 0;
  for (let index = 0; index < SEGMENT_RESOLUTION; index += 1) {
    let sample = Math.abs(bufferData[Math.floor(index * chunkSize)]);
    // scale samples
    sample **= 0.5;
    // ease the samples
    sample = Math.max(prevSample * 0.2, sample);
    audioSamples.push(sample);
    prevSample = sample;
  }
  return audioSamples;
}

function updateWaveform(shapeData) {
  if (!audioAvailable) return;
  for (let i = 0; i < shapeData.length; i += 1) {
    displacer.displaceRing(i, shapeData[i]);
  }
  geometry.attributes.displacement.needsUpdate = true;
}

function onRecordEnd(rec) {
  const buffer = rec.exportBuffer();
  const shapeData = sampleAudioBuffer(buffer);
  updateWaveform(shapeData);
}
const recorder = new Recorder(RECORDING_DURATION, onRecordEnd);

const btnRecord = document.createElement('button');
btnRecord.innerText = 'record';
btnRecord.style.fontSize = '5em';
btnRecord.style.zIndex = 3;
btnRecord.style.position = 'absolute';
btnRecord.style.left = 0;
btnRecord.addEventListener('click', () => {
  recorder.start();
});
document.body.appendChild(btnRecord);

let time = 0;
function tick(dt) {
  time += dt;
  mesh.material.uniforms.time.value = time / 1000;
}
orbitViewer.on('tick', tick);

