import * as Pizzicato from "pizzicato";

let processedSampleLength;
let zeroCrossingDistances = [];
const CROSSINGS_TOLERANCE = 1;

function getWaveData(waveform) {

    /*
        draw from first zero crossing
     */
    const zeroIndex1 = getZeroCrossingIndex(waveform);
    if (zeroIndex1 === -1) {
        return waveform;
    }

    return waveform.slice(zeroIndex1);


    /*
        draw from first zero crossing and try to avoid phase shifts
     */
    /*
    const zeroIndexes = getZeroCrossingIndexes(waveform);
    const newZeroCrossingDistances = getZeroCrossingDistances(zeroIndexes);
    if (zeroCrossingDistances.length && newZeroCrossingDistances.length) {
        console.log({zeroCrossingDistances, newZeroCrossingDistances});

        const distance1Obj = zeroCrossingDistances[0];
        const indexesOfSameDistance = newZeroCrossingDistances.filter(({distance}) => distance === distance1Obj.distance);
        for (let i=0; i < indexesOfSameDistance.length; i++) {
            const newDistanceObj = indexesOfSameDistance[i];
            if (areNextDistancesEqual(zeroCrossingDistances, 0, newZeroCrossingDistances, i)) {
                // looks like the same phase
                console.log('FOUND EQUALS');
                return waveform.slice(zeroIndexes[newDistanceObj.index]);
            }
        }
    }

    console.log('NO EQUALS');
    zeroCrossingDistances = newZeroCrossingDistances;

    return waveform.slice(zeroIndexes[0]);
    */


    /*
        draw as it is
     */
    //return waveform;
}

function getZeroCrossingIndex(waveformData) {
    return waveformData.findIndex((wavePoint, index, data) => {
        return (index > 0) && data[index-1] > 0 && wavePoint <= 0;
    });
}

function getZeroCrossingIndexes(waveformData) {
    const indexes = [];
    const length = waveformData.length;
    let currentPoint, previousPoint;

    for (let i = 1; i < length; i++) {
        currentPoint = waveformData[i];
        previousPoint = waveformData[i-1];
        if (previousPoint > 0 && currentPoint <= 0) {
            indexes.push(i);
        }
    }

    return indexes;
}

function getZeroCrossingDistances(indexes) {
    const distances = [];
    let prevIndex = indexes[0];
    let currentIndex;
    for (let i = 1; i < indexes.length; i++) {
        currentIndex = indexes[i];
        distances.push({
            distance: currentIndex -prevIndex,
            index: prevIndex,
        });
        prevIndex = currentIndex;
    }

    return distances;
}

function areNextDistancesEqual(distances1, index1, distances2, index2) {
    const distancesToCheck = 5;
    const getDistanceAtIndex = (array, index) => array.length > index ? array[index].distance : 0;

    for (let i = 1; i <= distancesToCheck; i++) {
        const distance1 = getDistanceAtIndex(distances1, index1+i);
        const distance2 = getDistanceAtIndex(distances2, index2+i);
        if (!distance1 || !distance2) {
            return false;
        }
        if (Math.abs(distance1 - distance2) > CROSSINGS_TOLERANCE) {
            return false;
        }
    }

    return true;
}

function createAnalyser(soundWave, sampleSize) {
    const analyser = Pizzicato.context.createAnalyser();
    analyser.fftSize = sampleSize;

    const waveform = new Float32Array(analyser.frequencyBinCount);

    soundWave.connect(analyser);

    const sampleRate = Pizzicato.context.sampleRate;
    const samples = sampleSize / 2;
    processedSampleLength = samples / sampleRate; // 0.046

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