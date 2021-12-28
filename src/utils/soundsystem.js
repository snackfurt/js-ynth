import * as Pizzicato from 'pizzicato';

const sounds = [];

let audioContext;
let limiter;
let preGain;
let processor;

let waveDataCallback;
let processErrorCallback;
let processorOptions;

async function init(drawCallback, errorCallback) {
    waveDataCallback = drawCallback;
    processErrorCallback = errorCallback;

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
        case 'error': {
            processErrorCallback(data);
            break;
        }
        default: {
            console.warn('unknown processor message', message);
            break;
        }
    }
}

function createSound(type, frequency) {
    const sound = createOscillator(type, frequency);
    sound.masterVolume.connect(preGain);

    return sound;
}

function createOscillator(type, frequency) {
    const osc = new Pizzicato.Sound({
        source: 'wave',
        options: {
            type,
            frequency,
            detached: true,
        }
    });

    return osc;
}

function removeOscillator(osc) {
    if (osc) {
        osc.off();
        osc.stop();
        osc.disconnect();
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

function setProcessorFps(fps) {
    processorMessage('fps', fps);
}

function processorMessage(id, data) {
    if (processor) {
        processor.port.postMessage({id, data});
    }
}

function getAudioContext() {
    return audioContext;
}

export {
    init,
    createOscillator,
    createSound,
    removeOscillator,
    startSoundProcessor,
    stopSoundProcessor,
    setProcessorSweepTime,
    setProcessorFps,
    getAudioContext,
}