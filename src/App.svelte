<script>
	import Countries from './Countries.svelte';
	import { onMount } from 'svelte';
	import Header from './Header.svelte';
	import Global from './Global.svelte';
	import Footer from './Footer.svelte';

	const API = "https://api.covid19api.com/summary";
	let data = {};
	let error = false;

	onMount(async () => {
		try {
			const response = await fetch(API);
			data = await response.json();
		} catch (err) {
			error = true;
		}
	});

</script>



<div>
	<Header></Header>
	{#if data.Global}
		<Global countries={data.Countries} global={data.Global} />
		<Countries countries={data.Countries} />
	{:else}
		<p>{error ? 'Lo sentimos ha ocurrido un error, Actualiza la pagina.' : 'Cargando...'}</p>
	{/if}
	<Footer></Footer>
</div>

<style global>
	@tailwind base;
	@tailwind components;
	@tailwind utilities;
</style>
