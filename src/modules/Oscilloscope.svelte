<div class="canvasContainer center" bind:this={canvasContainer}>
    <canvas class="canvas" bind:this={onscreenCanvas}></canvas>
</div>


<script>
    import {onMount, onDestroy} from 'svelte';

    export let oldWavesDisplayed;

    const canvasImages = [];

    let canvasContainer;
    let onscreenCanvas;
    let onscreenDrawingContext;
    let offscreenCanvas;
    let offscreenDrawingContext;

    let fadeOutTimeout = null;
    const frameTime = 1 / 60 * 1000;

    onMount(() => {
        init();
    });

    onDestroy(() => {
        clearFadeOut();
        // reset async callbacks to avoid null pointers if they are called after removal
        renderWaveFunction = ()=>{};
        renderSoundFunction = ()=>{};
        drawImages = ()=>{};
    });

    function init() {
        setCanvasSize(onscreenCanvas);
        onscreenDrawingContext = initDrawingContext(onscreenCanvas);

        offscreenCanvas = document.createElement('canvas');
        setCanvasSize(offscreenCanvas);
        offscreenDrawingContext = initDrawingContext(offscreenCanvas);

        renderWaveFunction = drawWave;
        renderSoundFunction = drawSound;
    }

    function setCanvasSize(canvas) {
        canvas.width = canvasContainer.clientWidth;
        canvas.height = canvas.width * 0.33;
    }

    function initDrawingContext(canvas) {
        const drawingContext = canvas.getContext('2d');
        drawingContext.strokeStyle = '#ff3e00';
        drawingContext.lineWidth = 1;

        return drawingContext;
    }

    function clearFadeOut() {
        if (fadeOutTimeout) {
            clearTimeout(fadeOutTimeout);
            fadeOutTimeout = null;
        }
    }

    function drawWave(data) {
        //console.log('drawWave');

        // stop fade out
        clearFadeOut();

        // draw samples
        const { samplesLength, continueProcessing } = data;
        const { width, height } = offscreenCanvas;
        let lastX = Number.POSITIVE_INFINITY;

        offscreenDrawingContext.clearRect(0, 0, width, height);
        offscreenDrawingContext.beginPath();

        for(let i = 0; i < samplesLength; i++) {
            const { x, y } = getWavePointCoordsAtIndex(data, i, width, height);
            if (x < lastX) offscreenDrawingContext.moveTo(x, y);
            else offscreenDrawingContext.lineTo(x, y);
            lastX = x;
        }

        offscreenDrawingContext.stroke();

        renderImage();

        if (!continueProcessing) {
            fadeOutImage();
        }
    }

    function drawSound(data) {
        //console.log('drawSound');

        // draw samples
        const { samplesX, samplesY } = data;
        const { width, height } = offscreenCanvas;

        const samplesLength = samplesX.length;
        const xOffset = -1;

        offscreenDrawingContext.clearRect(0, 0, width, height);
        offscreenDrawingContext.beginPath();

        for(let i = 0; i < samplesLength; i++) {
            const mockData = {
                xSamples: [xOffset + i / samplesLength * 2],   // range -1 to 1
                ySamples: [samplesY[i]],
            };
            const { x, y } = getWavePointCoordsAtIndex(mockData, 0, width, height);
            if (i === 0) offscreenDrawingContext.moveTo(x, y);
            else offscreenDrawingContext.lineTo(x, y);
        }

        offscreenDrawingContext.stroke();

        renderImage();
    }

    function getWavePointCoordsAtIndex(waveData, index, canvasWidth, canvasHeight) {
        const { xSamples, ySamples } = waveData;
        const padding = 100;   // avoid clipping of top points
        const yOffset = padding / 2;
        const height = canvasHeight - padding;

        const xOffset = canvasWidth / 2;

        return {
            x: xOffset + (xSamples[index] / 2) * canvasWidth,
            y: yOffset + (0.5 + ySamples[index] / 2) * height,
        }
    }

    function renderImage() {
        const canvasImage = new Image();

        canvasImages.push(canvasImage);
        if (canvasImages.length > oldWavesDisplayed) {
            const overflow = canvasImages.length - oldWavesDisplayed;
            canvasImages.splice(0, overflow);
        }

        canvasImage.onload = drawImages;
        canvasImage.src = offscreenCanvas.toDataURL();
    }

    function drawImages() {
        const { width, height } = onscreenCanvas;
        onscreenDrawingContext.clearRect(0, 0, width, height);
        onscreenDrawingContext.imageSmoothingEnabled = true;
        const fadeUntil = oldWavesDisplayed / 3;
        canvasImages.forEach((image, index) => {
            const opacity = Math.min((index+1) / fadeUntil, 1);
            onscreenDrawingContext.globalAlpha = opacity.toString(10);
            onscreenDrawingContext.drawImage(image, 0, 0, width, height);
        });
        onscreenDrawingContext.globalAlpha = 1;
    }

    function fadeOutImage() {
        if (!fadeOutTimeout && canvasImages.length) {
            fadeOutTimeout = setTimeout(() => {
                canvasImages.splice(0, 1);
                drawImages();
                fadeOutTimeout = null;
                fadeOutImage();
            }, frameTime);
        }
    }

</script>

<script context="module">
    let renderWaveFunction;
    let renderSoundFunction;

    export function drawWaveCallback(data) {
        renderWaveFunction(data);
    }

    export function drawSoundCallback(data) {
        renderSoundFunction(data);
    }
</script>


<style>
    .canvasContainer {
        width: 80%;
    }

</style>