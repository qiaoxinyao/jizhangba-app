// ============ 类型定义 ============

import type { ExpenseRecord } from './categories'

export interface CategoryBreakdown {
  name: string
  icon: string
  value: number
  percentage: number
}

export interface DailyTrend {
  day: number
  date: string
  amount: number
}

export interface MonthlyStats {
  totalSpending: number
  dailyAverage: number
  previousMonthTotal: number
  vsPreviousMonth: number | null // null 表示上月无数据可对比
  categoryBreakdown: CategoryBreakdown[]
  dailyTrend: DailyTrend[]
  dayCount: number
  recordCount: number
}

// ============ 分类图标映射 ============

const CATEGORY_ICONS: Record<string, string> = {
  '餐饮': '🍜',
  '交通': '🚗',
  '购物': '🛍️',
  '居住': '🏠',
  '娱乐': '🎮',
  '教育': '📚',
  '医疗': '🏥',
  '社交人情': '🎁',
  '金融': '💰',
  '其他': '📦'
}

// ============ 核心统计函数 ============

/**
 * 计算指定月份的统计数据
 * @param records 所有记账记录
 * @param year 年份
 * @param month 月份（1-12）
 */
export function getMonthlyStats(records: ExpenseRecord[], year: number, month: number): MonthlyStats {
  // 格式化年月前缀，用于匹配
  const ymPrefix = `${year}-${String(month).padStart(2, '0')}`

  // 筛选当月记录
  const monthRecords = records.filter(r => r.date.startsWith(ymPrefix))
  const recordCount = monthRecords.length

  // 计算当月总支出
  const totalSpending = monthRecords.reduce((sum, r) => sum + r.amount, 0)

  // 计算有支出的天数
  const daysWithRecords = new Set(monthRecords.map(r => r.date)).size
  const dailyAverage = daysWithRecords > 0 ? totalSpending / daysWithRecords : 0

  // 计算上月数据
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const prevYmPrefix = `${prevYear}-${String(prevMonth).padStart(2, '0')}`
  const prevMonthRecords = records.filter(r => r.date.startsWith(prevYmPrefix))
  const previousMonthTotal = prevMonthRecords.reduce((sum, r) => sum + r.amount, 0)

  // 计算环比变化
  let vsPreviousMonth: number | null = null
  if (previousMonthTotal > 0) {
    vsPreviousMonth = ((totalSpending - previousMonthTotal) / previousMonthTotal) * 100
  } else if (totalSpending > 0) {
    // 上月无支出，本月有支出 → 显示 +100%
    vsPreviousMonth = 100
  }
  // 如果两者都为 0，vsPreviousMonth 保持 null

  // 按分类汇总
  const catMap: Record<string, number> = {}
  for (const r of monthRecords) {
    catMap[r.category] = (catMap[r.category] || 0) + r.amount
  }

  const categoryBreakdown: CategoryBreakdown[] = Object.entries(catMap)
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({
      name,
      icon: CATEGORY_ICONS[name] || '📦',
      value,
      percentage: totalSpending > 0 ? Math.round((value / totalSpending) * 100) : 0
    }))
    // 按金额从大到小排序
    .sort((a, b) => b.value - a.value)

  // 生成每日趋势（当月 1 号到月底，零填充）
  const daysInMonth = new Date(year, month, 0).getDate()
  const dailyMap: Record<string, number> = {}
  for (const r of monthRecords) {
    dailyMap[r.date] = (dailyMap[r.date] || 0) + r.amount
  }

  const dailyTrend: DailyTrend[] = []
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${ymPrefix}-${String(day).padStart(2, '0')}`
    dailyTrend.push({
      day,
      date: dateStr,
      amount: dailyMap[dateStr] || 0
    })
  }

  return {
    totalSpending,
    dailyAverage,
    previousMonthTotal,
    vsPreviousMonth,
    categoryBreakdown,
    dailyTrend,
    dayCount: daysWithRecords,
    recordCount
  }
}

// ============ 格式化工具 ============

/**
 * 格式化金额，显示为 ¥1,234.56
 */
export function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}
