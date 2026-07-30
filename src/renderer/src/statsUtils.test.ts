import { describe, it, expect } from 'vitest'
import { formatCurrency, getMonthlyStats } from './statsUtils'
import type { ExpenseRecord } from './categories'

// ============ formatCurrency 测试 ============

describe('formatCurrency', () => {
  it('将整数格式化为带两位小数的金额', () => {
    expect(formatCurrency(100)).toBe('¥100.00')
  })

  it('将带小数的金额格式化为两位小数', () => {
    expect(formatCurrency(99.5)).toBe('¥99.50')
  })

  it('对 0 格式化', () => {
    expect(formatCurrency(0)).toBe('¥0.00')
  })

  it('对大数添加千分位分隔符', () => {
    expect(formatCurrency(1234567.89)).toBe('¥1,234,567.89')
  })

  it('对负数格式化', () => {
    expect(formatCurrency(-50)).toBe('¥-50.00')
  })
})

// ============ getMonthlyStats 测试 ============

describe('getMonthlyStats', () => {
  // 测试用的假数据
  const mockRecords: ExpenseRecord[] = [
    { id: '1', amount: 100, category: '餐饮', subCategory: '午餐', date: '2026-07-01', note: '午饭' },
    { id: '2', amount: 200, category: '餐饮', subCategory: '晚餐', date: '2026-07-02', note: '晚饭' },
    { id: '3', amount: 500, category: '交通', subCategory: '打车', date: '2026-07-03', note: '出差打车' },
    { id: '4', amount: 1000, category: '购物', subCategory: '衣服', date: '2026-07-15', note: '买衣服' },
    // 下个月的记录（不应被统计进去）
    { id: '5', amount: 999, category: '其他', subCategory: '杂项', date: '2026-08-01', note: '下个月的' },
  ]

  it('统计指定月份的总支出', () => {
    const stats = getMonthlyStats(mockRecords, 2026, 7)
    expect(stats.totalSpending).toBe(1800) // 100 + 200 + 500 + 1000
  })

  it('统计当月记录条数', () => {
    const stats = getMonthlyStats(mockRecords, 2026, 7)
    expect(stats.recordCount).toBe(4)
  })

  it('统计有支出的天数', () => {
    const stats = getMonthlyStats(mockRecords, 2026, 7)
    expect(stats.dayCount).toBe(4) // 7月1日、2日、3日、15日
  })

  it('计算日均支出', () => {
    const stats = getMonthlyStats(mockRecords, 2026, 7)
    expect(stats.dailyAverage).toBe(450) // 1800 / 4天
  })

  it('生成分类占比数据，按金额从大到小排序', () => {
    const stats = getMonthlyStats(mockRecords, 2026, 7)
    expect(stats.categoryBreakdown.length).toBe(3)
    expect(stats.categoryBreakdown[0].name).toBe('购物')  // 1000 最大
    expect(stats.categoryBreakdown[1].name).toBe('交通')  // 500 第二
    expect(stats.categoryBreakdown[2].name).toBe('餐饮')  // 300 第三
    // 排序应该是：购物(1000) > 交通(500) > 餐饮(300)
    expect(stats.categoryBreakdown[0].value).toBe(1000)
    expect(stats.categoryBreakdown[1].value).toBe(500)
    expect(stats.categoryBreakdown[2].value).toBe(300)
  })

  it('计算分类占百分比', () => {
    const stats = getMonthlyStats(mockRecords, 2026, 7)
    expect(stats.categoryBreakdown[0].percentage).toBe(56) // 购物 1000/1800 ≈ 56%
    expect(stats.categoryBreakdown[1].percentage).toBe(28) // 交通 500/1800 ≈ 28%
    expect(stats.categoryBreakdown[2].percentage).toBe(17) // 餐饮 300/1800 ≈ 17%
  })

  it('不把其他月份的数据算进来', () => {
    const stats = getMonthlyStats(mockRecords, 2026, 8)
    expect(stats.totalSpending).toBe(999)
    expect(stats.recordCount).toBe(1)
  })

  it('当月无记录时返回零值', () => {
    const stats = getMonthlyStats(mockRecords, 2026, 6)
    expect(stats.totalSpending).toBe(0)
    expect(stats.recordCount).toBe(0)
    expect(stats.dayCount).toBe(0)
    expect(stats.dailyAverage).toBe(0)
  })

  it('计算环比变化（本月 vs 上月）', () => {
    const stats = getMonthlyStats(mockRecords, 2026, 7)
    // 上月（2026年6月）无数据
    expect(stats.vsPreviousMonth).toBe(100) // 上月为0，本月有数据 → +100%
  })

  it('生成每日趋势（当月每天一条，含零填充）', () => {
    const stats = getMonthlyStats(mockRecords, 2026, 7)
    expect(stats.dailyTrend.length).toBe(31) // 7月有31天
    expect(stats.dailyTrend[0].amount).toBe(100)  // 7月1日
    expect(stats.dailyTrend[14].amount).toBe(1000) // 7月15日
    expect(stats.dailyTrend[3].amount).toBe(0)     // 7月4日无记录
  })
})
