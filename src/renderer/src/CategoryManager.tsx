import React, { useState } from 'react'
import { PRESET_CATEGORIES, COLORS } from './categories'
import type { CategoryDef } from './categories'

// ============ 常用 Emoji 图标供选择 ============
/** 这里准备了一堆 Emoji 图案，让用户给分类选个喜欢的图标 */
const EMOJI_OPTIONS = [
  '🍜', '🚗', '🛍️', '🏠', '🎮', '📚', '🏥', '🎁', '💰', '📦',
  '🐱', '🐶', '🌸', '🌿', '🎵', '🎬', '📷', '✈️', '🏖️', '⛰️',
  '🍕', '🍺', '☕', '🎂', '👕', '👟', '💄', '🖥️', '📱', '🔧',
  '🏋️', '🎯', '🎨', '📝', '🔬', '🌱', '💡', '🔑', '🎪', '🎲'
]

// ============ 组件接收的 props ============
/** 这个分类管理页面，外面会传进来 4 个功能，分别是：查看已有分类、新增、修改、删除 */
interface CategoryManagerProps {
  /** 当前有哪些用户自定义的分类（数组） */
  userCategories: CategoryDef[]
  /** 新增一个分类时调用的方法 */
  onAddCategory: (cat: CategoryDef) => void
  /** 修改一个分类时调用的方法 */
  onUpdateCategory: (cat: CategoryDef) => void
  /** 删除一个分类时调用的方法 */
  onDeleteCategory: (id: string) => void
}

/** 分类管理页面 —— 可以在这里查看、新增、修改、删除自定义分类 */
function CategoryManager({ userCategories, onAddCategory, onUpdateCategory, onDeleteCategory }: CategoryManagerProps) {
  // ===== 下面这些是页面上的"状态"，你可以理解成"当前页面上正在变化的值" =====

  /** 弹窗是否显示（true=显示，false=隐藏） */
  const [showForm, setShowForm] = useState(false)
  /** 当前正在编辑哪个分类（null=没在编辑，也就是在新增模式） */
  const [editingCat, setEditingCat] = useState<CategoryDef | null>(null)

  /** 用户在弹窗里填的"分类名称" */
  const [formName, setFormName] = useState('')
  /** 用户选中的 Emoji 图标 */
  const [formIcon, setFormIcon] = useState('📦')
  /** 弹窗里"子类"列表（数组，一开始有一个空项） */
  const [formChildren, setFormChildren] = useState<string[]>([''])
  /** 用来新增子类的输入框当前文字 */
  const [newChildInput, setNewChildInput] = useState('')

  /** 点"添加新分类"按钮时调用 —— 把弹窗清空，然后打开弹窗让用户填写 */
  const openAddForm = () => {
    setEditingCat(null)    // 告诉页面"现在不是在编辑旧分类"
    setFormName('')        // 把分类名称清空
    setFormIcon('📦')      // 把图标重置为默认箱子
    setFormChildren([''])  // 子类列表只留一个空白输入
    setNewChildInput('')   // 新增子类的输入框也清空
    setShowForm(true)      // 打开弹窗
  }

  /** 点分类旁的"编辑"按钮时调用 —— 把要修改的分类填进弹窗里，然后打开弹窗 */
  const openEditForm = (cat: CategoryDef) => {
    setEditingCat(cat)                    // 记录正在编辑哪个分类
    setFormName(cat.name)                 // 把分类名称填进去
    setFormIcon(cat.icon)                 // 把图标填进去
    setFormChildren([...cat.children])    // 把已有的子类列表填进去
    setNewChildInput('')                  // 新增子类的输入框留空
    setShowForm(true)                     // 打开弹窗
  }

  /** 点"取消"或者点灰色背景时调用 —— 关闭弹窗，什么都不保存 */
  const closeForm = () => {
    setShowForm(false)   // 隐藏弹窗
    setEditingCat(null)  // 清除"正在编辑"的状态
  }

  /** 用户在输入框打字后按"添加"按钮 —— 把新的子类名加到列表里 */
  const addChildToList = () => {
    const trimmed = newChildInput.trim()     // 去掉输入内容前后的空格
    if (trimmed && !formChildren.includes(trimmed)) {  // 不能为空，也不能跟已有的重复
      setFormChildren([...formChildren, trimmed])      // 把新子类加到列表末尾
    }
    setNewChildInput('')  // 添加完之后，清空输入框方便继续输入
    // 操作完后让输入框继续保持聚焦（这样用户不用再点一下输入框就能继续打字）
    setTimeout(() => {
      const input = document.querySelector('.child-input') as HTMLInputElement
      if (input) input.focus()
    }, 0)
  }

  /** 点子类旁边的"✕"按钮 —— 把这一项从子类列表里移除 */
  const removeChild = (index: number) => {
    setFormChildren(formChildren.filter((_, i) => i !== index))  // 只保留不是这一项的子类
  }

  /** 点弹窗里的"保存/添加"按钮 —— 检查填得对不对，然后存起来 */
  const handleSave = () => {
    // 检查分类名称有没有填
    if (!formName.trim()) {
      alert('请输入分类名称')
      return      // ⚠️ 没填就停下来，不让保存
    }
    // 去掉子类列表中的空项
    const validChildren = formChildren.filter(c => c.trim())
    // 检查有没有至少一个子类
    if (validChildren.length === 0) {
      alert('请至少添加一个子类')
      return      // ⚠️ 没有子类就停下来，不让保存
    }

    /** 如果 editingCat 有值，说明当前是"编辑已有分类"模式 */
    if (editingCat) {
      // 把修改后的分类信息传出去
      onUpdateCategory({
        ...editingCat,
        name: formName.trim(),
        icon: formIcon.trim() || '📦',
        children: validChildren
      })
    } else {
      // 否则就是"新增分类"模式 —— 先生成一个唯一的 ID，再传出去
      const newCat: CategoryDef = {
        id: 'user_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name: formName.trim(),
        icon: formIcon.trim() || '📦',
        isPreset: false,        // 标记为"用户自建"，不是系统预设
        children: validChildren
      }
      onAddCategory(newCat)
    }
    closeForm()  // 保存完后关掉弹窗
  }

  /** 点分类旁的"删除"按钮 —— 先弹个确认框，用户点确定才真删除 */
  const confirmDelete = (cat: CategoryDef) => {
    const msg = `确定要删除分类「${cat.icon} ${cat.name}」吗？\n\n已有记账记录仍会保留此分类名称，但新建记录将无法选择此分类。`
    if (window.confirm(msg)) {   // 浏览器自带确认弹窗，用户点"确定"才继续
      onDeleteCategory(cat.id)
    }
  }

  return (
    <div style={styles.container}>
      {/* ==================== 上半部分：系统预设分类（只读） ==================== */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>📋 系统预设分类（不可修改）</h3>
        {/* 把预设好的 10 个分类一行一行显示出来 */}
        <div style={styles.categoryList}>
          {PRESET_CATEGORIES.map(cat => (
            <div key={cat.id} style={styles.categoryRow}>
              <div style={styles.categoryInfo}>
                <span style={styles.categoryIcon}>{cat.icon}</span>
                <span style={styles.categoryName}>{cat.name}</span>
                {/* 把子类用" / "连起来显示，比如"理发 / 化妆品 / 护肤品" */}
                <span style={styles.categoryChildren}>
                  {cat.children.join(' / ')}
                </span>
              </div>
              {/* 打一个"系统预设"的标签，表示这个动不了 */}
              <span style={styles.presetTag}>系统预设</span>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== 下半部分：用户自定义分类 ==================== */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>📋 我的自定义分类</h3>
        {userCategories.length === 0 ? (
          // 如果还没有自定义分类，就显示一段提示文字
          <div style={styles.emptyState}>
            <p style={{ color: COLORS.textLight }}>还没有自定义分类，点击下方按钮添加</p>
          </div>
        ) : (
          // 否则就把所有自定义分类列出来，每行后面带"编辑"和"删除"按钮
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

      {/* ==================== 底部"添加新分类"按钮 ==================== */}
      <div style={styles.addBtnRow}>
        <button style={styles.addBtn} onClick={openAddForm}>＋ 添加新分类</button>
      </div>

      {/* ==================== 弹窗（新增 / 编辑分类） ==================== */}
      {showForm && (
        <div style={styles.overlay}>
          {/* 灰色半透明背景 —— 点击它可以关闭弹窗（相当于"取消"） */}
          <div style={styles.backdrop} onClick={closeForm} />
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>
              {editingCat ? '✏️ 编辑分类' : '➕ 添加新分类'}
            </h3>

            {/* ----- 分类名称输入框 ----- */}
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

            {/* ----- Emoji 图标选择器 ----- */}
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>图标 — 点击选择</label>
              <div style={styles.emojiGrid}>
                {EMOJI_OPTIONS.map(emoji => (
                  <button
                    key={emoji}
                    style={{
                      ...styles.emojiOption,
                      // 当前选中的图标会高亮（加边框和背景色）
                      ...(formIcon === emoji ? styles.emojiOptionActive : {})
                    }}
                    onClick={() => setFormIcon(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              {/* 显示当前选中的图标效果 */}
              <div style={styles.iconPreview}>
                已选：<span style={{ fontSize: 28 }}>{formIcon || '📦'}</span>
              </div>
            </div>

            {/* ----- 子类管理 ----- */}
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
                {/* 把已经添加的子类一个一个显示出来，每个旁边有个删除按钮 */}
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

            {/* ----- 底部按钮：取消 / 保存 ----- */}
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
