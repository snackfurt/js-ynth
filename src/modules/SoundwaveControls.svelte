<Panel heading="SOUNDWAVE" isOpen={true} removeHandler={() => removeHandler(sound)}>
    <Knob bind:value={waveTypeStep} title="WAVE TYPE" outputValue={waveType} max={4} min={1} pixelRange={200}/>
    <Knob bind:value={frequency} title="FREQUENCY" unit="Hz" max={5000} min={60} pixelRange={200}/>
</Panel>


<script>
    import Panel from '../components/Panel.svelte';
    import Knob from '../components/Knob.svelte';
    import {createSound, removeSound} from '../utils/soundsystem';

    export let sound;
    export let removeHandler;

    let frequency = 80;
    let waveTypeStep = 1;
    let waveType;

    const WAVE_TYPES = ['sine', 'triangle', 'sawtooth', 'square'];

    initSoundWave();

    function initSoundWave() {
        const { soundwave } = sound;
        const isPlaying = soundwave ? soundwave.playing : false;
        removeSound(soundwave);

        sound.soundwave = createSound(waveType, frequency);

        /*
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
        */

        if (isPlaying) {
            sound.soundwave.play();
        }
    }

    $: sound.soundwave.frequency = frequency;
    $: {
        waveType = WAVE_TYPES[waveTypeStep-1];
        initSoundWave();
    }

</script>


<style>

</style>