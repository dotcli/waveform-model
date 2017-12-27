class WaveformData {
  constructor(cylinderGeo) {
    const vertCount = cylinderGeo.attributes.position.count;
    const { radialSegments, heightSegments } = cylinderGeo.parameters;
    const displacements = new Float32Array(vertCount);

    this.displacements = displacements;
    // calculate and store modifiable vertices,
    // ring by ring, as a 2d array of indices
    const middleVertices = [];
    for (let heightIndex = 0; heightIndex < (heightSegments - 1); heightIndex += 1) {
      const ringOfVertices = [];
      for (let radialIndex = 0; radialIndex < (radialSegments + 1); radialIndex += 1) {
        ringOfVertices.push(((radialSegments + 1) * (heightIndex + 1)) + radialIndex);
      }
      middleVertices.push(ringOfVertices);
    }
    this.middleVertices = middleVertices;
  }
  getDisplacements() { return this.displacements; }
  update() {
    // TODO update displacements according to FFT or whatever
    // NOTE remember to take care of the caps
  }
  displaceAllRings(val) {
    this.middleVertices.forEach((ring, heightIndex) => {
      // ring.forEach((vertexIndex, radialIndex) => {
      //   this.displacements[vertexIndex] = val;
      // });
      this.displaceRing(heightIndex, val);
    });
  }
  displaceRing(h, val) {
    this.middleVertices[h].forEach((vertexIndex) => {
      this.displacements[vertexIndex] = val;
    });
  }
}

module.exports = WaveformData;
