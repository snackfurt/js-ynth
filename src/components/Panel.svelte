<button class:active={isOpen} class="panel-header unselectable" on:click={() => isOpen = !isOpen}>
    <span class="heading">{heading}</span>
    {#if isOpen}
        <span class="icon">&minus;</span>
    {:else}
        <span class="icon">&plus;</span>
    {/if}
</button>

<section class:open-panel={isOpen} class="panel-content">
    <slot></slot>
</section>


<script>
    export let heading;
    export let isOpen;
</script>


<style>
    button.panel-header {
        width: 100%;
        padding: 5px;
        margin: 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: white;
        color: #ff3e00;
        text-align: left;
        border: 1px solid #ff3e00;
        cursor: pointer;
        transition: .3s;
    }

    .heading {
        font-size: 1rem;
    }

    span.icon {
        font-size: 1.2rem;
    }

    .panel-content {
        display: flex;
        flex-direction: row;
        justify-content: center;
        height: 0;
        overflow: auto;
        transition: height 0.5s;
        margin-top: -1px;
        margin-bottom: 5px;
        border: none;
    }

    .open-panel {
        height: 110px;
        border: 1px solid #ff3e00;
    }


</style>