<script>
    export let handleSearch;
</script>

<div class="search">
    <input
        type="text"
        placeholder="Buscar al Pais"
        on:keyup={event => handleSearch(event)}
    />
</div>

<style>
    .search {
        margin: 2rem;
    }
    .search input {
        padding: 1rem;
        width: 100%;
        border-radius: 4px;
        border: 2px solid var(--color-four);
        outline: none;
        box-shadow: 0 19px 38px rgba(0, 0, 0, 0.1), 0 15px 12px rgba(0, 0, 0, 0.1);
    }
</style>