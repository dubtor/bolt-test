<script lang="ts">
  import { onMount } from 'svelte';
  import { auth } from './lib/firebase';
  import { user } from './lib/stores/auth';
  import ClinicList from './lib/components/clinics/ClinicList.svelte';
  import ClinicDetail from './lib/components/clinics/ClinicDetail.svelte';
  import ClinicForm from './lib/components/clinics/ClinicForm.svelte';
  import MyClinics from './lib/components/clinics/MyClinics.svelte';
  import SignIn from './lib/components/auth/SignIn.svelte';
  import SignUp from './lib/components/auth/SignUp.svelte';
  
  let showSignIn = true;
  let currentPath = window.location.pathname;
  let clinicId = '';
  let isEditMode = false;
  let countrySlug = '';
  let clinicSlug = '';

  function handleNavigation() {
    currentPath = window.location.pathname;

    // Reset all path-related variables
    clinicId = '';
    isEditMode = false;
    countrySlug = '';
    clinicSlug = '';

    // Match /clinics/[country]/[slug]
    const clinicMatch = currentPath.match(/^\/clinics\/([^/]+)\/([^/]+)$/);
    if (clinicMatch) {
      countrySlug = clinicMatch[1];
      clinicSlug = clinicMatch[2];
      return;
    }

    // Match /clinic/[id]/edit
    const editMatch = currentPath.match(/^\/clinic\/([^/]+)\/edit$/);
    if (editMatch) {
      clinicId = editMatch[1];
      isEditMode = true;
      return;
    }

    // Match /clinic/[id]
    const idMatch = currentPath.match(/^\/clinic\/([^/]+)$/);
    if (idMatch) {
      clinicId = idMatch[1];
      return;
    }
  }

  onMount(() => {
    handleNavigation();
    window.addEventListener('popstate', handleNavigation);
    return () => window.removeEventListener('popstate', handleNavigation);
  });
</script>

<main class="min-h-screen bg-gray-50">
  <nav class="bg-white shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex">
          <div class="flex-shrink-0 flex items-center">
            <a href="/" class="text-xl font-bold text-primary-600">Hair Transplant Directory</a>
          </div>
        </div>
        <div class="flex items-center space-x-4">
          {#if $user}
            <a
              href="/my-clinics"
              class="px-4 py-2 text-gray-700 hover:text-primary-600 transition-colors"
            >
              My Clinics
            </a>
            <span class="text-gray-600">{$user.email}</span>
            <button
              on:click={() => auth.signOut()}
              class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              Sign Out
            </button>
          {:else}
            <a 
              href="/auth"
              class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              Sign In / Sign Up
            </a>
          {/if}
        </div>
      </div>
    </div>
  </nav>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {#if currentPath === '/auth'}
      {#if showSignIn}
        <SignIn />
      {:else}
        <SignUp />
      {/if}
    {:else if currentPath === '/my-clinics'}
      {#if $user}
        <MyClinics />
      {:else}
        <SignIn />
      {/if}
    {:else if clinicId && isEditMode}
      {#if $user}
        <ClinicForm clinicId={clinicId} />
      {:else}
        <SignIn />
      {/if}
    {:else if countrySlug && clinicSlug}
      <ClinicDetail {countrySlug} {clinicSlug} />
    {:else}
      <ClinicList />
    {/if}
  </div>
</main>