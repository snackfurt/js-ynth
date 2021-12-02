<div class="knobContainer unselectable">
    <div class="label">{title}</div>
    <div class="knob center" style="--rotation: {rotation}" on:pointerdown={knobClicked}></div>
    <div class="label">{outputValue ?? value} {unit}</div>
    <div class="stepButtonContainer">
        <button class="stepButton" on:pointerdown={stepUpClicked}><span class="icon">&plus;</span></button>
        <button class="stepButton" on:pointerdown={stepDownClicked}><span class="icon">&minus;</span></button>
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

    let startY, startValue, stepButtonDown, stepButtonTimeout;
    $: valueRange = max - min;
    $: rotation = startRotation + (value - min) / valueRange * rotRange;

    function clamp(num, min, max) {
        return Math.round(Math.max(min, Math.min(num, max)));
    }

    function knobClicked({ clientY }) {
        startY = clientY;
        startValue = value;
        window.addEventListener('pointermove', knobMoved);
        window.addEventListener('pointerup', knobReleased);
    }

    function knobMoved({ clientY }) {
        const valueDiff = valueRange * (clientY - startY) / pixelRange;
        value = clamp(startValue - valueDiff, min, max)
    }

    function knobReleased() {
        window.removeEventListener('pointermove', knobMoved);
        window.removeEventListener('pointerup', knobReleased);
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
        width: 120px;
        top: 75px;
        justify-content: space-between;
    }

    .stepButton {
        color: #ff3e00;
        font-size: 1rem;
        border: none;
        background: none;
        height: 20px;
        width: 20px;
        padding: 0;
        margin: 0;
    }
</style>

