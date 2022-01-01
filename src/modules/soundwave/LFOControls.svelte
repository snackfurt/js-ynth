<Oscillator bind:frequency={frequency} bind:waveType={waveType} disabled={!lfoActive} maxFrequency={200} minFrequency={1} enableInverseFrequency={true}>
    <Knob slot="knob3" bind:value={depth} title="DEPTH" unit="" max={100} min={1}/>
    <Toggle slot="label" bind:toggled={lfoActive}
            hideLabel label="toggle LFO"
            switchColor="#ff3e00"
            toggledColor="#fff"
            untoggledColor="#fff"
            on="LFO on"
            off="LFO off"
    />
</Oscillator>

<script>
    import Oscillator from './OscillatorControls.svelte';
    import Knob from '../../components/Knob.svelte';
    import Toggle from '../../components/Toggle.svelte';

    // getters
    export let lfoActive;
    export let waveType;
    export let frequency;
    export let depth;

</script>
