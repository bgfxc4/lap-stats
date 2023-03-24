<template>
	<div v-show="$props.raceRunningTime != NaN && $props.raceRunningTime < 1" id="start-counter">
        <div id="text">
            Countdown
        </div>
        <div id="countdown">
            {{ $props.raceRunningTime == 0 ? "GO" : $props.raceRunningTime }}
        </div>
    </div>
</template>

<script>
export default {
	name: "StartCounter",
    props: {raceRunningTime: Number}
}
</script>

<style scoped>
#start-counter {
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
}

#text {
    font-weight: bold;
    font-size: 300%;
    text-align: center;
}

#countdown {
    font-weight: bolder;
    font-size: 500%;
    text-align: center;
}
</style>