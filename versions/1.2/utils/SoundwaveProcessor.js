class SoundwaveProcessor extends AudioWorkletProcessor {

    constructor(options) {
        super();

        this.options = options.processorOptions;
        //console.log('SoundwaveProcessor', this.options)

        this.port.onmessage = this.onMessage.bind(this);

        this.sampleTime = 1 / this.options.sampleRate;              // 1 / 44100 = 0,00002267573696 s
        this.frameTime = 1 / 60 * 1000;                             // 16,66666667 ms
        this.sweepMinTime = 1 / 15;                                 // ms per drawing (?)
        this.lastDraw = 0;

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
            case 'start': {
                this.continueProcessing = true;
                break;
            }
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
        //console.log('process')
        const input = inputs[0];
        const output = outputs[0];

        // copy over input to output to bypass the sound to the next audio node
        for (let channel = 0; channel < output.length; ++channel) {
            const inChannel = input[channel];
            const outChannel = output[channel];

            if (inChannel) {
                for (let i = 0; i < inChannel.length; i++) {
                    outChannel[i] = inChannel[i];
                }
            }
        }

        // check data - no input at all may occur occasionally
        // if we have input[0] but not input[1], there's something wrong
        if (!input[0]) {
            console.warn('no input')
        }
        if (input[0] && !input[1]) {
            console.warn('no ySamples - output busy?');
            this.postMessage('error', 'process');
            return false;
        }

        // now analyze
        if (input[0] && input[1]) {
            const xSamplesRaw = input[0];
            const ySamplesRaw = input[1];

            // this.postMessage({xSamples: xSamplesRaw, ySamples: ySamplesRaw, mainGain: this.options.mainGain});
            // return true;

            const length = xSamplesRaw.length;

            const xSamples = new Float32Array(length);
            const ySamples = new Float32Array(length);

            for (let i = 0; i < length; i++) {
                xSamples[i] = xSamplesRaw[i];
                ySamples[i] = ySamplesRaw[i];
            }

            for (let i = 0; i < length; i++) {
                this.sweepPosition += this.samplesPerSweep;
                if (this.sweepPosition > 1.0) {
                    this.sweepPosition = -1;
                }
                xSamples[i] = this.sweepPosition;
            }

            this.samplesX.push(...xSamples);
            this.samplesY.push(...ySamples);
        }

        // draw in ca. 60 fps or if we stop processing
        const now = new Date().getTime();
        const timeElapsed = now - this.lastDraw;

        if (timeElapsed >= this.frameTime || !this.continueProcessing) {
            const waveData = this.getWaveData(this.samplesX.splice(0), this.samplesY.splice(0));
            this.postMessage('waveData', waveData);

            this.lastDraw = now;
            // console.timeEnd('sample');
            // console.time('sample')
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