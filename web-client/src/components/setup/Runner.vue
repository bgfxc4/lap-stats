<template>
	<li class="list-group-item d-flex justify-content-between align-items-start" :class="{'d-none': $props.soloClassName != null && $props.soloClassName != runner.class_name}">
		<div class="ms-2 me-auto">
            {{$props.runner.index}} <div class="fw-bold" style="display: inline-block"> {{$props.runner.name}} ({{$props.runner.id}}, {{$props.runner.sponsors.reduce((a, b) => a+b.amount, 0)}}€ / round, 
                {{$props.runner.sponsors_fixed.reduce((a, b) => a+b.amount, 0)}}€ fixed) </div><br>
			{{$props.runner.class_name}}
		</div>

		<b-button v-if="$store.state.isDebug"  @click="$emit('debugLap', $props.runner.id)" style="background: #0000; border: none" class="mt-0 pt-0 px-4">
			<font-awesome-icon class="text-info" icon="flag-checkered" />
		</b-button>
		<b-button @click="$emit('edit', $props.runner.id)" style="background: #0000; border: none" class="mt-0 pt-0">
			<font-awesome-icon class="text-info" icon="pen" />
		</b-button>
		<b-button @click="$emit('delete', $props.runner.id)" style="background: #0000; border: none" class="mt-0 pt-0">
			<font-awesome-icon style="color: red" icon="trash-can" />
		</b-button>
	</li>
</template>

<script>
export default {
	name: "Runner",
	emits: ["delete", "debugLap", "edit"],
	props: {
		runner: Object,
		soloClassName: String
	}
}
</script>

<style>

</style>
