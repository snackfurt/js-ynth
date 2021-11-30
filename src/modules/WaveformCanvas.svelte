<div class="canvasContainer center">
    <canvas class="canvas" bind:this={onscreenCanvas}></canvas>
</div>


<script>
    import { onMount } from 'svelte';
    import { createAnalyser } from '../utils/wave-utils';

    export let doDrawing;
    export let soundWave;
    export let sampleSize;

    const canvasImages = [];
    const MAX_IMAGES = 10;

    let onscreenCanvas;
    let onscreenDrawingContext;
    let offscreenCanvas;
    let offscreenDrawingContext;
    let getSoundWaveData;
    let waveformWidth;

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
        const canvasImage = new Image();

        canvasImages.push(canvasImage);
        if (canvasImages.length > MAX_IMAGES) {
            const overflow = canvasImages.length - MAX_IMAGES;
            canvasImages.splice(0, overflow);
        }

        canvasImage.onload = drawImages;
        canvasImage.src = offscreenCanvas.toDataURL();
    }

    function drawImages() {
        const { width, height } = onscreenCanvas;
        onscreenDrawingContext.clearRect(0, 0, width, height);
        onscreenDrawingContext.imageSmoothingEnabled = false;
        canvasImages.forEach((image, index) => {
            const opacity = Math.min((index+1) * 0.2, 1);
            onscreenDrawingContext.globalAlpha = opacity.toString(10);
            onscreenDrawingContext.drawImage(image, 0, 0, width, height);
        });
        onscreenDrawingContext.globalAlpha = 1;
    }

</script>


<style>
    .canvasContainer {
        width: 80%;
    }

    .canvas {

    }
</style>