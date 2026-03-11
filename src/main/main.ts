import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import fs from "fs";

const savesDir = path.join(app.getPath("userData"), "saves");

function ensureSavesDir(): void {
  if (!fs.existsSync(savesDir)) {
    fs.mkdirSync(savesDir, { recursive: true });
  }
}

function sanitise(name: string): string {
  return name.replace(/[^a-zA-Z0-9_.-]/g, "");
}

function slotDir(slotId: string): string {
  return path.join(savesDir, sanitise(slotId));
}

function safeFilePath(slotId: string, filename: string): string {
  return path.join(slotDir(slotId), sanitise(filename));
}

function registerSaveHandlers(): void {
  ipcMain.handle("save:listSlots", () => {
    ensureSavesDir();
    return fs.readdirSync(savesDir).filter((f) => {
      return fs.statSync(path.join(savesDir, f)).isDirectory();
    });
  });

  ipcMain.handle("save:readFile", (_e, slotId: string, filename: string) => {
    const filePath = safeFilePath(slotId, filename);
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath, "utf-8");
  });

  ipcMain.handle("save:writeFile", (_e, slotId: string, filename: string, data: string) => {
    const dir = slotDir(slotId);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(safeFilePath(slotId, filename), data, "utf-8");
    return true;
  });

  ipcMain.handle("save:deleteSlot", (_e, slotId: string) => {
    const dir = slotDir(slotId);
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
    return true;
  });

  ipcMain.handle("save:deleteFile", (_e, slotId: string, filename: string) => {
    const filePath = safeFilePath(slotId, filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    return true;
  });

  ipcMain.handle("save:listFiles", (_e, slotId: string) => {
    const dir = slotDir(slotId);
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir);
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Laptop Tycoon",
    autoHideMenuBar: true,
    fullscreen: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(() => {
  ensureSavesDir();
  registerSaveHandlers();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
