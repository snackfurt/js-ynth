<script>
    import * as Pizzicato from 'pizzicato';

    let isSoundPlaying = false;

    const sawtoothWave = new Pizzicato.Sound({
        source: 'wave',
        options: {
            type: 'sine',
            frequency: 90,
        }
    });

    sawtoothWave.on('play', () => {
        isSoundPlaying = true;
    });
    sawtoothWave.on('stop', () => {
        setTimeout(() => isSoundPlaying = false, 1000);
    });

    function startSound() {
        sawtoothWave.play();
        connectAnalyser();
    }

    function stopSound() {
        sawtoothWave.stop();
    }

    function connectAnalyser() {
        const analyser = Pizzicato.context.createAnalyser();
        analyser.fftSize = 4096;

        sawtoothWave.connect(analyser);

        const waveform = new Float32Array(analyser.frequencyBinCount);
        const scopeCanvas = document.getElementById('canvas');
        scopeCanvas.width = waveform.length;
        scopeCanvas.height = scopeCanvas.width * 0.33;

        const scopeContext = scopeCanvas.getContext('2d');
        scopeContext.strokeStyle = "red";

        const onePeriodMs = 1000 / sawtoothWave.frequency;
        const timeout = 10 * onePeriodMs;
        //console.log({timeout});

        function draw() {
            if (!isSoundPlaying) return;

            analyser.getFloatTimeDomainData(waveform);
            console.log({waveform});
            const waveData = getWaveData(waveform);
            console.log({waveData});

            scopeContext.clearRect(0, 0, scopeCanvas.width, scopeCanvas.height);
            scopeContext.beginPath();
            for (let i = 0; i < waveData.length; i++) {
                const x = i;
                const y = (0.5 + waveData[i] / 2) * scopeCanvas.height;
                if (i === 0) {
                    scopeContext.moveTo(x, y);
                } else {
                    scopeContext.lineTo(x, y);
                }
            }
            scopeContext.stroke();

            //console.log(waveform);

            //requestAnimationFrame(draw);

            setTimeout(draw, timeout);
        }

        setTimeout(draw, timeout);
        //draw();
    }

    function getWaveData(waveform) {
        const zeroIndex1 = getZeroCrossingIndex(waveform);
        if (zeroIndex1 === -1) {
            return waveform;
        }

        const zeroIndex2 = zeroIndex1 + getZeroCrossingIndex(waveform.slice(zeroIndex1));
        const zeroIndex3 = zeroIndex2 + getZeroCrossingIndex(waveform.slice(zeroIndex2));

        return waveform.slice(zeroIndex1, zeroIndex3);
    }

    function getZeroCrossingIndex(waveformData) {
        return waveformData.findIndex((wavePoint, index, data) => {
            return (index > 0) && data[index-1] < 0 && wavePoint >= 0;
        });
    }
</script>

<button on:mousedown={startSound} on:mouseup={stopSound}>
    make a sound
</button>

<div id="canvas-container">
    <canvas id="canvas" width="500" height="375"></canvas>
</div>