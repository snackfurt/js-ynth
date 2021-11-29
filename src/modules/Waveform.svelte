<script>
    import * as Pizzicato from 'pizzicato';
    import WaveformCanvas from './WaveformCanvas.svelte';


    let isSoundPlaying = false;
    let doDrawing = false;

    const soundWave = new Pizzicato.Sound({
        source: 'wave',
        options: {
            type: 'sine',
            frequency: 180,
        }
    });

    soundWave.on('play', () => {
        isSoundPlaying = true;
        doDrawing = true;
    });
    soundWave.on('stop', () => {
        isSoundPlaying = false;
        //TODO: find a timeout without magic number - it seems to be not the sound's release
        //const timeout = Math.max(soundWave.release * 1000, drawInterval);
        const timeout = 150;
        setTimeout(() => {
            doDrawing = false;
        }, timeout);
    });

    function startSound() {
        soundWave.play();
    }

    function stopSound() {
        soundWave.stop();
    }

</script>

<button on:mousedown={startSound} on:mouseup={stopSound}>
    make a sound
</button>

<WaveformCanvas {soundWave} {doDrawing}></WaveformCanvas>