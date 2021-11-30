<div class="panel">
    <Knob bind:value={frequency} title="FREQUENZ" unit="Hz" max={5000} min={60} pixelRange={200}/>
    <Knob bind:value={sampleSizeStep} title="SAMPLE SIZE" outputValue={sampleSize} max={10} min={0} pixelRange={200}/>
</div>

<button class="unselectable" on:mousedown={startSound} on:mouseup={stopSound}>
    make a sound
</button>

<WaveformCanvas {soundWave} {doDrawing} {sampleSize}></WaveformCanvas>


<script>
    import * as Pizzicato from 'pizzicato';
    import WaveformCanvas from './WaveformCanvas.svelte';
    import Knob from "../components/Knob.svelte";


    let isSoundPlaying = false;
    let doDrawing = false;
    let frequency = 80;
    let sampleSize = 2048;
    let sampleSizeStep = 6;

    const SAMPLE_SIZES = [32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768];

    const soundWave = new Pizzicato.Sound({
        source: 'wave',
        options: {
            type: 'sine',
            frequency: frequency,
        }
    });

    soundWave.on('play', () => {
        isSoundPlaying = true;
        doDrawing = true;
    });
    soundWave.on('stop', () => {
        isSoundPlaying = false;
        //TODO: find a timeout without magic number - it seems to be not the sound's release
        //const timeout = Math.max(soundWave.release * 1000, drawInterval);
        const timeout = 150;
        setTimeout(() => {
            doDrawing = false;
        }, timeout);
    });

    function startSound() {
        soundWave.play();
    }

    function stopSound() {
        soundWave.stop();
    }

    $: soundWave.frequency = frequency;
    $: sampleSize = SAMPLE_SIZES[sampleSizeStep];

</script>


<style>
    .panel {
        display: flex;
        flex-direction: row;
        justify-content: center;
    }
</style>