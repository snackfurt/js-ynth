class SoundwaveProcessor extends AudioWorkletProcessor {

    constructor(options) {
        super();

        this.options = options.processorOptions;
        //console.log('SoundwaveProcessor', this.options)

        this.port.onmessage = this.onMessage;

        this.sampleTime = 1 / this.options.sampleRate;              // 1 / 44100 = 0,00002267573696 s
        this.frameTime = 1 / 60;                                    // 1/ 60 = 0,01666666667
        this.sweepMinTime = 1 / 20;                                 // ms per drawn sample (?)
        this.lastDraw = 0;

        this.samplesX = [];
        this.samplesY = [];

        this.sweepPosition = -1;
        this.belowTrigger = false;
    }

    onMessage(event) {
        console.log('AudioWorkletProcessor.onMessage:', event.data);
    }

    postMessage(data) {
        //console.log('AudioWorkletProcessor.postMessage:', data);
        this.port.postMessage(data);
    }

    process(inputs, outputs, parameters)
    {
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

        if (input[0]) {

            // now analyze
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

            const triggerValue = 0;
            const samplesPerSweep = 2 * this.sampleTime / this.sweepMinTime;

            for (let i = 0; i < length; i++) {
                this.sweepPosition += samplesPerSweep;
                if (this.sweepPosition > 1.1 && this.belowTrigger && ySamples[i] >= triggerValue) {
                    if (i === 0) {
                        //don't bother to calculate
                        this.sweepPosition = -1;
                    } else {
                        const delta = (ySamples[i] - triggerValue) / (ySamples[i] - ySamples[i - 1]);
                        this.sweepPosition = -1 + delta * samplesPerSweep;
                    }
                }
                xSamples[i] = this.sweepPosition;
                this.belowTrigger = ySamples[i] < triggerValue;
            }

            //this.postMessage({xSamples, ySamples});

            this.samplesX.push(...xSamples);
            this.samplesY.push(...ySamples);
        }

        const now = new Date().getTime();
        const timeElapsed = now - this.lastDraw;

        if (timeElapsed >= this.frameTime) {
            this.postMessage({xSamples: this.samplesX, ySamples: this.samplesY});
            this.samplesX = [];
            this.samplesY = [];
            this.lastDraw = now;
            console.timeEnd('sample');
            console.time('sample')
        }


        return true;
    }
}

registerProcessor('soundwave-processor', SoundwaveProcessor);