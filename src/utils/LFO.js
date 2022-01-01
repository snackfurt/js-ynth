import {createOscillator, removeOscillator, createGain} from './soundsystem';

export default class LFO {

    constructor() {
        this.gain = null;
        this.oscillator = null;

        this.waveType = null;
        this.frequency = null;
        this.destination = null;
        this.depth = null;
    }

    init(waveType, frequency, depth, destination) {
        this.waveType = waveType;
        this.frequency = frequency;
        this.depth = depth;
        this.destination = destination;

        this.remove();

        this.oscillator = createOscillator(waveType, frequency);

        this.gain = createGain({ gain: depth });
        this.gain.connect(destination);

        this.oscillator.connect(this.gain);
    }

    play() {
        if (this.oscillator) {
            this.oscillator.play();
        }
    }

    stop() {
        if (this.oscillator) {
            this.oscillator.stop();
        }
    }

    remove() {
        if (this.gain) {
            this.gain.disconnect();
        }
        removeOscillator(this.oscillator);
    }

    setFrequency(frequency) {
        if (this.oscillator) {
            this.oscillator.frequency = frequency;
        }
    }
}