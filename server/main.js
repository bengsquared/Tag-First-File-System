// eslint-disable-next-line import/no-extraneous-dependencies
const {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  dialog,
  Menu,
  TouchBar,
} = require("electron");
const filetypes = require("./functions/filetypes");
const appicon = require("osx-fileicon");
const storage = require("node-persist");
const { is } = require("electron-util");
const fs = require("fs");
const path = require("path");
const FileGraph = require("./functions/FileGraph");
const Project = require("./functions/Project");
const { graphFromPath } = require("./functions/buildGraph");
let mainWindow;
let storageOptions = {
  stringify: JSON.stringify,
  parse: JSON.parse,
  encoding: "utf8",
  logging: console.log, // can also be custom logging function
  ttl: false, // ttl* [NEW], can be true for 24h default or a number in MILLISECONDS or a valid Javascript Date object
  forgiveParseErrors: false,
};
storage.init(storageOptions);
let currentDir = null;
let currentStore = null;
let currentProject = null;

const scanFiles = async (data) => {
  if (!data.path) {
    console.error("scanFiles failed - data path was null");
    return false;
  }

  let [newfiles, newtags] = await buildDataWithTags({
    path: data.path,
    files: {},
    tags: {},
    universalTags: [],
  });

  await graph.makePreviews(files, data.path);
  let newObj = {
    path: data.path,
    name: data.name || "New Project",
    files: files,
    tags: tags,
  };
  return newObj;
};

const setCurrentDir = async (key) => {
  if (!!currentProject) {
    await currentStore.setItem("meta", currentProject);
  }
  currentDir = key;
  let dir = path.join(key, "/.manila/");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  delete currentStore;
  currentStore = await storage.create({
    ...storageOptions,
    dir: path.join(key, "/.manila/"),
  });
  await currentStore.init();
  let currentFileData = await currentStore.getItem("meta");
  delete currentProject;
  if (currentFileData) {
    try {
      currentProject = new Project(currentFileData);
    } catch {
      currentProject = new Project({ path: key });
    }
  } else {
    currentProject = new Project({ path: key });
  }
  storage.setItem(key, { key: key, name: currentProject.name });
  storage.setItem("lastOpened", key);
  return currentProject;
};

const createWindow = () => {
  mainWindow = new BrowserWindow({
    backgroundColor: "#F7F7F7",
    minWidth: 880,
    show: false,
    titleBarStyle: "hidden",
    height: 860,
    width: 1280,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  if (is.development) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
    mainWindow.loadURL("http://localhost:3000");
  } else {
    mainWindow.loadURL(
      `file://${path.join(__dirname, "../../build/index.html")}`
    );
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();

    ipcMain.on("open-external-window", (event, arg) => {
      shell.openExternal(arg);
    });
  });
};

generateMenu = () => {
  const template = [
    {
      label: "File",
      submenu: [{ role: "about" }, { role: "quit" }],
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
        { role: "pasteandmatchstyle" },
        { role: "delete" },
        { role: "selectall" },
      ],
    },
    {
      label: "View",
      submenu: [
        { type: "separator" },
        { role: "resetzoom" },
        { role: "zoomin" },
        { role: "zoomout" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      role: "window",
      submenu: [{ role: "minimize" }, { role: "close" }],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
};

app.on("ready", () => {
  createWindow();
  generateMenu();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  ipcMain.removeAllListeners();
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.on("load-page", (event, arg) => {
  mainWindow.loadURL(arg);
});

const triggermakepreviews = async (e) => {
  await currentProject.graph.makePreviews();
  currentStore.setItem("meta", currentProject);
  e.reply("projectUpdate", currentProject);
};

ipcMain.on("newDir", async (event, arg) => {
  let paths = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
  });
  if (paths) {
    await setCurrentDir(paths.filePaths[0]);
    await graphFromPath(currentProject);
    currentStore.setItem("meta", currentProject);
    event.reply("listDir", currentProject);
    triggermakepreviews(event);
  }
});

ipcMain.on("getKeys", async function (event, arg) {
  let data = [];
  await storage.forEach(async function (datum) {
    if (datum.key != "lastOpened") {
      data.push({ key: datum.key, name: datum.value.name });
    }
  });
  event.reply("keys", data);
});

const triggerescan = async (e, key) => {
  await graphFromPath(currentProject);
  await currentProject.graph.makePreviews();
  currentStore.setItem("meta", currentProject);
  e.reply("keyData", currentProject);
};

ipcMain.on("getDataByKey", async function (event, key) {
  let a;
  if (!currentStore || key !== currentDir) {
    await setCurrentDir(key);
  }
  event.reply("keyData", currentProject);
  triggerescan(event, key);
});

ipcMain.on("setData", async function (event, arg) {
  if (!currentStore || arg.key !== currentDir) {
    a = await setCurrentDir(arg.key);
  }
  let reply = await currentStore.updateItem("meta", arg.data);
  event.reply("newKeyData", reply);
  currentStore.setItem("meta", currentProject);
});

ipcMain.on("removeData", async function (event, arg) {
  let reply = await storage.removeItem(arg);
  event.reply("removedData", reply);
  currentStore.setItem("meta", currentProject);
});

ipcMain.on("addVertex", async function (event, vertex) {
  currentProject.graph.addVertex(vertex);
  event.reply("projectUpdate", currentProject);
  currentStore.setItem("meta", currentProject);
});

ipcMain.on("addEdge", async function (event, edgeArray) {
  for (i = 0; i < edgeArray.length; i++) {
    currentProject.graph.addEdge(edgeArray[i].source, edgeArray[i].destination);
  }
  event.reply("projectUpdate", currentProject);
  currentStore.setItem("meta", currentProject);
});

ipcMain.on("removeEdge", async function (event, { source, destination }) {
  currentProject.graph.removeEdge(source, destination);
  event.reply("projectUpdate", currentProject);
  currentStore.setItem("meta", currentProject);
});

ipcMain.on("removeVertex", async function (event, vertex) {
  currentProject.graph.removeVertex(vertex);
  event.reply("projectUpdate", currentProject);
  currentStore.setItem("meta", currentProject);
});

ipcMain.on("updateVertex", async function (event, vertex) {
  currentProject.updateVertex(vertex);
  event.reply("projectUpdate", currentProject);
  currentStore.setItem("meta", currentProject);
});

const triggerprojectnamerefresh = async (e, project) => {
  currentStore.setItem("meta", currentProject);
  await storage.setItem(project.path, {
    key: project.path,
    name: project.name,
  });
  let data = [];
  await storage.forEach(async function (datum) {
    data.push({ key: datum.key, name: datum.value.name });
  });
  e.reply("keys", data);
};

ipcMain.on("renameProject", async function (event, project) {
  if (project.path != currentProject.path) {
    await setCurrentDir(project.path);
  }
  currentProject.name = project.name;
  event.reply("projectUpdate", currentProject);
  triggerprojectnamerefresh(event, project);
});

ipcMain.on("getLastProject", async function (event, args) {
  let key = await storage.getItem("lastOpened");
  if (!currentStore || key !== currentDir) {
    await setCurrentDir(key);
  }
  event.reply("keyData", currentProject);
  triggerescan(event, key);
});

ipcMain.on("openQL", async function (event, path) {
  mainWindow && mainWindow.previewFile(path);
});

ipcMain.on("closeQL", async function (event, path) {
  mainWindow && mainWindow.closeFilePreview();
});

ipcMain.on("ondragstart", (event, filePath) => {
  console.log(filePath);
  event.sender.startDrag({
    files: filePath,
    icon: path.join(__dirname, "../src/assets/many-file-export.png"),
  });
});

ipcMain.on("filesDropped", async function (event, { tags, fileList }) {
  console.log(tags);
  console.log(fileList);
  for (i = 0; i < fileList.length; i++) {
    let stat = await fs.statSync(fileList[i]);
    let newFile;
    console.log(stat);
    console.log("postStat");
    console.log(Object.keys(currentProject.graph.files));
    console.log(!!currentProject.graph.files[stat.ino]);
    if (!currentProject.graph.files[stat.ino]) {
      let newPath = path.join(currentProject.path, path.basename(fileList[i]));
      let response = 1;
      try {
        if (!!fs.statSync(newPath, { throwIfNoEntry: false })) {
          let response = dialog.showMessageBoxSync({
            message: `You've already imported a file with the name ${path.basename(
              fileList[i]
            )}. Would you like to overwrite it?`,
            buttons: ["Skip", "OverWrite"],
            defaultId: 0,
          });
        }
      } catch {
        console.log("we're ok,but error thrown");
      }

      if (response === 1) {
        fs.renameSync(fileList[i], newPath);
        let filetype =
          filetypes.filetypes[path.extname(fileList[i]).toUpperCase()] ||
          path.extname(fileList[i]).substring(1);
        newFile = {
          id: stat.ino,
          type: "files",
          filetype: filetype,
          name: path.basename(fileList[i]),
          path: newPath,
          ...stat,
        };
        currentProject.graph.addVertex(newFile);
      }
    } else {
      console.log("else statement", !!currentProject.graph.files[stat.ino]);
      newFile = currentProject.graph.files[stat.ino];
    }
    for (const tag of tags) {
      currentProject.graph.addEdge(currentProject.graph.tags[tag], newFile);
    }
  }
  event.reply("projectUpdate", currentProject);
  triggermakepreviews(event);
});
