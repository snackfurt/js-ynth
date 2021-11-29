<script>
    import { afterUpdate, onMount } from 'svelte';
    import { createAnalyser } from '../utils/wave-utils';

    export let doDrawing;
    export let soundWave;

    let canvas;
    let drawingContext;
    let getSoundWaveData;

    onMount(() => {
        init();
    });
    afterUpdate(() => {
        drawNext();
    });

    function init() {
        const { getWaveData, waveformLength } = createAnalyser(soundWave);

        canvas.width = waveformLength;
        canvas.height = canvas.width * 0.33;

        drawingContext = canvas.getContext('2d');
        drawingContext.strokeStyle = "red";

        getSoundWaveData = getWaveData;
    }

    function draw() {
        const waveData = getSoundWaveData();
        const { x: startX, y: startY } = getWavePointCoordsAtIndex(waveData, 0);

        drawingContext.clearRect(0, 0, canvas.width, canvas.height);
        drawingContext.beginPath();
        drawingContext.moveTo(startX, startY);
        for (let i = 1; i < waveData.length; i++) {
            const { x, y } = getWavePointCoordsAtIndex(waveData, i);
            drawingContext.lineTo(x, y);
        }
        drawingContext.stroke();

        drawNext();
    }

    function drawNext() {
        if (doDrawing) {
            requestAnimationFrame(draw);
        }
    }

    function getWavePointCoordsAtIndex(waveData, index) {
        const padding = 4;   // avoid clipping of top points
        const yOffset = padding / 2;
        const height = canvas.height - padding;
        return {
            x: index,
            y: yOffset + (0.5 + waveData[index] / 2) * height,
        }
    }

</script>


<canvas bind:this={canvas} width={32} height={32}></canvas>