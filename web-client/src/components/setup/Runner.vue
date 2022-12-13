<template>
	<li class="list-group-item d-flex justify-content-between align-items-start">
		<div class="ms-2 me-auto">
			<div class="fw-bold">{{$props.runner.name}}</div>
			{{$props.runner.class_name}}
		</div>
		<font-awesome-icon style="color: red; margin-top: 2px; margin-left: 7px" icon="trash-can" />
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