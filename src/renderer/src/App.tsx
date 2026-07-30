import React from 'react'
import { useState, useEffect, useMemo, useRef } from 'react'
import StatsPage from './StatsPage'
import AddPage from './AddPage'
import ListPage from './ListPage'
import CategoryManager from './CategoryManager'
import SnakeGame from './SnakeGame'
import { PRESET_CATEGORIES, COLORS, mergeCategories } from './categories'
import type { ExpenseRecord, CategoryDef } from './categories'

// ============ 工具函数 ============

/** 把记账记录按日期从新到旧分组（比如 2024-01-01 下面的所有记录放一起） */
function groupByDate(records: ExpenseRecord[]): Record<string, ExpenseRecord[]> {
  // 先按日期从新到旧排序（最新的在最上面）
  const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date))
  // 按日期分组：同一天的记录放在同一个数组里
  const groups: Record<string, ExpenseRecord[]> = {}
  for (const record of sorted) {
    if (!groups[record.date]) {
      groups[record.date] = []
    }
    groups[record.date].push(record)
  }
  return groups
}

// ============ 主界面组件 ============
/** 整个记账 App 的根组件，管理所有页面切换、数据状态和操作函数 */
function App() {
  // ===== 页面和记录状态 =====
  // 当前显示哪个页面（add=记一笔 / list=历史记录 / stats=统计 / manage=管理 / game=玩游戏）
  const [page, setPage] = useState<'add' | 'list' | 'stats' | 'manage' | 'game'>('add')
  // 从本地存储读取的所有记账记录
  const [records, setRecords] = useState<ExpenseRecord[]>([])

  // ===== 表单状态（用户正在填写的记账信息） =====
  const [editingId, setEditingId] = useState<string | null>(null) // 正在编辑哪条记录（null=新增，有值=修改）
  const [amount, setAmount] = useState('')           // 用户输入的金额
  const [selectedCategory, setSelectedCategory] = useState(PRESET_CATEGORIES[0].name)  // 选中的一级分类
  const [selectedSubCategory, setSelectedSubCategory] = useState(PRESET_CATEGORIES[0].children[0]) // 选中的二级分类
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]) // 今天的日期（格式：2024-01-01）
  const [note, setNote] = useState('')               // 备注内容

  // ===== Toast 通知（操作完成后顶部弹出的小提示条） =====
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false })
  const toastTimerRef = useRef<number>(0) // 定时器编号，用来在弹出新 toast 时关掉旧的

  /** 显示一条 toast 通知，2.5 秒后自动消失 */
  const showToast = (message: string) => {
    // 如果上一次的 toast 还没消失，先把它关掉
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current)
    }
    setToast({ message, visible: true })
    // 设置定时器，2.5 秒后把 toast 隐藏掉
    toastTimerRef.current = window.setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }))
    }, 2500)
  }

  // ===== 筛选状态（在历史记录页面筛选记录用的） =====
  const [filterCategory, setFilterCategory] = useState('')   // 按分类筛选
  const [filterDateFrom, setFilterDateFrom] = useState('')   // 按开始日期筛选
  const [filterDateTo, setFilterDateTo] = useState('')       // 按结束日期筛选
  const [filterKeyword, setFilterKeyword] = useState('')     // 按关键词搜索

  // ===== 分类管理 =====
  // 用户自定义的分类（和系统预置的分类合并后一起用）
  const [userCategories, setUserCategories] = useState<CategoryDef[]>([])

  // 把系统预置分类和用户自定义分类合并成一个完整的分类列表
  const allCategories = useMemo(
    () => mergeCategories(userCategories),
    [userCategories]
  )
  // 用 ref 来存分类列表，这样事件处理函数里永远能拿到最新的分类（不会因为闭包而拿到旧的）
  const allCategoriesRef = useRef(allCategories)
  allCategoriesRef.current = allCategories

  // ===== 加载数据（App 启动时从本地存储读取记录和分类） =====
  useEffect(() => {
    window.api.getRecords().then(setRecords)
    window.api.getUserCategories().then(setUserCategories)
  }, [])

  // ===== 分类管理操作（增删改） =====
  /** 添加一个新的自定义分类 */
  const handleAddCategory = async (cat: CategoryDef) => {
    const updated = await window.api.addUserCategory(cat)
    setUserCategories(updated)
    showToast('✅ 添加分类成功！')
  }

  /** 修改一个已有的自定义分类 */
  const handleUpdateCategory = async (cat: CategoryDef) => {
    const updated = await window.api.updateUserCategory(cat)
    setUserCategories(updated)
    showToast('✅ 修改分类成功！')
  }

  /** 删除一个自定义分类 */
  const handleDeleteCategory = async (id: string) => {
    const updated = await window.api.deleteUserCategory(id)
    setUserCategories(updated)
    showToast('🗑️ 已删除该分类')
  }

  // ===== 筛选计算 =====
  // 根据用户选择的条件（分类、日期范围、关键词）从所有记录中筛选出要显示的记录
  const filteredRecords = records.filter(r => {
    if (filterCategory && r.category !== filterCategory) return false   // 分类不匹配 → 排除
    if (filterDateFrom && r.date < filterDateFrom) return false          // 早于开始日期 → 排除
    if (filterDateTo && r.date > filterDateTo) return false              // 晚于结束日期 → 排除
    if (filterKeyword) {
      const kw = filterKeyword.toLowerCase()
      // 在备注、分类名、子分类名里搜索关键词（不区分大小写）
      if (!r.note.toLowerCase().includes(kw) &&
          !r.category.toLowerCase().includes(kw) &&
          !r.subCategory.toLowerCase().includes(kw)) return false
    }
    return true
  })

  // 当前是否有任何筛选条件被激活（用于在界面上高亮筛选按钮）
  const isFilterActive = !!(filterCategory || filterDateFrom || filterDateTo || filterKeyword)
  // 按日期分组，用于在历史记录页面按天展示
  const groupedRecords = groupByDate(filteredRecords)

  // ===== 一级分类切换 =====
  /** 当用户选择了新的大分类时，自动把二级分类切换为该分类的第一个 */
  const handleCategoryChange = (catName: string) => {
    setSelectedCategory(catName)
    // 从最新的分类列表中找到对应的大分类，选中它的第一个子分类
    const cat = allCategoriesRef.current.find(c => c.name === catName)
    if (cat && cat.children.length > 0) {
      setSelectedSubCategory(cat.children[0])
    }
  }

  // ===== 保存记录 =====
  /** 把用户填的金额、分类、日期、备注保存到本地存储 */
  const handleSave = async () => {
    // 检查金额是否有效
    const numAmount = parseFloat(amount)
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      alert('请输入有效的金额')
      return
    }

    // 组装要保存的数据
    const recordData: ExpenseRecord = {
      id: editingId || Date.now().toString() + Math.random().toString(36).slice(2, 6), // 编辑时用原 id，新增时生成唯一 id
      amount: numAmount,
      category: selectedCategory,
      subCategory: selectedSubCategory,
      date,
      note
    }

    try {
      // 调用主进程的 API：编辑就更新，新增就添加
      const updated = editingId
        ? await window.api.updateRecord(recordData)
        : await window.api.addRecord(recordData)

      // 更新本地记录列表，并重置表单
      setRecords(updated)
      setEditingId(null)
      setAmount('')
      setNote('')
      showToast(editingId ? '✅ 修改成功！' : '✅ 记一笔成功！')
    } catch (err) {
      console.error('保存失败:', err)
      alert('保存出错，请按 F12 查看控制台错误信息')
    }
  }

  // ===== 编辑记录 =====
  /** 把选中的记录加载到表单里，切换到记一笔页面让用户修改 */
  const handleEdit = (record: ExpenseRecord) => {
    setEditingId(record.id)            // 标记正在编辑的记录 id
    setAmount(String(record.amount))   // 填充金额
    setSelectedCategory(record.category)   // 填充一级分类
    setSelectedSubCategory(record.subCategory) // 填充二级分类
    setDate(record.date)               // 填充日期
    setNote(record.note)               // 填充备注
    setPage('add')                     // 跳转到记一笔页面
  }

  // ===== 删除记录 =====
  /** 删除指定 id 的记账记录 */
  const handleDelete = async (id: string) => {
    const updated = await window.api.deleteRecord(id)
    setRecords(updated)
    showToast('🗑️ 已删除该记录')
  }

  // ===== 导航按钮 =====
  // 顶部导航栏的 5 个按钮，点击后切换到对应页面
  const navItems = [
    { key: 'add' as const,    label: '✏️ 记一笔' },
    { key: 'list' as const,   label: '📋 历史记录' },
    { key: 'stats' as const,  label: '📊 统计' },
    { key: 'manage' as const, label: '⚙️ 管理' },
    { key: 'game' as const,   label: '🎮 玩游戏' },
  ]

  return (
    <div style={styles.container}>
      {/* 全局微动效样式：按钮悬停变色、点击缩放、页面淡入、Toast 弹出/消失动画 */}
      <style>{`
        .nav-btn { transition: all 0.2s ease; }
        .nav-btn:hover { border-color: #ff6b6b; background: #fff5f5; }
        .nav-btn-active { transition: all 0.2s ease; }
        .save-btn { transition: all 0.15s ease; }
        .save-btn:hover { filter: brightness(0.9); }
        .save-btn:active { transform: scale(0.98); }
        .cat-btn, .sub-btn { transition: all 0.15s ease; }
        .cat-btn:hover { background: #fafafa; }
        .sub-btn:hover { background: #f5f5f5; }
        .record-row { transition: background 0.15s ease; }
        .record-row:hover { background: #fafafa; }
        .filter-btn, .filter-date, .filter-search { transition: all 0.15s ease; }
        .filter-date:focus, .filter-search:focus { border-color: #ff6b6b !important; box-shadow: 0 0 0 2px rgba(255,107,107,0.15); }
        .action-btn { transition: opacity 0.15s ease; }
        .action-btn:hover { opacity: 1 !important; }
        .export-btn { transition: all 0.15s ease; }
        .export-btn:hover { background: #e0f7f5; }
        .nav-title { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(-20px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        @keyframes toastOut { from { opacity: 1; transform: translateX(-50%) translateY(0); } to { opacity: 0; transform: translateX(-50%) translateY(-20px); } }
      `}</style>
      {/* 顶部导航：App 标题 + 5 个页面切换按钮 */}
      <header style={styles.header}>
        <h1 style={styles.title} className="nav-title">记账叭</h1>
        <div style={styles.nav}>
          {navItems.map(item => (
            <button
              key={item.key}
              className={page === item.key ? 'nav-btn-active' : 'nav-btn'}
              style={page === item.key ? styles.navBtnActive : styles.navBtn}
              onClick={() => setPage(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {/* Toast 通知条：操作完成后在屏幕顶部弹出的提示（如"✅ 记一笔成功！"），不显示时整个移除不占位 */}
      {toast.visible && (
        <div style={styles.toast}>
          {toast.message}
        </div>
      )}

      {/* 主体内容：根据当前选中的页面显示对应的组件 */}
      {page === 'add' ? (
        <AddPage
          categories={allCategories}
          amount={amount}
          selectedCategory={selectedCategory}
          selectedSubCategory={selectedSubCategory}
          date={date}
          note={note}
          editingId={editingId}
          onAmountChange={setAmount}
          onCategoryChange={handleCategoryChange}
          onSubCategoryChange={setSelectedSubCategory}
          onDateChange={setDate}
          onNoteChange={setNote}
          onSave={handleSave}
        />
      ) : page === 'list' ? (
        <ListPage
          categories={allCategories}
          records={records}
          filteredRecords={filteredRecords}
          groupedRecords={groupedRecords}
          isFilterActive={isFilterActive}
          filterCategory={filterCategory}
          filterDateFrom={filterDateFrom}
          filterDateTo={filterDateTo}
          filterKeyword={filterKeyword}
          onFilterCategoryChange={setFilterCategory}
          onFilterDateFromChange={setFilterDateFrom}
          onFilterDateToChange={setFilterDateTo}
          onFilterKeywordChange={setFilterKeyword}
          onClearFilters={() => {
            setFilterCategory('')
            setFilterDateFrom('')
            setFilterDateTo('')
            setFilterKeyword('')
          }}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onExportCSV={async () => {
            try {
              const result = await window.api.exportData('xls')
              if (result.success) {
                alert(`✅ 已导出：${result.path}`)
              } else if (result.reason !== 'canceled') {
                alert(`❌ 导出失败：${result.reason}`)
              }
            } catch (err) {
              console.error('导出 CSV 失败:', err)
              alert('❌ 导出失败，请查看控制台了解详情')
            }
          }}
          onExportJSON={async () => {
            try {
              const result = await window.api.exportData('json')
              if (result.success) {
                alert(`✅ 已导出：${result.path}`)
              } else if (result.reason !== 'canceled') {
                alert(`❌ 导出失败：${result.reason}`)
              }
            } catch (err) {
              console.error('导出 JSON 失败:', err)
              alert('❌ 导出失败，请查看控制台了解详情')
            }
          }}
        />
      ) : page === 'stats' ? (
        <StatsPage records={records} />
      ) : page === 'game' ? (
        <SnakeGame />
      ) : (
        <CategoryManager
          userCategories={userCategories}
          onAddCategory={handleAddCategory}
          onUpdateCategory={handleUpdateCategory}
          onDeleteCategory={handleDeleteCategory}
        />
      )}
    </div>
  )
}

// ============ 样式（只保留公共样式）============
const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: '-apple-system, "Microsoft YaHei", "PingFang SC", sans-serif',
    maxWidth: 700,
    margin: '0 auto',
    padding: '20px',
    minHeight: '100vh',
    backgroundColor: COLORS.bg
  },
  header: {
    textAlign: 'center',
    marginBottom: 24
  },
  title: {
    fontSize: 28,
    color: COLORS.textPrimary,
    margin: '0 0 16px 0'
  },
  nav: {
    display: 'flex',
    gap: 12,
    justifyContent: 'center'
  },
  navBtn: {
    padding: '8px 24px',
    border: '2px solid #ddd',
    borderRadius: 8,
    background: COLORS.white,
    cursor: 'pointer',
    fontSize: 16
  },
  navBtnActive: {
    padding: '8px 24px',
    border: `2px solid ${COLORS.primary}`,
    borderRadius: 8,
    background: COLORS.primary,
    color: COLORS.white,
    cursor: 'pointer',
    fontSize: 16
  },
  toast: {
    position: 'fixed' as const,
    top: 20,
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '10px 28px',
    background: '#333',
    color: '#fff',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
    zIndex: 9999,
    whiteSpace: 'nowrap' as const,
    animation: 'toastIn 0.25s ease'
  }
}

export default App
