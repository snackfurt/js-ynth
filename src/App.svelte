<main class="unselectable">
	<h1>JS SYNTH</h1>
	<ViewControls bind:sampleSize={sampleSize} bind:oldWavesDisplayed={oldWavesDisplayed} />
	<WaveformCanvas {doDrawing} {sampleSize} {oldWavesDisplayed} />
	<button on:mousedown={startSound} on:mouseup={stopSound}>
		make a sound
	</button>
	<button on:click={addSound}>
		add a sound
	</button>
	{#each sounds as sound}
		<SoundwaveControls bind:sound={sound} removeHandler={() => removeSound(sound)}/>
	{/each}
</main>


<script>
	import SoundwaveControls from './modules/SoundwaveControls.svelte';
	import WaveformCanvas from './modules/WaveformCanvas.svelte';
	import ViewControls from './modules/ViewControls.svelte';
	import Sound from './utils/Sound';

	let doDrawing = true;
	let sampleSize;
	let oldWavesDisplayed;

	let sounds = [new Sound()];


	function startSound() {
		sounds.forEach(sound => sound.play());
	}

	function stopSound() {
		sounds.forEach(sound => sound.stop());
	}

	function addSound() {
		sounds = sounds.concat(new Sound());
	}

	function removeSound(sound) {
		const index = sounds.indexOf(sound);

		if (index > -1) {
			const { [index]:removedSound, ...remainingSounds } = sounds;
			removedSound.remove();
			sounds = Object.values(remainingSounds);
		}
	}
</script>


<style>
	:global(.center) {
		margin: 0 auto;
	}

	main {
		text-align: center;
		margin: 0 auto;
		user-select: none;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 2em;
		font-weight: 100;
	}

	:global(button:active) {
		background: #f4f4f4;
	}

</style>