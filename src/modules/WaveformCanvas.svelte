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

        //setCanvasSize();
    }

    function initOffscreenCanvas() {
        offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = document.querySelector('.canvasContainer').clientWidth;
        offscreenCanvas.height = offscreenCanvas.width * 0.33;

        canvasImage = new Image;
        canvasImageSource = offscreenCanvas.toDataURL();
    }

    function initOnscreenCanvas() {
        onscreenCanvas.width = document.querySelector('.canvasContainer').clientWidth;
        onscreenCanvas.height = onscreenCanvas.width * 0.33;

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
        const { x: startX, y: startY } = getWavePointCoordsAtIndex(canvas, waveData, 0);
        const { width, height } = canvas;
        const { length: bufferLength } = waveData;

        const drawingContext = initDrawingContext(canvas);
        drawingContext.clearRect(0, 0, canvas.width, canvas.height);
        drawingContext.beginPath();
        drawingContext.moveTo(startX, startY);

        const sliceWidth = width * 1.0 / waveformWidth;
        let x = 0;
        let y, v;

        for(let i = 0; i < bufferLength; i++) {

            //v = waveData[i] / 128.0;
            //y = v * height / 2;
            const { x: v, y } = getWavePointCoordsAtIndex(canvas, waveData, i);

            if(i === 0) {
                drawingContext.moveTo(x, y);
            } else {
                drawingContext.lineTo(x, y);
            }

            x += sliceWidth;
        }

        //drawingContext.lineTo(canvas.width, canvas.height / 2);


        /*
        for (let i = 1; i < waveData.length; i++) {
            const { x, y } = getWavePointCoordsAtIndex(canvas, waveData, i);
            drawingContext.lineTo(x, y);
        }
         */
        drawingContext.stroke();

        renderImage();

        drawNextWaveform();
    }

    function drawNextWaveform() {
        if (doDrawing) {
            requestAnimationFrame(() => drawWaveform(offscreenCanvas));
        }
    }

    function getWavePointCoordsAtIndex(canvas, waveData, index) {
        const padding = 100;   // avoid clipping of top points
        const yOffset = padding / 2;
        const height = canvas.height - padding;
        return {
            x: index,
            y: yOffset + (0.5 + waveData[index] / 2) * height,
        }
    }

    function setCanvasSize() {
        onscreenCanvas.width = document.querySelector('.canvasContainer').clientWidth;
        onscreenCanvas.height = onscreenCanvas.width * 0.33;
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