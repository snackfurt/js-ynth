class SoundwaveProcessor extends AudioWorkletProcessor {

    constructor(options) {
        super();

        this.options = options.processorOptions;
        //console.log('SoundwaveProcessor', this.options)

        this.port.onmessage = this.onMessage.bind(this);

        this.sampleTime = 1 / this.options.sampleRate;              // 1 / 44100 = 0,00002267573696 s
        this.frameTime = 1 / 60 * 1000;                             // 16,66666667 ms
        this.sweepMinTime = 1 / 15;                                 // ms per drawing (?)
        this.lastDrawTime = 0;

        // vars for the process() function, create here to avoid garbage collection
        this.processStartTime = 0;
        this.processNowTime = 0;
        this.processDuration = 0;
        this.timeSinceLastDraw = 0;
        this.input = [];
        this.output = [];
        this.inChannel = [];
        this.outChannel = [];
        this.channelCount = 0;
        this.channelSample = 0;
        this.xSamples = new Float32Array();
        this.ySamples = new Float32Array();

        this.oneWave = 1 / 80;      // 0,0125
        this.samplesPerWave = this.oneWave / this.sampleTime; // 551,25

        this.continueProcessing = true;

        this.samplesX = [];
        this.samplesY = [];

        this.sweepPosition = -1;
        this.setSamplesPerSweep();
    }

    setSamplesPerSweep() {
        this.samplesPerSweep = 2 * this.sampleTime / this.sweepMinTime;
        //console.log('samplesPerSweep:', this.samplesPerSweep, 'sweepMinTime:', this.sweepMinTime);
    }

    onMessage(event) {
        //console.log('AudioWorkletProcessor.onMessage:', event.data);
        const { id, data } = event.data;
        switch(id) {
            case 'stop': {
                this.continueProcessing = false;
                break;
            }
            case 'sweepTime': {
                this.sweepMinTime = data;
                this.setSamplesPerSweep();
                break;
            }
            case 'fps': {
                this.frameTime = 1 / data * 1000;
                break;
            }
            default: {
                console.warn('SoundwaveProcessor: unknown message', event.data);
                break;
            }
        }
    }

    postMessage(id, data) {
        //console.log('AudioWorkletProcessor.postMessage:', data);
        this.port.postMessage({id, data});
    }

    process(inputs, outputs, parameters)
    {
        this.processStartTime = Date.now();

        this.input = inputs[0];
        this.output = outputs[0];

        // copy over input to output to bypass the sound to the next audio node
        for (this.channelCount = 0; this.channelCount < this.output.length; ++this.channelCount) {
            this.inChannel = this.input[this.channelCount];
            this.outChannel = this.output[this.channelCount];

            if (this.inChannel) {
                for (this.channelSample = 0; this.channelSample < this.inChannel.length; this.channelSample++) {
                    this.outChannel[this.channelSample] = this.inChannel[this.channelSample];
                }
            }
        }

        // check data - no input at all may occur occasionally
        if (!this.input[0]) {
            console.warn('no input')
        }

        // now analyze
        if (this.input[0]) {
            this.ySamples = Float32Array.from(this.input[0]);
            this.xSamples = new Float32Array(this.ySamples.length);

            for (this.channelSample = 0; this.channelSample < this.ySamples.length; this.channelSample++) {
                this.sweepPosition += this.samplesPerSweep;
                if (this.sweepPosition > 1.0) {
                    this.sweepPosition = -1;
                }
                this.xSamples[this.channelSample] = this.sweepPosition;
            }

            this.samplesX.push(...this.xSamples);
            this.samplesY.push(...this.ySamples);
        }

        // draw in ca. 60 fps or if we stop processing
        this.processNowTime = (currentTime * 1000).toFixed(2);
        this.timeSinceLastDraw = this.processNowTime - this.lastDrawTime;

        if (this.timeSinceLastDraw >= this.frameTime || !this.continueProcessing) {
            this.postMessage('waveData', this.getWaveData(this.samplesX.splice(0), this.samplesY.splice(0)));

            this.lastDrawTime = this.processNowTime;
        }

        this.processDuration = Date.now() - this.processStartTime;
        // console.log('processTime:', this.processDuration);
        if (this.processDuration > 3) {
            console.warn(`processing took ${this.processDuration} ms! did we just post? ${this.lastDrawTime === this.processNowTime}`);
        }

        return this.continueProcessing;
    }

    getWaveData(xSamples, ySamples) {
        return {
            xSamples,
            ySamples,
            samplesLength: xSamples.length,
            continueProcessing: this.continueProcessing,
        }
    }
}

registerProcessor('soundwave-processor', SoundwaveProcessor);