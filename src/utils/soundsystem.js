import * as Pizzicato from 'pizzicato';

const sounds = [];

let audioContext;
let limiter;
let preGain;
let processor;

let waveDataCallback;
let processorOptions;

async function init(drawCallback) {
    waveDataCallback = drawCallback;

    audioContext = Pizzicato.context;
    limiter = new Pizzicato.Effects.Compressor();
    preGain = audioContext.createGain();

    processorOptions = {
        mainGain: Pizzicato.masterGainNode.gain.value,
        sampleRate: audioContext.sampleRate,
    }
    await audioContext.audioWorklet.addModule('utils/SoundwaveProcessor.js');
}

function createProcessor() {
    const processorNode = new AudioWorkletNode(audioContext, 'soundwave-processor', {processorOptions});
    processorNode.port.onmessage = (e) => {
        //console.log('soundsystem.onmessage', e);
        handleProcessorMessage(e.data);
    }

    return processorNode;
}

function handleProcessorMessage(message) {
    const { id, data } = message;
    //console.log('handleProcessorMessage', id);
    //console.log(data);
    switch (id) {
        case 'waveData': {
            waveDataCallback(data);
            break;
        }
        default: {
            console.warn('unknown processor message', message);
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

async function startSoundProcessor() {
    console.log('startSoundProcessor')

    processor = createProcessor();

    preGain.connect(limiter);
    limiter.connect(processor);
    processor.connect(Pizzicato.masterGainNode);
}

function stopSoundProcessor() {
    console.log('stopSoundProcessor')
    if (processor) {
        processorMessage('stop');
        limiter.disconnect(processor);
        processor.disconnect(Pizzicato.masterGainNode);
    }
}

function setProcessorSweepTime(time) {
    processorMessage('sweepTime', time);
}

function processorMessage(id, data) {
    if (processor) {
        processor.port.postMessage({id, data});
    }
}

export {
    init,
    createSound,
    removeSound,
    startSoundProcessor,
    stopSoundProcessor,
    setProcessorSweepTime,
}