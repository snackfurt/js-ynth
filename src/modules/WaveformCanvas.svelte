<div class="canvasContainer center">
    <canvas class="canvas" bind:this={onscreenCanvas}></canvas>
</div>


<script>
    import { onMount } from 'svelte';
    import { createAnalyser } from '../utils/wave-utils';

    export let doDrawing;
    export let soundWave;
    export let sampleSize;

    let onscreenCanvas;
    let onscreenDrawingContext;
    let offscreenCanvas;
    let offscreenDrawingContext;
    let getSoundWaveData;
    let waveformWidth;

    let canvasImage;
    let canvasImageSource;

    let isMounted = false;

    onMount(() => {
        isMounted = true;
        init();
    });

    $: {
        isMounted && sampleSize && init();
    }
    $: {
        doDrawing && drawNextWaveform();
    }


    function init() {
        const { getWaveData, waveformLength } = createAnalyser(soundWave, sampleSize);

        waveformWidth = waveformLength;

        initOffscreenCanvas();
        initOnscreenCanvas();

        getSoundWaveData = getWaveData;
    }

    function initOffscreenCanvas() {
        offscreenCanvas = document.createElement('canvas');
        setCanvasSize(offscreenCanvas);

        canvasImage = new Image;
        canvasImageSource = offscreenCanvas.toDataURL();
    }

    function initOnscreenCanvas() {
        setCanvasSize(onscreenCanvas);
        onscreenDrawingContext = initDrawingContext(onscreenCanvas);
    }

    function initDrawingContext(canvas) {
        const drawingContext = canvas.getContext('2d');
        drawingContext.strokeStyle = "#ff3e00";
        drawingContext.lineWidth = 1;

        return drawingContext;
    }

    function drawWaveform(canvas) {
        const waveData = getSoundWaveData();
        const { width, height } = canvas;
        const { x: startX, y: startY } = getWavePointCoordsAtIndex(waveData, 0, height);


        const drawingContext = initDrawingContext(canvas);
        drawingContext.clearRect(0, 0, width, height);
        drawingContext.beginPath();
        drawingContext.moveTo(startX, startY);

        const sampleWidth = width * 1.0 / waveformWidth;

        for(let i = 0; i < waveData.length; i++) {

            const { x, y } = getWavePointCoordsAtIndex(waveData, i, canvas.height, sampleWidth);
            drawingContext.lineTo(x, y);
        }

        drawingContext.stroke();

        renderImage();

        drawNextWaveform();
    }

    function drawNextWaveform() {
        if (doDrawing) {
            requestAnimationFrame(() => drawWaveform(offscreenCanvas));
        }
    }

    function getWavePointCoordsAtIndex(waveData, index, totalHeight, sampleWidth) {
        const padding = 100;   // avoid clipping of top points
        const yOffset = padding / 2;
        const height = totalHeight - padding;
        return {
            x: index * sampleWidth,
            y: yOffset + (0.5 + waveData[index] / 2) * height,
        }
    }

    function setCanvasSize(canvas) {
        canvas.width = document.querySelector('.canvasContainer').clientWidth;
        canvas.height = canvas.width * 0.33;
    }

    function renderImage() {
        canvasImage.onload = () => {
            //if the image is being drawn due to resizing, reset the width and height. Putting the width and height outside the canvasImage.onload function will make scaling smoother, but the image will flicker as you scale. Pick your poison.
            //onscreenCanvas.width = offscreenCanvas.width;
            //onscreenCanvas.height = offscreenCanvas.height;
            //Prevent blurring
            //onscreenDrawingContext.clearRect(0, 0, onscreenCanvas.width, onscreenCanvas.height);
            onscreenDrawingContext.imageSmoothingEnabled = false;
            onscreenDrawingContext.drawImage(canvasImage,0,0,onscreenCanvas.width,onscreenCanvas.height)
        }

        canvasImage.src = offscreenCanvas.toDataURL();
    }

</script>


<style>
    .canvasContainer {
        width: 80%;
    }

    .canvas {

    }
</style>