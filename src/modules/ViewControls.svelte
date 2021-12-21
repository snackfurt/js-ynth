<Panel heading="VIEW PARAMETERS" isOpen={true}>
    <Knob bind:value={sampleSizeStep} title="⅟SAMPLE TIME" max={1000} min={1} pixelRange={200}/>
    <Knob bind:value={fps} title="FPS" max={120} min={1} pixelRange={200}/>
    <Knob bind:value={oldWavesDisplayed} title="WAVES SHOWING" max={30} min={1} pixelRange={200}/>
</Panel>


<script>
    import Panel from '../components/Panel.svelte';
    import Knob from '../components/Knob.svelte';

    export let sampleSize;
    export let fps = 60;
    export let oldWavesDisplayed = 10;

    let sampleSizeStep = 15;

    $: sampleSize = 1 / sampleSizeStep;
</script>