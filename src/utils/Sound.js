/**
 * This is a wrapper around a Pizzicato.Sound object ('soundwave').
 *
 * The underlying sound is created by the soundsystem ('createSound').
 */

import {createSound, removeOscillator} from './soundsystem';
import LFO from './LFO';

export default class Sound {
    constructor() {
        this.soundwave = null;
        this.lfo = null;
        this.isPlaying = false;
    }

    init(waveType, frequency) {
        this.remove();
        this.soundwave = createSound(waveType, frequency);
    }

    setFrequency(frequency) {
        if (this.soundwave) {
            this.soundwave.frequency = frequency;
        }
    }

    initLfo(waveType, frequency) {
        this.removeLfo();

        this.lfo = new LFO();
        this.lfo.init(waveType, frequency, this.soundwave.sourceNode.frequency);

        if (this.isPlaying) {
            this.lfo.play();
        }
    }

    setLfoFrequency(frequency) {
        if (this.lfo) {
            this.lfo.setFrequency(frequency);
        }
    }

    removeLfo() {
        if (this.lfo) {
            this.lfo.remove();
            this.lfo = null;
        }
    }

    play() {
        this.isPlaying = true;
        if (this.soundwave) {
            this.soundwave.play();
        }
        if (this.lfo) {
            const { waveType, frequency } = this.lfo;
            this.initLfo(waveType, frequency);
        }
    }

    stop() {
        this.isPlaying = false;
        if (this.soundwave) {
            this.soundwave.stop();
        }
        if (this.lfo) {
            this.lfo.stop();
        }
    }

    remove() {
        this.removeLfo();
        removeOscillator(this.soundwave);
    }
}