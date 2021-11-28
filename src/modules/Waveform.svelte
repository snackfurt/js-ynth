<script>
    import * as Pizzicato from 'pizzicato';

    const sawtoothWave = new Pizzicato.Sound({
        source: 'wave',
        options: {
            type: 'sawtooth'
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
        scopeContext.strokeStyle = "black"; // Green path

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

            requestAnimationFrame(draw);
        }

        draw();
    }
</script>

<button on:mousedown={startSound} on:mouseup={stopSound}>
    make a sound
</button>

<div id="canvas-container">
    <canvas id="canvas" width="500" height="375"></canvas>
</div>