<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<template>
  <div>
    <h1 class="head-line flex">
      <div><img :src="AxureLogo" height="20px" /> Projects</div>
      <el-button type="primary" size="default" @click="handleNewPrj">创建</el-button>
    </h1>
  </div>
  <div id="projects">
    <ProjectList ref="prjList" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ProjectList from './views/ProjectList.vue'
import AxureLogo from '@/assets/axure.svg'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prjList = ref<any>(null)

function handleNewPrj() {
  prjList.value.newProject()
}
</script>

<style scoped>
#projects {
  width: 100%;
}

.head-line {
  margin-bottom: 10px;
  padding: 0 15px;
  justify-content: space-between;
  align-items: center;
}
</style>
