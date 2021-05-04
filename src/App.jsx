import React, { useEffect, useState } from "react";
import Project from "./components/Project";
const { ipcRenderer, shell } = window.require("electron");
const fs = window.require("fs");
const locale = "en-US";
function isObj(obj) {
  // checks for null and undefined
  if (obj === null || typeof obj === "object") {
    return true;
  } else {
    return false;
  }
}

const App = () => {
  const [dirs, setDirs] = useState("");
  const [project, setProject] = useState("none");
  const [title, setTitle] = useState("manila");
  const [currentDir, setCurrentDir] = useState(null);

  useEffect(() => {
    if (dirs === "") {
      setDirs("loading");
      ipcRenderer.send("getKeys");
    }
    if (project == "none") {
      console.log("project is null");
      ipcRenderer.send("getLastProject");
    }
  }, []);

  useEffect(() => {
    setTitle(project.name);
  }, [project]);

  ipcRenderer.on("listDir", (e, a) => {
    setCurrentDir(a.path);
    setProject(a);
    ipcRenderer.send("getKeys");
  });

  ipcRenderer.on("keys", (e, a) => {
    setDirs(a);
  });

  ipcRenderer.on("keyData", (e, a) => {
    setProject(a);
  });

  ipcRenderer.on("projectUpdate", (e, a) => {
    setCurrentDir(a.path);
    setProject(a);
  });

  ipcRenderer.on("newKeyData", (e, a) => {
    ipcRenderer.send("getKeys");
  });

  const selectDir = (key) => {
    setProject("loading");
    setCurrentDir(key);
    ipcRenderer.send("getDataByKey", key);
  };

  const addDir = () => {
    setProject("loading");
    ipcRenderer.send("newDir");
  };

  const saveTitle = () => {
    project.name &&
      project.path &&
      ipcRenderer.send("renameProject", { path: project.path, name: title });
  };

  return (
    <main
      className="flex max-w-full max-h-screen w-full h-full pt-6 m-0
        overflow-hidden"
    >
      <div className="titlebar absolute text-center text-s border bg-gray-200 h-6 top-0 w-full">
        {!!project.name ? (
          <input
            className="bg-transparent w-auto centered"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
          />
        ) : (
          "manila"
        )}
      </div>

      <section className="border min-w-0 min-h-0 max-w-full flex-grow">
        {project === "none" ? (
          <div>
            {"Select a project to get started:"}
            {dirs == "" || dirs == "loading" ? (
              "loading"
            ) : (
              <ul>
                {dirs.map((dir) => (
                  <li>
                    <button
                      onClick={() => {
                        selectDir(dir.key);
                      }}
                    >
                      {dir.name}
                    </button>
                  </li>
                ))}
                <li>
                  <button
                    onClick={() => {
                      addDir();
                    }}
                  >
                    {"+ New Project"}
                  </button>
                </li>
              </ul>
            )}
          </div>
        ) : project === "loading" ? (
          "loading..."
        ) : (
          <Project
            key={project.path}
            data={project}
            dirs={dirs}
            selectDir={selectDir}
            addDir={addDir}
          />
        )}
      </section>
    </main>
  );
};
export default App;
