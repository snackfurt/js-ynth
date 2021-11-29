import * as Pizzicato from "pizzicato";

function getWaveData(waveform) {
    // start at first zero crossing to enable drawing the wave "statically", always beginning at the same starting point
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

function createAnalyser(soundWave) {
    const analyser = Pizzicato.context.createAnalyser();
    analyser.fftSize = 4096;

    const waveform = new Float32Array(analyser.frequencyBinCount);

    soundWave.connect(analyser);

    return {
        waveformLength: waveform.length,
        getWaveData: () => {
            analyser.getFloatTimeDomainData(waveform);
            console.log({waveform});
            const waveData = getWaveData(waveform);
            console.log({waveData});

            return waveData;
        }
    }
}

export {
    createAnalyser,
}