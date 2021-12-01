<main>
	<h1 class="unselectable">Hello</h1>
	<ViewControls bind:sampleSize={sampleSize} bind:oldWavesDisplayed={oldWavesDisplayed} />
	<WaveformCanvas {doDrawing} {sampleSize} {oldWavesDisplayed} />
	<button class="unselectable" on:mousedown={startSound} on:mouseup={stopSound}>
		make a sound
	</button>
	<Waveform bind:soundWave={sound1}/>
	<Waveform bind:soundWave={sound2}/>
</main>


<script>
	import Waveform from './modules/Waveform.svelte';
	import WaveformCanvas from './modules/WaveformCanvas.svelte';
	import ViewControls from './modules/ViewControls.svelte';

	let doDrawing = true;
	let sampleSize;
	let oldWavesDisplayed;
	let sound1;
	let sound2;

	const sounds = [sound1, sound2];

	function startSound() {
		sound1.play();
		sound2.play();
	}

	function stopSound() {
		sound1.stop();
		sound2.stop();
	}
</script>


<style>
	:global(.unselectable) {
		user-select: none;
	}

	:global(.center) {
		margin: 0 auto;
	}

	main {
		text-align: center;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>