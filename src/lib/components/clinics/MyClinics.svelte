<script lang="ts">
  import { onMount } from 'svelte';
  import { clinics, isLoading, error, fetchMyClinics, publishClinic, unpublishClinic, addClinic } from '../../stores/clinics';
  import ClinicCard from './ClinicCard.svelte';
  import { user } from '../../stores/auth';
  import { getCountryName, getCountrySlug } from '../../utils/countries';
  import { getClinicUrl, generateDraftClinicName } from '../../utils/clinic';
  import { createEmptyClinic } from '../../types/clinic';
  import { db } from '../../firebase';
  import { doc, deleteDoc } from 'firebase/firestore';
  import { Trash2 } from 'lucide-svelte';
  import { validateClinic } from '../../types/clinic';

  async function handlePublishToggle(clinicId: string, currentStatus: 'draft' | 'published') {
    try {
      if (currentStatus === 'draft') {
        const clinic = $clinics.find(c => c.id === clinicId);
        if (clinic) {
          const validationResult = validateClinic(clinic);
          if (!validationResult.isValid) {
            alert('Cannot publish clinic. Please complete all required fields first.');
            return;
          }
        }
        await publishClinic(clinicId);
      } else {
        await unpublishClinic(clinicId);
      }
      await fetchMyClinics();
    } catch (e) {
      console.error('Error toggling clinic status:', e);
    }
  }

  async function handleDelete(clinicId: string) {
    if (!confirm('Are you sure you want to delete this clinic? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'clinics', clinicId));
      await fetchMyClinics();
    } catch (e) {
      console.error('Error deleting clinic:', e);
    }
  }

  async function handleAddNewClinic() {
    try {
      const currentUser = $user;
      if (!currentUser) return;

      const draftClinic = {
        ...createEmptyClinic(),
        name: generateDraftClinicName(),
        slug: generateDraftClinicName().toLowerCase().replace(/\s+/g, '-'),
        userId: currentUser.id,
      };

      const newClinicId = await addClinic(draftClinic);
      window.location.href = `/clinic/${newClinicId}/edit`;
    } catch (e) {
      console.error('Error creating draft clinic:', e);
      error.set('Error creating new clinic. Please try again.');
    }
  }

  onMount(() => {
    if ($user) {
      fetchMyClinics();
    }
  });
</script>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <div class="flex justify-between items-center mb-6">
    <h2 class="text-2xl font-bold text-gray-900">My Clinics</h2>
    <button
      on:click={handleAddNewClinic}
      class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
    >
      Add New Clinic
    </button>
  </div>

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
    <div class="space-y-4">
      {#each $clinics as clinic (clinic.id)}
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
          <div class="p-6">
            <div class="flex justify-between items-start">
              <div>
                <h3 class="text-xl font-semibold">{clinic.name || '(Unnamed Clinic)'}                
                  {#if !validateClinic(clinic).isValid}
                    <span class="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                      Incomplete
                    </span>
                  {:else}
                    <span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      Valid
                    </span>
                  {/if}
                </h3>
                <p class="text-gray-600 mt-2">{clinic.description}</p>
              </div>
              <div class="flex gap-2 items-center">
                <label class="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    class="sr-only peer"
                    checked={clinic.status === 'published'}
                    on:change={() => handlePublishToggle(clinic.id, clinic.status)}
                  />
                  <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  <span class="ml-2 text-sm font-medium text-gray-700">Published</span>
                </label>
                <a
                  href="/clinic/{clinic.id}/edit"
                  class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                >
                  Edit
                </a>
                {#if clinic.status === 'published'}
                <a
                  href={getClinicUrl(clinic)}
                  class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                >
                  View
                </a>
                {/if}
                <button
                  on:click={() => handleDelete(clinic.id)}
                  class="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete clinic"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
            
            <div class="mt-4 flex items-center gap-2">
              <span class="text-sm text-gray-600">
                {clinic.address.city}, {getCountryName(clinic.address.country)}
              </span>
              {#if clinic.rating > 0}
                <span class="text-gray-300">•</span>
                <span class="text-sm text-gray-600 flex items-center">
                  <span class="text-yellow-400 mr-1">★</span>
                  {clinic.rating.toFixed(1)}
                </span>
              {/if}
            </div>
          </div>
        </div>
      {/each}

      {#if $clinics.length === 0}
        <div class="text-center py-12 bg-white rounded-lg shadow">
          <h3 class="text-lg font-medium text-gray-900">No clinics found</h3>
          <p class="mt-2 text-sm text-gray-500">
            You haven't created any clinics yet. Click "Add New Clinic" to get started.
          </p>
          <button
            on:click={handleAddNewClinic}
            class="mt-4 inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
          >
            Add New Clinic
          </button>
        </div>
      {/if}
    </div>
  {/if}
</div>