import { removeSound } from "./soundsystem";

export default class Sound {
    constructor() {
        this.soundwave = null;
        this.isPlaying = false;
    }

    play() {
        if (this.soundwave) {
            this.soundwave.play();
        }
    }

    stop() {
        if (this.soundwave) {
            this.soundwave.stop();
        }
    }

    remove() {
        removeSound(this.soundwave);
    }
}