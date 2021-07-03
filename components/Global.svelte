<script>
  export let global = {};
  export let countries = [];
</script>

<div class="global">
    <h1>Ámbito Global:</h1>
    <div class="global-card">
      <div>
        <span>Paises Afectados</span>
        <h2>{countries.length}</h2>
      </div>
      <div>
        <span>Casos Confirmados</span>
        <h2>{global.TotalConfirmed}</h2>
      </div>
      <div>
        <span>Casos de recuperación</span>
        <h2>{global.TotalRecovered}</h2>
      </div>
      <div>
        <span>Total de muertes</span>
        <h2>{global.TotalDeaths}</h2>
      </div>
    </div>
</div>

<style>
  .global {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    align-items: center;
    justify-content: center;
    font-family: 'Ubuntu', sans-serif;
  }

  .global h1 {
    font-size: 2.3rem;
  }

  .global-card {
    display: grid;
    gap: 1rem;
    font-size: 1.5rem;
    text-align: center;
    box-shadow: 10px 10px 15px rgba(39, 44, 49, 0.06),
            -10px 10px 15px rgba(39, 44, 49, 0.03);
    border-radius: 20px;
    border: 1px solid var(--third-clr);
    padding: 1rem;

    transition: transform 500ms ease;
  }

  .global-card:hover {
    transform: scale(1.03);
  }
</style>