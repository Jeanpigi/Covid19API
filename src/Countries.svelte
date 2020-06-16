<script>
    import Country from "./Country.svelte";
    import Search from "./Search.svelte";

    export let countries = [];
    let searchCountries = countries;

    const handleSearch = event => {
        const value = event.target.value;
        searchCountries = countries.filter(country =>
        country.Country.toLowerCase().includes(value.toLowerCase())
        );
    };
</script>

<Search {handleSearch} />

<div class="mx-8 md:mx-6 xl:mx-4">
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {#each searchCountries as country}
            <Country {country} />
        {/each}
    </div>
</div>
