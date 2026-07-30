import React from 'react'
import { COLORS } from './categories'
import type { ExpenseRecord, CategoryDef } from './categories'

/**
 * 这个组件需要的所有"外部数据"和"操作函数"。
 * 可以理解为：父组件（App.tsx）把记账页需要的东西都通过这里传进来。
 * 好比插件板的插孔——父组件插什么，这里就有什么。
 */
interface AddPageProps {
  /** 所有消费分类列表（如：餐饮、交通、购物……） */
  categories: CategoryDef[]
  /** 用户输入的金额（字符串形式，因为输入框里显示的就是文字） */
  amount: string
  /** 用户选中的一级分类名字（如"餐饮"） */
  selectedCategory: string
  /** 用户选中的二级分类名字（如"午餐"） */
  selectedSubCategory: string
  /** 消费日期（格式：YYYY-MM-DD） */
  date: string
  /** 用户填写的备注文字 */
  note: string
  /** 如果正在修改某条记录，这里存的是那条记录的 ID；否则是 null */
  editingId: string | null
  /** 当金额输入框内容变化时，通知父组件 */
  onAmountChange: (val: string) => void
  /** 当用户换了一个一级分类时，通知父组件 */
  onCategoryChange: (catName: string) => void
  /** 当用户换了一个二级分类时，通知父组件 */
  onSubCategoryChange: (sub: string) => void
  /** 当日期变了时，通知父组件 */
  onDateChange: (val: string) => void
  /** 当备注文字变了时，通知父组件 */
  onNoteChange: (val: string) => void
  /** 用户点"保存"按钮时，让父组件去处理存数据的事 */
  onSave: () => void
}

/**
 * 这是"记一笔"页面（添加消费记录的地方）。
 * 整个页面就是一个大表单：金额、日期、分类、子类、备注，然后点保存。
 * 如果用电脑上的类比，就像你在 Excel 里填一行数据一样。
 */
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
  // 根据用户选中的一级分类名字，找到那个分类的完整信息（包括它的所有子类）
  const currentCategory = categories.find(c => c.name === selectedCategory) || categories[0]

  return (
    <div style={styles.container}>
      {/* ===== 金额输入区 ===== */}
      {/* 这里是一个大大的金额输入框，¥ 符号左边显示，数字在大框里填 */}
      <div style={styles.amountRow}>
        {/* "¥" 符号，提示用户这里填的是人民币金额 */}
        <span style={styles.amountPrefix}>¥</span>
        <input
          style={styles.amountInput}
          type="number"
          step="0.01"
          placeholder="0.00"
          value={amount}
          // 禁止鼠标滚轮调整金额（防误触），滚轮时直接让输入框失去焦点
          onWheel={e => { e.currentTarget.blur() }}
          // 用户打字时，把输入的内容告诉父组件
          onChange={e => onAmountChange(e.target.value)}
          // 页面一打开，光标自动落在金额框里，不用鼠标点就能直接输
          autoFocus
        />
      </div>

      {/* ===== 日期选择 ===== */}
      {/* 用户在这里选择这笔消费发生在哪一天（默认是今天） */}
      <div style={styles.fieldRow}>
        <label style={styles.fieldLabel}>日期</label>
        <input
          style={styles.fieldInput}
          type="date"
          value={date}
          // 用户改了日期，通知父组件更新
          onChange={e => onDateChange(e.target.value)}
        />
      </div>

      {/* ===== 一级分类选择（大类） ===== */}
      {/* 比如"餐饮""交通""购物"等大分类，点哪个就选中哪个 */}
      <div style={styles.fieldRow}>
        <label style={styles.fieldLabel}>分类</label>
        <div style={styles.categoryGroup}>
          {categories.map(cat => (
            <button
              key={cat.id}
              className="cat-btn" // 这个 class 用于全局样式（如果加了的话）
              // 如果这个分类是当前选中的，就用高亮样式，否则用普通样式
              style={selectedCategory === cat.name ? styles.categoryBtnActive : styles.categoryBtn}
              // 用户点击分类时，告诉父组件："用户换成这个分类了"
              onClick={() => onCategoryChange(cat.name)}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* ===== 二级分类选择（子类） ===== */}
      {/* 选了一级分类后，这里会出现对应的子分类按钮，比如"餐饮"下有"午餐""晚餐"等 */}
      <div style={styles.fieldRow}>
        <label style={styles.fieldLabel}>子类</label>
        <div style={styles.subCategoryGroup}>
          {/* 只有先选了一级分类，这里才会有子类按钮显示 */}
          {currentCategory && currentCategory.children.map(sub => (
            <button
              key={sub}
              className="sub-btn"
              // 哪个子类被选中，哪个就高亮
              style={selectedSubCategory === sub ? styles.subCategoryBtnActive : styles.subCategoryBtn}
              // 点击子类时通知父组件用户的选择
              onClick={() => onSubCategoryChange(sub)}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {/* ===== 备注输入 ===== */}
      {/* 用户可写可不写，比如记一下"午餐"或"打车上班"，方便以后回忆 */}
      <div style={styles.fieldRow}>
        <label style={styles.fieldLabel}>备注</label>
        <input
          style={styles.fieldInput}
          type="text"
          placeholder='选填，如"午餐""打车上班"…'
          value={note}
          // 备注内容变了，告诉父组件保存最新的文字
          onChange={e => onNoteChange(e.target.value)}
        />
      </div>

      {/* ===== 保存按钮 ===== */}
      {/* 如果是新增记录，按钮显示"记一笔"；如果是修改已有的记录，显示"更新记录" */}
      <button className="save-btn" style={styles.saveBtn} onClick={onSave}>
        {editingId ? '✅ 更新记录' : '✅ 记一笔'}
      </button>
    </div>
  )
}

// ============ 页面样式 ============
// 下面这些定义了页面上每个元素长什么样：颜色、大小、间距、圆角等
// 每一个属性和 CSS（网页样式语言）里的写法基本一样
const styles: Record<string, React.CSSProperties> = {
  // 整个白色卡片区域的样式：白底、圆角、阴影，让页面看起来像一张"卡片"
  container: {
    background: COLORS.white,
    borderRadius: 12,
    padding: 24,
    boxShadow: COLORS.shadow
  },
  // 金额输入行：让 ¥ 符号和输入框水平居中排列
  amountRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24
  },
  // 金额前面的 ¥ 符号样式：大号、绿色、加粗
  amountPrefix: {
    fontSize: 32,
    color: COLORS.primary,
    fontWeight: 'bold'
  },
  // 金额输入框：大号数字、无边框（只有底部一条线）、文字居中
  amountInput: {
    fontSize: 48,
    border: 'none',
    borderBottom: '2px solid #eee',
    outline: 'none',
    width: 200,
    textAlign: 'center' as const,
    background: 'transparent'
  },
  // 每一行表单（日期/分类/子类/备注）的布局：上下结构，标签在上一行，输入在下一行
  fieldRow: {
    marginBottom: 20,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8
  },
  // 字段标签（"日期""分类""子类""备注"这些文字）的样式：灰色小字、加粗
  fieldLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: 600
  },
  // 输入框（日期、备注等）的统一样式：圆角、有边框
  fieldInput: {
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: 8,
    fontSize: 15,
    outline: 'none'
  },
  // 一级分类按钮组：按钮们横着排列，会自动换行
  categoryGroup: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 8
  },
  // 没选中的一级分类按钮：白底灰边框、圆角像药丸
  categoryBtn: {
    padding: '6px 14px',
    border: '1px solid #ddd',
    borderRadius: 20,
    background: COLORS.white,
    cursor: 'pointer',
    fontSize: 14
  },
  // 被选中（高亮）的一级分类按钮：绿色边框、绿底淡绿字
  categoryBtnActive: {
    padding: '6px 14px',
    border: `1px solid ${COLORS.primary}`,
    borderRadius: 20,
    background: COLORS.primaryBg,
    color: COLORS.primary,
    cursor: 'pointer',
    fontSize: 14
  },
  // 二级分类（子类）按钮组：同样横排可换行
  subCategoryGroup: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 8
  },
  // 没选中的二级分类按钮：小一点、浅灰底、方角
  subCategoryBtn: {
    padding: '6px 14px',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 6,
    background: '#fafafa',
    cursor: 'pointer',
    fontSize: 13
  },
  // 被选中的二级分类按钮：蓝色调高亮
  subCategoryBtnActive: {
    padding: '6px 14px',
    border: `1px solid ${COLORS.accent}`,
    borderRadius: 6,
    background: COLORS.accentBg,
    color: COLORS.accentDark,
    cursor: 'pointer',
    fontSize: 13
  },
  // "记一笔"保存按钮：绿色长条、白字、宽占满整行
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
