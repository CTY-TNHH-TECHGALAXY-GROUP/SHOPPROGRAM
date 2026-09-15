const { app, BrowserWindow, Menu, ipcMain } = require("electron");
const path = require("path");
const http = require("http");
const fs = require("fs");
const url = require("url");

let mainWindow;
let server;
let serverPort = 8765;

// Tìm port khả dụng
function findAvailablePort(startPort) {
  return new Promise((resolve) => {
    const testServer = http.createServer();
    testServer.listen(startPort, "127.0.0.1", () => {
      testServer.close(() => {
        resolve(startPort);
      });
    });
    testServer.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        resolve(findAvailablePort(startPort + 1));
      } else {
        resolve(startPort);
      }
    });
  });
}

// Khởi động local server (đơn giản static file server)
function startServer() {
  return new Promise((resolve, reject) => {
    findAvailablePort(serverPort).then((port) => {
      serverPort = port;

      const shopProgramDir = path.join(__dirname, "..");

      server = http.createServer((req, res) => {
        // Xử lý CORS cho các API requests
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

        if (req.method === "OPTIONS") {
          res.writeHead(200);
          res.end();
          return;
        }

        // Đường dẫn file
        let filePath = path.join(shopProgramDir, req.url === "/" ? "/index.html" : req.url);

        // Bảo vệ path traversal
        if (!filePath.startsWith(shopProgramDir)) {
          res.writeHead(403);
          res.end("Forbidden");
          return;
        }

        // Nếu là thư mục, phục vụ index.html
        if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
          filePath = path.join(filePath, "index.html");
        }

        // Phục vụ file
        fs.readFile(filePath, (err, data) => {
          if (err) {
            res.writeHead(404);
            res.end("Not Found");
            return;
          }

          // Xác định content type
          const ext = path.extname(filePath);
          const contentTypes = {
            ".html": "text/html",
            ".js": "application/javascript",
            ".css": "text/css",
            ".json": "application/json",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".gif": "image/gif",
            ".svg": "image/svg+xml",
          };

          const contentType = contentTypes[ext] || "application/octet-stream";
          res.writeHead(200, { "Content-Type": contentType });
          res.end(data);
        });
      });

      server.listen(serverPort, "127.0.0.1", () => {
        console.log(`✓ Server chạy tại http://127.0.0.1:${serverPort}`);
        resolve();
      });

      server.on("error", (err) => {
        console.error("Server error:", err);
        reject(err);
      });
    });
  });
}

// Tạo window chính
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: true,
    },
    icon: path.join(__dirname, "../logo.png"),
  });

  // Load ứng dụng
  mainWindow.loadURL(`http://127.0.0.1:${serverPort}`);

  // Mở DevTools trong development (comment lại nếu không muốn)
  // mainWindow.webContents.openDevTools();

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Tạo menu
  createMenu();
}

// Tạo menu
function createMenu() {
  const template = [
    {
      label: "OriaFarm",
      submenu: [
        {
          label: "Về ứng dụng",
          click: () => {
            const { dialog } = require("electron");
            dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "Về OriaFarm POS",
              message: "OriaFarm - Phần mềm quản lý bán hàng",
              detail: "Phiên bản: 1.0.0\n© 2024 TechGalaxy Group",
            });
          },
        },
        { type: "separator" },
        {
          label: "Thoát",
          accelerator: "CmdOrCtrl+Q",
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Khi Electron khởi động xong
app.on("ready", () => {
  startServer()
    .then(() => createWindow())
    .catch((err) => {
      console.error("Failed to start:", err);
      app.quit();
    });
});

// Tắt server khi app đóng
app.on("before-quit", () => {
  if (server) {
    server.close(() => {
      console.log("✓ Server đã dừng");
    });
  }
});

// Đóng app khi tất cả window đóng (macOS除外)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Mở window khi app active lại (macOS)
app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
