<script>

import Waveform from './modules/Waveform.svelte';
</script>

<main>
	<h1 class="unselectable">Hello</h1>
	<Waveform />
</main>

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