// ============ 分类数据 ============
export const CATEGORIES = [
  {
    name: '餐饮',
    icon: '🍜',
    children: ['一日三餐', '外卖', '零食饮品', '聚餐请客', '水果生鲜']
  },
  {
    name: '交通',
    icon: '🚗',
    children: ['公交地铁', '打车出行', '私家车', '共享单车', '长途出行']
  },
  {
    name: '购物',
    icon: '🛍️',
    children: ['日用百货', '服装鞋帽', '美妆护肤', '数码电器', '家居装饰', '宠物']
  },
  {
    name: '居住',
    icon: '🏠',
    children: ['房租房贷', '水电燃气', '物业网费', '维修保洁', '家居日用']
  },
  {
    name: '娱乐',
    icon: '🎮',
    children: ['影视音乐', '游戏', '运动健身', '旅游度假', '休闲放松']
  },
  {
    name: '教育',
    icon: '📚',
    children: ['课程培训', '书籍文具', '考试报名', '学习工具', '兴趣培养']
  },
  {
    name: '医疗',
    icon: '🏥',
    children: ['门诊挂号', '药品器械', '体检疫苗', '牙科眼科', '美容医疗']
  },
  {
    name: '社交人情',
    icon: '🎁',
    children: ['红包礼金', '送礼', '聚会团建', '孝敬长辈', '恋爱约会']
  },
  {
    name: '金融',
    icon: '💰',
    children: ['储蓄存款', '投资理财', '还款', '保险', '手续费', '借贷往来']
  },
  {
    name: '其他',
    icon: '📦',
    children: ['通讯费', '快递邮寄', '公益捐赠', '税费', '杂项']
  }
]

// ============ 类型定义 ============
export interface Record {
  id: string
  amount: number
  category: string
  subCategory: string
  date: string
  note: string
}

// ============ 主题色 ============
export const COLORS = {
  primary: '#ff6b6b',
  primaryLight: '#ff8e8e',
  primaryBg: '#fff0f0',
  accent: '#4ecdc4',
  accentDark: '#2a9d8f',
  accentBg: '#f0faf9',
  border: '#e0e0e0',
  borderLight: '#f0f0f0',
  textPrimary: '#333',
  textSecondary: '#666',
  textLight: '#999',
  textMuted: '#bbb',
  bg: '#f5f5f5',
  white: '#fff',
  shadow: '0 2px 8px rgba(0,0,0,0.08)'
}
