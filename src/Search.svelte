<script>
    export let handleSearch;
</script>

<div class="py-8 px-16">
    <input
        class="bg-white text-sm xl:text-xl text-center focus:outline-none focus:shadow-outline border border-gray-400 rounded-lg py-2 px-4 block w-full appearance-none leading-normal"
        type="text"
        placeholder="Buscar al Pais"
        on:keyup={event => handleSearch(event)}
    />
</div>