<script>
    import * as Pizzicato from 'pizzicato';

    const sawtoothWave = new Pizzicato.Sound({
        source: 'wave',
        options: {
            type: 'sine',
            frequency: 90,
        }
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
        analyser.fftSize = 2048;

        sawtoothWave.connect(analyser);

        const waveform = new Float32Array(analyser.frequencyBinCount);
        const scopeCanvas = document.getElementById('canvas');
        scopeCanvas.width = waveform.length;
        scopeCanvas.height = scopeCanvas.width * 0.33;

        const scopeContext = scopeCanvas.getContext('2d');
        scopeContext.strokeStyle = "red";

        const onePeriodMs = 1000 / sawtoothWave.frequency;
        const starttime = Date.now();

        function draw() {
            analyser.getFloatTimeDomainData(waveform);
            scopeContext.clearRect(0, 0, scopeCanvas.width, scopeCanvas.height);
            scopeContext.beginPath();
            for (var i = 0; i < waveform.length; i++) {
                var x = i;
                var y = (0.5 + waveform[i] / 2) * scopeCanvas.height;
                if (i === 0) {
                    scopeContext.moveTo(x, y);
                } else {
                    scopeContext.lineTo(x, y);
                }
            }
            scopeContext.stroke();

            //console.log(waveform);

            //requestAnimationFrame(draw);

            const timeElapsed = Date.now() - starttime;
            const periodsElapsed = timeElapsed / onePeriodMs;
            const timeUntilNextPeriod = timeElapsed % onePeriodMs;
            const timeout = timeUntilNextPeriod + 10 * onePeriodMs;

            console.log({timeElapsed, periodsElapsed, timeUntilNextPeriod, timeout});

            setTimeout(draw, timeout);
        }

        const timeout = 10 * onePeriodMs;
        console.log({timeout});
        setTimeout(draw, timeout);
        //draw();
    }
</script>

<button on:mousedown={startSound} on:mouseup={stopSound}>
    make a sound
</button>

<div id="canvas-container">
    <canvas id="canvas" width="500" height="375"></canvas>
</div>