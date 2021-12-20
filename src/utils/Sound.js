import { removeSound } from "./soundsystem";

export default class Sound {
    constructor() {
        this.soundwave = null;
        this.isPlaying = false;
    }

    play() {
        this.isPlaying = true;
        if (this.soundwave) {
            this.soundwave.play();
        }
    }

    stop() {
        this.isPlaying = false;
        if (this.soundwave) {
            this.soundwave.stop();
        }
    }

    remove() {
        removeSound(this.soundwave);
    }
}