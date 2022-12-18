<template>
	<li class="list-group-item d-flex justify-content-between align-items-start">
		<div class="ms-2 me-auto">
			<div class="fw-bold">{{$props.name}}</div>
		</div>
		<span class="badge bg-primary rounded-pill">{{$props.runner_count}}</span>
		<b-button style="background: #0000; border: none" class="mt-0 pt-0" v-b-modal.deleteClassModal>
			<font-awesome-icon style="color: red" icon="trash-can" />
		</b-button>
	</li>
</template>

<script>
export default {
	name: "Class",
	props: {
		name: String,
		runner_count: Number
	}
}
</script>

<style>

</style>