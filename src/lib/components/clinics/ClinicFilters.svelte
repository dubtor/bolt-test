<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { countries, regions, hasRegions, getCountryFlag } from '../../utils/countries';
  import { clinics } from '../../stores/clinics';
  import type { CountryCode } from '../../utils/countries';

  const dispatch = createEventDispatcher();

  let selectedCountries: CountryCode[] = [];
  let selectedRegion = '';
  let city = '';
  let minRating = 0;
  let services: string[] = [];
  let minPrice = '';
  let maxPrice = '';

  const availableServices = [
    'FUE Hair Transplant',
    'FUT Hair Transplant',
    'Beard Transplant',
    'Eyebrow Transplant',
    'PRP Treatment'
  ];

  // Compute available regions based on selected country
  $: availableRegions = selectedCountries.length === 1 && hasRegions(selectedCountries[0])
    ? regions[selectedCountries[0]]
    : null;

  // Reset region when multiple countries are selected or when the country changes
  $: if (selectedCountries.length !== 1 || !availableRegions) {
    selectedRegion = '';
  }

  // Debounce function
  function debounce(func: Function, wait: number) {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  const debouncedFilter = debounce(handleFilter, 300);

  function handleFilter() {
    dispatch('filterChange', {
      countries: selectedCountries.length > 0 ? selectedCountries : undefined,
      region: selectedRegion || undefined,
      city: city || undefined,
      minRating: minRating || undefined,
      services: services.length > 0 ? services : undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined
    });
  }

  function toggleCountry(code: CountryCode) {
    if (selectedCountries.includes(code)) {
      selectedCountries = selectedCountries.filter(c => c !== code);
    } else {
      selectedCountries = [...selectedCountries, code];
    }
  }

  function clearFilters() {
    selectedCountries = [];
    selectedRegion = '';
    city = '';
    minRating = 0;
    services = [];
    minPrice = '';
    maxPrice = '';
    handleFilter();
  }

  // Watch for changes in filters that don't require a server request
  $: if (city || minRating || services.length || minPrice || maxPrice || selectedRegion) {
    debouncedFilter();
  }

  // Immediate filter for country changes (server request)
  $: if (selectedCountries !== undefined) {
    handleFilter();
  }
</script>

<div class="bg-white p-4 rounded-lg shadow mb-6">
  <div class="grid grid-cols-1 gap-4">
    <div class="flex flex-col">
      <label class="block text-sm font-medium text-gray-700 mb-2">Countries</label>
      <div class="flex flex-wrap gap-2">
        {#each Object.entries(countries) as [code, name]}
          <button
            type="button"
            class="px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2
              {selectedCountries.includes(code)
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
            on:click={() => toggleCountry(code)}
          >
            <img 
              src={getCountryFlag(code)} 
              alt={name} 
              class="w-4 h-3"
            />
            {name}
          </button>
        {/each}
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      {#if availableRegions}
        <div class="flex flex-col">
          <label for="region" class="block text-sm font-medium text-gray-700 mb-1">Region</label>
          <select
            id="region"
            bind:value={selectedRegion}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          >
            <option value="">All Regions</option>
            {#each Object.entries(availableRegions) as [code, name]}
              <option value={code}>{name}</option>
            {/each}
          </select>
        </div>
      {/if}

      <div class="flex flex-col">
        <label for="city" class="block text-sm font-medium text-gray-700 mb-1">City</label>
        <input
          type="text"
          id="city"
          bind:value={city}
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Enter city name"
        />
      </div>

      <div class="flex flex-col">
        <label for="rating" class="block text-sm font-medium text-gray-700 mb-1">Minimum Rating</label>
        <select
          id="rating"
          bind:value={minRating}
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        >
          <option value={0}>Any Rating</option>
          <option value={3}>3+ Stars</option>
          <option value={4}>4+ Stars</option>
          <option value={4.5}>4.5+ Stars</option>
        </select>
      </div>

      <div class="flex flex-col">
        <label for="services" class="block text-sm font-medium text-gray-700 mb-1">Services</label>
        <select
          id="services"
          multiple
          bind:value={services}
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white h-[42px]"
        >
          {#each availableServices as service}
            <option value={service}>{service}</option>
          {/each}
        </select>
      </div>
    </div>
  </div>

  <div class="flex justify-end mt-4">
    <button
      on:click={clearFilters}
      class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
    >
      Clear Filters
    </button>
  </div>
</div>