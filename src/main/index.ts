import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { writeFileSync } from 'fs'
import Store from 'electron-store'

// ============ 本地类型定义（与渲染进程的 categories.ts 保持一致） ============
interface StoreRecord {
  id: string; amount: number; category: string
  subCategory: string; date: string; note: string
}
interface StoreCategory {
  id: string; name: string; icon: string
  isPreset: boolean; children: string[]
}

// ============ 通用 Store 工具 ============
// 抽取公共模式：读取 → 操作 → 写回 → 返回
// 避免每个 IPC handler 都重复 get/set 的逻辑

/** 从 store 读取一个数组，执行操作后写回并返回 */
function arrayStore<T>(key: string, fn: (items: T[]) => T[]): T[] {
  const items = store.get(key, []) as T[]
  const result = fn(items)
  store.set(key, result)
  return result
}

/** 从 store 读取数组后直接返回（只读操作） */
function getArray<T>(key: string): T[] {
  return store.get(key, []) as T[]
}

// ============ 数据存储 ============
// 使用 electron-store 在用户电脑本地保存数据（存为 JSON 文件，不会丢失）
const store = new Store({
  name: 'jizhangba-data', // 文件名：jizhangba-data.json
  // 定义数据结构：每条记录包含 id、金额、分类、子分类、日期、备注
  schema: {
    records: {
      type: 'array',
      default: [],
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          amount: { type: 'number' },
          category: { type: 'string' },
          subCategory: { type: 'string' },
          date: { type: 'string' },
          note: { type: 'string' }
        }
      }
    },
    categories: {
      type: 'array',
      default: [],
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          icon: { type: 'string' },
          isPreset: { type: 'boolean' },
          children: {
            type: 'array',
            items: { type: 'string' }
          }
        },
        required: ['id', 'name', 'icon', 'isPreset', 'children']
      }
    }
  }
})

// ============ IPC 通信（接收来自界面的请求） ============
// 下面这些是"通道"，渲染进程（界面）通过 window.api.xxx() 调用这里的方法

/** 获取所有记账记录 */
ipcMain.handle('store:getRecords', () => {
  return getArray<StoreRecord>('records')
})

/** 添加一条新记录，返回更新后的完整列表 */
ipcMain.handle('store:addRecord', (_event, record: StoreRecord) => {
  return arrayStore<StoreRecord>('records', items => {
    items.push(record)
    return items
  })
})

/** 删除指定 id 的记录，返回更新后的列表 */
ipcMain.handle('store:deleteRecord', (_event, id: string) => {
  return arrayStore<StoreRecord>('records', items =>
    items.filter(r => r.id !== id)
  )
})

/** 修改已有记录（先找到同 id 的记录再替换），返回更新后的列表 */
ipcMain.handle('store:updateRecord', (_event, updatedRecord: StoreRecord) => {
  return arrayStore<StoreRecord>('records', items => {
    const index = items.findIndex(r => r.id === updatedRecord.id)
    if (index !== -1) items[index] = updatedRecord
    return items
  })
})

// ============ 导出数据 ============

/** 弹出保存文件对话框，让用户选择保存位置和文件名 */
async function showExportDialog(win: BrowserWindow | null, format: 'json' | 'xls') {
  const ext = format === 'json' ? 'json' : 'xls'
  const filterName = format === 'json' ? 'JSON 文件' : 'Excel 文件'
  const defaultName = `记账叭_${new Date().toISOString().split('T')[0]}.${ext}`

  const dialogOpts = {
    title: '导出记账数据',
    defaultPath: defaultName,
    filters: [{ name: filterName, extensions: [ext] }]
  }

  return win
    ? dialog.showSaveDialog(win, dialogOpts)
    : dialog.showSaveDialog(dialogOpts)
}

/** 导出为 JSON 格式 */
function exportAsJson(records: StoreRecord[], filePath: string) {
  const data = JSON.stringify(records, null, 2)
  writeFileSync(filePath, data, 'utf-8')
}

/** 导出为 HTML/Excel 格式（保存为 .xls，Excel 打开自动适配列宽） */
function exportAsHtml(records: StoreRecord[], filePath: string) {
  const rows = records.map(r => {
    const date = r.date.replace(/-/g, '/')
    const note = (r.note || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return `    <tr>
      <td style="text-align:center">${date}</td>
      <td>${r.category}</td>
      <td>${r.subCategory}</td>
      <td style="text-align:right">${r.amount.toFixed(2)}</td>
      <td>${note}</td>
    </tr>`
  }).join('\n')

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>记账叭导出</title>
<style>
table { border-collapse: collapse; font-size: 13px; font-family: "Microsoft YaHei", sans-serif; }
th { background: #ff6b6b; color: #fff; padding: 8px 12px; text-align: center; border: 1px solid #ddd; }
td { padding: 6px 12px; border: 1px solid #ddd; }
tr:nth-child(even) { background: #fafafa; }
</style>
</head>
<body>
<table>
  <thead>
    <tr>
      <th>日期</th><th>分类</th><th>子类</th><th>金额</th><th>备注</th>
    </tr>
  </thead>
  <tbody>
${rows}
  </tbody>
</table>
</body>
</html>`
  writeFileSync(filePath, html, 'utf-8')
}

/** 导出数据：弹出"另存为"对话框，让用户选择保存位置，支持 JSON 和 Excel 两种格式 */
ipcMain.handle('store:exportData', async (event, format: 'json' | 'xls') => {
  try {
    const records = getArray<StoreRecord>('records')
    const win = BrowserWindow.fromWebContents(event.sender)
    const saveResult = await showExportDialog(win, format)

    if (saveResult.canceled || !saveResult.filePath) {
      return { success: false, reason: 'canceled' }
    }

    if (format === 'json') {
      exportAsJson(records, saveResult.filePath)
    } else {
      exportAsHtml(records, saveResult.filePath)
    }

    return { success: true, path: saveResult.filePath }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('导出失败:', message)
    return { success: false, reason: message }
  }
})

// ============ 分类管理 IPC ============

/** 获取所有自定义分类 */
ipcMain.handle('store:getUserCategories', () => {
  return getArray<StoreCategory>('categories')
})

/** 添加一个自定义分类，返回更新后的完整列表 */
ipcMain.handle('store:addUserCategory', (_event, category: StoreCategory) => {
  return arrayStore<StoreCategory>('categories', items => {
    items.push(category)
    return items
  })
})

/** 修改一个自定义分类，返回更新后的列表 */
ipcMain.handle('store:updateUserCategory', (_event, updatedCategory: StoreCategory) => {
  return arrayStore<StoreCategory>('categories', items => {
    const index = items.findIndex(c => c.id === updatedCategory.id)
    if (index !== -1) items[index] = updatedCategory
    return items
  })
})

/** 删除一个自定义分类，返回更新后的列表 */
ipcMain.handle('store:deleteUserCategory', (_event, id: string) => {
  return arrayStore<StoreCategory>('categories', items =>
    items.filter(c => c.id !== id)
  )
})

// ============ 窗口设置 ============

// 禁用 GPU 加速，避免部分 Windows 系统上 Electron 窗口崩溃或白屏
app.disableHardwareAcceleration()
app.commandLine.appendSwitch('no-sandbox')
app.commandLine.appendSwitch('disable-gpu')
app.commandLine.appendSwitch('use-gl', 'swiftshader')
app.commandLine.appendSwitch('disable-software-rasterizer')
app.commandLine.appendSwitch('ignore-gpu-blocklist')

/** 创建应用主窗口，加载记账叭界面 */
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 900,       // 默认宽度
    height: 680,      // 默认高度
    minWidth: 700,    // 最小宽度（防止窗口太小内容显示不全）
    minHeight: 500,   // 最小高度
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'), // 加载 preload 脚本（暴露 API 给界面）
      sandbox: false
    },
    title: '记账叭'
  })

  // 开发模式：连接 Vite 开发服务器；生产模式：加载打包后的 HTML 文件
  if (process.env.ELECTRON_RENDERER_URL) {
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// 当 Electron 准备好后，创建窗口
app.whenReady().then(() => {
  createWindow()

  // macOS 上点击 Dock 图标时，如果没有窗口则重新创建一个
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// 所有窗口关闭时退出应用（macOS 除外，macOS 一般保留菜单栏）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
