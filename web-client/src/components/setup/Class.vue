<template>
	<li class="list-group-item d-flex justify-content-between align-items-start">
		<div class="ms-2 me-auto">
			<div class="fw-bold">{{$props.name}}</div>
		</div>
		<span class="badge bg-primary rounded-pill">{{$props.runner_count}}</span>
		<font-awesome-icon style="color: red; margin-top: 2px; margin-left: 7px" icon="trash-can" />
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