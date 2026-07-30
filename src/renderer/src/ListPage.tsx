import React from 'react'
import { COLORS } from './categories'
import type { ExpenseRecord, CategoryDef } from './categories'

/**
 * 这条记录的页面上半部分——筛选条件、记录列表、导出按钮，都在这里
 * 大白话：这个组件把"历史记录"页面拼出来，用户可以看到自己记过的每一笔账，
 * 还能按分类/日期/关键词筛选，也可以导出成 Excel 或 JSON 文件
 */

// ============ 组件接收的 props ============
/**
 * 这个页面需要的"材料清单"——父组件（App）把数据和回调函数传进来，
 * 这个页面只负责展示和触发操作，不自己存数据
 */
interface ListPageProps {
  categories: CategoryDef[]                // 所有支出分类的列表（如餐饮、交通……）
  records: ExpenseRecord[]                 // 全部记账记录（还没筛选过的）
  filteredRecords: ExpenseRecord[]         // 经过筛选后剩下的记录（显示在页面上的）
  groupedRecords: Record<string, ExpenseRecord[]>  // 按日期分好组的记录（页面按天显示）
  isFilterActive: boolean                  // 当前有没有在用筛选功能（true=正在筛选）
  filterCategory: string                   // 筛选栏里选中的分类名称（空字符串=全部）
  filterDateFrom: string                   // 筛选栏里的起始日期
  filterDateTo: string                     // 筛选栏里的结束日期
  filterKeyword: string                    // 筛选栏里的搜索关键词
  onFilterCategoryChange: (val: string) => void   // 用户切换分类筛选时触发
  onFilterDateFromChange: (val: string) => void   // 用户改了起始日期时触发
  onFilterDateToChange: (val: string) => void     // 用户改了结束日期时触发
  onFilterKeywordChange: (val: string) => void    // 用户输入搜索关键词时触发
  onClearFilters: () => void                      // 用户点了"清除筛选"时触发
  onEdit: (record: ExpenseRecord) => void         // 用户点了某条记录的编辑按钮时触发
  onDelete: (id: string) => void                  // 用户点了某条记录的删除按钮时触发
  onExportCSV: () => void                         // 用户点了"导出 Excel"时触发
  onExportJSON: () => void                        // 用户点了"导出 JSON"时触发
}

/**
 * 历史记录页面的主体
 *
 * 它从父组件拿到数据（记录列表、筛选条件），然后画到屏幕上。
 * 用户在这里可以筛选、查看、编辑、删除记录，或者把数据导出为文件。
 */
function ListPage({
  categories,
  records,
  filteredRecords,
  groupedRecords,
  isFilterActive,
  filterCategory,
  filterDateFrom,
  filterDateTo,
  filterKeyword,
  onFilterCategoryChange,
  onFilterDateFromChange,
  onFilterDateToChange,
  onFilterKeywordChange,
  onClearFilters,
  onEdit,
  onDelete,
  onExportCSV,
  onExportJSON
}: ListPageProps) {
  return (
    <div style={styles.container}>
      {/* ====== 筛选栏区域 ====== */}
      {/*
        只要有记账记录（哪怕一条），就显示筛选栏。
        一条都没有时隐藏筛选栏，只显示"还没有记账记录"。
       */}
      {records.length > 0 && (
        <div style={styles.filterBar}>
          {/* ---- 第一行：分类筛选按钮 ---- */}
          <div style={styles.filterRow}>
            {/*
              "全部"按钮：点了就显示所有分类的记录。
              如果当前没有选中任何分类（filterCategory 是空字符串），按钮就会高亮。
             */}
            <button
              className="filter-btn"
              style={!filterCategory ? styles.filterCatBtnActive : styles.filterCatBtn}
              onClick={() => onFilterCategoryChange('')}
            >
              全部
            </button>
            {/*
              遍历所有支出分类，每个分类生成一个按钮。
              用户点哪个分类，就只显示那个分类下的记录。
             */}
            {categories.map(cat => (
              <button
                key={cat.id}
                className="filter-btn"
                style={filterCategory === cat.name ? styles.filterCatBtnActive : styles.filterCatBtn}
                onClick={() => onFilterCategoryChange(cat.name)}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>

          {/* ---- 第二行：日期范围 + 关键词搜索 ---- */}
          <div style={styles.filterRow}>
            {/*
              起始日期输入框：用户选一个日期，只显示这一当天及之后的记录。
              type="date" 会让浏览器弹出日期选择器，非常方便。
             */}
            <input
              className="filter-date"
              style={styles.filterDateInput}
              type="date"
              value={filterDateFrom}
              onChange={e => onFilterDateFromChange(e.target.value)}
            />
            <span style={{ color: '#ccc' }}>~</span>
            {/*
              结束日期输入框：用户选一个日期，只显示这一当天及之前的记录。
              两个日期配合使用，就是"从某天到某天"的范围筛选。
             */}
            <input
              className="filter-date"
              style={styles.filterDateInput}
              type="date"
              value={filterDateTo}
              onChange={e => onFilterDateToChange(e.target.value)}
            />
            {/*
              搜索框：用户可以输入文字，按备注或分类名称查找记录。
              输入的内容会实时筛选，不用点搜索按钮。
             */}
            <input
              className="filter-search"
              style={styles.filterSearchInput}
              type="text"
              placeholder="🔍 搜索备注、分类…"
              value={filterKeyword}
              onChange={e => onFilterKeywordChange(e.target.value)}
            />
            {/*
              如果用户正在使用筛选（选了分类、日期或搜了关键词），
              就显示"清除筛选"按钮，点一下所有筛选条件恢复默认。
             */}
            {isFilterActive && (
              <button
                className="filter-btn"
                style={styles.filterClearBtn}
                onClick={onClearFilters}
              >
                清除筛选
              </button>
            )}
          </div>

          {/* ---- 第三行：导出按钮 ---- */}
          <div style={styles.filterRow}>
            {/*
              导出 Excel：所有记录（包括筛选后的结果）存成一个 .csv 文件，
              用户可以用 Excel 或 WPS 表格打开。
             */}
            <button className="export-btn" style={styles.exportBtn} onClick={onExportCSV}>
              📤 导出 Excel
            </button>
            {/*
              导出 JSON：存成一个 .json 文件，适合懂技术的用户备份或迁移数据。
             */}
            <button className="export-btn" style={styles.exportBtn} onClick={onExportJSON}>
              📤 导出 JSON
            </button>
          </div>
        </div>
      )}

      {/* ====== 主内容区域 ====== */}

      {/*
        如果筛选后一条记录都没有（或者本来就没有记录），显示空状态提示。
        两种情况：
        - 用户正在筛选但没有匹配的 → 显示"没有找到匹配的记录"
        - 一条记录都没记过 → 显示"还没有记账记录"
       */}
      {filteredRecords.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={{ fontSize: 48, margin: 0 }}>{isFilterActive ? '🔍' : '📭'}</p>
          <p>{isFilterActive ? '没有找到匹配的记录，试试调整筛选条件' : '还没有记账记录，去记一笔吧！'}</p>
        </div>
      ) : (
        <>
          {/*
            显示当前有多少条记录（是筛选后的数量，不是全部记录的数量）。
            如果用户正在筛选，这个数字会随筛选条件变化。
           */}
          <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 8, paddingLeft: 4 }}>
            共 {filteredRecords.length} 条记录
          </div>

          {/*
            按日期分组显示记录。
            groupedRecords 是一个对象，key 是日期字符串（如"2026-07-29"），
            value 是这一天的所有记账记录。
            循环遍历每一天，把同一天的记录放在一个卡片里。
           */}
          {Object.entries(groupedRecords).map(([dateGroup, items]) => (
            <div key={dateGroup} style={styles.dateGroup}>
              {/*
                日期分组标题，显示是哪一天的记录。
                例如："2026-07-29 星期一"
               */}
              <div style={styles.dateHeader}>{dateGroup}</div>
              {/*
                遍历当天的每一条记录，逐条渲染。
              */}
              {items.map(record => (
                <div key={record.id} className="record-row" style={styles.recordRow}>
                  {/*
                    左侧：分类名称 + 二级分类名称 + 备注文字
                    例如："餐饮 · 午餐" + "今天中午吃了沙拉"
                  */}
                  <div style={styles.recordLeft}>
                    <span style={styles.recordCategory}>{record.category} · {record.subCategory}</span>
                    {/*
                      如果用户记了备注，就显示在分类下面（灰色小字）。
                      没有备注就不显示，不占位置。
                    */}
                    {record.note && <span style={styles.recordNote}>{record.note}</span>}
                  </div>
                  {/*
                    右侧：金额 + 编辑按钮 + 删除按钮
                    金额前面加了负号，表示是支出。
                  */}
                  <div style={styles.recordRight}>
                    {/*
                      显示这条记录花了多少钱，保留两位小数。
                      例如："-¥15.50"
                    */}
                    <span style={styles.recordAmount}>-¥{record.amount.toFixed(2)}</span>
                    {/*
                      编辑按钮（铅笔图标）：点一下可以修改这条记录的内容。
                      鼠标悬停时会显示"编辑"提示。
                    */}
                    <button className="action-btn" style={styles.actionBtn} onClick={() => onEdit(record)} title="编辑">✏️</button>
                    {/*
                      删除按钮（垃圾桶图标）：点一下会删除这条记录（会再让用户确认）。
                      鼠标悬停时会显示"删除"提示。
                    */}
                    <button className="action-btn" style={styles.actionBtn} onClick={() => onDelete(record.id)} title="删除">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </>
      )}
    </div>
  )
}

// ============ 样式 ============
/**
 * 这个页面上所有元素的外观设置（大小、颜色、间距等）。
 * 用 React 的行内样式（style={...}）来定义，每个属性对应一个 CSS 规则。
 */
const styles: Record<string, React.CSSProperties> = {
  // 整个页面的外框：白色背景、圆角、带阴影
  container: {
    background: COLORS.white,
    borderRadius: 12,
    padding: 16,
    boxShadow: COLORS.shadow
  },
  // 筛选栏区域：底部加一条浅色分割线，和记录列表区分开
  filterBar: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: `1px solid ${COLORS.borderLight}`
  },
  // 每一行筛选条件：横向排列，自动换行，均匀间隔
  filterRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 6,
    alignItems: 'center',
    marginBottom: 8
  },
  // 分类按钮（未选中状态）：浅色边框、圆角胶囊形状
  filterCatBtn: {
    padding: '4px 10px',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 14,
    background: '#fafafa',
    cursor: 'pointer',
    fontSize: 12
  },
  // 分类按钮（选中状态）：主题色边框、浅色背景、文字变主题色
  filterCatBtnActive: {
    padding: '4px 10px',
    border: `1px solid ${COLORS.primary}`,
    borderRadius: 14,
    background: COLORS.primaryBg,
    color: COLORS.primary,
    cursor: 'pointer',
    fontSize: 12
  },
  // 日期输入框：浅色边框、小圆角
  filterDateInput: {
    padding: '6px 10px',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 6,
    fontSize: 13,
    outline: 'none',
    width: 130
  },
  // 关键词搜索框：跟日期框类似，但稍宽一点
  filterSearchInput: {
    padding: '6px 10px',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 6,
    fontSize: 13,
    outline: 'none',
    width: 160
  },
  // "清除筛选"按钮：浅色边框、文字颜色稍微淡一些
  filterClearBtn: {
    padding: '5px 12px',
    border: '1px solid #ddd',
    borderRadius: 6,
    background: COLORS.white,
    cursor: 'pointer',
    fontSize: 12,
    color: COLORS.textLight
  },
  // 导出按钮：使用"强调色"（accent），吸引用户注意
  exportBtn: {
    padding: '5px 14px',
    border: `1px solid ${COLORS.accent}`,
    borderRadius: 6,
    background: COLORS.accentBg,
    cursor: 'pointer',
    fontSize: 12,
    color: COLORS.accentDark
  },
  // 空状态提示：居中显示、大段空白，让用户一眼看到"没有数据"
  emptyState: {
    textAlign: 'center' as const,
    padding: '60px 0',
    color: COLORS.textLight
  },
  // 每一天的记录分组：每组之间留一点间距
  dateGroup: {
    marginBottom: 16
  },
  // 日期分组标题：浅色文字，稍微缩进
  dateHeader: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 8,
    paddingLeft: 4
  },
  // 单条记录的行：左右布局（左边分类备注，右边金额操作），底部有分割线
  recordRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: `1px solid ${COLORS.borderLight}`
  },
  // 记录的左侧：分类名在上、备注在下，竖直排列
  recordLeft: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2
  },
  // 分类名称：稍大字号、深色
  recordCategory: {
    fontSize: 15,
    color: COLORS.textPrimary
  },
  // 备注文字：稍小字号、浅灰色
  recordNote: {
    fontSize: 12,
    color: COLORS.textLight
  },
  // 记录的右侧：金额、编辑、删除，横向排开
  recordRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  // 金额数字：主题色、加粗、稍大，突出显示
  recordAmount: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: 600
  },
  // 操作按钮（编辑/删除）：无边框、半透明，鼠标悬停才变明显
  actionBtn: {
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: 14,
    padding: 4,
    opacity: 0.5
  }
}

export default ListPage
