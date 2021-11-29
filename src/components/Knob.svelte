<div class="knobContainer center">
    <div class="knob center" style="--rotation: {rotation}" on:pointerdown={pointerDown}></div>
    <div class="label unselectable">{value} Hz</div>
</div>

<script>
    export let value, min, max;
    export let rotRange = 2 * Math.PI * 0.83;
    export let pixelRange = 200;
    export let startRotation = -Math.PI * 0.83;

    let startY, startValue;
    $: valueRange = max - min;
    $: rotation = startRotation + (value - min) / valueRange * rotRange;

    function clamp(num, min, max) {
        return Math.round(Math.max(min, Math.min(num, max)));
    }

    function pointerMove({ clientY }) {
        const valueDiff = valueRange * (clientY - startY) / pixelRange;
        value = clamp(startValue - valueDiff, min, max)
    }

    function pointerDown({ clientY }) {
        console.log({ clientY });
        startY = clientY;
        startValue = value;
        window.addEventListener('pointermove', pointerMove);
        window.addEventListener('pointerup', pointerUp);
    }

    function pointerUp() {
        window.removeEventListener('pointermove', pointerMove);
        window.removeEventListener('pointerup', pointerUp);
    }
</script>


<style>

    .knobContainer {
        width: fit-content;
        margin-bottom: 10px;
    }

    .knob {
        display: block;
        width: 44px;
        height: 44px;
        padding: 0;
        border-radius: 50%;
        background-image: conic-gradient(white 0%, white 2%, #ff3e00 2%, #ff3e00 98%, white 98%, white 100%);
        transform: rotate(calc(var(--rotation) * 1rad));
        transform-origin: 50% 50%;
    }

    .label {
        width: 80px;
    }
</style>

