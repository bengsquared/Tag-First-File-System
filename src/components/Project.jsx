import React, { useEffect, useState } from "react";
import FileList from "./FileList";
import FileCards from "./FileCards";
import FilterManager from "./FilterManager";
import FileInfo from "./FileInfo";
import GraphView from "./GraphView";
import SideBar from "./SideBar";
const { ipcRenderer, shell } = window.require("electron");
const locale = "en-US";

const Project = ({ key, data, dirs, selectDir, addDir }) => {
  const [currentFiles, setCurrentFiles] = useState(data.graph.files);
  const [tags, setTags] = useState([]);
  const [title, setTitle] = useState(data.name);
  const [viewFile, setViewFile] = useState(null);
  const [hiddenTags, setHiddenTags] = useState([]);
  const [possibleTags, setPossibleTags] = useState(
    Object.keys(data.graph.tags)
  );

  const filter = async () => {
    if (tags.length > 0 || hiddenTags.length > 0) {
      //get the smallest/most restrictive tag, then iterate through its files
      let smallestTagIndex = 0;
      let smallestTagIndexLength = -1;
      let cl;
      for (let i = 0; i < tags.length; i++) {
        console.log(tags[i]);
        console.log(i);
        console.log(data.graph.tags[tags[i]]);
        console.log(data.graph.tags);
        cl = Object.keys(data.graph.tags[tags[i]].files).length;
        if (cl < smallestTagIndexLength || smallestTagIndexLength === -1) {
          smallestTagIndex = i;
          smallestTagIndexLength = cl;
        }
      }

      let newfiles = {};
      let ptags = {};
      let allFiles =
        tags.length === 0
          ? Object.keys(currentFiles)
          : Object.keys(data.graph.tags[tags[smallestTagIndex]].files);

      for (const fileId of allFiles) {
        let fileMatchesAllTags = true;
        for (const tag of tags) {
          if (!data.graph.tags[tag].files[fileId]) {
            fileMatchesAllTags = false;
            break;
          }
        }
        if (fileMatchesAllTags) {
          for (const hiddentag of hiddenTags) {
            if (!!data.graph.tags[hiddentag].files[fileId]) {
              fileMatchesAllTags = false;
              break;
            }
          }
        }
        if (fileMatchesAllTags) {
          Object.keys(data.graph.files[fileId].tags).forEach((t) => {
            if (!tags.includes(t)) {
              possibleTags[t] = (possibleTags[t] || 0) + 1;
            }
          });
          newfiles[fileId] = data.graph.files[fileId];
        }
      }
      setCurrentFiles(newfiles);
      setPossibleTags(Object.keys(ptags));
    } else {
      setCurrentFiles(data.graph.files);
      setPossibleTags(Object.keys(data.graph.tags));
    }
  };

  useEffect(() => {
    filter();
  }, [tags, hiddenTags, data.graph.files]);

  // ipcRenderer.on("projectUpdate", (e, p) => {
  //   setTitle(p.name);
  //   setCurrentFiles(p.files);
  // });

  const addFilter = async (tag) => {
    if (!tags.includes(tag)) {
      let tagarr = tags;
      tagarr.push(tag);
      await setTags(tagarr);
      filter();
    }
  };

  const setFilterDirect = async (tag) => {
    await setTags(tag);
    filter();
  };

  const remFilter = async (tag) => {
    await setTags(tags.filter((t) => t !== tag));
    filter();
  };

  const clearFilters = () => {
    setTags([]);
    setCurrentFiles(data.graph.files);
  };

  const viewFileByID = (id) => {
    setViewFile(id);
  };

  const closeFile = () => {
    setViewFile(null);
  };

  const hideTag = async (tag) => {
    let newHiddenTags = hiddenTags;
    newHiddenTags.push(tag);
    console.log(newHiddenTags);
    await setHiddenTags(newHiddenTags);
    filter();
  };

  const unhideTag = async (tag) => {
    await setHiddenTags(hiddenTags.filter((t) => t !== tag));
    filter();
  };

  return (
    <div className="flex max-w-full h-full">
      <aside className="min-w-0 max-w-full border-r-2 flex-none w-48">
        {dirs === "" || dirs === "loading" ? (
          <p>loading</p>
        ) : (
          <SideBar
            dirs={dirs}
            currentDir={data.path}
            selectDir={selectDir}
            addDir={addDir}
            tags={data.graph.tags}
            addFilter={addFilter}
            hideTag={hideTag}
            unhideTag={unhideTag}
            hiddenTags={hiddenTags}
          />
        )}
      </aside>
      <section className="flex flex-grow flex-col relative min-h-0 max-h-full h-full max-w-full min-w-0 overflow-y-none bg-white">
        <FilterManager
          data={data}
          currentTags={tags}
          addFilter={addFilter}
          remFilter={remFilter}
          hideTag={hideTag}
          unhideTag={unhideTag}
        />
        <FileCards
          closeFile={closeFile}
          viewFile={viewFileByID}
          files={currentFiles}
          clearFilters={clearFilters}
          addFilter={addFilter}
          path={data.path}
          selectedTags={tags}
        />

        {viewFile && (
          <FileInfo
            fileID={viewFile}
            graph={data.graph}
            closeFile={closeFile}
            clearFilters={clearFilters}
            addFilter={addFilter}
            viewFile={viewFileByID}
          />
        )}
      </section>
    </div>
  );
};

// <FileList
//   closeFile={closeFile}
//   viewFile={viewFileByID}
//   files={currentFiles}
//   clearFilters={clearFilters}
//   addFilter={addFilter}
//   path={data.path}
//   selectedTags={tags}
// />
// <GraphView tags={data.graph.tags} files={data.graph.files} />

// Object.keys(data.graph.tags).filter((tag) => !currentTags.includes(tag))

export default Project;
