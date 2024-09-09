<script setup>
import { ref, onMounted } from 'vue'
import Map from './map'
const box = ref(null)
onMounted(() => {
  init(box.value, document.querySelector('#provinceInfo'))
})

const init = (container, el) => {
  console.log('onMounted', container, el)

  const map = new Map(container, el)
  map.init()
}

</script>
<template>
  <div ref="box" class="china-chart">
    <div id="tooltip"></div>
  </div>
</template>



<style>
.china-chart {
  height: 100%;
  width: 100%;
}
#tooltip {
  position: absolute;
  z-index: 2;
  background: white;
  padding: 10px;
  border-radius: 2px;
  visibility: hidden;
}
</style>