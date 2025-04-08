<template>
  <el-dialog
    v-model="open"
    :title="projectInfo.action === 'add' ? '新建项目' : '更新项目'"
    id="project-editor"
    :close-on-click-modal="false"
  >
    <el-form>
      <el-form-item label="项目名称">
        <el-input v-model="projectInfo.name" />
      </el-form-item>
      <el-form-item label="项目描述">
        <el-input v-model="projectInfo.desc" />
      </el-form-item>
      <el-form-item label="项目文件">
        <DragDropZone @change="handleFileChange" :file-name="projectInfo.filename" />
      </el-form-item>
    </el-form>
    <div style="text-align: right">
      <el-button type="primary" @click="handleSubmit" :loading="loading">确定</el-button>
      <el-button @click="open = false">取消</el-button>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import DragDropZone from './DragDropZone.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios, { AxiosError } from 'axios'
import type { ProjectInfo } from '@/typing.d/project'
import { pinyin } from '@/pinyin'

defineExpose({ showCreate, showEdit })
const emit = defineEmits(['success'])

const open = ref(false)
const loading = ref(false)
const projectInfo = reactive({
  action: 'add' as 'add' | 'update',
  id: '',
  name: '',
  desc: '',
  file: null as File | Blob | null,
  filename: '',
})

function showCreate() {
  open.value = true
  projectInfo.action = 'add'
}

function showEdit(project: ProjectInfo) {
  open.value = true
  projectInfo.action = 'update'
  projectInfo.id = project.id
  projectInfo.name = project.name
  projectInfo.desc = project.desc
}

function handleFileChange(f: Blob | File, filename: string) {
  projectInfo.file = f
  projectInfo.filename = filename
}

function doSubmit() {
  const pyinfo = pinyin(projectInfo.name + projectInfo.desc)

  loading.value = true
  const formData = new FormData()
  formData.append('id', projectInfo.id)
  formData.append('name', projectInfo.name)
  formData.append('desc', projectInfo.desc)
  formData.append('action', projectInfo.action)
  formData.append('pinyin', pyinfo.pinyin) // 提交拼音全称
  formData.append('py', pyinfo.py) // 提交拼音首字母
  if (projectInfo.file) formData.append('file', projectInfo.file)
  axios
    .post('/api/upload', formData)
    .then(() => {
      ElMessage.success(projectInfo.action === 'add' ? '项目创建成功' : '项目已更新')
      open.value = false
      emit('success')
    })
    .catch((err: AxiosError) => {
      ElMessage.error(err.response?.data ?? err.message)
    })
    .finally(() => {
      loading.value = false
    })
}

function handleSubmit() {
  if (!projectInfo.name) {
    ElMessage.error('项目名称不能为空')
    return
  }
  if (!projectInfo.file && projectInfo.action === 'add') {
    ElMessage.error('项目文件不能为空')
    return
  }
  if (!projectInfo.file) {
    ElMessageBox.confirm('您未上传新的项目原型，要继续沿用上一次的原型吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info',
    }).then(() => {
      doSubmit()
    })
  } else {
    doSubmit()
  }
}

watch(open, (val) => {
  if (!val) {
    projectInfo.name = ''
    projectInfo.desc = ''
    projectInfo.file = null
    projectInfo.filename = ''
  }
})
</script>

<style lang="less">
#project-editor {
  width: 500px;
  padding: 20px;
}
.upload-zone {
  width: 100%;
}
</style>
