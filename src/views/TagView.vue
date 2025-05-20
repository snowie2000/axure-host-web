<template>
  <div class="mask dark">
    <div class="tag-container">
      <div
        class="tag"
        v-for="(tag, idx) in tags"
        :key="tag.name"
        :class="{
          red: idx === 0,
          orange: idx === 1,
          yellow: idx === 2,
          checked: selected.has(tag.name),
        }"
        :style="{ fontSize: `${Math.round(14 + tag.percentage * 40)}px` }"
        @click="handleCheckToggle(tag.name)"
      >
        {{ tag.name }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type PropType } from 'vue'

export interface Tag {
  name: string
  percentage: number
}

const props = defineProps({
  tags: {
    type: Array as PropType<Tag[]>,
    default: () => [],
  },
  selected: {
    type: Object as PropType<Set<string>>,
    default: () => new Set<string>(),
    required: true,
  },
})

const emit = defineEmits(['select', 'unselect'])

function handleCheckToggle(tagName: string) {
  if (props.selected.has(tagName)) {
    emit('unselect', tagName)
  } else {
    emit('select', tagName)
  }
}
</script>

<style lang="less" scoped>
.tag-container {
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  height: 80vh; /* adjust as needed */
  align-content: flex-start; /* keep columns tight to the left */
  gap: 80px; /* space between icons */
  row-gap: 30px; /* space between rows */
  margin-left: 100px;
}

@keyframes fadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

.tag {
  position: relative;
  padding: 5px 20px;
  border-bottom: 1px solid transparent;
  background: transparent;
  white-space: nowrap; /* Prevent tags from wrapping within their grid item */
  cursor: default;
  height: auto;
  --tag-color: 255, 255, 255;
  color: rgb(var(--tag-color));
  text-shadow: 0 0 60px rgb(255, 255, 255, 0.5);

  &:hover {
    border-bottom: 1px solid rgb(var(--tag-color));
    background: linear-gradient(
      to right,
      rgba(var(--tag-color), 0.25),
      rgba(var(--tag-color), 0.01)
    );
  }

  &.checked {
    background: rgb(var(--tag-color), 0.15);
    outline: 1px solid rgb(var(--tag-color));

    &::before {
      content: '';
      background: transparent;
      font-size: 10px;
      position: absolute;
      top: 0;
      right: 0;
      color: white;
      border-top: 10px solid rgb(var(--tag-color)); /* Color and size of the top edge of the triangle */
      border-left: 10px solid transparent; /* Makes the left side transparent */
      border-bottom: 10px solid transparent; /* Makes the bottom side transparent */
      border-right: 10px solid rgb(var(--tag-color)); /* Color and size of the right edge of the triangle */
    }

    &&:after {
      content: '√';
      background: transparent;
      font-size: 10px;
      position: absolute;
      top: -3px;
      right: 2px;
      color: rgba(0, 0, 0, 0.5);
    }
  }

  &.red {
    --tag-color: 255, 80, 80;
  }

  &.orange {
    --tag-color: 255, 187, 51;
  }

  &.yellow {
    --tag-color: 255, 235, 51;
  }

  &.green {
    --tag-color: 0, 200, 81;
  }
}

.mask {
  backdrop-filter: blur(2px);
  position: fixed;
  opacity: 0;
  animation: fadeIn 0.2s forwards;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  z-index: 99;

  &.dark {
    background-color: rgba(0, 0, 0, 0.5);
  }
}
</style>
