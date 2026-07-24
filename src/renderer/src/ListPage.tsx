import React from 'react'
import { CATEGORIES, COLORS } from './categories'
import type { Record } from './categories'

// ============ 组件接收的 props ============
interface ListPageProps {
  records: Record[]
  filteredRecords: Record[]
  groupedRecords: Record<string, Record[]>
  isFilterActive: boolean
  filterCategory: string
  filterDateFrom: string
  filterDateTo: string
  filterKeyword: string
  onFilterCategoryChange: (val: string) => void
  onFilterDateFromChange: (val: string) => void
  onFilterDateToChange: (val: string) => void
  onFilterKeywordChange: (val: string) => void
  onClearFilters: () => void
  onEdit: (record: Record) => void
  onDelete: (id: string) => void
  onExportCSV: () => void
  onExportJSON: () => void
}

function ListPage({
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
      {/* 筛选栏 */}
      {records.length > 0 && (
        <div style={styles.filterBar}>
          <div style={styles.filterRow}>
            <button
              className="filter-btn"
              style={!filterCategory ? styles.filterCatBtnActive : styles.filterCatBtn}
              onClick={() => onFilterCategoryChange('')}
            >
              全部
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat.name}
                className="filter-btn"
                style={filterCategory === cat.name ? styles.filterCatBtnActive : styles.filterCatBtn}
                onClick={() => onFilterCategoryChange(cat.name)}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
          <div style={styles.filterRow}>
            <input
              className="filter-date"
              style={styles.filterDateInput}
              type="date"
              value={filterDateFrom}
              onChange={e => onFilterDateFromChange(e.target.value)}
            />
            <span style={{ color: '#ccc' }}>~</span>
            <input
              className="filter-date"
              style={styles.filterDateInput}
              type="date"
              value={filterDateTo}
              onChange={e => onFilterDateToChange(e.target.value)}
            />
            <input
              className="filter-search"
              style={styles.filterSearchInput}
              type="text"
              placeholder="🔍 搜索备注、分类…"
              value={filterKeyword}
              onChange={e => onFilterKeywordChange(e.target.value)}
            />
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
          <div style={styles.filterRow}>
            <button className="export-btn" style={styles.exportBtn} onClick={onExportCSV}>
              📤 导出 Excel
            </button>
            <button className="export-btn" style={styles.exportBtn} onClick={onExportJSON}>
              📤 导出 JSON
            </button>
          </div>
        </div>
      )}

      {/* 空状态 */}
      {filteredRecords.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={{ fontSize: 48, margin: 0 }}>{isFilterActive ? '🔍' : '📭'}</p>
          <p>{isFilterActive ? '没有找到匹配的记录，试试调整筛选条件' : '还没有记账记录，去记一笔吧！'}</p>
        </div>
      ) : (
        <>
          {/* 记录数 */}
          <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 8, paddingLeft: 4 }}>
            共 {filteredRecords.length} 条记录
          </div>

          {/* 按日期分组 */}
          {Object.entries(groupedRecords).map(([dateGroup, items]) => (
            <div key={dateGroup} style={styles.dateGroup}>
              <div style={styles.dateHeader}>{dateGroup}</div>
              {items.map(record => (
                <div key={record.id} className="record-row" style={styles.recordRow}>
                  <div style={styles.recordLeft}>
                    <span style={styles.recordCategory}>{record.category} · {record.subCategory}</span>
                    {record.note && <span style={styles.recordNote}>{record.note}</span>}
                  </div>
                  <div style={styles.recordRight}>
                    <span style={styles.recordAmount}>-¥{record.amount.toFixed(2)}</span>
                    <button className="action-btn" style={styles.actionBtn} onClick={() => onEdit(record)} title="编辑">✏️</button>
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
const styles: Record<string, React.CSSProperties> = {
  container: {
    background: COLORS.white,
    borderRadius: 12,
    padding: 16,
    boxShadow: COLORS.shadow
  },
  filterBar: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: `1px solid ${COLORS.borderLight}`
  },
  filterRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 6,
    alignItems: 'center',
    marginBottom: 8
  },
  filterCatBtn: {
    padding: '4px 10px',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 14,
    background: '#fafafa',
    cursor: 'pointer',
    fontSize: 12
  },
  filterCatBtnActive: {
    padding: '4px 10px',
    border: `1px solid ${COLORS.primary}`,
    borderRadius: 14,
    background: COLORS.primaryBg,
    color: COLORS.primary,
    cursor: 'pointer',
    fontSize: 12
  },
  filterDateInput: {
    padding: '6px 10px',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 6,
    fontSize: 13,
    outline: 'none',
    width: 130
  },
  filterSearchInput: {
    padding: '6px 10px',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 6,
    fontSize: 13,
    outline: 'none',
    width: 160
  },
  filterClearBtn: {
    padding: '5px 12px',
    border: '1px solid #ddd',
    borderRadius: 6,
    background: COLORS.white,
    cursor: 'pointer',
    fontSize: 12,
    color: COLORS.textLight
  },
  exportBtn: {
    padding: '5px 14px',
    border: `1px solid ${COLORS.accent}`,
    borderRadius: 6,
    background: COLORS.accentBg,
    cursor: 'pointer',
    fontSize: 12,
    color: COLORS.accentDark
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '60px 0',
    color: COLORS.textLight
  },
  dateGroup: {
    marginBottom: 16
  },
  dateHeader: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 8,
    paddingLeft: 4
  },
  recordRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: `1px solid ${COLORS.borderLight}`
  },
  recordLeft: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2
  },
  recordCategory: {
    fontSize: 15,
    color: COLORS.textPrimary
  },
  recordNote: {
    fontSize: 12,
    color: COLORS.textLight
  },
  recordRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  recordAmount: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: 600
  },
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
