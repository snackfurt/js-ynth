<Panel heading="SOUNDWAVE" isOpen={true} removeHandler={() => removeHandler(sound)}>
    <Oscillator maxFrequency={5000} minFrequency={60} frequency={80} updateHandler={updateSound}>
        SOUND
    </Oscillator>

    <Oscillator disabled={!lfoActive} maxFrequency={200} minFrequency={1} frequency={10} updateHandler={updateLfo}>
        <Toggle bind:toggled={lfoActive}
                hideLabel label="toggle LFO"
                switchColor="#ff3e00"
                toggledColor="#fff"
                untoggledColor="#fff"
                on="LFO on"
                off="LFO off"
        />
    </Oscillator>

</Panel>


<script>
    import Panel from '../components/Panel.svelte';
    import Oscillator from './Oscillator.svelte';
    import Toggle from '../components/Toggle.svelte';

    export let sound;
    export let removeHandler;

    // sound
    let soundFrequency;
    let soundWaveType;

    // lfo
    let lfoActive = false;
    let lfoFrequency;
    let lfoWaveType;

    // reactive stuff
    $: {
        if (lfoActive) {
            sound.initLfo(lfoWaveType, lfoFrequency);
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

        const { frequency, waveType } = updateData;
        if (frequency) {
            soundFrequency = frequency;
            sound.setFrequency(frequency);
        }
        if (waveType) {
            soundWaveType = waveType;
            initSoundWave();
        }
    }

    function updateLfo(updateData) {
        const { frequency, waveType } = updateData;
        if (frequency) {
            lfoFrequency = frequency;
            sound.setLfoFrequency(frequency);
        }
        if (waveType) {
            lfoWaveType = waveType;
            sound.initLfo(lfoWaveType, lfoFrequency);
        }
    }


</script>


<style>
    #toggle {
        width: 112px;
    }
</style>