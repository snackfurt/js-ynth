<Oscillator disabled={!lfoActive} maxFrequency={200} minFrequency={1} frequency={10} enableInverseFrequency={true} {updateHandler}>
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

    export let updateHandler;

    let lfoActive = false;
    let depth = 50;

    $: {
        updateHandler({depth});
    }
    $: {
        updateHandler({lfoIsActive: lfoActive});
    }

</script>