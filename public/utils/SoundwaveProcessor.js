class SoundwaveProcessor extends AudioWorkletProcessor {

    constructor(options) {
        super();

        this.options = options.processorOptions;
        //console.log('SoundwaveProcessor', this.options)

        this.port.onmessage = this.onMessage;

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

        // just copy over input to output to bypass the sound to the next audio node
        for (let channel = 0; channel < output.length; ++channel) {
            const inChannel = input[channel];
            const outChannel = output[channel];

            if (inChannel) {
                for (let i = 0; i < inChannel.length; i++) {
                    outChannel[i] = inChannel[i];
                }
            }
        }

        // just continue processing if no data available
        if (!input[0]) {
            return true;
        }

        // now analyze
        const xSamplesRaw = input[0];
        const ySamplesRaw = input[1];
        const xOut = output[0];
        const yOut = output[1];

        const xSamples = new Float32Array(512);
        const ySamples = new Float32Array(512);

        const length = xSamplesRaw.length;
        for (let i=0; i < length; i++)
        {
            xSamples[i] = xSamplesRaw[i];
            ySamples[i] = ySamplesRaw[i];
        }

        const gain = Math.pow(2.0, this.options.mainGain);
        const sweepMinTime = this.options.sweepMsDiv * 10 / 1000;
        const triggerValue = this.options.sweepTriggerValue / gain;
        const samplesPerSweep = 2 * this.options.timePerSample / sweepMinTime;

        for (let i=0; i < length; i++)
        {
            this.sweepPosition += samplesPerSweep;
            if (this.sweepPosition > 1.1 && this.belowTrigger && ySamples[i] >= triggerValue)
            {
                if (i == 0) {
                    //don't bother to calculate
                    this.sweepPosition = -1;
                }
                else {
                    const delta = (ySamples[i] - triggerValue) / (ySamples[i] - ySamples[i-1]);
                    this.sweepPosition = -1 + delta * samplesPerSweep;
                }
            }
            xSamples[i] = this.sweepPosition / gain;
            this.belowTrigger = ySamples[i] < triggerValue;
        }

        /*
        if (!controls.disableFilter)
        {
            Filter.generateSmoothedSamples(AudioSystem.oldYSamples, ySamples, AudioSystem.smoothedYSamples);
            if (!controls.sweepOn) Filter.generateSmoothedSamples(AudioSystem.oldXSamples, xSamples, AudioSystem.smoothedXSamples);
            else
            {
                const xS = AudioSystem.smoothedXSamples;
                const yS = AudioSystem.smoothedYSamples;
                const gain = Math.pow(2.0,controls.mainGain);
                const sweepMinTime = controls.sweepMsDiv*10/1000;
                const triggerValue = controls.sweepTriggerValue/gain;
                const smoothedLength = AudioSystem.smoothedYSamples.length;
                const timeIncrement = 2*AudioSystem.timePerSample/(sweepMinTime*Filter.steps);
                for (let i=0; i<smoothedLength; i++)
                {
                    sweepPosition += timeIncrement;
                    if (sweepPosition > 1.1 && belowTrigger && yS[i]>=triggerValue)
                        sweepPosition =-1;
                    xS[i] = sweepPosition / gain;
                    belowTrigger = yS[i]<triggerValue;
                }
            }
            if (!controls.swapXY) Render.drawLineTexture(AudioSystem.smoothedXSamples, AudioSystem.smoothedYSamples);
            else Render.drawLineTexture(AudioSystem.smoothedYSamples, AudioSystem.smoothedXSamples);
        }
        else
         */
        {
            //Render.drawLineTexture(xSamples, ySamples);
            this.postMessage({xSamples, ySamples, mainGain: this.options.mainGain});
            //Render.drawLineTexture(ySamples, xSamples);
        }

        /*
        for (let i = 0; i<length; i++)
        {
            AudioSystem.oldXSamples[i] = xSamples[i];
            AudioSystem.oldYSamples[i] = ySamples[i];
            xOut[i] = xSamplesRaw[i];
            yOut[i] = ySamplesRaw[i];
        }

        AudioSystem.audioVolumeNode.gain.value = controls.audioVolume;
         */

        return true;
    }
}

registerProcessor('soundwave-processor', SoundwaveProcessor);