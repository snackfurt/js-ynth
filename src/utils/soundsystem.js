import * as Pizzicato from 'pizzicato';

const sounds = [];

let limiter;
let preGain;
let processor;

let drawCallback;
let waveDataResolver;

async function init(drawCallback) {
    limiter = new Pizzicato.Effects.Compressor();
    preGain = Pizzicato.context.createGain();
    processor = await createProcessor(drawCallback);

    preGain.connect(limiter);
    limiter.connect(processor);
    processor.connect(Pizzicato.masterGainNode);
}

async function createProcessor(drawCallback) {
    const audioContext = Pizzicato.context;
    await audioContext.audioWorklet.addModule('utils/SoundwaveProcessor.js');
    const processorOptions = {
        mainGain: Pizzicato.masterGainNode.gain.value,
        sampleRate: audioContext.sampleRate,
    }
    const processorNode = new AudioWorkletNode(audioContext, 'soundwave-processor', {processorOptions});
    processorNode.port.onmessage = (e) => {
        console.log('soundsystem.onmessage', e);
        handleProcessorMessage(e.data);
    }

    return processorNode;
}

function handleProcessorMessage(message) {
    const { id, data } = message;
    console.log('handleProcessorMessage', id);
    //console.log(data);
    switch (id) {
        case 'draw': {
            drawCallback(data);
            break;
        }
        case 'waveData': {
            waveDataResolver(data);
            break;
        }
        default: {
            console.log('unknow processor message');
            break;
        }
    }
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

function removeSound(sound) {
    if (sound) {
        sound.off();
        sound.stop();
        sound.disconnect();
    }
}

function getSoundProcessorData() {
    return new Promise((resolve, reject) => {
        waveDataResolver = resolve;
        processor.port.postMessage('getWaves');
    });
}

export {
    init,
    createSound,
    removeSound,
    getSoundProcessorData,
}