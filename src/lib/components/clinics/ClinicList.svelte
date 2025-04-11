<script lang="ts">
  import { onMount } from 'svelte';
  import { clinics, isLoading, error, fetchPublishedClinics } from '../../stores/clinics';
  import type { Clinic } from '../../types';
  import ClinicCard from './ClinicCard.svelte';
  import ClinicFilters from './ClinicFilters.svelte';

  let filteredClinics: Clinic[] = [];
  let currentFilters = {};

  $: filteredClinics = $clinics;

  onMount(() => {
    fetchPublishedClinics();
  });

  async function handleFilterChange(event: CustomEvent<any>) {
    currentFilters = event.detail;
    await fetchPublishedClinics(currentFilters);
  }
</script>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <div class="mb-6">
    <h2 class="text-2xl font-bold text-gray-900">Hair Transplant Clinics</h2>
  </div>

  <ClinicFilters on:filterChange={handleFilterChange} />

  {#if $error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4">
      {$error}
    </div>
  {/if}

  {#if $isLoading}
    <div class="flex justify-center items-center min-h-[200px]">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  {:else}
    <div class="mb-6 text-gray-600">
      Found {filteredClinics.length} {filteredClinics.length === 1 ? 'clinic' : 'clinics'}
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each filteredClinics as clinic (clinic.id)}
        <ClinicCard {clinic} />
      {/each}
    </div>

    {#if filteredClinics.length === 0}
      <div class="text-center py-12">
        <h3 class="text-lg font-medium text-gray-900">No clinics found</h3>
        <p class="mt-2 text-sm text-gray-500">Try adjusting your filters to see more results.</p>
      </div>
    {/if}
  {/if}
</div>