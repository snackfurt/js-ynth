class SingleSoundProcessor extends AudioWorkletProcessor {

    constructor(options) {
        super();

        this.options = options.processorOptions;
        //console.log('SingleSoundProcessor', this.options)

        this.port.onmessage = this.onMessage.bind(this);

        this.continueProcessing = true;
        this.soundStarted = false;

        this.samplesX = [];
        this.samplesY = [];
    }

    onMessage(event) {
        //console.log('AudioWorkletProcessor.onMessage:', event.data);
        const { id, data } = event.data;
        switch(id) {
            case 'stop': {
                this.endProcessing();
                break;
            }
            default: {
                console.warn('SingleSoundProcessor: unknown message', event.data);
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

        // collect 'em all!
        if (input[0] && input[1]) {
            const xSamples = input[0];
            const ySamples = input[1];

            if (ySamples.every(sample => sample === 0)) {
                console.log('silence!');
                if (this.soundStarted) {
                    this.endProcessing();
                }
            }
            else {
                this.soundStarted = true;
                this.samplesX.push(...xSamples);
                this.samplesY.push(...ySamples);
            }
        }

        return this.continueProcessing;
    }

    endProcessing() {
        console.log('endProcessing');
        const {samplesX, samplesY} = this;
        this.postMessage('soundData', {samplesX, samplesY});
        this.continueProcessing = false;
    }
}

registerProcessor('single-sound-processor', SingleSoundProcessor);