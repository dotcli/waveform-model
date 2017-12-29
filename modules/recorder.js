/* Tone.js Recorder */
/* records using Tone.UserMedia and */
/* saves into AudioBuffer */
/* inspired / converted / stolen from https://github.com/googlecreativelab/chrome-music-lab/blob/master/pianoroll/app/mic/Recorder.js */

const Tone = require('tone');

let bufferDuration = 5; // seconds

class Recorder {
  constructor(duration = bufferDuration, cb = Tone.noOp) {
    bufferDuration = duration;
    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this, cb);

    // NOTE Tone@0.10.0
    this.mic = new Tone.UserMedia();
    // NOTE Tone@0.7.1
    // this.mic = new Tone.Microphone();

    this.jsNode = Tone.context.createScriptProcessor(4096, 1, 1);
    // HACK connect to a silent node to make sure it'll not be garbage collected
    // Use carefully
    const silentNode = Tone.context.createGain();
    silentNode.gain.value = 0;
    silentNode.connect(Tone.context.destination);
    this.jsNode.connect(silentNode);

    this.mic.connect(this.jsNode);

    this.audioBuffer = Tone.context.createBuffer(1, Tone.context.sampleRate * bufferDuration, Tone.context.sampleRate);
    this.bufferArray = this.audioBuffer.getChannelData(0);
    this.bufferPosition = 0;
    this.isRecording = false;
    this.meter = 0;
    this.head = 0;
    this.onended = Tone.noOp;
    this.duration = 0;
    // onset: where audios actually start getting recorded
    this.onset = 0;
  }
  start() {
    this.jsNode.onaudioprocess = this.onprocess.bind(this);
    this.mic.open().then(() => {
      // 0 out the buffer
      for (let i = 0; i < this.bufferArray.length; i += 1) {
        this.bufferArray[i] = 0;
      }
      this.isRecording = true;
      this.bufferPosition = 0;
      this.head = 0;
    });
  }
  stop(cb) {
    this.mic.close();
    this.jsNode.onaudioprocess = Tone.noOp;
    this.isRecording = false;
    // compute the onset
    for (let i = 0; i < this.bufferArray.length; i += 1) {
      if (Math.abs(this.bufferArray[i]) > 0.01) {
        this.onset = (i / this.bufferArray.length) * bufferDuration;
        break;
      }
    }
    cb(this);
  }
  onprocess(event) {
    // store audio into bufferArray, and
    // meter the input
    const { bufferSize } = this.jsNode;
    const smoothing = 0.3;
    const input = event.inputBuffer.getChannelData(0);
    let sum = 0;
    let x;
    const recordBufferLen = this.bufferArray.length;
    for (let i = 0; i < bufferSize; i += 1) {
      x = input[i];
      sum += x * x;
      // if it's recording, fill the record buffer
      if (this.isRecording) {
        if (this.bufferPosition < recordBufferLen) {
          this.bufferArray[this.bufferPosition] = x;
          this.bufferPosition += 1;
        } else {
          // if the buffer is filled, then the record duration reached limit
          this.stop();
          // get out of the audio thread
          setTimeout(this.onended.bind(this), 5);
        }
      }
    }
    this.head = this.bufferPosition / recordBufferLen;
    this.duration = this.head * bufferDuration;
    const rms = Math.sqrt(sum / bufferSize);
    this.meter = Math.max(rms, this.meter * smoothing);
  }
  /**
   * returns a duplicate of recorder's last recording
   * return AudioBuffer */
  exportBuffer() {
    // export a
    const copyBuffer = Tone.context.createBuffer(1, Tone.context.sampleRate * bufferDuration, Tone.context.sampleRate);
    const copyArray = copyBuffer.getChannelData(0);
    if (copyArray.length !== this.bufferArray.length) {
      throw new Error('Something is fucked.');
    }
    for (let i = 0; i < copyArray.length; i += 1) {
      copyArray[i] = this.bufferArray[i];
    }
    return copyBuffer;
  }
}

module.exports = Recorder;
