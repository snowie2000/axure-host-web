<template>
  <div style="position: relative">
    <TransitionGroup name="slide" :css="animate">
      <ProjectItem
        v-for="prj in displayProjects"
        :key="prj.id"
        :project="prj"
        @delete="() => handleDelete(prj)"
        @update="() => handleUpdate(prj)"
      />
    </TransitionGroup>

    <el-pagination
      :hide-on-single-page="true"
      layout="prev, pager, next"
      :page-sizes="[10, 20, 50, 100]"
      :total="projects.length"
      :page-size="pageInfo.pageSize"
      @change="handlePageChange"
    />
    <NewProject ref="dlgNewPrj" @success="loadProjects" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, nextTick } from 'vue'
import type { ProjectInfo } from '@/typing.d/project'
import axios from 'axios'
import ProjectItem from './ProjectItem.vue'
import { ElMessageBox } from 'element-plus'
import NewProject from './NewProject.vue'
defineExpose({ newProject })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dlgNewPrj = ref<any>(null)
const animate = ref(false)
const projects = ref<ProjectInfo[]>([])
const displayProjects = computed(() => {
  const start = (pageInfo.page - 1) * pageInfo.pageSize
  return projects.value.slice(start, start + pageInfo.pageSize)
})

const pageInfo = reactive({
  page: 1,
  pageSize: 10,
})

function loadProjects() {
  axios.get('/api/list').then((res) => {
    animate.value = true
    projects.value = res.data ?? []
    nextTick(() => {
      animate.value = false
    })
  })
}

function newProject() {
  dlgNewPrj.value.showCreate()
}

function handleUpdate(prj: ProjectInfo) {
  dlgNewPrj.value.showEdit(prj)
}

function handleDelete(prj: ProjectInfo) {
  ElMessageBox.confirm(`要删除项目 "${prj.name}" 吗？删除后无法找回！`, '警告', {
    confirmButtonText: '删除',
    confirmButtonClass: 'el-button--danger',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    axios.get('/api/delete', { params: { id: prj.id } }).then(() => {
      loadProjects()
    })
  })
}

function handlePageChange(page: number, pageSize: number) {
  pageInfo.page = page
  pageInfo.pageSize = pageSize
}

onMounted(() => {
  loadProjects()
})
</script>

<style lang="less" scoped>
::v-deep(.el-pagination) {
  justify-content: flex-end;
}

.slide-move,
.slide-enter-active,
.slide-leave-active {
  transition:
    transform 0.5s cubic-bezier(0.55, 0, 0.1, 1),
    opacity 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translate(30px, 0);
}
</style>
