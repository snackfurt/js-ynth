<Oscillator maxFrequency={5000} minFrequency={60} frequency={80} {updateHandler}>
    <Knob slot="knob3" bind:value={detune} title="DETUNE" unit="cents" max={50} min={-50} />
    <span slot="label">SOUND</span>
</Oscillator>


<script>
    import Oscillator from './OscillatorControls.svelte';
    import Knob from '../../components/Knob.svelte';

    export let updateHandler;
    
    let detune = 0;

    $: {
        updateHandler({detune});
    }
    
</script>