<script>
    /**
     * adapted from https://github.com/metonym/svelte-toggle
     */

    /**
     * Specify whether the toggle switch is toggled
     */
    export let toggled = true;

    /**
     * Specify the label text
     */
    export let label = "Label";

    /**
     * Set to `true` to visually hide the label
     */
    export let hideLabel = false;

    /**
     * Set to `true` to disable the button
     */
    export let disabled = false;

    /**
     * Set a descriptor for the toggled state
     * @type {string}
     */
    export let on = undefined;

    /**
     * Set a descriptor for the untoggled state
     * @type {string}
     */
    export let off = undefined;

    /**
     * Specify the switch color
     */
    export let switchColor = "#fff";

    /**
     * Specify the toggled switch background color
     */
    export let toggledColor = "#0f62fe";

    /**
     * Specify the untoggled switch background color
     */
    export let untoggledColor = "#8d8d8d";



    let id = "toggle" + Math.random().toString(36);

    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    $: dispatch("toggle", toggled);
</script>

<div>
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label for="{id}" class:hideLabel>{label}</label>
    <div>
        <button
                id="{id}"
                aria-checked="{toggled}"
                type="button"
                role="switch"
                style="color: {switchColor}; background-color: {toggled ? toggledColor : untoggledColor};"
                {disabled}
                on:click
                on:click={() => (toggled = !toggled)}
                on:focus
                on:blur>
        </button>
        <slot {toggled}>
            {#if on && off}<span>{toggled ? on : off}</span>{/if}
        </slot>
    </div>
</div>


<style>
    label {
        display: block;
        margin-bottom: 0.25rem;
        font-size: 0.75rem;
    }

    /**
    * Visually hide element without breaking screen readers
    * https://a11yproject.com/posts/how-to-hide-content/
    */
    .hideLabel {
        position: absolute;
        height: 1px;
        width: 1px;
        overflow: hidden;
        clip: rect(1px 1px 1px 1px);
        clip: rect(1px, 1px, 1px, 1px);
        white-space: nowrap;
    }

    button {
        position: relative;
        padding: 0 0.25rem;
        border: 1px solid;
        border-radius: 1rem;
        height: 1.25rem;
        width: 2.5rem;
        font: inherit;
        color: inherit;
        line-height: inherit;
    }

    button:not([disabled]) {
        cursor: pointer;
    }

    button[disabled] {
        cursor: not-allowed;
        opacity: 0.6;
    }

    button:before {
        position: absolute;
        content: "";
        top: 0;
        bottom: 0;
        left: 0.125rem;
        margin: auto;
        height: 1rem;
        width: 1rem;
        text-align: center;
        border-radius: 50%;
        background-color: currentColor;
        transition: transform 150ms ease-out;
    }

    button[aria-checked="true"]:before {
        transform: translateX(1.12rem);
    }

    div {
        display: flex;
        align-items: center;
    }

    span {
        margin-left: 0.5rem;
    }
</style>