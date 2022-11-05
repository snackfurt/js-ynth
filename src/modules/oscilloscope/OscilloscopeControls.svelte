<Panel heading="OSCILLOSCOPE PARAMETERS" isOpen={true}>
    <div class="container">
        <Knob bind:value={sampleSizeStep} title="⅟SAMPLE TIME" max={1000} min={1} pixelRange={200}/>
        <Knob bind:value={fps} title="FPS" max={120} min={1} pixelRange={200}/>
        <Knob bind:value={oldWavesDisplayed} title="WAVES SHOWING" max={30} min={1} pixelRange={200}/>
    </div>
</Panel>


<script>
    import Panel from '../../components/Panel.svelte';
    import Knob from '../../components/Knob.svelte';

    export let sampleSize;
    export let fps;
    export let oldWavesDisplayed;

    let sampleSizeStep = 1 / sampleSize;

    $: sampleSize = 1 / sampleSizeStep;
</script>


<style>
    .container {
        display: flex;
        flex-direction: row;
        justify-content: space-around;
        padding: 5px 5px 5px;
    }
</style>