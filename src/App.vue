<script setup lang="ts">
import { ref } from 'vue';
import type { Cell } from './types/game';
// 矿区-装载着255个不确定状态的金矿
const grid = ref<Cell[]>([])
const BOARD_SIZE = 15; // 一行 15 个格子
// 随机分发矿石
const generatePrizes = () => {
  let count = 0 //记录发出去的矿石
  while (count < 30) {
    // 随机生成一个 0 到 224 的索引号
    const randomIndex = Math.floor(Math.random() * 225)
    if (grid.value[randomIndex].type === '') {
      grid.value[randomIndex].type = 'success'
      grid.value[randomIndex].score = Math.floor(Math.random() * 3) + 1
      count++
    }
  }
  // 其余金矿的状态为error
  grid.value.forEach((item) => {
    if (item.type === '') {
      item.type = 'error'
    }
  })

}
// 创建矿区-矿石初始化
const initBoard = () => {
  const tempBoard: Cell[] = []
  for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
    const row = Math.floor(i / BOARD_SIZE)
    const col = i % BOARD_SIZE
    tempBoard.push({ id: i, row, col, type: '', mined: false, score: 0 })
  }
  grid.value = tempBoard
  // 开始分发矿石
  generatePrizes()
  console.log(grid.value);
}
initBoard()
</script>

<template>

</template>
