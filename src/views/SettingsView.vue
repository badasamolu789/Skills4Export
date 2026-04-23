<template>
  <section class="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
    <div class="space-y-3 px-1">
      <div class="flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
        <RouterLink to="/feed" class="transition hover:text-[var(--accent-strong)]">Home</RouterLink>
        <span>/</span>
        <span class="font-medium text-[var(--accent-strong)]">Settings</span>
      </div>
      <div>
        <h1 class="text-[1.65rem] font-semibold leading-tight text-[var(--text-primary)] sm:text-[1.95rem] lg:text-[2.1rem]">
          Settings
        </h1>
        <p class="mt-2 max-w-2xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
          Manage your account settings and profile options.
        </p>
      </div>
    </div>

    <div class="mt-8 rounded-[1.5rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-8 shadow-[var(--shadow-elevated)]">
      <div class="overflow-hidden rounded-[1.5rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)]">
        <div class="flex flex-wrap items-center gap-3 border-b border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-6 py-4">
          <button class="rounded-full border-b-2 border-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--accent-strong)]">Change Password</button>
          <button class="rounded-full px-4 py-3 text-sm text-[var(--text-secondary)] transition hover:text-[var(--accent)]">Email Settings</button>
          <button class="rounded-full px-4 py-3 text-sm text-[var(--text-secondary)] transition hover:text-[var(--accent)]">Privacy</button>
          <button class="rounded-full px-4 py-3 text-sm text-[var(--text-secondary)] transition hover:text-[var(--accent)]">Delete Account</button>
          <button class="rounded-full px-4 py-3 text-sm text-[var(--text-secondary)] transition hover:text-[var(--accent)]">Delete Page</button>
        </div>

        <div class="px-6 py-8">
          <div class="rounded-[1.25rem] bg-[var(--surface-secondary)] p-6">
            <h2 class="text-base font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">Change your password</h2>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
