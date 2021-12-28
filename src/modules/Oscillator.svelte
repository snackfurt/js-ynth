<div class:disabled>
    <Knob bind:value={waveTypeStep} title="WAVE TYPE" outputValue={waveType} max={4} min={1} pixelRange={200}/>
    <Knob bind:value={frequency} title="FREQUENCY" unit="Hz" max={maxFrequency} min={minFrequency} pixelRange={200}/>
</div>


<script>
    import Knob from '../components/Knob.svelte';

    export let updateHandler;
    export let waveType;
    export let frequency;
    export let maxFrequency;
    export let minFrequency;
    export let disabled = false;

    let waveTypeStep = 1;

    const WAVE_TYPES = ['sine', 'triangle', 'sawtooth', 'square'];

    // reactive stuff
    $: updateHandler({frequency});
    $: {
        waveType = WAVE_TYPES[waveTypeStep-1];
        updateHandler({waveType});
    }
    //

</script>


<style>
    div {
        display: flex;
    }

    .disabled {
        pointer-events: none;
        opacity: 0.6;
    }
</style>