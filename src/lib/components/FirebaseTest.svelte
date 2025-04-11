<script lang="ts">
  import { onMount } from 'svelte';
  import { auth } from '../firebase';
  import { createUserWithEmailAndPassword } from 'firebase/auth';

  let status = 'Checking Firebase connection...';
  let error = null;
  let email = 'test@example.com';
  let password = 'testpassword123';

  async function testFirebase() {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      status = 'Firebase is working! Email authentication successful.';
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') {
        status = 'Firebase is working! (User already exists)';
      } else {
        error = e.message;
        status = 'Firebase connection failed!';
      }
    }
  }

  onMount(() => {
    testFirebase();
  });
</script>

<div class="max-w-md mx-auto mt-8 bg-white p-6 rounded-lg shadow-md">
  <h2 class="text-xl font-semibold mb-4">Firebase Connection Test</h2>
  
  {#if error}
    <p class="text-red-600">Error: {error}</p>
  {:else}
    <p class="text-gray-700">{status}</p>
  {/if}

  {#if auth.currentUser}
    <p class="text-green-600 mt-2">
      Current User ID: {auth.currentUser.uid}
    </p>
  {/if}
</div>