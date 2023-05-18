<template>
	<li class="list-group-item d-flex justify-content-between align-items-start">
		<div class="ms-2 me-auto">
			<div class="fw-bold">{{$props.name}}</div>
		</div>
		<span class="badge bg-primary rounded-pill mt-1">{{$props.runnerCount}}</span>
		<b-button @click="$emit('isolate', $props.name)" style="background: #0000; border: none; margin-left: 15px;" class="mt-0 pt-0 px-2">
			<font-awesome-icon style="color: grey" :class="{'text-primary': $props.soloClassName == name}" :icon="$props.soloClassName == name ? 'eye-slash' : 'eye'" />
		</b-button>
		<b-button @click="$emit('delete', $props.name)" style="background: #0000; border: none" class="mt-0 pt-0 px-1">
			<font-awesome-icon style="color: red" icon="trash-can" />
		</b-button>
	</li>
</template>

<script>
export default {
	name: "Class",
	emits: ["delete", "isolate"],
	props: {
		name: String,
		runnerCount: Number,
		soloClassName: String
	}
}
</script>

<style>

</style>
