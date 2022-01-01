<Panel heading="SOUNDWAVE" isOpen={true} removeHandler={() => removeHandler(sound)}>
    <SoundGeneratorControls updateHandler={updateSound} />
    <LFOControls updateHandler={updateLfo} />
</Panel>


<script>
    import Panel from '../../components/Panel.svelte';
    import SoundGeneratorControls from './SoundGeneratorControls.svelte';
    import LFOControls from './LFOControls.svelte';

    export let sound;
    export let removeHandler;

    // sound
    let soundFrequency;
    let soundWaveType;

    // lfo
    let lfoActive;
    let lfoFrequency;
    let lfoWaveType;
    let lfoDepth;

    // reactive stuff
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

    function updateSound(updateData) {
        //console.log({updateData});

        const { frequency, waveType, detune } = updateData;
        if (frequency) {
            soundFrequency = frequency;
            sound.setFrequency(frequency);
        }
        if (waveType) {
            soundWaveType = waveType;
            initSoundWave();
        }
        if (detune !== undefined) {
            sound.setDetune(detune);
        }
    }

    function updateLfo(updateData) {
        const { frequency, waveType, depth, lfoIsActive } = updateData;
        if (frequency) {
            lfoFrequency = frequency;
            sound.setLfoFrequency(frequency);
        }
        if (waveType) {
            lfoWaveType = waveType;
            sound.initLfo(lfoWaveType, lfoFrequency, lfoDepth);
        }
        if (depth) {
            lfoDepth = depth;
            sound.initLfo(lfoWaveType, lfoFrequency, lfoDepth);
        }
        if (lfoIsActive !== undefined) {
            lfoActive = lfoIsActive;
        }
    }


</script>
