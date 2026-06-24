import { defineStore } from "pinia";
import type { cdType, Cell } from "../types/game";
import { ref } from "vue";

export const useGame = defineStore('mining', () => {
    // 镐头冷却时间
    const cd = ref<cdType[]>([
        { time: 0, click: true },
        { time: 0, click: true },
        { time: 0, click: true },
        { time: 0, click: true }
    ])
    // 星星总数
    const stars = ref(0)
    // 总分数
    const score = ref(0)
    // 镐头高亮
    const pickaxe = ref(0)
    //地图章节
    const frequency = ref(0)
    // 矿石记录
    const grid = ref<Cell[]>([])
    // 矿区解锁程度
    const mapnum = ref(0)
    // 头像
    const avatar = ref('./assets/images/avatar.png')

    return { cd, stars, score, pickaxe, frequency, grid, mapnum, avatar, }
}, {
    persist: true //持久化
})