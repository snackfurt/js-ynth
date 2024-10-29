<main>
	<h1>JS-YNTH</h1>
	<small>v. {version} · <a href="{linkUrl}" bind:this={archiveLink}>ARCHIVE</a> · <a href="gallery.html" bind:this={galleryLink}>GALLERY</a></small>
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

	export let version;

	let userClicked = false;
	let archiveLink;
	let galleryLink;

	const linkUrl = location.pathname.includes('/versions/') ? '../' : './versions/';

	window.addEventListener('pointerup', initApp);

	function initApp(event) {
		if (event.target !== archiveLink && event.target !== galleryLink) {
			window.removeEventListener('pointerup', initApp);
			userClicked = true;
		}
	}
</script>


<style>

	:global(.center) {
		margin: 0 auto;
	}

	:global(button:active) {
		background: #f4f4f4;
	}

	main {
		text-align: center;
		margin: 0 auto;
		user-select: none;
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 1em;
		font-weight: 360;
	}

	h1 {
		display: inline;
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 2em;
		font-weight: 300;
	}

	small {
		display: block;
		margin-bottom: 12px;
	}


</style>