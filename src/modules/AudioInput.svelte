<Panel heading="AUDIO INPUT" isOpen={true} removeHandler={() => removeHandler()}>
    <label>
        <input type="checkbox" bind:checked={useEchoCancellation}>
        echo cancellation
    </label>
    <label>
        <input type="checkbox" bind:checked={useNoiseSuppression}>
        noise suppression
    </label>
</Panel>


<script>
    import Panel from '../components/Panel.svelte';

    export let removeHandler;
    export let useEchoCancellation;
    export let useNoiseSuppression;
</script>


<style>
    label {
        margin: 0 20px;
    }
</style>
