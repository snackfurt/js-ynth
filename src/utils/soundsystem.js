import * as Pizzicato from 'pizzicato';

const sounds = [];
const limiter = new Pizzicato.Effects.Compressor();
const preGain = Pizzicato.context.createGain();

init();

function init() {
    preGain.connect(limiter);
    limiter.connect(Pizzicato.masterGainNode);
}

function createSound(type, frequency) {
    const sound = new Pizzicato.Sound({
        source: 'wave',
        options: {
            type,
            frequency,
            detached: true,
        }
    });

    sound.masterVolume.connect(preGain);

    return sound;
}

export {
    createSound,
}