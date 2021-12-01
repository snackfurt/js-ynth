<Panel heading="SOUND PARAMETERS" isOpen={true}>
    <Knob bind:value={waveTypeStep} title="WAVE TYPE" outputValue={waveType} max={4} min={1} pixelRange={200}/>
    <Knob bind:value={frequency} title="FREQUENCY" unit="Hz" max={5000} min={60} pixelRange={200}/>
</Panel>
<Panel heading="VIEW PARAMETERS" isOpen={true}>
    <Knob bind:value={sampleSizeStep} title="SAMPLE SIZE" outputValue={sampleSize} max={10} min={0} pixelRange={200}/>
    <Knob bind:value={oldWavesDisplayed} title="WAVES SHOWING" max={30} min={1} pixelRange={200}/>
</Panel>

<button class="unselectable" on:mousedown={startSound} on:mouseup={stopSound}>
    make a sound
</button>

<WaveformCanvas {soundWave} {doDrawing} {sampleSize} {oldWavesDisplayed}></WaveformCanvas>


<script>
    import * as Pizzicato from 'pizzicato';
    import WaveformCanvas from './WaveformCanvas.svelte';
    import Panel from '../components/Panel.svelte';
    import Knob from '../components/Knob.svelte';

    let isSoundPlaying = false;
    let doDrawing = false;
    let frequency = 80;
    let sampleSizeStep = 7;
    let sampleSize;
    let oldWavesDisplayed = 10;
    let waveTypeStep = 1;
    let waveType;
    let soundWave;

    const SAMPLE_SIZES = [32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768];
    const WAVE_TYPES = ['sine', 'triangle', 'sawtooth', 'square'];

    initSoundWave();

    function initSoundWave() {
        if (soundWave) {
            soundWave.off();
            soundWave.stop();
        }

        soundWave = new Pizzicato.Sound({
            source: 'wave',
            options: {
                type: waveType,
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
            const timeout = 600;
            setTimeout(() => {
                doDrawing = isSoundPlaying;
            }, timeout);
        });

        if (isSoundPlaying) {
            soundWave.play();
        }
    }

    function startSound() {
        soundWave.play();
    }

    function stopSound() {
        soundWave.stop();
    }

    $: soundWave.frequency = frequency;
    $: sampleSize = SAMPLE_SIZES[sampleSizeStep];
    $: {
        waveType = WAVE_TYPES[waveTypeStep-1];
        initSoundWave();
    }

</script>


<style>
</style>