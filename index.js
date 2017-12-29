const THREE = require('three');
const MeshCustomMaterial = require('./modules/meshCustomMaterial');
const Displacer = require('./modules/displacer');
const Recorder = require('./modules/recorder');
const createOrbitViewer = require('three-orbit-viewer')(THREE);

const material = new MeshCustomMaterial();
material.metalness = 0.8;
material.flatShading = true;

const RECORDING_DURATION = 5;
const SEGMENT_RESOLUTION = 128;
const HEIGHT_SEGMENT = SEGMENT_RESOLUTION + 1;
const RADIAL_SEGMENT = 16;
const HEIGHT = 5;
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

// lighting
const pointLight = new THREE.PointLight(0xffdd99, 1);
pointLight.position.set(0, 1, 1);
orbitViewer.scene.add(pointLight);
const lightHelper = new THREE.PointLightHelper(pointLight, 0.2);
orbitViewer.scene.add(lightHelper);
const ambientLight = new THREE.AmbientLight(0x404040, 1); // soft white light
orbitViewer.scene.add(ambientLight);
const hemiLight = new THREE.HemisphereLight(0x5555ff, 0x200808, 5);
hemiLight.position.set(0, 50, 0);
orbitViewer.scene.add(hemiLight);

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
  mesh.rotation.z = Math.sin(time / 1372);
  // rotate light around to see
  pointLight.position.set(2 * Math.sin(time / 2000), 3 * Math.cos(time / 1000), 2 * Math.sin(time / 500));
}
orbitViewer.on('tick', tick);

