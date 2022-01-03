<ViewControls bind:sampleSize={sampleSize} bind:oldWavesDisplayed={oldWavesDisplayed} bind:fps={fps} />
{#if errorMessage}
    <div class="errorMsg">{errorMessage}</div>
{:else}
    <Oscilloscope {oldWavesDisplayed} />
{/if}
<div>
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
{#if isInputPlaying}
    <AudioInput bind:useEchoCancellation={useEchoCancellation} bind:useNoiseSuppression={useNoiseSuppression} removeHandler={stopAudioInput} />
{/if}
{#each sounds as sound}
    <SoundwaveControls bind:sound={sound} removeHandler={() => removeSound(sound)} />
{/each}

<script>
    import {onMount} from 'svelte';
    import AudioInput from '../modules/AudioInput.svelte';
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
    let useEchoCancellation = false;
    let useNoiseSuppression = true;
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
    $: isSoundPlaying ? startSound() : stopSound();
    $: setProcessorSweepTime(sampleSize);
    $: setProcessorFps(fps);
    $: updateAudioInput(useEchoCancellation, useNoiseSuppression);  // pass unused params to enable reactivity
    //

    function toggleAudioInput() {
        errorMessage = null;

        if (isInputPlaying) {
            stopAudioInput();
        }
        else {
            startAudioInput();
        }
    }

    function startAudioInput() {
        console.log('startAudioInput');
        startUserAudio(useEchoCancellation, useNoiseSuppression)
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

    function stopAudioInput() {
        stopUserAudio();
        isInputPlaying = false;
    }

    function updateAudioInput() {
        console.log('updateAudioInput');
        if (isInputPlaying) {
            startAudioInput();
        }
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