import React from 'react'
import { COLORS } from './categories'
import type { Record, CategoryDef } from './categories'

// ============ 组件接收的 props ============
interface AddPageProps {
  categories: CategoryDef[]
  amount: string
  selectedCategory: string
  selectedSubCategory: string
  date: string
  note: string
  editingId: string | null
  onAmountChange: (val: string) => void
  onCategoryChange: (catName: string) => void
  onSubCategoryChange: (sub: string) => void
  onDateChange: (val: string) => void
  onNoteChange: (val: string) => void
  onSave: () => void
}

function AddPage({
  categories,
  amount,
  selectedCategory,
  selectedSubCategory,
  date,
  note,
  editingId,
  onAmountChange,
  onCategoryChange,
  onSubCategoryChange,
  onDateChange,
  onNoteChange,
  onSave
}: AddPageProps) {
  const currentCategory = categories.find(c => c.name === selectedCategory) || categories[0]

  return (
    <div style={styles.container}>
      {/* 金额输入 */}
      <div style={styles.amountRow}>
        <span style={styles.amountPrefix}>¥</span>
        <input
          style={styles.amountInput}
          type="number"
          step="0.01"
          placeholder="0.00"
          value={amount}
          onChange={e => onAmountChange(e.target.value)}
          autoFocus
        />
      </div>

      {/* 日期 */}
      <div style={styles.fieldRow}>
        <label style={styles.fieldLabel}>日期</label>
        <input
          style={styles.fieldInput}
          type="date"
          value={date}
          onChange={e => onDateChange(e.target.value)}
        />
      </div>

      {/* 一级分类 */}
      <div style={styles.fieldRow}>
        <label style={styles.fieldLabel}>分类</label>
        <div style={styles.categoryGroup}>
          {categories.map(cat => (
            <button
              key={cat.id}
              className="cat-btn"
              style={selectedCategory === cat.name ? styles.categoryBtnActive : styles.categoryBtn}
              onClick={() => onCategoryChange(cat.name)}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* 二级分类 */}
      <div style={styles.fieldRow}>
        <label style={styles.fieldLabel}>子类</label>
        <div style={styles.subCategoryGroup}>
          {currentCategory && currentCategory.children.map(sub => (
            <button
              key={sub}
              className="sub-btn"
              style={selectedSubCategory === sub ? styles.subCategoryBtnActive : styles.subCategoryBtn}
              onClick={() => onSubCategoryChange(sub)}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {/* 备注 */}
      <div style={styles.fieldRow}>
        <label style={styles.fieldLabel}>备注</label>
        <input
          style={styles.fieldInput}
          type="text"
          placeholder='选填，如"午餐""打车上班"…'
          value={note}
          onChange={e => onNoteChange(e.target.value)}
        />
      </div>

      {/* 保存按钮 */}
      <button className="save-btn" style={styles.saveBtn} onClick={onSave}>
        {editingId ? '✅ 更新记录' : '✅ 记一笔'}
      </button>
    </div>
  )
}

// ============ 样式 ============
const styles: Record<string, React.CSSProperties> = {
  container: {
    background: COLORS.white,
    borderRadius: 12,
    padding: 24,
    boxShadow: COLORS.shadow
  },
  amountRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24
  },
  amountPrefix: {
    fontSize: 32,
    color: COLORS.primary,
    fontWeight: 'bold'
  },
  amountInput: {
    fontSize: 48,
    border: 'none',
    borderBottom: '2px solid #eee',
    outline: 'none',
    width: 200,
    textAlign: 'center' as const,
    background: 'transparent'
  },
  fieldRow: {
    marginBottom: 20,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8
  },
  fieldLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: 600
  },
  fieldInput: {
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: 8,
    fontSize: 15,
    outline: 'none'
  },
  categoryGroup: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 8
  },
  categoryBtn: {
    padding: '6px 14px',
    border: '1px solid #ddd',
    borderRadius: 20,
    background: COLORS.white,
    cursor: 'pointer',
    fontSize: 14
  },
  categoryBtnActive: {
    padding: '6px 14px',
    border: `1px solid ${COLORS.primary}`,
    borderRadius: 20,
    background: COLORS.primaryBg,
    color: COLORS.primary,
    cursor: 'pointer',
    fontSize: 14
  },
  subCategoryGroup: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 8
  },
  subCategoryBtn: {
    padding: '6px 14px',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 6,
    background: '#fafafa',
    cursor: 'pointer',
    fontSize: 13
  },
  subCategoryBtnActive: {
    padding: '6px 14px',
    border: `1px solid ${COLORS.accent}`,
    borderRadius: 6,
    background: COLORS.accentBg,
    color: COLORS.accentDark,
    cursor: 'pointer',
    fontSize: 13
  },
  saveBtn: {
    width: '100%',
    padding: '14px',
    border: 'none',
    borderRadius: 10,
    background: COLORS.primary,
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 12
  }
}

export default AddPage
