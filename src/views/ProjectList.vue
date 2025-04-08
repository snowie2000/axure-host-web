<template>
  <div style="position: relative">
    <div class="search-bar">
      <el-input v-model="keyword" placeholder="搜索项目" clearable class="search-input">
        <template #prefix>
          <Search style="width: 1em; height: 1em" />
        </template>
      </el-input>
    </div>
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
import { Search } from '@element-plus/icons-vue'
import { pinyin } from '@/pinyin'

defineExpose({ newProject })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dlgNewPrj = ref<any>(null)
const animate = ref(false)
const keyword = ref('')
const projects = ref<ProjectInfo[]>([])
const displayProjects = computed(() => {
  const start = (pageInfo.page - 1) * pageInfo.pageSize
  const filteredProjects = keyword.value
    ? projects.value.filter(
        (prj) =>
          prj.py.includes(keyword.value.toLowerCase()) ||
          prj.pinyin.includes(keyword.value.toLowerCase()) ||
          prj.name.toLowerCase().includes(keyword.value.toLowerCase()) ||
          prj.desc.toLowerCase().includes(keyword.value.toLowerCase()),
      )
    : projects.value
  return filteredProjects.slice(start, start + pageInfo.pageSize)
})

const pageInfo = reactive({
  page: 1,
  pageSize: 10,
})

function loadProjects() {
  axios.get('/api/list').then((res) => {
    animate.value = true
    // 补全没有拼音信息的项目，老项目没有此字段
    res.data.forEach((prj: ProjectInfo) => {
      if (!prj.py) {
        const pyinfo = pinyin(prj.name + prj.desc)
        prj.py = pyinfo.py
        prj.pinyin = pyinfo.pinyin
      }
    })
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

.search-bar {
  margin-bottom: 10px;

  .search-input {
    ::v-deep(.el-input__wrapper) {
      box-shadow: none;
      border-radius: 15px;
      background: #f8f8f8;

      &.is-focus {
        box-shadow: 0 0 0 2px #409eff inset;
      }
    }
  }
}
</style>
