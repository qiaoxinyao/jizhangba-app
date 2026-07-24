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
  // 导出数据
  exportData: (format: 'csv' | 'json') => ipcRenderer.invoke('store:exportData', format)
}

contextBridge.exposeInMainWorld('api', api)
