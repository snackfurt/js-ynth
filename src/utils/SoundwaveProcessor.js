class SoundwaveProcessor extends AudioWorkletProcessor {

    constructor(options) {
        super();

        this.options = options.processorOptions;
        //console.log('SoundwaveProcessor', this.options)

        this.port.onmessage = this.onMessage.bind(this);

        this.sampleTime = 1 / this.options.sampleRate;              // 1 / 44100 = 0,00002267573696 s
        this.frameTime = 1 / 60 * 1000;                             // 16,66666667 ms
        this.sweepMinTime = 1 / 15;                                 // ms per drawing (?)
        this.triggerValue = 0;
        this.samplesPerSweep = 2 * this.sampleTime / this.sweepMinTime;
        this.lastDraw = 0;

        this.oneWave = 1 / 80;      // 0,0125
        this.samplesPerWave = this.oneWave / this.sampleTime; // 551,25

        this.continueProcessing = true;

        this.samplesX = [];
        this.samplesY = [];
        this.waves = [];

        this.sweepPosition = -1;
        this.belowTrigger = false;
    }

    onMessage(event) {
        //console.log('AudioWorkletProcessor.onMessage:', event.data);

        switch(event.data) {
            case 'start': {
                this.continueProcessing = true;
                break;
            }
            case 'stop': {
                this.continueProcessing = false;
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
        console.log('process')
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

        // now analyze
        if (!input[0]) {
            console.warn('no input')
        }
        if (input[0]) {
            const xSamplesRaw = input[0];
            const ySamplesRaw = input[1];

            // this.postMessage({xSamples: xSamplesRaw, ySamples: ySamplesRaw, mainGain: this.options.mainGain});
            // return true;

            const length = xSamplesRaw.length;

            const xSamples = new Float32Array(length);
            const ySamples = new Float32Array(length);

            let newWaveIndex = -1;

            for (let i = 0; i < length; i++) {
                xSamples[i] = xSamplesRaw[i];
                ySamples[i] = ySamplesRaw[i];
            }

            for (let i = 0; i < length; i++) {
                this.sweepPosition += this.samplesPerSweep;
                if (this.sweepPosition > 1.0 && this.belowTrigger && ySamples[i] >= this.triggerValue) {
                    if (i === 0) {
                        //don't bother to calculate
                        this.sweepPosition = -1;
                    }
                    else {
                        const delta = (ySamples[i] - this.triggerValue) / (ySamples[i] - ySamples[i - 1]);
                        this.sweepPosition = -1 + delta * this.samplesPerSweep;
                    }
                    newWaveIndex = i;
                }
                xSamples[i] = this.sweepPosition;
                this.belowTrigger = ySamples[i] < this.triggerValue;
            }

            //this.postMessage({xSamples, ySamples});

            if (newWaveIndex > -1) {
                const waveSamplesX = [...this.samplesX.splice(0), ...xSamples.slice(0, newWaveIndex)];
                const waveSamplesY = [...this.samplesY.splice(0), ...ySamples.slice(0, newWaveIndex)];
                this.waves.push({xSamples: waveSamplesX, ySamples: waveSamplesY, samplesLength: waveSamplesX.length});

                this.samplesX.push(...xSamples.slice(newWaveIndex));
                this.samplesY.push(...ySamples.slice(newWaveIndex));
            }
            else {
                this.samplesX.push(...xSamples);
                this.samplesY.push(...ySamples);
            }
        }

        // only draw "complete" waves in ca. 60 fps
        const now = new Date().getTime();
        const timeElapsed = now - this.lastDraw;

        if (timeElapsed >= this.frameTime) {
            //this.postMessage({xSamples: this.samplesX, ySamples: this.samplesY});
            // this.samplesX = [];
            // this.samplesY = [];
            this.postMessage('waveData', this.waves);
            this.waves = [];

            this.lastDraw = now;
            // console.timeEnd('sample');
            // console.time('sample')
        }

        // if we stop processing, draw the last samples
        if (!this.continueProcessing) {
            const lastSamplesData = {
                samplesLength: this.samplesX.length,
                xSamples: this.samplesX.splice(0),
                ySamples: this.samplesY.splice(0),
            };
            this.postMessage('waveData', [lastSamplesData]);
        }

        return this.continueProcessing;
    }
}

registerProcessor('soundwave-processor', SoundwaveProcessor);