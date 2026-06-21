<script setup lang="ts">
import { onMounted, ref } from 'vue';
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
const cols = ref(15)
onMounted(() => {
  if (window.innerWidth < 650) {
    cols.value = 9
  }
})
</script>

<template>
  <div class="bg_1" />
  <div class="bg_2" />
  <div class="user">
    <div class="userInfo">
      <img src="./assets/images/avatar.png" class="avatar" alt="">
      <div class="stars">我 <span class="star">⭐</span> 123</div>
    </div>
  </div>
  <div class="mining_box">
    <div class="title">Vue 挖矿小游戏</div>
    <div class="statistics"> 当前挖矿分数: 364 | 目前你已挖完矿区3次 </div>
    <div class="card_box">
      <div class="grid_item" v-for="(item, index) in grid">
        <div class="card_map card_bg">{{ index }}</div>
      </div>
    </div>
  </div>
  <div class="tool_box">

  </div>
</template>

<style>
body {
  background-image: url(./assets/images/bg/bg0.png);
}

.bg_1,
.bg_2 {
  z-index: -1;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  transition: all .3s ease-out;
}

.bg_1 {
  background-image: url(./assets/images/bg/bg1.png);
  background-position: top
}

.bg_2 {
  background-image: url(./assets/images/bg/bg2.png);
  background-position: top
}

.user {
  padding: 5px;
  background-color: #fff;
  font-size: 14px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, .1);

  .userInfo {
    display: flex;
    align-items: center;

    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      margin-right: 5px;
    }
  }
}

.mining_box {
  padding: 40px 10px 80px;
  margin: 0 auto;
  max-width: 650px;

  .title {
    margin-bottom: 40px;
    font-size: 22px;
    text-align: center;
  }

  .statistics {
    font-size: 14px;
  }

  .card_box {
    margin: 10px auto;
    width: 100%;
    display: grid;
    grid-template-columns: repeat(v-bind(cols), 40px);
    justify-content: center;
    align-content: center;
    gap: 1px;

    .grid_item {
      aspect-ratio: 1;

      cursor: pointer;

      .card_bg {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        z-index: 1;
        color: #fff;
        background-color: #464646;
        text-shadow: 0 0 5px #000;
        background-size: cover;
      }

      .card_map {
        background-image: url(./assets/images/map/bg2.png);
      }
    }
  }
}



.tool_box {
  height: 80px;
  width: 340px;
  background-color: red;
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
}
</style>