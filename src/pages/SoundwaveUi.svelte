<ViewControls bind:sampleSize={sampleSize} bind:oldWavesDisplayed={oldWavesDisplayed} bind:fps={fps} />
<Oscilloscope bind:this={oscilloscope} {oldWavesDisplayed} />
<button on:click={() => isSoundPlaying = !isSoundPlaying}>
    {#if isSoundPlaying}
        stop sound
    {:else}
        play sound
    {/if}
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
    import ViewControls from '../modules/ViewControls.svelte';
    import Sound from '../utils/Sound';
    import Oscilloscope, { drawCallback } from '../modules/Oscilloscope.svelte';
    import {
        init as initSoundsystem, setProcessorFps,
        setProcessorSweepTime,
        startSoundProcessor,
        stopSoundProcessor
    } from '../utils/soundsystem';

    let isSoundPlaying = false;
    let sampleSize;
    let fps;
    let oldWavesDisplayed;
    let oscilloscope;

    let sounds = [];

    onMount(() => {
        initSoundsystem(drawCallback);
        sounds = sounds.concat(new Sound());
    });

    // reactive stuff
    $: {
        if (isSoundPlaying) {
            startSound();
        }
        else {
            stopSound();
        }
    }

    $: {
        setProcessorSweepTime(sampleSize);
    }

    $: {
        setProcessorFps(fps);
    }
    //

    function startSound() {
        startSoundProcessor().then(() => {
            setProcessorSweepTime(sampleSize);
            setProcessorFps(fps);
            sounds.forEach(sound => sound.play());
        });
    }

    function stopSound() {
        sounds.forEach(sound => sound.stop());
        isSoundPlaying = false;
        //TODO: find a timeout without magic number - it seems to be not the sound's release
        //const timeout = Math.max(soundWave.release * 1000, drawInterval);
        const timeout = 600;
        setTimeout(() => {
            if (!isSoundPlaying) {
                stopSoundProcessor();
            }
        }, timeout);
    }

    function addSound() {
        const sound = new Sound();
        if (isSoundPlaying) {
            sound.play();
        }
        sounds = sounds.concat(sound);
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