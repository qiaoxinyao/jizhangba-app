import React, { useState, useMemo } from 'react'
import {
  PieChart, Pie, Cell, Tooltip as PieTooltip, Legend, ResponsiveContainer
} from 'recharts'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as BarTooltip, ResponsiveContainer as BarResponsiveContainer
} from 'recharts'
import { getMonthlyStats, formatCurrency, MonthlyStats } from './statsUtils'
import type { ExpenseRecord } from './categories'

// ============ 饼图配色（10 种分类各一种） ============
const CATEGORY_COLORS: Record<string, string> = {
  '餐饮': '#ff6b6b',
  '交通': '#4ecdc4',
  '购物': '#45b7d1',
  '居住': '#f9ca24',
  '娱乐': '#a29bfe',
  '教育': '#fd79a8',
  '医疗': '#00b894',
  '社交人情': '#e17055',
  '金融': '#6c5ce7',
  '其他': '#636e72'
}

// 组件接收 records 作为 prop
interface StatsPageProps {
  records: ExpenseRecord[]
}

function StatsPage({ records }: StatsPageProps) {
  // 当前日期（每次渲染都重新获取，避免跨月时出错）
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  const [viewYear, setViewYear] = useState(currentYear)
  const [viewMonth, setViewMonth] = useState(currentMonth)

  // 计算统计数据（只在 records 或年月变化时重新计算）
  const stats = useMemo<MonthlyStats>(
    () => getMonthlyStats(records, viewYear, viewMonth),
    [records, viewYear, viewMonth]
  )

  // 月份切换
  const goPrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  const goNextMonth = () => {
    // 不能超过当前月
    if (viewYear >= currentYear && viewMonth >= currentMonth) return
    if (viewMonth === 12) {
      setViewMonth(1)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  const canGoNext = viewYear < currentYear || (viewYear === currentYear && viewMonth < currentMonth)

  // 当月是否有数据
  const hasData = stats.recordCount > 0

  return (
    <div style={styles.container}>
      {/* 月份选择栏 */}
      <div style={styles.monthSelector}>
        <button style={styles.arrowBtn} onClick={goPrevMonth}>◀</button>
        <span style={styles.monthLabel}>{viewYear}年{viewMonth}月</span>
        <button
          style={{
            ...styles.arrowBtn,
            opacity: canGoNext ? 1 : 0.3,
            cursor: canGoNext ? 'pointer' : 'not-allowed'
          }}
          onClick={goNextMonth}
          disabled={!canGoNext}
        >
          ▶
        </button>
      </div>

      {/* 汇总卡片 */}
      <div style={styles.cardsRow}>
        <div style={styles.card}>
          <div style={styles.cardLabel}>总支出</div>
          <div style={styles.cardValue}>{formatCurrency(stats.totalSpending)}</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>日均支出</div>
          <div style={styles.cardValue}>{formatCurrency(stats.dailyAverage)}</div>
          <div style={styles.cardSub}>{stats.dayCount} 天有支出</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>较上月</div>
          <div style={{
            ...styles.cardValue,
            color: stats.vsPreviousMonth === null ? '#999'
              : stats.vsPreviousMonth > 0 ? '#ff6b6b'
              : stats.vsPreviousMonth < 0 ? '#4ecdc4'
              : '#999'
          }}>
            {stats.vsPreviousMonth === null ? '——' : `${stats.vsPreviousMonth > 0 ? '+' : ''}${stats.vsPreviousMonth.toFixed(1)}%`}
          </div>
          <div style={styles.cardSub}>
            {stats.vsPreviousMonth !== null
              ? (stats.vsPreviousMonth > 0 ? '↑ 比上月增多' : stats.vsPreviousMonth < 0 ? '↓ 比上月减少' : '与上月持平')
              : '上月无数据'
            }
          </div>
        </div>
      </div>

      {/* 空状态 */}
      {!hasData ? (
        <div style={styles.emptyState}>
          <p style={{ fontSize: 48, margin: 0 }}>📊</p>
          <p>该月暂无记账记录</p>
        </div>
      ) : (
        <>
          {/* 分类饼图 */}
          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>分类支出占比</h3>
            {stats.categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, icon, percentage }) => `${icon} ${name} ${percentage}%`}
                    labelLine={true}
                  >
                    {stats.categoryBreakdown.map((entry) => (
                      <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || '#636e72'} />
                    ))}
                  </Pie>
                  <PieTooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ textAlign: 'center', color: '#999' }}>暂无分类数据</p>
            )}
          </div>

          {/* 每日趋势柱状图 */}
          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>每日支出趋势</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 12, fill: '#999' }}
                  interval={Math.max(0, Math.floor(stats.dailyTrend.length / 15))}
                  tickFormatter={(day: number) => `${day}日`}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#999' }}
                  tickFormatter={(val: number) => `¥${val}`}
                />
                <BarTooltip
                  formatter={(value: number) => [formatCurrency(value), '支出']}
                  labelFormatter={(day: number) => `${viewYear}年${viewMonth}月${day}日`}
                />
                <Bar dataKey="amount" fill="#ff6b6b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}

// ============ 样式 ============
const styles: Record<string, React.CSSProperties> = {
  container: {
    background: '#fff',
    borderRadius: 12,
    padding: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
  },
  monthSelector: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 24
  },
  arrowBtn: {
    border: '1px solid #ddd',
    background: '#fff',
    borderRadius: 8,
    padding: '6px 12px',
    cursor: 'pointer',
    fontSize: 14,
    lineHeight: 1
  },
  monthLabel: {
    fontSize: 18,
    fontWeight: 600,
    color: '#333',
    minWidth: 120,
    textAlign: 'center' as const
  },
  cardsRow: {
    display: 'flex',
    gap: 12,
    marginBottom: 24
  },
  card: {
    flex: 1,
    background: '#fafafa',
    borderRadius: 10,
    padding: '14px 12px',
    textAlign: 'center' as const,
    border: '1px solid #f0f0f0'
  },
  cardLabel: {
    fontSize: 13,
    color: '#999',
    marginBottom: 6
  },
  cardValue: {
    fontSize: 22,
    fontWeight: 700,
    color: '#333',
    marginBottom: 4
  },
  cardSub: {
    fontSize: 12,
    color: '#bbb'
  },
  chartCard: {
    marginBottom: 20,
    padding: '16px 0',
    borderTop: '1px solid #f0f0f0'
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#333',
    margin: '0 0 16px 0',
    paddingLeft: 4
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '80px 0',
    color: '#999'
  }
}

export default StatsPage
