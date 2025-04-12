<script lang="ts">
  import type { Clinic } from '../../types/clinic';
  import { user } from '../../stores/auth';
  import { getCountryName, getRegionName, hasRegions } from '../../utils/countries';
  import { getClinicUrl } from '../../utils/clinic';
  import { getCountryFlag } from '../../utils/countries';

  export let clinic: Clinic;

  function formatPrice(min: number, max: number, currency: string): string {
    return `${currency}${min.toLocaleString()} - ${currency}${max.toLocaleString()}`;
  }

  $: isOwner = $user && clinic.userId === $user.id;
  $: clinicUrl = getClinicUrl(clinic);
</script>

<div class="bg-white rounded-lg shadow-md overflow-hidden h-full flex flex-col">
  <div class="relative pb-[66.67%]">
    <img
      src={clinic.images.main}
      alt={clinic.name}
      class="absolute h-full w-full object-cover"
    />
    {#if clinic.images.logo}
      <div class="absolute bottom-4 left-4 w-16 h-16 bg-white rounded-lg p-2 shadow-md">
        <img
          src={clinic.images.logo}
          alt={`${clinic.name} logo`}
          class="w-full h-full object-contain"
        />
      </div>
    {/if}
    {#if isOwner}
      <div class="absolute top-2 right-2 flex gap-2">
        <span class="bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-medium">
          My Clinic
        </span>
        {#if clinic.status === 'draft'}
          <span class="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            Draft
          </span>
        {/if}
      </div>
    {/if}
  </div>
  
  <div class="p-4 flex-1 flex flex-col">
    <h3 class="text-xl font-semibold mb-2">{clinic.name}</h3>
    
    <div class="flex items-center mb-2">
      <span class="text-yellow-400">★</span>
      <span class="ml-1">{clinic.rating.toFixed(1)}</span>
      <span class="text-gray-500 ml-1">({clinic.reviewCount} reviews)</span>
    </div>
    
    <p class="text-gray-600 mb-2">
      <img 
        src={getCountryFlag(clinic.address.country)} 
        alt={getCountryName(clinic.address.country)} 
        class="inline-block w-4 h-3 mr-1 align-middle"
      />
      {clinic.address.city}
      {#if hasRegions(clinic.address.country) && clinic.address.region}
        , {getRegionName(clinic.address.country, clinic.address.region)}
      {/if}
      , {getCountryName(clinic.address.country)}
    </p>
    
    <p class="text-primary-600 font-medium mb-4">
      {formatPrice(clinic.priceRange.min, clinic.priceRange.max, clinic.priceRange.currency)}
    </p>
    
    <div class="flex flex-wrap gap-2 mb-4">
      {#each clinic.services.slice(0, 3) as service}
        <span class="bg-primary-100 text-primary-800 text-sm px-2 py-1 rounded">
          {service}
        </span>
      {/each}
    </div>
    
    <a
      href={clinicUrl}
      class="mt-auto w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors text-center"
    >
      View Details
    </a>
  </div>
</div>