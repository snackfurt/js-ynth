<Oscillator bind:frequency={frequency} bind:waveType={waveType} maxFrequency={5000} minFrequency={60}>
    <Knob slot="knob3" bind:value={detune} title="DETUNE" unit="cents" max={50} min={-50} />
    <span slot="label">SOUND</span>
</Oscillator>


<script>
    import Oscillator from './OscillatorControls.svelte';
    import Knob from '../../components/Knob.svelte';

    // getters
    export let waveType;
    export let frequency;
    export let detune;
    
</script>
