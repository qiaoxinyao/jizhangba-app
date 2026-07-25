import React from 'react'
import { useState, useEffect, useMemo, useRef } from 'react'
import StatsPage from './StatsPage'
import AddPage from './AddPage'
import ListPage from './ListPage'
import CategoryManager from './CategoryManager'
import { PRESET_CATEGORIES, COLORS, mergeCategories } from './categories'
import type { Record, CategoryDef } from './categories'

// ============ 工具函数 ============
function groupByDate(records: Record[]): Record<string, Record[]> {
  const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date))
  const groups: Record<string, Record[]> = {}
  for (const record of sorted) {
    if (!groups[record.date]) {
      groups[record.date] = []
    }
    groups[record.date].push(record)
  }
  return groups
}

// ============ 主界面组件 ============
function App() {
  // 页面状态
  const [page, setPage] = useState<'add' | 'list' | 'stats' | 'manage'>('add')
  const [records, setRecords] = useState<Record[]>([])

  // 表单状态
  const [editingId, setEditingId] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(PRESET_CATEGORIES[0].name)
  const [selectedSubCategory, setSelectedSubCategory] = useState(PRESET_CATEGORIES[0].children[0])
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [note, setNote] = useState('')

  // ===== Toast 通知 =====
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false })
  const toastTimerRef = useRef<ReturnType<typeof setTimeout>>(0)

  const showToast = (message: string) => {
    // 清除上一个定时器
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast({ message, visible: true })
    toastTimerRef.current = setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }))
    }, 2500)
  }

  // 筛选状态
  const [filterCategory, setFilterCategory] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [filterKeyword, setFilterKeyword] = useState('')

  // ===== 分类管理 =====
  const [userCategories, setUserCategories] = useState<CategoryDef[]>([])

  // 合并预置 + 自定义分类
  const allCategories = useMemo(
    () => mergeCategories(userCategories),
    [userCategories]
  )
  // 用 ref 保证事件处理函数永远拿到最新分类列表
  const allCategoriesRef = useRef(allCategories)
  allCategoriesRef.current = allCategories

  // 加载数据
  useEffect(() => {
    window.api.getRecords().then(setRecords)
    window.api.getUserCategories().then(setUserCategories)
  }, [])

  // 分类管理操作
  const handleAddCategory = async (cat: CategoryDef) => {
    const updated = await window.api.addUserCategory(cat)
    setUserCategories(updated)
    showToast('✅ 添加分类成功！')
  }

  const handleUpdateCategory = async (cat: CategoryDef) => {
    const updated = await window.api.updateUserCategory(cat)
    setUserCategories(updated)
    showToast('✅ 修改分类成功！')
  }

  const handleDeleteCategory = async (id: string) => {
    const updated = await window.api.deleteUserCategory(id)
    setUserCategories(updated)
    showToast('🗑️ 已删除该分类')
  }

  // 筛选计算
  const filteredRecords = records.filter(r => {
    if (filterCategory && r.category !== filterCategory) return false
    if (filterDateFrom && r.date < filterDateFrom) return false
    if (filterDateTo && r.date > filterDateTo) return false
    if (filterKeyword) {
      const kw = filterKeyword.toLowerCase()
      if (!r.note.toLowerCase().includes(kw) &&
          !r.category.toLowerCase().includes(kw) &&
          !r.subCategory.toLowerCase().includes(kw)) return false
    }
    return true
  })

  const isFilterActive = filterCategory || filterDateFrom || filterDateTo || filterKeyword
  const groupedRecords = groupByDate(filteredRecords)

  // 处理一级分类切换
  const handleCategoryChange = (catName: string) => {
    setSelectedCategory(catName)
    // 用 ref 确保拿到最新分类列表
    const cat = allCategoriesRef.current.find(c => c.name === catName)
    if (cat && cat.children.length > 0) {
      setSelectedSubCategory(cat.children[0])
    }
  }

  // 保存记录
  const handleSave = async () => {
    const numAmount = parseFloat(amount)
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      alert('请输入有效的金额')
      return
    }

    const recordData: Record = {
      id: editingId || Date.now().toString() + Math.random().toString(36).slice(2, 6),
      amount: numAmount,
      category: selectedCategory,
      subCategory: selectedSubCategory,
      date,
      note
    }

    try {
      const updated = editingId
        ? await window.api.updateRecord(recordData)
        : await window.api.addRecord(recordData)

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

  // 编辑记录
  const handleEdit = (record: Record) => {
    setEditingId(record.id)
    setAmount(String(record.amount))
    setSelectedCategory(record.category)
    setSelectedSubCategory(record.subCategory)
    setDate(record.date)
    setNote(record.note)
    setPage('add')
  }

  // 删除记录
  const handleDelete = async (id: string) => {
    const updated = await window.api.deleteRecord(id)
    setRecords(updated)
    showToast('🗑️ 已删除该记录')
  }

  // 导航按钮定义
  const navItems = [
    { key: 'add' as const,    label: '✏️ 记一笔' },
    { key: 'list' as const,   label: '📋 历史记录' },
    { key: 'stats' as const,  label: '📊 统计' },
    { key: 'manage' as const, label: '⚙️ 管理' },
  ]

  return (
    <div style={styles.container}>
      {/* 全局微动效样式 */}
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
      {/* 顶部导航 */}
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

      {/* Toast 通知条 — 不显示时直接移除 DOM */}
      {toast.visible && (
        <div style={styles.toast}>
          {toast.message}
        </div>
      )}

      {/* 主体内容 */}
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
