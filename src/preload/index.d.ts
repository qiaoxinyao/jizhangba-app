export {}

interface Api {
  getRecords: () => Promise<any[]>
  addRecord: (record: any) => Promise<any[]>
  deleteRecord: (id: string) => Promise<any[]>
  updateRecord: (record: any) => Promise<any[]>
  exportData: (format: string) => Promise<{ success: boolean; reason?: string; path?: string; fallback?: boolean }>

  // 分类管理
  getUserCategories: () => Promise<any[]>
  addUserCategory: (category: any) => Promise<any[]>
  updateUserCategory: (category: any) => Promise<any[]>
  deleteUserCategory: (id: string) => Promise<any[]>
}

declare global {
  interface Window {
    api: Api
  }
}
