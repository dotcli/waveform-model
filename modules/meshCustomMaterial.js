const THREE = require('three');
const shader = require('./waveform.shader');

const vertexShader = shader.vertex;
const fragmentShader = shader.fragment;

function setFlags(material) {
  /* eslint-disable no-param-reassign */
  material.vertexShader = vertexShader;
  material.fragmentShader = fragmentShader;
  material.type = 'MeshCustomMaterial';
  /* eslint-enable no-param-reassign */
}


function MeshCustomMaterial(parameters) {
  THREE.MeshStandardMaterial.call(this);
  this.uniforms = THREE.UniformsUtils.merge([
    THREE.ShaderLib.standard.uniforms,
    {
      // your custom uniforms or overrides to built-ins
      time: { value: 1.0 },
    },
  ]);
  setFlags(this);
  this.setValues(parameters);

  // live shader reload
  shader.on('change', () => {
    // Mark shader for recompilation
    this.vertexShader = shader.vertex;
    this.fragmentShader = shader.fragment;
    this.needsUpdate = true;
  });
}

MeshCustomMaterial.prototype = Object.create(THREE.MeshStandardMaterial.prototype);
MeshCustomMaterial.prototype.constructor = MeshCustomMaterial;
MeshCustomMaterial.prototype.isMeshStandardMaterial = true;

MeshCustomMaterial.prototype.copy = function copy(source) {
  THREE.MeshStandardMaterial.prototype.copy.call(this, source);
  this.uniforms = THREE.UniformsUtils.clone(source.uniforms);
  setFlags(this);
  return this;
};

module.exports = MeshCustomMaterial;
