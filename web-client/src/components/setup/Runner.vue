<template>
	<li class="list-group-item d-flex justify-content-between align-items-start">
		<div class="ms-2 me-auto">
			<div class="fw-bold">{{$props.runner.name}}</div>
			{{$props.runner.class_name}}
		</div>
		<b-button style="background: #0000; border: none" class="mt-0 pt-0" v-b-modal.deleteRunnerModal>
			<font-awesome-icon style="color: red" icon="trash-can" />
		</b-button>
	</li>
</template>

<script>
export default {
	name: "Runner",
	props: {
		runner: Object
	}
}
</script>

<style>

</style>