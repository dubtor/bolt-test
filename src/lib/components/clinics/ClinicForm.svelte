<script lang="ts">
  import { onMount } from 'svelte';
  import { db, storage, auth } from '../../firebase';
  import { doc, getDoc } from 'firebase/firestore';
  import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
  import type { Clinic, Doctor } from '../../types';
  import { countries, regions, hasRegions, type CountryCode } from '../../utils/countries';
  import { addClinic, updateClinic } from '../../stores/clinics';

  export let clinicId: string | undefined = undefined;
  
  let loading = clinicId ? true : false;
  let error: string | null = null;
  let currentStep = 0;
  let imageFiles: { main: File | null; gallery: File[] } = { main: null, gallery: [] };

  // Form data
  let clinic: Partial<Clinic> = {
    name: '',
    description: '',
    address: {
      street: '',
      city: '',
      country: 'TR' as CountryCode,
      region: '',
      postalCode: ''
    },
    services: [],
    priceRange: {
      min: 0,
      max: 0,
      currency: '€'
    },
    contact: {
      phone: '',
      email: '',
      website: ''
    },
    operatingHours: {
      monday: { open: '09:00', close: '18:00' },
      tuesday: { open: '09:00', close: '18:00' },
      wednesday: { open: '09:00', close: '18:00' },
      thursday: { open: '09:00', close: '18:00' },
      friday: { open: '09:00', close: '18:00' }
    },
    images: {
      main: '',
      gallery: []
    },
    doctors: [],
    rating: 0,
    reviewCount: 0
  };

  const steps = [
    { title: 'General', fields: ['name', 'description'] },
    { title: 'Location', fields: ['address', 'contact'] },
    { title: 'Services', fields: ['services', 'priceRange'] },
    { title: 'Hours', fields: ['operatingHours'] },
    { title: 'Images', fields: ['images'] },
    { title: 'Doctors', fields: ['doctors'] }
  ];

  const availableServices = [
    'FUE Hair Transplant',
    'FUT Hair Transplant',
    'Beard Transplant',
    'Eyebrow Transplant',
    'PRP Treatment'
  ];

  // Reactive statement to handle country changes
  $: if (clinic.address.country && !hasRegions(clinic.address.country)) {
    clinic.address.region = undefined;
  }

  // Get available regions for the selected country
  $: availableRegions = clinic.address.country && hasRegions(clinic.address.country) 
    ? regions[clinic.address.country] 
    : null;

  async function fetchClinic() {
    if (!clinicId) return;
    
    try {
      const docRef = doc(db, 'clinics', clinicId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        clinic = { ...clinic, ...docSnap.data() };
      } else {
        error = "Clinic not found";
      }
    } catch (e) {
      error = "Error loading clinic";
      console.error(e);
    } finally {
      loading = false;
    }
  }

  async function handleImageUpload(file: File, path: string): Promise<string> {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    return getDownloadURL(snapshot.ref);
  }

  async function handleSubmit() {
    if (!auth.currentUser) return;

    try {
      loading = true;
      error = null;

      // Handle image uploads
      if (imageFiles.main) {
        const mainImagePath = `clinics/${auth.currentUser.uid}/${Date.now()}_main`;
        clinic.images.main = await handleImageUpload(imageFiles.main, mainImagePath);
      }

      if (imageFiles.gallery.length > 0) {
        const galleryUrls = await Promise.all(
          imageFiles.gallery.map((file, index) => {
            const galleryPath = `clinics/${auth.currentUser.uid}/${Date.now()}_gallery_${index}`;
            return handleImageUpload(file, galleryPath);
          })
        );
        clinic.images.gallery = galleryUrls;
      }

      // Create a copy of the clinic data for submission
      const clinicData = { ...clinic };
      
      // Remove undefined region if country doesn't have regions
      if (clinicData.address?.region === undefined) {
        delete clinicData.address.region;
      }

      // Add or update clinic using store functions
      if (clinicId) {
        await updateClinic(clinicId, clinicData);
      } else {
        await addClinic(clinicData);
      }

      window.location.href = '/';
    } catch (e: any) {
      error = e.message;
      console.error(e);
    } finally {
      loading = false;
    }
  }

  function addDoctor() {
    clinic.doctors = [...(clinic.doctors || []), {
      id: crypto.randomUUID(),
      name: '',
      specialization: '',
      experience: 0,
      qualifications: []
    }];
  }

  function removeDoctor(index: number) {
    clinic.doctors = clinic.doctors.filter((_, i) => i !== index);
  }

  function handleMainImageChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      imageFiles.main = input.files[0];
    }
  }

  function handleGalleryImagesChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      imageFiles.gallery = Array.from(input.files);
    }
  }

  onMount(fetchClinic);
</script>

<div class="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-6">{clinicId ? 'Edit' : 'Add'} Clinic</h1>

    {#if error}
      <div class="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        {error}
      </div>
    {/if}

    <!-- Progress bar -->
    <div class="mb-8">
      <div class="flex justify-between mb-2">
        {#each steps as step, i}
          <button
            class="flex-1 text-center {i === currentStep ? 'text-primary-600 font-semibold' : 'text-gray-500'}"
            on:click={() => currentStep = i}
          >
            {step.title}
          </button>
        {/each}
      </div>
      <div class="h-2 bg-gray-200 rounded-full">
        <div
          class="h-full bg-primary-600 rounded-full transition-all"
          style="width: {((currentStep + 1) / steps.length) * 100}%"
        ></div>
      </div>
    </div>

    <!-- Step content -->
    <div class="mb-8">
      {#if currentStep === 0}
        <!-- Basic Information -->
        <div class="space-y-4">
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 mb-1">Clinic Name</label>
            <input
              type="text"
              id="name"
              bind:value={clinic.name}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label for="description" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              id="description"
              bind:value={clinic.description}
              rows="4"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            ></textarea>
          </div>
        </div>

      {:else if currentStep === 1}
        <!-- Location & Contact -->
        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="street" class="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
              <input
                type="text"
                id="street"
                bind:value={clinic.address.street}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label for="city" class="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                id="city"
                bind:value={clinic.address.city}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label for="country" class="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <select
                id="country"
                bind:value={clinic.address.country}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                required
              >
                {#each Object.entries(countries) as [code, name]}
                  <option value={code}>{name}</option>
                {/each}
              </select>
            </div>
            {#if availableRegions}
              <div>
                <label for="region" class="block text-sm font-medium text-gray-700 mb-1">State</label>
                <select
                  id="region"
                  bind:value={clinic.address.region}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  required
                >
                  <option value="">Select Region</option>
                  {#each Object.entries(availableRegions) as [code, name]}
                    <option value={code}>{name}</option>
                  {/each}
                </select>
              </div>
            {/if}
            <div>
              <label for="postalCode" class="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
              <input
                type="text"
                id="postalCode"
                bind:value={clinic.address.postalCode}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                id="phone"
                bind:value={clinic.contact.phone}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                id="email"
                bind:value={clinic.contact.email}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div class="md:col-span-2">
              <label for="website" class="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                type="url"
                id="website"
                bind:value={clinic.contact.website}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

      {:else if currentStep === 2}
        <!-- Services & Pricing -->
        <div class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Services</label>
            <div class="space-y-2">
              {#each availableServices as service}
                <label class="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    value={service}
                    checked={clinic.services.includes(service)}
                    on:change={(e) => {
                      if (e.target.checked) {
                        clinic.services = [...clinic.services, service];
                      } else {
                        clinic.services = clinic.services.filter(s => s !== service);
                      }
                    }}
                    class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span>{service}</span>
                </label>
              {/each}
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label for="currency" class="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select
                  id="currency"
                  bind:value={clinic.priceRange.currency}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="€">EUR (€)</option>
                  <option value="$">USD ($)</option>
                  <option value="£">GBP (£)</option>
                </select>
              </div>
              <div>
                <label for="minPrice" class="block text-sm font-medium text-gray-700 mb-1">Minimum Price</label>
                <input
                  type="number"
                  id="minPrice"
                  bind:value={clinic.priceRange.min}
                  min="0"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label for="maxPrice" class="block text-sm font-medium text-gray-700 mb-1">Maximum Price</label>
                <input
                  type="number"
                  id="maxPrice"
                  bind:value={clinic.priceRange.max}
                  min="0"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            </div>
          </div>
        </div>

      {:else if currentStep === 3}
        <!-- Operating Hours -->
        <div class="space-y-4">
          {#each Object.entries(clinic.operatingHours) as [day, hours]}
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div class="font-medium capitalize">{day}</div>
              <div>
                <label for="{day}-open" class="block text-sm font-medium text-gray-700 mb-1">Opening Time</label>
                <input
                  type="time"
                  id="{day}-open"
                  bind:value={hours.open}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label for="{day}-close" class="block text-sm font-medium text-gray-700 mb-1">Closing Time</label>
                <input
                  type="time"
                  id="{day}-close"
                  bind:value={hours.close}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          {/each}
        </div>

      {:else if currentStep === 4}
        <!-- Images -->
        <div class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Main Image</label>
            <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
              <div class="space-y-1 text-center">
                <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <div class="flex text-sm text-gray-600">
                  <label for="main-image" class="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                    <span>Upload a file</span>
                    <input
                      id="main-image"
                      type="file"
                      accept="image/*"
                      on:change={handleMainImageChange}
                      class="sr-only"
                    />
                  </label>
                  <p class="pl-1">or drag and drop</p>
                </div>
                <p class="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
              </div>
            </div>
            {#if clinic.images.main || imageFiles.main}
              <div class="mt-2">
                <img
                  src={imageFiles.main ? URL.createObjectURL(imageFiles.main) : clinic.images.main}
                  alt="Main clinic image"
                  class="h-32 w-full object-cover rounded-lg"
                />
              </div>
            {/if}
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Gallery Images</label>
            <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
              <div class="space-y-1 text-center">
                <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <div class="flex text-sm text-gray-600">
                  <label for="gallery-images" class="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                    <span>Upload files</span>
                    <input
                      id="gallery-images"
                      type="file"
                      accept="image/*"
                      multiple
                      on:change={handleGalleryImagesChange}
                      class="sr-only"
                    />
                  </label>
                  <p class="pl-1">or drag and drop</p>
                </div>
                <p class="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
              </div>
            </div>
            {#if clinic.images.gallery.length > 0 || imageFiles.gallery.length > 0}
              <div class="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                {#each imageFiles.gallery as file}
                  <img
                    src={URL.createObjectURL(file)}
                    alt="Gallery preview"
                    class="h-32 w-full object-cover rounded-lg"
                  />
                {/each}
                {#each clinic.images.gallery as url}
                  <img
                    src={url}
                    alt="Gallery image"
                    class="h-32 w-full object-cover rounded-lg"
                  />
                {/each}
              </div>
            {/if}
          </div>
        </div>

      {:else if currentStep === 5}
        <!-- Medical Team -->
        <div class="space-y-6">
          <button
            type="button"
            on:click={addDoctor}
            class="mb-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Add Doctor
          </button>

          {#each clinic.doctors as doctor, index}
            <div class="p-4 bg-gray-50 rounded-lg space-y-4">
              <div class="flex justify-between items-center">
                <h3 class="text-lg font-medium">Doctor {index + 1}</h3>
                <button
                  type="button"
                  on:click={() => removeDoctor(index)}
                  class="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    bind:value={doctor.name}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                  <input
                    type="text"
                    bind:value={doctor.specialization}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                  <input
                    type="number"
                    bind:value={doctor.experience}
                    min="0"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Qualifications (comma-separated)</label>
                  <input
                    type="text"
                    value={doctor.qualifications.join(', ')}
                    on:input={(e) => {
                      doctor.qualifications = e.target.value.split(',').map(q => q.trim()).filter(Boolean);
                    }}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Navigation buttons -->
    <div class="flex justify-between">
      <button
        type="button"
        class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        disabled={currentStep === 0}
        on:click={() => currentStep--}
      >
        Previous
      </button>

      <button
        type="button"
        class="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        disabled={loading}
        on:click={() => {
          if (currentStep === steps.length - 1) {
            handleSubmit();
          } else {
            currentStep++;
          }
        }}
      >
        {#if loading}
          <span class="inline-flex items-center">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        {:else if currentStep === steps.length - 1}
          {clinicId ? 'Update' : 'Create'} Clinic
        {:else}
          Next
        {/if}
      </button>
    </div>
  </div>
</div>