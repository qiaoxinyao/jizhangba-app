export {}

interface Api {
  getRecords: () => Promise<any[]>
  addRecord: (record: any) => Promise<any[]>
  deleteRecord: (id: string) => Promise<any[]>
  updateRecord: (record: any) => Promise<any[]>
  exportData: (format: string) => Promise<{ success: boolean; reason?: string; path?: string; fallback?: boolean }>
}

declare global {
  interface Window {
    api: Api
  }
}
