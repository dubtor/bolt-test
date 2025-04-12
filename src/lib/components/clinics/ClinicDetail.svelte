<script lang="ts">
  import { onMount } from 'svelte';
  import { db } from '../../firebase';
  import { doc, deleteDoc } from 'firebase/firestore';
  import type { Clinic } from '../../types';
  import { user } from '../../stores/auth';
  import { getCountryName, getRegionName, hasRegions, getCountryCodeBySlug, getCountryFlag } from '../../utils/countries';
  import { getClinicBySlug } from '../../stores/clinics';

  export let countrySlug: string;
  export let clinicSlug: string;

  let clinic: Clinic | null = null;
  let loading = true;
  let error: string | null = null;
  let isOwner = false;

  $: if (clinic && $user) {
    isOwner = clinic.userId === $user.id;
  }

  async function fetchClinic() {
    try {
      const countryCode = getCountryCodeBySlug(countrySlug);
      if (!countryCode) {
        error = "Invalid country";
        return;
      }

      const clinicData = await getClinicBySlug(clinicSlug);
      if (!clinicData) {
        error = "Clinic not found";
        return;
      }

      // Verify the clinic belongs to the specified country
      if (clinicData.address.country !== countryCode) {
        error = "Clinic not found in this country";
        return;
      }

      clinic = clinicData;
    } catch (e) {
      error = "Error loading clinic details";
      console.error(e);
    } finally {
      loading = false;
    }
  }

  async function handleDelete() {
    if (!clinic || !confirm('Are you sure you want to delete this clinic?')) return;
    
    try {
      await deleteDoc(doc(db, 'clinics', clinic.id));
      window.location.href = '/';
    } catch (e) {
      error = "Error deleting clinic";
      console.error(e);
    }
  }

  onMount(fetchClinic);
</script>

<div class="mb-4">
  <a
    href="/"
    class="inline-flex items-center text-gray-600 hover:text-gray-900"
  >
    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
    Back to Clinics
  </a>
</div>

{#if loading}
  <div class="flex justify-center items-center min-h-[400px]">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
{:else if error}
  <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
    {error}
  </div>
{:else if clinic}
  <div class="bg-white shadow-lg rounded-lg overflow-hidden">
    <div class="relative h-96">
      <img
        src={clinic.images.main}
        alt={clinic.name}
        class="absolute h-full w-full object-cover"
      />
      {#if clinic.images.logo}
        <div class="absolute bottom-4 left-4 w-24 h-24 bg-white rounded-lg p-2 shadow-md">
          <img
            src={clinic.images.logo}
            alt={`${clinic.name} logo`}
            class="w-full h-full object-contain"
          />
        </div>
      {/if}
      {#if isOwner}
        <div class="absolute top-4 right-4 space-x-2 flex items-center">
          <span class="bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            My Clinic
          </span>
          <button
            on:click={() => window.location.href = `/clinic/${clinic.id}/edit`}
            class="bg-white text-gray-700 px-4 py-2 rounded-lg shadow hover:bg-gray-50"
          >
            Edit
          </button>
          <button
            on:click={handleDelete}
            class="bg-red-600 text-white px-4 py-2 rounded-lg shadow hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      {/if}
    </div>

    <div class="p-6">
      <div class="flex justify-between items-start">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">{clinic.name}</h1>
          <div class="flex items-center mt-2">
            <span class="text-yellow-400 text-xl">★</span>
            <span class="ml-1 text-lg">{clinic.rating.toFixed(1)}</span>
            <span class="text-gray-500 ml-1">({clinic.reviewCount} reviews)</span>
          </div>
        </div>
        <div class="text-right">
          <p class="text-2xl font-bold text-primary-600">
            {clinic.priceRange.currency}{clinic.priceRange.min.toLocaleString()} - {clinic.priceRange.currency}{clinic.priceRange.max.toLocaleString()}
          </p>
        </div>
      </div>

      <div class="mt-6">
        <h2 class="text-xl font-semibold mb-2">About</h2>
        <p class="text-gray-600">{clinic.description}</p>
      </div>

      <div class="mt-6">
        <h2 class="text-xl font-semibold mb-2">Services</h2>
        <div class="flex flex-wrap gap-2">
          {#each clinic.services as service}
            <span class="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm">
              {service}
            </span>
          {/each}
        </div>
      </div>

      <div class="mt-6">
        <h2 class="text-xl font-semibold mb-2">Location & Contact</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p class="text-gray-600">
              {clinic.address.street}<br />
              {clinic.address.city}, {clinic.address.postalCode}<br />
              {#if hasRegions(clinic.address.country) && clinic.address.region}
                {getRegionName(clinic.address.country, clinic.address.region)}<br />
              {/if}
              <img 
                src={getCountryFlag(clinic.address.country)} 
                alt={getCountryName(clinic.address.country)} 
                class="inline-block w-4 h-3 mr-1 align-middle"
              />
              {getCountryName(clinic.address.country)}
            </p>
          </div>
          <div>
            <p class="text-gray-600">
              <strong>Phone:</strong> {clinic.contact.phone}<br />
              <strong>Email:</strong> {clinic.contact.email}<br />
              {#if clinic.contact.website}
                <strong>Website:</strong> <a href={clinic.contact.website} target="_blank" class="text-primary-600 hover:underline">{clinic.contact.website}</a>
              {/if}
            </p>
          </div>
        </div>
      </div>

      <div class="mt-6">
        <h2 class="text-xl font-semibold mb-2">Medical Team</h2>
        {#if !clinic.doctors || clinic.doctors.length === 0}
          <div class="bg-gray-100 p-4 rounded-lg flex items-start">
            <svg class="w-5 h-5 text-gray-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-gray-600">
              This clinic has not specified information about their surgeons.
            </p>
          </div>
        {:else}
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each clinic.doctors as doctor}
              <div class="bg-gray-50 p-4 rounded-lg">
                {#if doctor.image}
                  <img src={doctor.image} alt={doctor.name} class="w-24 h-24 rounded-full mx-auto mb-3 object-cover" />
                {/if}
                <h3 class="font-semibold text-lg">{doctor.name}</h3>
                <p class="text-gray-600">{doctor.specialization}</p>
                <p class="text-sm text-gray-500">{doctor.experience} years experience</p>
                <div class="mt-2">
                  {#each doctor.qualifications as qualification}
                    <span class="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
                      {qualification}
                    </span>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      {#if clinic.images.gallery.length > 0}
        <div class="mt-6">
          <h2 class="text-xl font-semibold mb-2">Gallery</h2>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            {#each clinic.images.gallery as image}
              <img src={image} alt="Clinic gallery" class="rounded-lg w-full h-48 object-cover" />
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}