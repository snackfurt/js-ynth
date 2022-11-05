<div class="panel">
    <div class="panel-header">
        {#if removeHandler}
            <button class="remove-button" on:click={removeHandler}>&#10060;</button>
        {/if}
        <button class="panel-button" on:click={() => isOpen = !isOpen}>
            <span class="heading">{heading}</span>
            <span class="icon">{#if isOpen}&mapstoup;{:else}&mapstodown;{/if}</span>
        </button>
    </div>

    <section class:isOpen class="panel-content">
        <slot></slot>
    </section>
</div>


<script>
    export let heading;
    export let isOpen;
    export let removeHandler = null;
</script>


<style>
    .panel {
        margin-bottom: 5px;
    }

    .panel-header {
        margin: 0;
        border: 1px solid #ff3e00;
        transition: .3s;
        display: flex;
    }

    .heading {
        font-size: 1rem;
    }

    .icon {
        font-size: 1.2rem;
    }

    .panel-content {
        display: flex;
        flex-direction: column;
        justify-content: center;
        height: 0;
        overflow: auto;
        transition: height 0.5s;
        margin-top: -1px;
        margin-bottom: 5px;
        border: none;
        visibility: hidden;
    }

    .panel-button {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: white;
        color: #ff3e00;
        text-align: left;
        border: none;
    }

    .remove-button {
        height: 26px;
        width: 26px;
        border: 1px solid #ff3e00;
        background: none;
        font-size: 0.6rem;
        margin-left: 5px;
        margin-top: 6px;
        margin-bottom: 0;
        padding-left: 2px;
    }

    .isOpen {
        border: 1px solid #ff3e00;
        height: fit-content;
        padding: 10px;
        visibility: visible;
    }

    @media screen and (min-width: 984px) {
        
        .panel-content {
            display: flex;
            flex-direction: row;
            justify-content: center;
        }
    }


</style>