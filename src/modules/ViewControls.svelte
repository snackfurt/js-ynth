<Panel heading="VIEW PARAMETERS" isOpen={true}>
    <Knob bind:value={sampleSizeStep} title="SAMPLE SIZE" outputValue={sampleSize} max={10} min={0} pixelRange={200}/>
    <Knob bind:value={oldWavesDisplayed} title="WAVES SHOWING" max={30} min={1} pixelRange={200}/>
</Panel>


<script>
    import Panel from '../components/Panel.svelte';
    import Knob from '../components/Knob.svelte';

    export let sampleSize;
    export let oldWavesDisplayed = 10;

    const SAMPLE_SIZES = [32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768];

    let sampleSizeStep = 7;

    $: sampleSize = SAMPLE_SIZES[sampleSizeStep];
</script>