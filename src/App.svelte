<script>
  import Countries from "../components/Countries.svelte";
  import { onMount } from "svelte";
  import Header from "../components/Header.svelte";
  import Global from "../components/Global.svelte";
  import Footer from "../components/Footer.svelte";

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

<Header />
<main>
  {#if data.Global}
    <Global countries={data.Countries} global={data.Global} />
    <Countries countries={data.Countries} />
  {:else}
    <p>
      {error
        ? "Lo sentimos ha ocurrido un error, Actualiza la pagina."
        : "Cargando..."}
    </p>
  {/if}
</main>
<Footer />

<style>
	main {
		background: var(--second-clr);
		padding: 2rem;
	}
</style>
