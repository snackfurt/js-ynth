<Panel heading="SOUNDWAVE" isOpen={true} removeHandler={() => removeHandler(sound)}>
    <SoundGeneratorControls bind:frequency={soundFrequency} bind:waveType={soundWaveType} bind:detune={soundDetune} />
    <LFOControls bind:lfoActive={lfoActive} bind:frequency={lfoFrequency} bind:waveType={lfoWaveType} bind:depth={lfoDepth} />
</Panel>


<script>
    import Panel from '../../components/Panel.svelte';
    import SoundGeneratorControls from './SoundGeneratorControls.svelte';
    import LFOControls from './LFOControls.svelte';

    export let sound;
    export let removeHandler;

    // sound
    let soundWaveType = null;
    let soundFrequency = 80;
    let soundDetune = 0;

    // lfo
    let lfoWaveType = null;
    let lfoFrequency = 10;
    let lfoDepth = 50;
    let lfoActive = false;

    // reactive stuff
    $: {
        sound.setFrequency(soundFrequency);
    }
    $: {
        soundWaveType && initSoundWave();
    }
    $: {
        if (soundDetune !== undefined) {
            sound.setDetune(soundDetune);
        }
    }
    $: {
        if (lfoActive) {
            sound.initLfo(lfoWaveType, lfoFrequency, lfoDepth);
        }
        else {
            sound.removeLfo();
        }
    }
    //

    function initSoundWave() {
        const { isPlaying } = sound;

        sound.init(soundWaveType, soundFrequency);

        if (isPlaying) {
            sound.play();
        }
    }

</script>
