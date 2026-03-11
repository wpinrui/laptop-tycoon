import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("saveAPI", {
  listSlots: (): Promise<string[]> => ipcRenderer.invoke("save:listSlots"),
  readFile: (slotId: string, filename: string): Promise<string | null> =>
    ipcRenderer.invoke("save:readFile", slotId, filename),
  writeFile: (slotId: string, filename: string, data: string): Promise<boolean> =>
    ipcRenderer.invoke("save:writeFile", slotId, filename, data),
  deleteSlot: (slotId: string): Promise<boolean> =>
    ipcRenderer.invoke("save:deleteSlot", slotId),
  deleteFile: (slotId: string, filename: string): Promise<boolean> =>
    ipcRenderer.invoke("save:deleteFile", slotId, filename),
  listFiles: (slotId: string): Promise<string[]> =>
    ipcRenderer.invoke("save:listFiles", slotId),
});
