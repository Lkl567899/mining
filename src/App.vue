<script setup lang="ts">
import { h, onMounted, ref } from 'vue';
import type { Cell, PickaxeItem } from './types/game';
import { useGame } from './stores/game';
import { storeToRefs } from 'pinia';
// 随机分发矿石
const generatePrizes = () => {
  let count = 0 //记录发出去的矿石
  while (count < 30) {
    // 随机生成一个 0 到 224 的索引号
    const randomIndex = Math.floor(Math.random() * grid.value.length)
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
const Mining = useGame() // 仓库
const { grid, score, stars, frequency, pickaxe, mapnum, cd, infiniteBombShow, resetCdShow, everyGrid, avatar } = storeToRefs(Mining)
// 列
const cols = ref(15)
// 行
const rows = ref(15)
// 兼顾移动端
onMounted(() => {
  if (window.innerWidth < 650) {
    cols.value = 9
    infiniteBombShow.value = false
    resetCdShow.value = false
  }
  initBoard()
})
// 创建矿区-矿石初始化
const initBoard = () => {
  const totalCells = rows.value * cols.value
  if (grid.value.length !== 0 && grid.value.length === totalCells && !everyGrid.value) {
    return
  } else {
    console.log('我重生了');
    grid.value = [] // 尺寸对不上（比如换了设备），清空残局，重新生成适合屏幕的地图
    cd.value = [{ time: 0, click: true },
    { time: 0, click: true },
    { time: 0, click: true },
    { time: 0, click: true }]
  }
  console.log(cols.value, 'cols');
  console.log(rows.value, 'rows');
  const tempBoard: Cell[] = []
  for (let i = 0; i < totalCells; i++) {
    const row = Math.floor(i / cols.value)
    const col = i % cols.value
    tempBoard.push({ id: i, row, col, type: '', mined: false, score: Math.floor(Math.random() * 3) + 1, aroundCount: 0 })
  }
  grid.value = tempBoard
  // 开始分发矿石
  generatePrizes()
  console.log(grid.value);
}
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
}
// 换地图
const checkAllCleared = () => {
  everyGrid.value = grid.value.every(item => item.mined)
  console.log(everyGrid.value, 'everyGrid');
  if (frequency.value === 5) {
    messageApi.success('恭喜你通关喵~')
    return
  }
  if (everyGrid.value) {
    frequency.value += 1 //换地图
    initBoard() //重置矿区
    mapnum.value += 1 // 地图进度
    messageApi.success(`进入下一关喵~`)
  }
}

// 点击触发
const handleClick = (item: Cell) => {
  if (item.mined) return //矿已被挖开
  if (!cd.value[pickaxe.value].click) return //镐头还在cd
  const row = item.row
  const col = item.col
  console.log(row, col);
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
  checkAllCleared()
  // 镐头冷却
  let timeIncrement
  // 重置cd开关 所有工具都不进入冷却
  if (resetCdShow.value) return
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
      // 蹦蹦炸弹cd不进入冷却
      if (infiniteBombShow.value) {
        return
      }
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
import { SmileOutlined } from '@ant-design/icons-vue';
import { notification, Button } from 'ant-design-vue';
import { message } from 'ant-design-vue';
const [messageApi, contextHolder] = message.useMessage(); //全局提示

// 蹦蹦炸弹无限cd
const Bomb = () => {
  infiniteBombShow.value = !infiniteBombShow.value
  if (infiniteBombShow.value) {
    messageApi.success({
      content: () => '感受可莉的愤怒吧😡!',
      style: {
        marginTop: '20vh'
      }
    })
    cd.value[3].time = 0 // 保罗炸弹冷却重置
  }

}
// 所有工具无限cd
const resetCd = () => {
  resetCdShow.value = !resetCdShow.value
  if (resetCdShow.value) {
    //重置所有工具的cd
    messageApi.success({
      content: () => '所有工具无限cd已开启!',
      style: {
        marginTop: '20vh'
      }
    })
    cd.value.forEach(item => item.time = 0)
  }
}
// 作弊弹窗
const modifier = () => {
  // 限制弹窗数量
  notification.config({
    maxCount: 1
  })
  notification.success({
    message: '修改器',
    description: () => h('div', { class: 'notify' }, [
      h(Button, { class: ['notify-btn', infiniteBombShow.value ? 'bomb-active' : ''], size: 'small', danger: true, onClick: Bomb }, () => '无限蹦蹦炸弹'),
      h(Button, { class: ['notify-btn', 'cd-default', resetCdShow.value ? 'cd-active' : ''], size: 'small', onClick: resetCd }, () => '重置镐头冷却')
    ]),
    duration: 3,
    class: 'notification_'
  })
}

// 用户弹出框
const open = ref(false)

// 修改头像
const handleLocalUpload = (options: any) => {
  const fileEntity = options.file // 照片实体
  const reader = new FileReader() // 扫描器
  reader.onload = (e) => {
    const imageObj = new Image();
    imageObj.src = e.target?.result as string

    imageObj.onload = () => {
      const targetWidth = 100;
      const scaleFactor = targetWidth / imageObj.width;
      const targetHeight = imageObj.height * scaleFactor;
      const invisibleCanvas = document.createElement('canvas');
      invisibleCanvas.width = targetWidth;
      invisibleCanvas.height = targetHeight;
      const ctx = invisibleCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(imageObj, 0, 0, targetWidth, targetHeight);
        const base64 = invisibleCanvas.toDataURL('image/jpeg', 0.8)
        if (base64 && typeof base64 === 'string') {
          avatar.value = base64
          message.success('头像修改成功~');
          options.onSuccess()
        }
      }
    }
    imageObj.onerror = () => {
      options.onError();
    };

  }
  reader.readAsDataURL(fileEntity)
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
      <img :src="avatar" class="avatar pointer_cursor" alt="" @click="open = !open">
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
            <img :src="avatar" alt="" class="default_img">
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
  <div class="game_modifier" @click="modifier">
    <SmileOutlined />
  </div>
  <context-holder />
  <a-modal v-model:open="open" title="我的信息" width="400px" :footer="null">
    <div class="user_box">
      <div class="avatar_box">
        <img :src="avatar" alt="" class="user_avatar">
        <div class="username">我</div>
      </div>
      <div class="data_box">
        <div class="data_item">星星: 0</div>
        <div class="data_item">等级: 0</div>
      </div>
      <div class="btn_box">
        <a-upload name="avatar" :show-upload-list="false" :customRequest="handleLocalUpload">
          <a-button type="primary pointer_cursor">修改头像</a-button>
        </a-upload>
        <a-button type="primary pointer_cursor" class="import_btn">导入</a-button>
        <a-button type="primary pointer_cursor" class="export_btn">导出</a-button>
        <a-button type="primary pointer_cursor" danger>清空</a-button>
      </div>
    </div>
  </a-modal>
</template>

<style>
.pointer_cursor {
  cursor: url(./assets/images/cur/pointer.png), default;
}

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
    margin: 30px 0;
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

      .map3 {
        background-image: url(./assets/images/map/bg3.png);
      }

      .map4 {
        background-image: url(./assets/images/map/bg4.png);
      }

      .map5 {
        background-image: url(./assets/images/map/bg5.png);
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

/* 游戏修改器 */
.game_modifier {
  width: 30px;
  height: 30px;
  line-height: 30px;
  text-align: center;
  background-color: hsla(0, 0%, 100%, .8);
  box-shadow: 0 0 5px rgba(0, 0, 0, .3);
  position: fixed;
  left: 0%;
  top: 80px;
  z-index: 2;
  border-radius: 0 50% 50% 0;
  cursor: url(./assets/images/cur/pointer.png), default;

}

.notify {
  margin-top: 10px;
}

.notify-btn {
  margin-right: 10px;
  font-size: 12px !important;
}

.notification_ {
  width: 300px;
}

@media screen and (max-width:650px) {
  .notification_ {
    width: 200px;
  }

  .notify-btn {
    margin-top: 10px;
    font-size: 12px !important;
  }

}

/* 蹦蹦炸弹的开启样式 */
.notify-btn.bomb-active {
  background-color: #c53030 !important;
  border-color: #c53030 !important;
  color: #fff !important;
  box-shadow:
    0 0 8px rgba(197, 48, 48, .8),
    inset 0 0 6px rgba(255, 100, 100, .4);
}

/* 重置cd的开启样式 */
.notify-btn.cd-default {
  border-color: #722ed1 !important;
  color: #722ed1 !important;
}

.notify-btn.cd-active {
  background-color: #722ed1 !important;
  border-color: #722ed1 !important;
  color: #fff !important;
  box-shadow: 0 0 8px rgba(114, 46, 209, .7);
}

.user_box {
  width: 100%;
  height: 100%;

  .avatar_box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin: 20px 0;

    .user_avatar {
      width: 45px;
      height: 45px;
    }

    .username {
      margin-top: 3px;
    }
  }
}

.data_box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  .data_item {
    width: 180px;
    height: 36px;
    border: 1px solid #ccc;
    border-radius: 4px;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.btn_box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 10px 0;

  .import_btn {
    background-color: #ccc;
  }

  .import_btn:hover {
    background-color: #c6c3c3;
  }

  .export_btn {
    background-color: #eebc07;
  }

  .export_btn:hover {
    background-color: #f3bf04 !important;
  }
}
</style>