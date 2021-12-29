<div class="container">
    <div class="controls" class:disabled>
        <Knob bind:value={waveTypeStep} title="WAVE TYPE" outputValue={waveType} max={4} min={1}/>
        <Knob bind:value={frequency} bind:useInverse={useInverseFrequency} title="FREQUENCY" unit="Hz" max={maxFrequency} min={minFrequency} enableInverse={enableInverseFrequency}/>
    </div>
    <div class="slotContainer">
        <slot></slot>
    </div>
</div>


<script>
    import Knob from '../components/Knob.svelte';

    export let updateHandler;
    export let waveType;
    export let frequency;
    export let useInverseFrequency;
    export let maxFrequency;
    export let minFrequency;
    export let disabled = false;
    export let enableInverseFrequency = false;

    let waveTypeStep = 1;

    const WAVE_TYPES = ['sine', 'triangle', 'sawtooth', 'square'];

    // reactive stuff
    $: {
        const finalFrequency = useInverseFrequency ? 1/frequency : frequency;
        console.log({finalFrequency, useInverseFrequency, frequency})
        updateHandler({frequency: finalFrequency});
    }
    $: {
        waveType = WAVE_TYPES[waveTypeStep-1];
        updateHandler({waveType});
    }
    //

</script>


<style>
    .container {
        display: flex;
        flex-direction: column;
        padding: 5px 5px 0px;
    }

    .controls {
        display: flex;
        flex-direction: row;
        border: 1px solid;
        border-radius: 1em;
        height: 120px;
        padding-top: 24px;
    }

    .slotContainer {
        margin-top: -6px;
        margin-left: 10px;
        position: absolute;
        background-color: #fff;
        width: max-content;
        height: max-content;
        padding-right: 3px;
        padding-left: 3px;
    }

    .disabled {
        pointer-events: none;
        opacity: 0.6;
    }
</style>