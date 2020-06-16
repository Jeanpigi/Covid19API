<script>
  export let global = {};
  export let countries = [];
</script>

<div class="mt-4 xl:mx-16 xl:mb-16 text-center">
    <h1 class="mb-4 xl:mb-10 text-xl md:text-2xl xl:text-3xl ">Ámbito Global:</h1>
    <div class="text-sm xl:text-xl font-sans grid grid-cols-1 xl:grid-cols-4">
      <div>
        <span class="text-bold">Paises Afectados</span>
        <h2>{countries.length}</h2>
      </div>
      <div>
        <span class="text-bold">Casos Confirmados</span>
        <h2>{global.TotalConfirmed}</h2>
      </div>
      <div>
        <span class="text-bold">Casos de recuperación</span>
        <h2>{global.TotalRecovered}</h2>
      </div>
      <div>
        <span class="text-bold">Total de muertes</span>
        <h2>{global.TotalDeaths}</h2>
      </div>
    </div>
</div>
