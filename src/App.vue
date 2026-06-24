<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { Cell, PickaxeItem } from './types/game';
import { useGame } from './stores/game';
import { storeToRefs } from 'pinia';
const BOARD_SIZE = 15; // 一行 15 个格子

// 随机分发矿石
const generatePrizes = () => {
  let count = 0 //记录发出去的矿石
  while (count < 30) {
    // 随机生成一个 0 到 224 的索引号
    const randomIndex = Math.floor(Math.random() * 225)
    console.log(randomIndex);
    if (grid.value[randomIndex].type === '') {
      grid.value[randomIndex].type = 'success'
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
const Mining = useGame()
const { grid, score, stars, frequency, pickaxe, cd, mapnum } = storeToRefs(Mining)
// 创建矿区-矿石初始化
const initBoard = () => {
  if (Mining.grid.length !== 0) return  // 优先按照本地存储的来
  frequency.value = 1
  const tempBoard: Cell[] = []
  for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
    const row = Math.floor(i / BOARD_SIZE)
    const col = i % BOARD_SIZE
    tempBoard.push({ id: i, row, col, type: '', mined: false, score: Math.floor(Math.random() * 3) + 1, aroundCount: 0 })
  }
  grid.value = tempBoard
  // 开始分发矿石
  generatePrizes()
  console.log(grid.value);
}
initBoard()
const cols = ref(15)
const rows = ref(15)
// 兼顾移动端
onMounted(() => {
  if (window.innerWidth < 650) {
    cols.value = 9
  }
})
// 镐头样式
const pickaxes: PickaxeItem[] = [
  {
    name: '铁镐',
    desc: '一把简单的镐，十分钟就能做出来，但是能成功挖出来的星星矿和宝石并不多！',
    icon: new URL('./assets/images/pickaxe/0.png', import.meta.url).href
  },
  {
    name: '银稿',
    desc: '银质的镐，制作需要半小时，挖出来的星星矿和宝石至少比铁镐多！',
    icon: new URL('./assets/images/pickaxe/1.png', import.meta.url).href
  },
  {
    name: '金稿',
    desc: '制作工艺非常难的镐，制作需要一小时，金镐能最大程度减少挖掘对星星矿和宝石造成的破坏，所以挖出来的星星矿和宝石的产量非常高！',
    icon: new URL('./assets/images/pickaxe/2.png', import.meta.url).href
  },
  {
    name: '保罗炸弹',
    desc: '感受保罗的愤怒吧!能一次性轰开3x3片矿区!',
    icon: new URL('./assets/images/pickaxe/3.png', import.meta.url).href
  }
]
// 镐头高亮
const clickPickaxe = (index: number) => {
  pickaxe.value = index
  console.log(pickaxe.value);
}
// 点击触发
const handleClick = (item: Cell) => {
  if (item.mined) return //矿已被挖开
  if (!cd.value[pickaxe.value].click) return //镐头还在cd
  const row = item.row
  const col = item.col
  switch (pickaxe.value) {
    // 普通镐
    case 0:
      digSingleCell(row, col)
      break
    case 1:
      for (let dCol = -1; dCol <= 1; dCol++) {
        digSingleCell(row, col + dCol)
      }
      break
    case 2:
      const crossDirections = [
        [0, 0],   // 自己
        [-1, 0],  // 上
        [1, 0],   // 下
        [0, -1],  // 左
        [0, 1]    // 右
      ]
      crossDirections.forEach(([dRow, dCol]) => {
        digSingleCell(row + dRow, col + dCol)
      })
      break
    case 3:
      for (let dRow = -1; dRow <= 1; dRow++) {
        for (let dCol = -1; dCol <= 1; dCol++) {
          digSingleCell(row + dRow, col + dCol)
        }
      }
      break
  }
  // 镐头冷却
  let timeIncrement
  switch (pickaxe.value) {
    case 0:
      timeIncrement = 10 * 60 * 100
      break
    case 1:
      timeIncrement = 30 * 60 * 100
      break
    case 2:
      timeIncrement = 50 * 60 * 100
      break
    default:
      timeIncrement = 100 * 60 * 100;
  }
  cd.value[pickaxe.value].time = Date.now() + timeIncrement
  cd.value[pickaxe.value].click = false
}

// 挖矿功能 挖取多个矿石以及探测邻居有无星星矿
const digSingleCell = (targetRow: number, targetCol: number) => {
  // 边缘矿石的边界处理
  if (targetRow >= 0 && targetRow < rows.value && targetCol >= 0 && targetCol < cols.value) {
    // 循环出当前元素坐标的八个邻居
    const neighborIndex = targetRow * cols.value + targetCol
    const neighbor = grid.value[neighborIndex]
    if (neighbor.mined) return
    // 1. 结算这个格子的随机得分
    score.value += neighbor.score
    neighbor.mined = true
    // 2. 如果挖到的是星星矿，星星总数 +1
    if (neighbor.type === 'success') {
      stars.value += 1
    }
    let count = 0
    // 以当前格子为中心循环探测附近八个邻居是否存在星星矿 存在用数量显示出来
    for (let dRow = -1; dRow <= 1; dRow++) {
      for (let dCol = -1; dCol <= 1; dCol++) {
        if (dRow === 0 && dCol === 0) continue
        let neighborRow = targetRow + dRow
        let neighborCol = targetCol + dCol
        if (neighborRow >= 0 && neighborRow < rows.value && neighborCol >= 0 && neighborCol < cols.value) {
          const neighborIndex = neighborRow * cols.value + neighborCol
          if (grid.value[neighborIndex].type === 'success') {
            count++
          }
        }
      }

    }
    neighbor.aroundCount = count
  }
}
// 冷却结束的回调
const onFinish = (index: number) => {
  console.log('结束了');
  cd.value[index].click = true
  cd.value[index].time = 0
}
</script>
<!-- 
1. -1 -1
2. -1 0
3. -1 1
4. 0 -1
5. 0 0 
6. 0 1
7. 1 -1
8. 1 0
9. 1 1
 -->
<template>
  <div class="bg_1" />
  <div class="bg_2" />
  <div class="user">
    <div class="userInfo">
      <img src="./assets/images/avatar.png" class="avatar" alt="">
      <div class="stars">我 <span class="star">⭐</span> {{ stars }}</div>
    </div>
  </div>
  <div class="mining_box">
    <div class="title">Vue 挖矿小游戏</div>
    <div class="statistics"> 当前挖矿分数: {{ score }} | 目前你已挖完矿区{{ mapnum }}次 </div>
    <div class="card_box">
      <div class="grid_item" v-for="(item) in grid" :key="item.id" @click="handleClick(item)">
        <div :class="['card_bg', 'open']" v-if="item.mined">
          <a-tooltip>
            <template #title>
              <div class="desc">挖取这座矿区你获得了{{ item.score }}分</div>
              <div class="desc">{{ item.type === 'success' ? '恭喜你挖到了宝贵的星星矿石' : item.aroundCount ?
                `探测器检测到周围有${item.aroundCount}座星星矿石` : '探测器未检测到周围有星星矿' }}</div>
            </template>
            <div v-if="item.type === 'error'">{{ item.aroundCount }}</div>
            <div v-else>⭐</div>
            <img src="./assets/images/avatar.png" alt="" class="default_img">
          </a-tooltip>

        </div>
        <div v-else :class="['card_bg', 'map' + frequency]"></div>
      </div>
    </div>
  </div>
  <div class="tool_box">
    <div class="pickaxe_item" v-for="(item, index) in pickaxes" :key="index" @click="clickPickaxe(index)">
      <img :src="item.icon" alt="" :class="['pickaxe_icon', { active: pickaxe === index }]">
      <div class="card_demining_time_body">
        <span v-if="!cd[index].click">
          <a-statistic-countdown :value="cd[index].time" @finish="onFinish(index)" format="mm:ss"
            style="padding-bottom: 5px;"
            :value-style="{ fontSize: '12px', height: '100%', display: 'flex', alignItems: 'center' }" />
        </span>
        <span v-else class="time-status">完成!</span>
      </div>
    </div>
  </div>
</template>

<style>
body {
  background-image: url(./assets/images/bg/bg0.png);
  cursor: url(./assets/images/cur/default.png), default;
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
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 2;
  padding: 5px;
  font-size: 14px;
  background-color: hsla(0, 0%, 100%, .8);
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
  padding: 40px 10px 62px;
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

      .card_bg {
        position: relative;
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
        cursor: url(./assets/images/cur/pointer.png), default;

        .default_img {
          width: 40px;
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          opacity: 0.3;
          transition: opacity ease 0.2s;
        }
      }

      .open {
        background-color: #a4a4a4;
        background-image: none;
        box-sizing: border-box;
        border: 1px solid #727272;
      }

      .map1 {
        background-image: url(./assets/images/map/bg1.png);
      }

      .map2 {
        background-image: url(./assets/images/map/bg2.png);
      }
    }

    .grid_item:hover .default_img {
      opacity: 1;
    }
  }
}



.tool_box {
  position: fixed;
  bottom: 5px;
  left: 50%;
  width: 300px;
  height: 62px;
  transform: translateX(-50%);
  z-index: 2;
  border-radius: 5px;
  background-color: #fff;
  box-shadow: 0 0 5px rgba(0, 0, 0, .3);
  display: flex;
  justify-content: space-around;

  .pickaxe_item {
    width: 48px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    .pickaxe_icon {
      margin-top: 10px;
      opacity: .3;
      height: 32px;
    }

    .card_demining_time_body {
      height: 20px;
      font-size: 12px;

      .time-status {
        height: 100%;
        display: flex;
        align-items: center;
      }
    }

    .active {
      opacity: 1;
    }

  }

  .pickaxe_item:hover .pickaxe_icon {
    opacity: 1;
  }
}

.ant-statistic {
  padding-bottom: 0 !important;
}
</style>