<div class="canvasContainer center" bind:this={canvasContainer}>
    {#if !supportsWebGl}
        Sorry, your browser does not support WebGl
    {:else if renderingError}
        Sorry, there was an error:
        {renderingError}
    {:else}
        <canvas id="example" class="canvas" bind:this={canvas}></canvas>
    {/if}
</div>


<script>
    import {onMount} from 'svelte';
    import {supportsWebGl} from '../utils/supportsWebGl';
    import OscilloscopeRenderer from '../oscilloscope/OscilloscopeRenderer';
    import {getProcessor} from '../utils/soundsystem';

    let canvas;
    let canvasContainer;
    let renderingError;
    let processor;

    onMount(() => {
        init();
    });

    function init() {
        processor = getProcessor();
        initRenderer();
    }

    function initRenderer() {
        setCanvasSize(canvas);
        renderer = new OscilloscopeRenderer(canvas);
        renderer.init();
    }

    function setCanvasSize(canvas) {
        canvas.width = canvasContainer.clientWidth;
        canvas.height = canvas.width * 0.33;
    }

</script>

<script context="module">
    let renderer;

    export function drawCallback(data) {
        renderer.draw(data);
    }
</script>


<style>
    .canvasContainer {
        width: 80%;
    }

    .canvas {

    }
</style>