<script>
    import * as Pizzicato from 'pizzicato';
    import {getWaveData} from "../utils/wave-utils";

    let isSoundPlaying = false;
    let doDrawing = false;

    const soundWave = new Pizzicato.Sound({
        source: 'wave',
        options: {
            type: 'sine',
            frequency: 180,
        }
    });

    const onePeriodMs = 1000 / soundWave.frequency;
    const drawInterval = 5 * onePeriodMs;
    console.log({drawInterval});

    soundWave.on('play', () => {
        isSoundPlaying = true;
        doDrawing = true;
    });
    soundWave.on('stop', () => {
        isSoundPlaying = false;
        //TODO: find a timeout without magic number - it seems to be not the sound's release
        //const timeout = Math.max(soundWave.release * 1000, drawInterval);
        const timeout = 150;
        setTimeout(() => {
            doDrawing = false;
        }, timeout);
    });

    function startSound() {
        soundWave.play();
        connectAnalyser();
    }

    function stopSound() {
        soundWave.stop();
    }

    function connectAnalyser() {
        const analyser = Pizzicato.context.createAnalyser();
        analyser.fftSize = 4096;

        soundWave.connect(analyser);

        const waveform = new Float32Array(analyser.frequencyBinCount);
        const scopeCanvas = document.getElementById('canvas');
        scopeCanvas.width = waveform.length;
        scopeCanvas.height = scopeCanvas.width * 0.33;

        const scopeContext = scopeCanvas.getContext('2d');
        scopeContext.strokeStyle = "red";

        function draw() {
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

            if (doDrawing) {
                //setTimeout(draw, drawInterval);
                requestAnimationFrame(draw);
            }
        }

        requestAnimationFrame(draw);
    }


</script>

<button on:mousedown={startSound} on:mouseup={stopSound}>
    make a sound
</button>

<div id="canvas-container">
    <canvas id="canvas" width="500" height="375"></canvas>
</div>