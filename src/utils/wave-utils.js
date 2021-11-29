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

export {
    getWaveData,
}