<template>
  <el-card shadow="hover" class="project-item">
    <div class="project-header flex">
      <div class="project-info flex">
        <a class="name" :href="`/${project.id}`" target="_blank">{{ project.name }}</a>
        <span class="date">{{ project.date }}</span>
      </div>
      <div class="project-actions">
        <el-button type="primary" link size="default" ref="btnLink" @click="handleCopyLink"
          >复制链接</el-button
        >
        <el-button type="primary" link size="default" @click="emit('update')">更新</el-button>
        <el-button type="danger" link size="default" @click="emit('delete')">删除</el-button>
      </div>
    </div>
    <div class="project-desc" v-if="project.desc">{{ project.desc }}</div>
    <div class="project-desc" v-else><i>未提供项目描述</i></div>
    <div class="tags" v-if="(project.tag || []).length">
      <el-tag
        class="tag"
        v-for="item in project.tag"
        :key="item"
        effect="light"
        @click="emit('tag-click', item)"
      >
        {{ item }}
      </el-tag>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import type { ProjectInfo } from '@/typing.d/project'
import ClipboardJS from 'clipboard'
import { ElMessage } from 'element-plus'
import { onUnmounted, ref, watch } from 'vue'

const props = defineProps<{
  project: ProjectInfo
}>()
const emit = defineEmits(['delete', 'update', 'tag-click'])

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const btnLink = ref<any>(null)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let clipboard = null as any

function handleCopyLink() {
  ElMessage.success('链接已复制到剪贴板')
}

watch(btnLink, (el) => {
  if (el) {
    if (clipboard) {
      clipboard.destroy()
    }
    clipboard = new ClipboardJS(el.$el, {
      text: function () {
        return location.origin + '/' + props.project.id
      },
    })
  }
})

onUnmounted(() => {
  if (clipboard) {
    clipboard.destroy()
  }
})
</script>

<style lang="less" scoped>
.project-item {
  border: none;
  border-bottom: 1px solid #f0f0f0;
  position: relative;

  &:hover {
    z-index: 1;
  }

  ::v-deep(.el-card__body) {
    padding: 10px 20px;
  }

  .project-info {
    flex: 1 1 99%;
    align-items: center;

    .name {
      flex: 1 1 99%;
      text-decoration: none;
      color: var(--color-text);
      font-weight: 600;
    }

    .date {
      flex: 0 0 130px;
      font-size: 12px;
    }
  }

  .project-desc {
    color: #666;
    font-size: 13px;
    margin-top: 4px;
  }

  .project-actions {
    flex: 0 0 200px;
    text-align: right;
    gap: 10px;
  }

  .tags {
    .tag {
      margin-top: 4px;
      color: #409eff;
      cursor: pointer;
    }
    .tag + .tag {
      margin-left: 5px;
    }
  }
}
</style>
