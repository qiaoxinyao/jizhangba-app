import { contextBridge, ipcRenderer } from 'electron'

// 通过 contextBridge 安全地暴露 API 给渲染进程（界面代码）
const api = {
  // 获取所有记账记录
  getRecords: () => ipcRenderer.invoke('store:getRecords'),
  // 添加一条记录
  addRecord: (record: any) => ipcRenderer.invoke('store:addRecord', record),
  // 删除一条记录
  deleteRecord: (id: string) => ipcRenderer.invoke('store:deleteRecord', id),
  // 更新一条记录
  updateRecord: (record: any) => ipcRenderer.invoke('store:updateRecord', record),
  // 导出数据（xls = Excel 表格，json = 纯 JSON 文件）
  exportData: (format: 'xls' | 'json') => ipcRenderer.invoke('store:exportData', format),

  // ============ 分类管理 ============
  // 获取用户自定义分类
  getUserCategories: () => ipcRenderer.invoke('store:getUserCategories'),
  // 新增分类
  addUserCategory: (category: any) => ipcRenderer.invoke('store:addUserCategory', category),
  // 修改分类
  updateUserCategory: (category: any) => ipcRenderer.invoke('store:updateUserCategory', category),
  // 删除分类
  deleteUserCategory: (id: string) => ipcRenderer.invoke('store:deleteUserCategory', id)
}

contextBridge.exposeInMainWorld('api', api)
