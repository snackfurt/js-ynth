<div class="canvasContainer center" bind:this={canvasContainer}>
    <canvas class="canvas" bind:this={onscreenCanvas}></canvas>
</div>


<script>
    import {onMount} from 'svelte';
    import {getSoundProcessorData} from '../utils/soundsystem';

    export let oldWavesDisplayed;
    export let doDrawing;

    const canvasImages = [];

    let canvasContainer;
    let onscreenCanvas;
    let onscreenDrawingContext;
    let offscreenCanvas;
    let offscreenDrawingContext;

    onMount(() => {
        init();
    });

    $: doDrawing && drawNextWave();

    function init() {
        setCanvasSize(onscreenCanvas);
        onscreenDrawingContext = initDrawingContext(onscreenCanvas);

        offscreenCanvas = document.createElement('canvas');
        setCanvasSize(offscreenCanvas);
        offscreenDrawingContext = initDrawingContext(offscreenCanvas);

        renderFunction = draw;
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

    function drawNextWave() {
        if (doDrawing) {
            console.log('drawNextWave')
            getSoundProcessorData()
                .then(waveData => {
                    console.log('got wavedata')
                    requestAnimationFrame(() => {
                        console.log('raf')
                        draw(waveData);
                        drawNextWave();
                    });
                })
                .catch(error => {
                    console.warn('drawNextWave error:', error);
                });
        }
    }

    function draw(data) {
        console.log('draw', data);

        if (data.length) {
            /*
            if (this.rafId) cancelAnimationFrame(this.rafId);
            this.rafId = requestAnimationFrame(() => {
                this.rafId = null;
                this.drawSample(data);
            })
            */
            // TODO: loop through waves
            drawSample(data[0]);
        }
    }

    function drawSample(data) {
        //console.log(data)
        const { samplesLength } = data;
        const { width, height } = offscreenCanvas;
        const { x: startX, y: startY } = getWavePointCoordsAtIndex(data, 0, width, height);

        offscreenDrawingContext.clearRect(0, 0, width, height);
        offscreenDrawingContext.beginPath();
        offscreenDrawingContext.moveTo(startX, startY);

        for(let i = 1; i < samplesLength; i++) {

            const { x, y } = getWavePointCoordsAtIndex(data, i, width, height);
            //console.log({x ,y});
            offscreenDrawingContext.lineTo(x, y);
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
            x: xOffset + xSamples[index] * canvasWidth,
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

</script>

<script context="module">
    let renderFunction;

    export function drawCallback(data) {
        renderFunction(data);
    }
</script>


<style>
    .canvasContainer {
        width: 80%;
    }

    .canvas {

    }
</style>