<div class="canvasContainer">
    <canvas bind:this={onscreenCanvas} width={600} height={200}></canvas>
</div>


<script>
    import { afterUpdate, onMount } from 'svelte';
    import { createAnalyser } from '../utils/wave-utils';

    export let doDrawing;
    export let soundWave;

    let onscreenCanvas;
    let onscreenDrawingContext;
    let offscreenCanvas;
    let offscreenDrawingContext;
    let getSoundWaveData;

    let canvasImage;
    let canvasImageSource;

    onMount(() => {
        init();
    });
    afterUpdate(() => {
        drawNextWaveform();
    });

    function init() {
        const { getWaveData, waveformLength } = createAnalyser(soundWave);

        offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = waveformLength;
        offscreenCanvas.height = offscreenCanvas.width * 0.33;

        offscreenDrawingContext = offscreenCanvas.getContext('2d');
        offscreenDrawingContext.strokeStyle = "#ff3e00";

        getSoundWaveData = getWaveData;

        canvasImage = new Image;
        canvasImageSource = offscreenCanvas.toDataURL();

        onscreenDrawingContext = onscreenCanvas.getContext('2d');
    }

    function drawWaveform() {
        const waveData = getSoundWaveData();
        const { x: startX, y: startY } = getWavePointCoordsAtIndex(waveData, 0);

        offscreenDrawingContext.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
        offscreenDrawingContext.beginPath();
        offscreenDrawingContext.moveTo(startX, startY);
        for (let i = 1; i < waveData.length; i++) {
            const { x, y } = getWavePointCoordsAtIndex(waveData, i);
            offscreenDrawingContext.lineTo(x, y);
        }
        offscreenDrawingContext.stroke();

        renderImage();

        drawNextWaveform();
    }

    function drawNextWaveform() {
        if (doDrawing) {
            requestAnimationFrame(drawWaveform);
        }
    }

    function getWavePointCoordsAtIndex(waveData, index) {
        const padding = 100;   // avoid clipping of top points
        const yOffset = padding / 2;
        const height = offscreenCanvas.height - padding;
        return {
            x: index,
            y: yOffset + (0.5 + waveData[index] / 2) * height,
        }
    }

    function renderImage() {
        canvasImage.onload = () => {
            //if the image is being drawn due to resizing, reset the width and height. Putting the width and height outside the canvasImage.onload function will make scaling smoother, but the image will flicker as you scale. Pick your poison.
            //onscreenCanvas.width = offscreenCanvas.width;
            //onscreenCanvas.height = offscreenCanvas.height;
            //Prevent blurring
            onscreenDrawingContext.imageSmoothingEnabled = false;
            onscreenDrawingContext.drawImage(canvasImage,0,0,onscreenCanvas.width,onscreenCanvas.height)
        }

        canvasImage.src = offscreenCanvas.toDataURL();;
    }

</script>


<style>
    .canvasContainer {
        width: 100%;
    }
</style>