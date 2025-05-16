<template>
  <div style="position: relative">
    <div class="search-bar">
      <el-mention
        v-model="keyword"
        :prefix="['#']"
        :options="tags"
        :whole="true"
        placeholder="搜索项目, 使用 # 搜索tag"
        clearable
        class="search-input"
        @search="handleSearch"
      >
        <template #prefix>
          <Search style="width: 1em; height: 1em" />
        </template>
      </el-mention>
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
import { ElMessageBox, type MentionOption } from 'element-plus'
import NewProject from './NewProject.vue'
import { Search } from '@element-plus/icons-vue'
import { pinyin } from '@/pinyin'

defineExpose({ newProject })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dlgNewPrj = ref<any>(null)
const animate = ref(false)
const keyword = ref('')
const projects = ref<ProjectInfo[]>([])
const tagMap = ref(new Map<string, number>())
const displayProjects = computed(() => {
  // separate keyword from tags
  const matches = keyword.value.matchAll(/#(.+?)\s/gi)
  const tagList = Array.from(matches)
    .map((it) => it[1])
    .filter((it) => tagMap.value.has(it)) // 只搜索存在的tag
  let pureKeyword = keyword.value.replace(/(#[^\s]+)/gi, '').replace(/(#\s*)$/gi, '')
  pureKeyword = pureKeyword.trim().toLowerCase()

  const start = (pageInfo.page - 1) * pageInfo.pageSize
  // 按tag搜索，要求的tag必须全部存在
  let filteredProjects = tagList.length
    ? projects.value.filter((prj) => {
        if (tagList.length) {
          const tagSet = new Set(prj.tag || [])
          if (tagList.some((tag) => !tagSet.has(tag))) {
            return false
          }
        }
        return true
      })
    : projects.value

  // 按其他条件搜索
  filteredProjects = pureKeyword
    ? filteredProjects.filter(
        (prj) =>
          prj.py.includes(pureKeyword) ||
          prj.pinyin.includes(pureKeyword) ||
          prj.name.toLowerCase().includes(pureKeyword) ||
          prj.desc.toLowerCase().includes(pureKeyword),
      )
    : filteredProjects
  return filteredProjects.slice(start, start + pageInfo.pageSize)
})

const tags = computed<MentionOption[]>(() => {
  return Array.from(tagMap.value.keys()).map((tag) => {
    return {
      value: tag,
    }
  })
})

const pageInfo = reactive({
  page: 1,
  pageSize: 10,
})

function loadProjects() {
  axios.get('/api/list').then((res) => {
    animate.value = true
    tagMap.value.clear()
    // 补全没有拼音信息的项目，老项目没有此字段，并生成tag图
    res.data.forEach((prj: ProjectInfo) => {
      if (!prj.py) {
        const pyinfo = pinyin(prj.name + prj.desc)
        prj.py = pyinfo.py
        prj.pinyin = pyinfo.pinyin
      }
      // 统计tag数
      ;(prj.tag || []).forEach((tag) => {
        const count = tagMap.value.get(tag) || 0
        tagMap.value.set(tag, count + 1)
      })
    })

    projects.value = res.data ?? []
    nextTick(() => {
      animate.value = false
    })
  })
}

function handleSearch(keyword: string, prefix: string) {
  if (prefix === '#') {
    tags.value = [{ value: '123' }, { value: '456' }]
  }
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

  ::v-deep(.el-input__wrapper) {
    box-shadow: none;
    border-radius: 15px;
    background: #f8f8f8;

    &.is-focus {
      box-shadow: 0 0 0 2px #409eff inset;
    }
  }
}
</style>
