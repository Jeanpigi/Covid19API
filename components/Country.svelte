<script>
    export let country = {};
</script>

<div class="country">
    <h1 class="country-title">{country.Country}</h1>
    <div>
        <h2>Código del Pais:</h2>
        <h3>{country.CountryCode}</h3>
    </div>
    <div>
        <h2>Nuevos Casos Confirmados:</h2>
        <h3>{country.NewConfirmed}</h3>
    </div>
    <div>
        <h2>Total de casos Confirmados:</h2>
        <h3>{country.TotalConfirmed}</h3>
    </div>
    <div>
        <h2>Nuevos casos de muertes:</h2>
        <h3>{country.NewDeaths}</h3>
    </div>
    <div>
        <h2>Total de casos de muertes:</h2>
        <h3>{country.TotalDeaths}</h3>
    </div>
</div>

<style>
    .country {
        text-align: center;
        box-shadow: 10px 10px 15px rgba(39, 44, 49, 0.06),
            -10px 10px 15px rgba(39, 44, 49, 0.03);
        margin-bottom: 2rem;
        border-radius: 20px;
        padding: 1rem;
        border: 1px solid var(--primary-clr);
        background: var(--primary-clr);

        transition: transform 500ms ease;
    }

    .country:hover {
        transform: scale(1.03);
    }

    .country-title {
        margin-bottom: 1rem;
        font-weight: bold;
        font-family: 'Ubuntu', sans-serif;
        font-size: 1.8rem;
        position: relative;
    }

    .country-title::after {
        content: "";
        position: absolute;
        height: 2px;
        width: calc(90% + 1rem);
        left: calc(1rem * 1);
        bottom: 0;
        background: #24292e;
        transform: scaleX(0);

        transition:  transform 500ms ease;
    }

    .country:hover .country-title::after{
        transform: scaleX(1);
    }
</style>
