module.exports = require('shader-reload')({
  fragment: `precision highp float;
  uniform vec3 color;
  uniform float time;
  varying vec3 vNormal;
  varying float vDisplacement;
  
  void main () {
    // float a = sin(time * 3.0) * 0.5 + 0.5;
    float a = 0.0;
    vec3 outColor = mix(vec3(1.0), color, a);
    // vec3 outColor = mix(vec3(vDisplacement), color, a);
    gl_FragColor = vec4(outColor * (vNormal.z * 0.5 + 0.5), 1.0);
    // gl_FragColor = vec4(outColor, 1.0);
  }`,
  vertex: `precision highp float;
  // attribute vec3 position;
  // attribute vec3 normal;
  // uniform mat4 projectionMatrix;
  // uniform mat4 modelViewMatrix;
  uniform float time;
  varying vec3 vNormal;
  
  attribute float displacement;
  varying float vDisplacement;

  void main () {
    vec3 pos = position.xyz;
    // pos += normal * 0.5 * (sin(time * 1.0) * 0.5 + 0.5);
    // pos += normal * (displacement / 128.0);
    pos += normal * displacement;
    vNormal = normal;
    vDisplacement = displacement;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos.xyz, 1.0);
  }`,
});
