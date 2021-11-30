import * as Pizzicato from "pizzicato";

let soundwave;
let processedSampleLength;

function getWaveData(waveform) {
    const zeroIndex1 = getZeroCrossingIndex(waveform);
    if (zeroIndex1 === -1) {
        return waveform;
    }

    return waveform.slice(zeroIndex1);

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