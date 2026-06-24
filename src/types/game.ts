
/**
 * 矿区格子的状态类型
 * - 'success': 成功挖到宝贝
 * - 'error': 没挖到、空地或触发惩罚
 * - '': 未初始化的初始状态
 */
export type CallType = 'success' | 'error' | ''

/**
 * 单个格子的完整数据接口
 */
export interface Cell {
    /** 格子的唯一标识，从 0 开始递增 */
    id: number;

    /** 格子所在的行坐标（0-14） */
    row: number;

    /** 格子所在的列坐标（0-14） */
    col: number;

    /** * 当前格子的奖惩属性 
     * @example 'success' | 'error' | ''
     */
    type: CallType;

    /** 该格子是否已经被玩家点击挖开了 */
    mined: boolean;

    /** 挖到该格子可以获得的分数奖励 */
    score: number;
    /** 当前格子邻居的矿石数量 */
    aroundCount: number
}
export interface PickaxeItem {
    /** 镐头类型 */
    name: string
    /** 镐头描述 */
    desc: string
    /** 镐头样式 */
    icon: string
}

export interface cdType {
    /** 镐头的冷却时间 */
    time: number
    /** 是否禁用 */
    click: boolean
}