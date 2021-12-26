<main>
	<h1>JS SYNTH</h1>
	{#if userClicked}
		<SoundwaveUi></SoundwaveUi>
	{:else}
		<div>
			click anywhere to start
		</div>
	{/if}
</main>


<script>
	import SoundwaveUi from './pages/SoundwaveUi.svelte';

	let userClicked = false;

	window.addEventListener('pointerup', initApp);

	function initApp() {
		window.removeEventListener('pointerup', initApp);
		userClicked = true;
	}
</script>


<style>

	:global(.center) {
		margin: 0 auto;
	}

	:global(button:active) {
		background: #f4f4f4;
	}

	:global(div) {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 1em;
		font-weight: 180;
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

</style>