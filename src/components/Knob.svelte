<div class="knobContainer">
    <div class="label">{title}</div>
    {#if enableInverse}
        <button class="inverseButton" class:useInverse on:click={() => {useInverse = !useInverse}}><span class="icon">⅟</span></button>
    {/if}
    <div class="knob center" style="--rotation: {rotation}" on:pointerdown|self={knobClicked}></div>
    <div class="label">{displayedValue} {unit}</div>
    <div class="stepButtonContainer">
        <button class="stepButton" on:pointerdown|self={stepUpClicked}><span class="icon">&plus;</span></button>
        <button class="stepButton" on:pointerdown|self={stepDownClicked}><span class="icon">&minus;</span></button>
    </div>
</div>

<script>
    export let value, min, max;
    export let rotRange = 2 * Math.PI * 0.83;
    export let pixelRange = 200;
    export let startRotation = -Math.PI * 0.83;
    export let title = '';
    export let unit = '';
    export let outputValue = null;
    export let enableInverse = false;
    export let useInverse = false;

    let startY, startValue, stepButtonDown, stepButtonTimeout;
    let displayedValue;
    let stopScrolling = false;

    $: valueRange = max - min;
    $: rotation = startRotation + (value - min) / valueRange * rotRange;
    $: displayedValue = outputValue ?? (useInverse ? round(1/value) : value);

    // avoid scrolling on mobile devices
    window.addEventListener('touchmove', preventTouchMove, { passive: false });

    function round(num) {
        return num.toFixed(3);
    }

    function clamp(num, min, max) {
        return Math.round(Math.max(min, Math.min(num, max)));
    }

    function knobClicked({ clientY }) {
        startY = clientY;
        startValue = value;
        window.addEventListener('pointermove', knobMoved);
        window.addEventListener('pointerup', knobReleased);
        stopScrolling = true;
    }

    function knobMoved(event) {
        const { clientY } = event;
        const valueDiff = valueRange * (clientY - startY) / pixelRange;
        value = clamp(startValue - valueDiff, min, max);
    }

    function knobReleased() {
        window.removeEventListener('pointermove', knobMoved);
        window.removeEventListener('pointerup', knobReleased);
        stopScrolling = false;
    }

    function preventTouchMove(event) {
        if (stopScrolling) {
            event.preventDefault();
        }
    }

    function stepUpClicked() {
        stepButtonDown = true;
        stepUp();
        window.addEventListener('pointerup', stepReleased);
    }

    function stepDownClicked() {
        stepButtonDown = true;
        stepDown();
        window.addEventListener('pointerup', stepReleased);
    }

    function stepReleased() {
        stepButtonDown = false;
        clearTimeout(stepButtonTimeout);
        window.removeEventListener('pointerup', stepReleased);
    }

    function stepUp() {
        if (stepButtonDown && value < max){
            value = value + 1;
            stepButtonTimeout = setTimeout(stepUp, 300);
        }
    }

    function stepDown() {
        if (stepButtonDown && value > min){
            value = value - 1;
            stepButtonTimeout = setTimeout(stepDown, 300);
        }
    }
</script>


<style>

    .knobContainer {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 10px;
        width: 160px;
        position: relative;
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
        margin: 5px;
    }

    .stepButtonContainer {
        display: flex;
        flex-direction: row;
        position: absolute;
        width: 130px;
        top: 67px;
        justify-content: space-between;
    }

    .stepButton {
        color: #ff3e00;
        font-size: 1rem;
        border: none;
        background: transparent;
        height: 35px;
        width: 35px;
        padding: 0;
        margin: 0;
    }

    .icon {
        pointer-events: none;
    }


    .inverseButton {
        color: #ff3e00;
        font-size: 1rem;
        border: 1px solid #ff3e00;
        background: transparent;
        height: 30px;
        width: 30px;
        padding: 0;
        position: absolute;
        margin-left: 87px;
        margin-top: 28px;
    }

    .useInverse {
        color: #ffffff;
        background-color: #ff3e00;
    }
</style>

