import React, { useState } from 'react'
import { PRESET_CATEGORIES, COLORS } from './categories'
import type { CategoryDef } from './categories'

// ============ 常用 Emoji 图标供选择 ============
const EMOJI_OPTIONS = [
  '🍜', '🚗', '🛍️', '🏠', '🎮', '📚', '🏥', '🎁', '💰', '📦',
  '🐱', '🐶', '🌸', '🌿', '🎵', '🎬', '📷', '✈️', '🏖️', '⛰️',
  '🍕', '🍺', '☕', '🎂', '👕', '👟', '💄', '🖥️', '📱', '🔧',
  '🏋️', '🎯', '🎨', '📝', '🔬', '🌱', '💡', '🔑', '🎪', '🎲'
]

// ============ 组件接收的 props ============
interface CategoryManagerProps {
  userCategories: CategoryDef[]
  onAddCategory: (cat: CategoryDef) => void
  onUpdateCategory: (cat: CategoryDef) => void
  onDeleteCategory: (id: string) => void
}

function CategoryManager({ userCategories, onAddCategory, onUpdateCategory, onDeleteCategory }: CategoryManagerProps) {
  // 表单弹窗状态
  const [showForm, setShowForm] = useState(false)
  const [editingCat, setEditingCat] = useState<CategoryDef | null>(null)

  // 表单字段
  const [formName, setFormName] = useState('')
  const [formIcon, setFormIcon] = useState('📦')
  const [formChildren, setFormChildren] = useState<string[]>([''])
  const [newChildInput, setNewChildInput] = useState('')

  // 打开添加弹窗
  const openAddForm = () => {
    setEditingCat(null)
    setFormName('')
    setFormIcon('📦')
    setFormChildren([''])
    setNewChildInput('')
    setShowForm(true)
  }

  // 打开编辑弹窗
  const openEditForm = (cat: CategoryDef) => {
    setEditingCat(cat)
    setFormName(cat.name)
    setFormIcon(cat.icon)
    setFormChildren([...cat.children])
    setNewChildInput('')
    setShowForm(true)
  }

  // 关闭弹窗
  const closeForm = () => {
    setShowForm(false)
    setEditingCat(null)
  }

  // 添加子类到列表
  const addChildToList = () => {
    const trimmed = newChildInput.trim()
    if (trimmed && !formChildren.includes(trimmed)) {
      setFormChildren([...formChildren, trimmed])
    }
    setNewChildInput('')
    // 操作完后让输入框继续保持聚焦
    setTimeout(() => {
      const input = document.querySelector('.child-input') as HTMLInputElement
      if (input) input.focus()
    }, 0)
  }

  // 移除子类
  const removeChild = (index: number) => {
    setFormChildren(formChildren.filter((_, i) => i !== index))
  }

  // 保存分类
  const handleSave = () => {
    if (!formName.trim()) {
      alert('请输入分类名称')
      return
    }
    const validChildren = formChildren.filter(c => c.trim())
    if (validChildren.length === 0) {
      alert('请至少添加一个子类')
      return
    }

    if (editingCat) {
      // 编辑已有分类
      onUpdateCategory({
        ...editingCat,
        name: formName.trim(),
        icon: formIcon.trim() || '📦',
        children: validChildren
      })
    } else {
      // 新增分类
      const newCat: CategoryDef = {
        id: 'user_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name: formName.trim(),
        icon: formIcon.trim() || '📦',
        isPreset: false,
        children: validChildren
      }
      onAddCategory(newCat)
    }
    closeForm()
  }

  // 确认删除
  const confirmDelete = (cat: CategoryDef) => {
    const msg = `确定要删除分类「${cat.icon} ${cat.name}」吗？\n\n已有记账记录仍会保留此分类名称，但新建记录将无法选择此分类。`
    if (window.confirm(msg)) {
      onDeleteCategory(cat.id)
    }
  }

  return (
    <div style={styles.container}>
      {/* ===== 系统预置分类 ===== */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>📋 系统预设分类（不可修改）</h3>
        <div style={styles.categoryList}>
          {PRESET_CATEGORIES.map(cat => (
            <div key={cat.id} style={styles.categoryRow}>
              <div style={styles.categoryInfo}>
                <span style={styles.categoryIcon}>{cat.icon}</span>
                <span style={styles.categoryName}>{cat.name}</span>
                <span style={styles.categoryChildren}>
                  {cat.children.join(' / ')}
                </span>
              </div>
              <span style={styles.presetTag}>系统预设</span>
            </div>
          ))}
        </div>
      </section>

      {/* ===== 用户自定义分类 ===== */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>📋 我的自定义分类</h3>
        {userCategories.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={{ color: COLORS.textLight }}>还没有自定义分类，点击下方按钮添加</p>
          </div>
        ) : (
          <div style={styles.categoryList}>
            {userCategories.map(cat => (
              <div key={cat.id} style={styles.categoryRow}>
                <div style={styles.categoryInfo}>
                  <span style={styles.categoryIcon}>{cat.icon}</span>
                  <span style={styles.categoryName}>{cat.name}</span>
                  <span style={styles.categoryChildren}>
                    {cat.children.join(' / ')}
                  </span>
                </div>
                <div style={styles.categoryActions}>
                  <span style={styles.userTag}>自定义</span>
                  <button style={styles.actionBtn} onClick={() => openEditForm(cat)} title="编辑">✏️</button>
                  <button style={styles.actionBtn} onClick={() => confirmDelete(cat)} title="删除">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 添加按钮 */}
      <div style={styles.addBtnRow}>
        <button style={styles.addBtn} onClick={openAddForm}>＋ 添加新分类</button>
      </div>

      {/* ===== 添加/编辑弹窗 ===== */}
      {showForm && (
        <div style={styles.overlay}>
          {/* 点击灰色背景关闭 */}
          <div style={styles.backdrop} onClick={closeForm} />
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>
              {editingCat ? '✏️ 编辑分类' : '➕ 添加新分类'}
            </h3>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>分类名称</label>
              <input
                style={styles.formInput}
                type="text"
                placeholder="如：宠物、书籍..."
                value={formName}
                onChange={e => setFormName(e.target.value)}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>图标 — 点击选择</label>
              <div style={styles.emojiGrid}>
                {EMOJI_OPTIONS.map(emoji => (
                  <button
                    key={emoji}
                    style={{
                      ...styles.emojiOption,
                      ...(formIcon === emoji ? styles.emojiOptionActive : {})
                    }}
                    onClick={() => setFormIcon(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <div style={styles.iconPreview}>
                已选：<span style={{ fontSize: 28 }}>{formIcon || '📦'}</span>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>子类</label>
              <div style={styles.addChildRow}>
                <input
                  className="child-input"
                  style={styles.flexInput}
                  type="text"
                  placeholder="新增子类..."
                  value={newChildInput}
                  onChange={e => setNewChildInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addChildToList() }}
                />
                <button style={styles.addChildBtn} onClick={addChildToList}>＋ 添加</button>
              </div>
              <div style={styles.childList}>
                {formChildren.map((child, i) => (
                  <div key={i} style={styles.childItem}>
                    <span>🏷️ {child || '(空)'}</span>
                    <button
                      style={styles.removeChildBtn}
                      onClick={() => removeChild(i)}
                      title="移除"
                    >✕</button>
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.modalActions}>
              <button style={styles.cancelBtn} onClick={closeForm}>取消</button>
              <button style={styles.saveBtn} onClick={handleSave}>
                {editingCat ? '✅ 保存修改' : '✅ 添加分类'}
              </button>
            </div>
          </div>
        </div>
      )}
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
  section: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: COLORS.textPrimary,
    margin: '0 0 12px 0',
    paddingBottom: 8,
    borderBottom: `1px solid ${COLORS.borderLight}`
  },
  categoryList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8
  },
  categoryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    borderRadius: 8,
    background: '#fafafa',
    border: `1px solid ${COLORS.borderLight}`
  },
  categoryInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0
  },
  categoryIcon: {
    fontSize: 20,
    flexShrink: 0
  },
  categoryName: {
    fontSize: 15,
    fontWeight: 600,
    color: COLORS.textPrimary,
    whiteSpace: 'nowrap' as const
  },
  categoryChildren: {
    fontSize: 12,
    color: COLORS.textLight,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const
  },
  categoryActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0
  },
  presetTag: {
    fontSize: 11,
    padding: '2px 8px',
    borderRadius: 10,
    background: '#e8e8e8',
    color: '#999',
    fontWeight: 500,
    flexShrink: 0
  },
  userTag: {
    fontSize: 11,
    padding: '2px 8px',
    borderRadius: 10,
    background: '#e8f8f5',
    color: '#2a9d8f',
    fontWeight: 500,
    flexShrink: 0
  },
  actionBtn: {
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: 16,
    padding: 4,
    opacity: 0.6,
    transition: 'opacity 0.15s',
    lineHeight: 1
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '40px 0'
  },
  addBtnRow: {
    textAlign: 'center' as const,
    marginTop: 8
  },
  addBtn: {
    padding: '12px 32px',
    border: `2px dashed ${COLORS.primary}`,
    borderRadius: 10,
    background: COLORS.primaryBg,
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s'
  },
  // 弹窗
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    pointerEvents: 'none' as const
  },
  backdrop: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.4)',
    pointerEvents: 'auto' as const
  },
  modal: {
    position: 'relative' as const,
    background: COLORS.white,
    borderRadius: 14,
    padding: 28,
    width: 420,
    maxWidth: '90vw',
    maxHeight: '80vh',
    overflowY: 'auto' as const,
    boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
    zIndex: 1,
    pointerEvents: 'auto' as const
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 600,
    color: COLORS.textPrimary,
    margin: '0 0 20px 0'
  },
  formGroup: {
    marginBottom: 18
  },
  formLabel: {
    display: 'block',
    fontSize: 14,
    fontWeight: 600,
    color: COLORS.textSecondary,
    marginBottom: 6
  },
  formInput: {
    width: '100%',
    padding: '10px 12px',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    fontSize: 15,
    outline: 'none',
    boxSizing: 'border-box' as const
  },
  flexInput: {
    flex: 1,
    padding: '10px 12px',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    fontSize: 15,
    outline: 'none',
    boxSizing: 'border-box' as const
  },
  // Emoji 选择器
  emojiGrid: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 4,
    marginBottom: 10
  },
  emojiOption: {
    width: 36,
    height: 36,
    border: '2px solid transparent',
    borderRadius: 8,
    background: '#f5f5f5',
    cursor: 'pointer',
    fontSize: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.1s',
    padding: 0
  },
  emojiOptionActive: {
    border: `2px solid ${COLORS.primary}`,
    background: COLORS.primaryBg,
    transform: 'scale(1.15)'
  },
  iconPreview: {
    fontSize: 13,
    color: COLORS.textLight,
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  addChildRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 8
  },
  addChildBtn: {
    padding: '10px 16px',
    border: `1px solid ${COLORS.accent}`,
    borderRadius: 8,
    background: COLORS.accentBg,
    color: COLORS.accentDark,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    whiteSpace: 'nowrap' as const
  },
  childList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6
  },
  childItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 10px',
    background: '#f9f9f9',
    borderRadius: 6,
    fontSize: 14,
    color: COLORS.textPrimary
  },
  removeChildBtn: {
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    color: '#ccc',
    fontSize: 14,
    padding: '2px 6px'
  },
  modalActions: {
    display: 'flex',
    gap: 12,
    justifyContent: 'flex-end',
    marginTop: 24
  },
  cancelBtn: {
    padding: '10px 24px',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    background: COLORS.white,
    cursor: 'pointer',
    fontSize: 15,
    color: COLORS.textSecondary
  },
  saveBtn: {
    padding: '10px 24px',
    border: 'none',
    borderRadius: 8,
    background: COLORS.primary,
    color: COLORS.white,
    cursor: 'pointer',
    fontSize: 15,
    fontWeight: 600
  }
}

export default CategoryManager
