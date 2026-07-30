import React, { useState, useMemo } from 'react'
import {
  PieChart, Pie, Cell, Tooltip as PieTooltip, Legend, ResponsiveContainer
} from 'recharts'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as BarTooltip, ResponsiveContainer as BarResponsiveContainer
} from 'recharts'
import { getMonthlyStats, formatCurrency, MonthlyStats } from './statsUtils'
import type { ExpenseRecord } from './categories'

/**
 * 饼图配色 —— 每种分类一种颜色，让图表看起来一目了然
 * 比如"餐饮"是红色，"交通"是青色，看到颜色就知道是哪一类
 */
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

/**
 * StatsPage 组件接收的参数
 * records —— 用户记的所有账单记录，用来算统计数据
 */
interface StatsPageProps {
  records: ExpenseRecord[]
}

/** 统计页面 —— 用图表展示每月花了多少钱，花在了哪里 */
function StatsPage({ records }: StatsPageProps) {
  // 获取今天的日期，用来算"当前是哪年哪月"（避免用户翻到还没到的月份）
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1  // getMonth() 从 0 开始算，所以要加 1

  // 用户当前想看哪一年的账（点"◀ ▶"按钮会变）
  const [viewYear, setViewYear] = useState(currentYear)
  // 用户当前想看哪个月的账（点"◀ ▶"按钮会变）
  const [viewMonth, setViewMonth] = useState(currentMonth)

  /**
   * 自动计算选中月份的统计数据
   * 只有 records（账单记录）、viewYear、viewMonth 变了才会重新算
   * 这样用户翻月份时不用手动点"刷新"按钮
   */
  const stats = useMemo<MonthlyStats>(
    () => getMonthlyStats(records, viewYear, viewMonth),
    [records, viewYear, viewMonth]
  )

  /** 点击"◀"按钮，往前翻一个月（比如从 7 月翻到 6 月，跨年也自动处理） */
  const goPrevMonth = () => {
    if (viewMonth === 1) {
      // 如果是 1 月往前翻，就回到上一年的 12 月
      setViewMonth(12)
      setViewYear(viewYear - 1)
    } else {
      // 否则只是月份减 1
      setViewMonth(viewMonth - 1)
    }
  }

  /** 点击"▶"按钮，往后翻一个月（不能超过当前月，因为还没到的月份没有数据） */
  const goNextMonth = () => {
    // 如果已经翻到当前月了，就不再往后翻
    if (viewYear >= currentYear && viewMonth >= currentMonth) return
    if (viewMonth === 12) {
      // 如果是 12 月往后翻，就跳到下一年的 1 月
      setViewMonth(1)
      setViewYear(viewYear + 1)
    } else {
      // 否则只是月份加 1
      setViewMonth(viewMonth + 1)
    }
  }

  /** 判断"▶"按钮能不能点 —— 还没到当前月就能点，已经到最后一个月了就变灰 */
  const canGoNext = viewYear < currentYear || (viewYear === currentYear && viewMonth < currentMonth)

  // 看看这个月有没有记账记录，没有的话就显示"空状态"提示
  const hasData = stats.recordCount > 0

  return (
    <div style={styles.container}>
      {/* 月份选择栏 —— 点 ◀ ▶ 按钮切换查看的月份 */}
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

      {/* 汇总卡片 —— 三张卡片并排显示：总花了多少、平均每天花多少、跟上月比涨了还是跌了 */}
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
            // 涨了显示红色，跌了显示绿色，没有数据显示灰色
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

      {/* 如果这个月没有记账记录，就显示"空状态"小图标+提示文字，不展示图表 */}
      {!hasData ? (
        <div style={styles.emptyState}>
          <p style={{ fontSize: 48, margin: 0 }}>📊</p>
          <p>该月暂无记账记录</p>
        </div>
      ) : (
        <>
          {/* 分类饼图 —— 用不同颜色的扇形展示"吃饭花了多少""交通花了多少"……一目了然 */}
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
                    {/* 在扇形旁边显示：图标 + 分类名 + 占比百分比 */}
                    {stats.categoryBreakdown.map((entry) => (
                      <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || '#636e72'} />
                    ))}
                  </Pie>
                  {/* 鼠标悬停在扇形上时，显示该分类花了多少钱 */}
                  <PieTooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ textAlign: 'center', color: '#999' }}>暂无分类数据</p>
            )}
          </div>

          {/* 每日趋势柱状图 —— 一根柱子代表一天，柱子越高花得越多，一眼看出哪天花得最多 */}
          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>每日支出趋势</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 12, fill: '#999' }}
                  // 如果天数太多（比如全月 31 天），就隔几个显示一个日期，避免标签挤在一起
                  interval={Math.max(0, Math.floor(stats.dailyTrend.length / 15))}
                  tickFormatter={(day: number) => `${day}日`}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#999' }}
                  tickFormatter={(val: number) => `¥${val}`}
                />
                {/* 鼠标悬停在柱子上时，显示"X年X月X日 花了多少钱" */}
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

/** 页面样式 —— 控制统计页面的文字大小、颜色、间距、卡片圆角等外观 */
const styles: Record<string, React.CSSProperties> = {
  // 整个统计页面的白色背景卡片，带圆角和阴影
  container: {
    background: '#fff',
    borderRadius: 12,
    padding: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
  },
  // 月份切换按钮那一行：让 ◀ 按钮、月份文字、▶ 按钮排成一行，居中显示
  monthSelector: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 24
  },
  // ◀ ▶ 箭头按钮的样式：浅灰色边框、白色背景、小圆角
  arrowBtn: {
    border: '1px solid #ddd',
    background: '#fff',
    borderRadius: 8,
    padding: '6px 12px',
    cursor: 'pointer',
    fontSize: 14,
    lineHeight: 1
  },
  // 中间显示的"2026年7月"这种月份文字：大号、加粗、深灰色
  monthLabel: {
    fontSize: 18,
    fontWeight: 600,
    color: '#333',
    minWidth: 120,
    textAlign: 'center' as const
  },
  // 三张汇总卡片（总支出、日均支出、较上月）排成一行
  cardsRow: {
    display: 'flex',
    gap: 12,
    marginBottom: 24
  },
  // 每张汇总卡片：浅灰背景、圆角、居中显示文字
  card: {
    flex: 1,
    background: '#fafafa',
    borderRadius: 10,
    padding: '14px 12px',
    textAlign: 'center' as const,
    border: '1px solid #f0f0f0'
  },
  // 卡片顶部的标签文字（如"总支出""日均支出"）：小号、灰色
  cardLabel: {
    fontSize: 13,
    color: '#999',
    marginBottom: 6
  },
  // 卡片中的金额数字：大号、加粗、深灰色
  cardValue: {
    fontSize: 22,
    fontWeight: 700,
    color: '#333',
    marginBottom: 4
  },
  // 卡片底部的小字说明（如"5 天有支出""比上月增多"）：更小号、浅灰色
  cardSub: {
    fontSize: 12,
    color: '#bbb'
  },
  // 每个图表的容器：上下留空白，上面有一条浅色分割线
  chartCard: {
    marginBottom: 20,
    padding: '16px 0',
    borderTop: '1px solid #f0f0f0'
  },
  // 图表标题（如"分类支出占比""每日支出趋势"）：16号字、加粗
  chartTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#333',
    margin: '0 0 16px 0',
    paddingLeft: 4
  },
  // "没有数据"时的空白页提示：居中、大间距、灰色文字
  emptyState: {
    textAlign: 'center' as const,
    padding: '80px 0',
    color: '#999'
  }
}

export default StatsPage
