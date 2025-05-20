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
        @tag-click="handleAddTag"
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
    <NewProject ref="dlgNewPrj" :tags="simpleTagList" @success="loadProjects" />
  </div>
  <TagView
    v-if="tagViewShow"
    :tags="tagWithPercent"
    :selected="searchTagSet"
    @select="handleAddTag"
    @unselect="handleDeleteTag"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, nextTick, onUnmounted } from 'vue'
import type { ProjectInfo } from '@/typing.d/project'
import axios from 'axios'
import ProjectItem from './ProjectItem.vue'
import { ElMessageBox, type MentionOption } from 'element-plus'
import NewProject from './NewProject.vue'
import { Search } from '@element-plus/icons-vue'
import { pinyin } from '@/pinyin'
import TagView from './TagView.vue'

defineExpose({ newProject })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dlgNewPrj = ref<any>(null)
const animate = ref(false)
const keyword = ref('')
const projects = ref<ProjectInfo[]>([])
const tagMap = ref(new Map<string, number>())
const tagViewShow = ref(false)

const searchTagList = computed(() => {
  const matches = keyword.value.matchAll(/#(.+?)\s/gi)
  const tagList = Array.from(matches)
    .map((it) => it[1])
    .filter((it) => tagMap.value.has(it)) // 只搜索存在的tag
  return tagList
})

const searchTagSet = computed(() => new Set(searchTagList.value))

const searchKeyword = computed(() => {
  let pureKeyword = keyword.value.replace(/(#[^\s]+)/gi, '').replace(/(#\s*)$/gi, '')
  pureKeyword = pureKeyword.trim().toLowerCase()
  return pureKeyword
})

const displayProjects = computed(() => {
  const start = (pageInfo.page - 1) * pageInfo.pageSize
  // 按tag搜索，要求的tag必须全部存在
  let filteredProjects = searchTagList.value.length
    ? projects.value.filter((prj) => {
        if (searchTagList.value.length) {
          const tagSet = new Set(prj.tag || [])
          if (searchTagList.value.some((tag) => !tagSet.has(tag))) {
            return false
          }
        }
        return true
      })
    : projects.value

  // 按其他条件搜索
  filteredProjects = searchKeyword.value
    ? filteredProjects.filter(
        (prj) =>
          prj.py.includes(searchKeyword.value) ||
          prj.pinyin.includes(searchKeyword.value) ||
          prj.name.toLowerCase().includes(searchKeyword.value) ||
          prj.desc.toLowerCase().includes(searchKeyword.value),
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

const tagWithPercent = computed(() => {
  let total = 0
  tagMap.value.forEach((count) => {
    total += count * count
  })
  return Array.from(tagMap.value.entries())
    .map(([tag, count]) => {
      return {
        name: tag,
        percentage: (count * count) / total,
      }
    })
    .sort((a, b) => {
      const ret = b.percentage - a.percentage
      return ret === 0 ? a.name.localeCompare(b.name) : ret
    })
})

const simpleTagList = computed(() => {
  return tagWithPercent.value.map((tag) => tag.name)
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

// 处理tag的添加和删除
function handleAddTag(tag: string) {
  if (searchTagSet.value.has(tag)) {
    return
  }
  rebuildKeyword([...searchTagList.value, tag])
}

function handleDeleteTag(tag: string) {
  if (!searchTagSet.value.has(tag)) {
    return
  }
  const newTagList = searchTagList.value.filter((it) => it !== tag)
  rebuildKeyword(newTagList)
}

// 从taglist和searchKeyword重建keyword
function rebuildKeyword(tagList: string[]) {
  keyword.value =
    tagList.reduce((acc, tag) => {
      return acc + `#${tag} `
    }, '') + searchKeyword.value
}

function handlePageChange(page: number, pageSize: number) {
  pageInfo.page = page
  pageInfo.pageSize = pageSize
}

function handleShowView(event: KeyboardEvent) {
  if (event.key === 'Tab') {
    event.preventDefault() // Prevent default tab behavior
    if (!tagViewShow.value) {
      tagViewShow.value = true
    }
  }
}

function handleHideView(event: KeyboardEvent) {
  if (event.key === 'Tab' && tagViewShow.value) {
    event.preventDefault() // Prevent default tab behavior
    tagViewShow.value = false
  }
}

onMounted(() => {
  loadProjects()
})

onMounted(() => {
  document.addEventListener('keydown', handleShowView)
  document.addEventListener('keyup', handleHideView)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleShowView)
  document.removeEventListener('keyup', handleHideView)
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
