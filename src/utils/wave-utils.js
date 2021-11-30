import * as Pizzicato from "pizzicato";
import {sampleSize} from "../modules/WaveformCanvas.svelte";

const SAMPLE_SIZE = 4096;
let soundwave;
let processedSampleLength;

function getWaveData(waveform) {
    const zeroIndexes = getZeroCrossingIndexes(waveform);
    const { length: crossings } = zeroIndexes;

    if (crossings > 1) {
        return waveform.slice(zeroIndexes[0], zeroIndexes[1]);
    }
    else if (crossings === 1) {
        return waveform.slice(zeroIndexes[0]);
    }
    else {
        return waveform;
    }
}

function getZeroCrossingIndex(waveformData) {
    return waveformData.findIndex((wavePoint, index, data) => {
        return (index > 0) && data[index-1] > 0 && wavePoint <= 0;
    });
}

function getZeroCrossingIndexes(waveformData) {
    const indexes = [];
    waveformData.forEach((wavePoint, index, data) => {
        if( (index > 0) && data[index-1] > 0 && wavePoint <= 0 ) {
            indexes.push(index);
        }
    });

    return indexes;
}

function createAnalyser(soundWave, sampleSize) {
    const analyser = Pizzicato.context.createAnalyser();
    analyser.fftSize = sampleSize;

    const waveform = new Float32Array(analyser.frequencyBinCount);

    soundWave.connect(analyser);

    const sampleRate = Pizzicato.context.sampleRate;
    const samples = sampleSize / 2;
    processedSampleLength = samples / sampleRate; // 0.046

    soundwave = soundWave;

    return {
        waveformLength: waveform.length,
        getWaveData: () => {
            analyser.getFloatTimeDomainData(waveform);
            //console.log({waveform});
            const waveData = getWaveData(waveform);
            //console.log({waveData});

            return waveData;
        }
    }
}

export {
    createAnalyser,
}