<!-- eslint-disable @typescript-eslint/ban-ts-comment -->
<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<template>
  <div class="drop-area" ref="zone" @click="handleManualSelect">
    <div style="line-height: 20px"><UploadFilled width="40px" color="#aaa" /></div>
    拖放文件或文件夹到此处
    <div v-if="fileName">
      <el-tag type="success">{{ fileName }}</el-tag>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { UploadFilled } from '@element-plus/icons-vue'
import JSZip from 'jszip'
import type { SelectFileOption } from '@/typing.d/common'
defineProps<{
  fileName: string
}>()
const emit = defineEmits(['change'])

const zone = ref<HTMLElement | null>(null)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function addFolderToZip(zip: JSZip, directoryHandle: any, path: string) {
  for await (const entry of directoryHandle.values()) {
    if (entry.kind === 'file') {
      const file = await entry.getFile()
      zip.file(path + '/' + file.name, await file.arrayBuffer())
    } else if (entry.kind === 'directory') {
      await addFolderToZip(zip, entry, path + '/' + entry.name)
    }
  }
}

function SelectFile(option: SelectFileOption) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = option.fileExt?.join(',') ?? ''
  input.multiple = option.multiple ?? false

  return new Promise<File[]>((resolve, reject) => {
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement
      if (!target?.files?.length) {
        reject('未选择任何文件')
        return
      }
      if (option.fileExt?.length && option.restrictExt) {
        for (let i = 0; i < target.files.length; i++) {
          const file = target.files[i]
          const ext = file.name.split('.').pop()?.toLowerCase()
          if (!ext || !option.fileExt.includes('.' + ext)) {
            reject('文件类型不符合要求')
            return
          }
        }
      }
      resolve(Array.from(target.files))
    }
    input.click()
  })
}

function handleManualSelect() {
  SelectFile({
    fileExt: ['.zip'],
    restrictExt: true,
  }).then((files) => {
    emit('change', files[0], files[0].name)
  })
}

function setup() {
  const dropArea = zone.value!

  dropArea.addEventListener('dragover', (event) => {
    event.preventDefault()
  })

  dropArea.addEventListener('drop', async (event) => {
    event.preventDefault()
    const items = event.dataTransfer?.items ?? []
    if (items.length > 0 && items[0].kind === 'file') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entry = await (items[0] as any).getAsFileSystemHandle()
      if (entry.kind === 'directory') {
        const zip = new JSZip()
        await addFolderToZip(zip, entry, entry.name)
        const blob = await zip.generateAsync({ type: 'blob' })
        emit('change', blob, entry.name + '.zip')
      } else {
        emit('change', await entry.getFile(), entry.name)
      }
    }
  })
}

watch(zone, (el) => {
  if (el) {
    setup()
  }
})
</script>

<style lang="less" scoped>
.drop-area {
  border: 2px dashed #ccc;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  width: 100%;
}
</style>
