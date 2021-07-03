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

<div class="countries">
    {#each searchCountries as country}
        <Country {country} />
    {/each}
</div>

<style>
    .countries {
        display: grid;
        grid-template-columns: 1fr;
        gap: 4rem;
        padding: 1rem;
    }

    @media screen and (min-width: 1023px) {
    .countries {
        grid-template-columns: 1fr 1fr 1fr;
    }
}
</style>
