import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { writeFileSync } from 'fs'
import Store from 'electron-store'

// 初始化数据存储（存到用户的电脑本地文件里）
const store = new Store({
  name: 'jizhangba-data',
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

// 处理来自渲染进程（界面）的请求
ipcMain.handle('store:getRecords', () => {
  return store.get('records', [])
})

ipcMain.handle('store:addRecord', (_event, record) => {
  const records = store.get('records', []) as any[]
  records.push(record)
  store.set('records', records)
  return records
})

ipcMain.handle('store:deleteRecord', (_event, id: string) => {
  const records = store.get('records', []) as any[]
  const filtered = records.filter((r: any) => r.id !== id)
  store.set('records', filtered)
  return filtered
})

ipcMain.handle('store:updateRecord', (_event, updatedRecord: any) => {
  const records = store.get('records', []) as any[]
  const index = records.findIndex((r: any) => r.id === updatedRecord.id)
  if (index !== -1) {
    records[index] = updatedRecord
    store.set('records', records)
  }
  return records
})

ipcMain.handle('store:exportData', async (event, format: string) => {
  try {
    const records = store.get('records', []) as any[]

    const win = BrowserWindow.fromWebContents(event.sender)

    // 根据格式决定文件扩展名和保存对话框
    let ext: string, filterName: string, filterExt: string[], defaultName: string

    if (format === 'json') {
      ext = 'json'
      filterName = 'JSON 文件'
      filterExt = ['json']
    } else {
      ext = 'xls'
      filterName = 'Excel 文件'
      filterExt = ['xls']
    }
    defaultName = `记账叭_${new Date().toISOString().split('T')[0]}.${ext}`

    const saveResult = await (win
      ? dialog.showSaveDialog(win, {
          title: '导出记账数据',
          defaultPath: defaultName,
          filters: [{ name: filterName, extensions: filterExt }]
        })
      : dialog.showSaveDialog({
          title: '导出记账数据',
          defaultPath: defaultName,
          filters: [{ name: filterName, extensions: filterExt }]
        })
    )

    if (saveResult.canceled || !saveResult.filePath) {
      return { success: false, reason: 'canceled' }
    }

    if (format === 'json') {
      const data = JSON.stringify(records, null, 2)
      writeFileSync(saveResult.filePath, data, 'utf-8')
    } else {
      // 生成 HTML 表格（保存为 .xls，Excel 打开自动适配列宽）
      const rows = records.map((r: any) => {
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
      writeFileSync(saveResult.filePath, html, 'utf-8')
    }

    return { success: true, path: saveResult.filePath }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('导出失败:', message)
    return { success: false, reason: message }
  }
})

// ============ 分类管理 IPC ============
ipcMain.handle('store:getUserCategories', () => {
  return store.get('categories', [])
})

ipcMain.handle('store:addUserCategory', (_event, category) => {
  const categories = store.get('categories', []) as any[]
  categories.push(category)
  store.set('categories', categories)
  return categories
})

ipcMain.handle('store:updateUserCategory', (_event, updatedCategory) => {
  const categories = store.get('categories', []) as any[]
  const index = categories.findIndex((c: any) => c.id === updatedCategory.id)
  if (index !== -1) {
    categories[index] = updatedCategory
    store.set('categories', categories)
  }
  return categories
})

ipcMain.handle('store:deleteUserCategory', (_event, id: string) => {
  const categories = store.get('categories', []) as any[]
  const filtered = categories.filter((c: any) => c.id !== id)
  store.set('categories', filtered)
  return filtered
})

// 禁用 GPU 加速，避免部分 Windows 系统上崩溃
app.disableHardwareAcceleration()
app.commandLine.appendSwitch('no-sandbox')
app.commandLine.appendSwitch('disable-gpu')
app.commandLine.appendSwitch('use-gl', 'swiftshader')
app.commandLine.appendSwitch('disable-software-rasterizer')
app.commandLine.appendSwitch('ignore-gpu-blocklist')

// 创建应用窗口
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 680,
    minWidth: 700,
    minHeight: 500,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    },
    title: '记账叭'
  })

  // 开发模式加载本地服务，生产模式加载打包文件
  if (process.env.ELECTRON_RENDERER_URL) {
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
