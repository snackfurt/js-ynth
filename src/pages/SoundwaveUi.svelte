<ViewControls bind:sampleSize={sampleSize} bind:oldWavesDisplayed={oldWavesDisplayed} />
<!--<WaveformCanvas {doDrawing} {sampleSize} {oldWavesDisplayed} />-->
<Oscilloscope bind:this={oscilloscope}/>
<button on:mousedown={startSound} on:mouseup={stopSound}>
    make a sound
</button>
<button on:click={addSound}>
    add a sound
</button>
{#each sounds as sound}
    <SoundwaveControls bind:sound={sound} removeHandler={() => removeSound(sound)} />
{/each}

<script>
    import {onMount} from 'svelte';
    import SoundwaveControls from '../modules/SoundwaveControls.svelte';
    import WaveformCanvas from '../modules/WaveformCanvas.svelte';
    import ViewControls from '../modules/ViewControls.svelte';
    import Sound from '../utils/Sound';
    import Oscilloscope, { drawCallback } from '../modules/Oscilloscope.svelte';
    import { init as initSoundsystem } from '../utils/soundsystem';

    let isSoundPlaying = false
    let doDrawing = false;
    let sampleSize;
    let oldWavesDisplayed;
    let oscilloscope;

    let sounds = [];

    onMount(() => {
        initSoundsystem(drawCallback);
        sounds = sounds.concat(new Sound());
    });

    function startSound() {
        isSoundPlaying = true;
        doDrawing = true;
        sounds.forEach(sound => sound.play());
    }

    function stopSound() {
        sounds.forEach(sound => sound.stop());
        isSoundPlaying = false;
        //TODO: find a timeout without magic number - it seems to be not the sound's release
        //const timeout = Math.max(soundWave.release * 1000, drawInterval);
        const timeout = 600;
        setTimeout(() => {
            doDrawing = isSoundPlaying;
        }, timeout);
    }

    function addSound() {
        sounds = sounds.concat(new Sound());
    }

    function removeSound(sound) {
        const index = sounds.indexOf(sound);

        if (index > -1) {
            const { [index]:removedSound, ...remainingSounds } = sounds;
            removedSound.remove();
            sounds = Object.values(remainingSounds);
        }
    }
</script>