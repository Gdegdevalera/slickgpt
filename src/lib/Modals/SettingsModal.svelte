<script lang="ts">
	import { Accordion, AccordionItem, getModalStore, getToastStore } from '@skeletonlabs/skeleton';
	import { chatStore, settingsStore } from '$misc/stores';
	import { showToast, track } from '$misc/shared';
	import type { AiModelSettings, JanAiModel } from '$misc/janai';

	const modalStore = getModalStore();
	const toastStore = getToastStore();

	let slug: string = $modalStore[0].meta?.slug || '';
	let title = $chatStore[slug].title;
	let settings = $chatStore[slug].settings;
	let savedSettings = { ...settings };

	function handleChangeSettings() {
		chatStore.updateChat(slug, { title, settings });

		savedSettings = { ...settings };
		track('saveSettings');
		modalStore.close();
	}

	function handleResetSettings() {
		settings = { ...savedSettings };
		title = $chatStore[slug].title;
	}

	function handleCloseSettings() {
		handleResetSettings();
		modalStore.close();
	}

	async function handleLoadModels() {
		const response = await fetch('/api/models', {
			method: 'POST',
			body: JSON.stringify({
				apiUrl: $settingsStore.apiUrl
			})
		});

		if (!response.ok) {
			showToast(toastStore, 'An error occured.', 'error');
			return;
		}

		const janAiModels: JanAiModel[] = await response.json();
		
		console.log({janAiModels});

		$settingsStore.models = janAiModels?.reduce((acc, x) => {
			acc[x.id] = x.parameters;
			return acc;
		}, {} as {[key: string]: AiModelSettings});
	}

	function clamp(value: number, min: number, max: number) {
		return Math.max(min, Math.min(value, max));
	}

	let maxTokensForModel = 0;

	$: models = $settingsStore.models;
	$: {
		maxTokensForModel = ($settingsStore.models ?? {})[$chatStore[slug].settings.model]?.max_tokens ?? 0;
		settings.max_tokens = clamp(settings.max_tokens, 0, maxTokensForModel);
	}
</script>

<div class="card variant-filled-surface-700 p-8">
	<form>
		<h3 class="h3 mb-4">Settings</h3>
		<div class="flex-row space-y-6">
			<!-- API url -->
			<label class="label">
				<div class="flex justify-between space-x-12">
					<span>AI API URL</span>
				</div>
				<input
					required
					class="input"
					class:input-error={!$settingsStore.apiUrl}
					type="text"
					bind:value={$settingsStore.apiUrl}
				/>
			</label>

			<button class="btn variant-filled-primary" on:click={handleLoadModels}>
				{#if models}
					Reload Models List
				{:else}
					Load Models List
				{/if}
			</button>

			<!-- Model -->
			{#if models && $settingsStore.apiUrl}
				<div class="flex flex-col space-y-2">
					<label class="label">
						<div class="flex justify-between space-x-12">
							<span>Model</span>
							<a
								class="anchor"
								target="_blank"
								rel="noreferrer"
								href="https://platform.openai.com/docs/api-reference/completions/create"
							>
								See docs
							</a>
						</div>
						<select class="select" bind:value={settings.model}>
							{#each Object.keys(models) as model}
								<option value={model}>{model}</option>
							{/each}
						</select>
					</label>
					<!-- Set as default -->
					{#if $settingsStore.defaultModel !== settings.model}
						<button
							class="btn btn-sm variant-ghost-secondary self-start"
							on:click={() => ($settingsStore.defaultModel = settings.model)}
						>
							Use as default
						</button>
					{/if}
				</div>

				<!-- Advanced Settings -->
				<Accordion>
					<AccordionItem>
						<svelte:fragment slot="summary">Advanced</svelte:fragment>
						<svelte:fragment slot="content">
							<!-- Max Tokens -->
							<label class="label">
								<span class="inline-block w-40">Max Tokens: {settings.max_tokens}</span>
								<input
									type="range"
									min={8}
									step={8}
									max={maxTokensForModel}
									bind:value={settings.max_tokens}
								/>
							</label>

							<!-- Temperature -->
							<label class="label">
								<span>Temperature: {settings.temperature}</span>
								<input type="range" max={2} step="0.1" bind:value={settings.temperature} />
							</label>

							<!-- Top p -->
							<label class="label">
								<span>Top p: {settings.top_p}</span>
								<input type="range" max={1} step="0.1" bind:value={settings.top_p} />
							</label>
						</svelte:fragment>
					</AccordionItem>
				</Accordion>
			{/if}

			<!-- Buttons -->
			<div class="flex justify-between">
				<div class="flex space-x-2">
					<button class="btn btn-sm" on:click={handleCloseSettings}>Close</button>
					<button class="btn btn-sm" on:click={handleResetSettings}>Reset</button>
				</div>
				<button class="btn variant-filled-primary" on:click={handleChangeSettings}>Save</button>
			</div>
		</div>
	</form>
</div>
