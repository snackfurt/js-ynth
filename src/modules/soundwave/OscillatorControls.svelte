<div class="container">
    <div class="controls" class:disabled>
        <Knob bind:value={waveTypeValue} title="WAVE TYPE" outputValue={waveType} max={4} min={1}/>
        <Knob bind:value={frequencyValue} bind:useInverse={useInverseFrequency} title="FREQUENCY" unit="Hz" max={maxFrequency} min={minFrequency} enableInverse={enableInverseFrequency}/>
        <slot name="knob3"></slot>
    </div>
    <div class="labelContainer">
        <slot name="label"></slot>
    </div>
</div>


<script>
    import Knob from '../../components/Knob.svelte';

    // getters
    export let waveType;
    export let frequency;
    export let useInverseFrequency = false;
    // setters
    export let maxFrequency;
    export let minFrequency;
    export let disabled = false;
    export let enableInverseFrequency = false;

    let waveTypeValue = 1;
    let frequencyValue = frequency;

    const WAVE_TYPES = ['sine', 'triangle', 'sawtooth', 'square'];

    // reactive stuff
    $: {
        frequency = useInverseFrequency ? 1/frequencyValue : frequencyValue;
    }
    $: {
        waveType = WAVE_TYPES[waveTypeValue-1];
    }
    //

</script>


<style>
    .container {
        display: flex;
        flex-direction: column;
        padding: 5px 5px 12px;
    }

    .controls {
        display: flex;
        flex-direction: row;
        justify-content: space-around;
        border: 1px solid;
        border-radius: 1em;
        height: 120px;
        padding-top: 24px;
    }

    .labelContainer {
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
