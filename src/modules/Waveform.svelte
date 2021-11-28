<script>
    import * as Pizzicato from 'pizzicato';

    const sawtoothWave = new Pizzicato.Sound({
        source: 'wave',
        options: {
            type: 'sawtooth'
        }
    });

    function startSound() {
        sawtoothWave.play();
    }

    function stopSound() {
        sawtoothWave.stop();
    }
</script>

<button on:mousedown={startSound} on:mouseup={stopSound}>
    make a sound
</button>