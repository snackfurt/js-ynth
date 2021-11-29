import * as Pizzicato from "pizzicato";

const SAMPLE_SIZE = 4096;
let soundwave;
let processedSampleLength;

function getWaveData(waveform) {
    // start at first zero crossing to enable drawing the wave "statically", always beginning at the same starting point
    /*
    const zeroIndex1 = getZeroCrossingIndex(waveform);
    if (zeroIndex1 === -1) {
        return waveform;
    }

    return waveform.slice(zeroIndex1);
     */
    const sampledPeriods = processedSampleLength * soundwave.frequency;
    const zeroIndexes = getZeroCrossingIndexes(waveform);
    console.log({sampledPeriods, zeroIndexes})
    const { length: crossings } = zeroIndexes;
    const lastCrossingIndex = Math.floor(sampledPeriods-1);

    if (crossings > lastCrossingIndex) {
        return waveform.slice(zeroIndexes[0], zeroIndexes[lastCrossingIndex]);
    }
    else if (crossings >= 1) {
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

function createAnalyser(soundWave) {
    const analyser = Pizzicato.context.createAnalyser();
    analyser.fftSize = SAMPLE_SIZE;

    const waveform = new Float32Array(analyser.frequencyBinCount);

    soundWave.connect(analyser);

    const sampleRate = Pizzicato.context.sampleRate;
    const samples = SAMPLE_SIZE / 2;
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