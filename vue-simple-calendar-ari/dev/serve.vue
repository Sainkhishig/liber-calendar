<script lang="ts">
import { defineComponent } from 'vue';
import VueSimpleCalendarAri from '@/vue-simple-calendar-ari.vue';

export default defineComponent({
  name: 'ServeDev',
  components: {
    VueSimpleCalendarAri
  }
});
</script>

<template>
  <div id="app">
    <vue-simple-calendar-ari />
  </div>
</template>
