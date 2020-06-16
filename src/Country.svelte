<script>
    export let country = {};
</script>

<div class="flex justify-center">
    <div class="bg-gray-300 rounded border-indigo-500 border overflow-hidden shadow-lg text-center text-sm xl:text-xl my-6">
        <div class="m-4">
            <h3 class="text-xl xl:text-3xl font-bold">{country.Country}</h3>
        </div>
        <div class="m-4">
            <h1 class="text-indigo-500">Código del Pais:</h1>
            <h3>{country.CountryCode}</h3>
        </div>
        <div class="m-4">
            <h1 class="text-indigo-500">Nuevos Casos Confirmados:</h1>
            <h3>{country.NewConfirmed}</h3>
        </div>
        <div class="m-4">
            <h1 class="text-indigo-500">Total de casos Confirmados:</h1>
            <h3>{country.TotalConfirmed}</h3>
        </div>
        <div class="m-4">
            <h1 class="text-indigo-500">Nuevos casos de muertes:</h1>
            <h3>{country.NewDeaths}</h3>
        </div>
        <div class="m-4">
            <h1 class="text-indigo-500">Total de casos de muertes:</h1>
            <h3>{country.TotalDeaths}</h3>
        </div>
    </div>
</div>
