<ViewControls bind:sampleSize={sampleSize} bind:oldWavesDisplayed={oldWavesDisplayed} bind:fps={fps} />
{#if errorMessage}
    <div class="errorMsg">{errorMessage}</div>
{:else}
    <Oscilloscope {oldWavesDisplayed} />
{/if}
<div>
    <label>
        <input type="checkbox" bind:checked={useEchoCancellation} on:change={startAudioInput} disabled={!isInputPlaying}>
        echo cancellation
    </label>
    <button on:click={toggleAudioInput}>
        {#if isInputPlaying}
            stop input
        {:else}
            get input
        {/if}
    </button>
    <button on:click={toggleSound}>
        {#if isSoundPlaying}
            stop sound
        {:else}
            play sound
        {/if}
    </button>
    <button on:click={addSound}>
        add a sound
    </button>
</div>
{#each sounds as sound}
    <SoundwaveControls bind:sound={sound} removeHandler={() => removeSound(sound)} />
{/each}

<script>
    import {onMount} from 'svelte';
    import SoundwaveControls from '../modules/soundwave/SoundwaveControls.svelte';
    import ViewControls from '../modules/ViewControls.svelte';
    import Sound from '../utils/Sound';
    import Oscilloscope, { drawCallback } from '../modules/Oscilloscope.svelte';
    import {
        init as initSoundsystem, 
        startSound as startPlayingSound,
        stopSound as stopPlayingSound,
        startUserAudio,
        stopUserAudio,
        setProcessorFps,
        setProcessorSweepTime,
    } from '../utils/soundsystem';

    let isSoundPlaying = false;
    let isInputPlaying = false;
    let useEchoCancellation = true;
    let sampleSize;
    let fps;
    let oldWavesDisplayed;
    let errorMessage;

    let sounds = [];

    onMount(() => {
        initSoundsystem(drawCallback, errorCallback);
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

    function toggleAudioInput() {
        errorMessage = null;

        if (isInputPlaying) {
            stopUserAudio();
            isInputPlaying = false;
        }
        else {
            startAudioInput();
        }
    }

    function startAudioInput() {
        startUserAudio(useEchoCancellation)
                .then(() => {
                    console.log('got user audio');
                    isInputPlaying = true;
                })
                .catch(error => {
                    console.error('cannot get user audio', {error});
                    errorMessage = 'cannot get audio input';
                    isInputPlaying = false;
                });
    }

    function toggleSound() {
        errorMessage = null;
        isSoundPlaying = !isSoundPlaying;
    }

    function startSound() {
        startPlayingSound();
        setProcessorSweepTime(sampleSize);
        setProcessorFps(fps);
        sounds.forEach(sound => sound.play());
    }

    function stopSound() {
        sounds.forEach(sound => sound.stop());
        isSoundPlaying = false;
        //TODO: find a timeout without magic number - it seems to be not the sound's release
        //const timeout = Math.max(soundWave.release * 1000, drawInterval);
        const timeout = 600;
        setTimeout(() => {
            if (!isSoundPlaying) {
                stopPlayingSound();
            }
        }, timeout);
    }

    function addSound() {
        const sound = new Sound();
        sounds = sounds.concat(sound);

        if (isSoundPlaying) {
            sounds.forEach(sound => sound.stop());
            sounds.forEach(sound => sound.play());
        }
    }

    function removeSound(sound) {
        const index = sounds.indexOf(sound);

        if (index > -1) {
            const { [index]:removedSound, ...remainingSounds } = sounds;
            removedSound.remove();
            sounds = Object.values(remainingSounds);
        }
    }

    function errorCallback(errorType) {
        let message = 'an error occurred.';

        switch(errorType) {
            case 'process': {
                message = 'cannot get audio data. please check your audio system - is your audio used by another app?'
                break;
            }
            default: {
                break;
            }
        }

        errorMessage = message;
    }
</script>


<style>
    .errorMsg {
        margin: 20px 0;
    }

    button {
        background-color: white;
        color: #ff3e00;
        text-align: left;
        border: 1px solid;
        text-transform: uppercase;
    }
</style>