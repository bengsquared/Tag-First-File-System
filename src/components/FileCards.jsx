import React, { useEffect, useState } from "react";

import "./FileList.css";
const { ipcRenderer, shell } = window.require("electron");

const FileCards = ({
  files,
  addFilter,
  path,
  closeFile,
  viewFile,
  selectedTags,
}) => {
  const [selectList, setSelectList] = useState({});
  const [rr, trr] = useState(true);
  const [preventDrop, setPreventDrop] = useState(false);
  const [allowFileDrop, setAllowFileDrop] = useState(false);

  const onDragHandler = (e, fileId) => {
    e.preventDefault();
    setPreventDrop(true);
    console.log(selectList);
    let filepaths = [files[fileId].path];
    if (Object.keys(selectList).length > 0) {
      filepaths = [];
      for (let key in selectList) {
        key !== "first" && key !== "last" && filepaths.push(files[key].path);
      }
    }

    ipcRenderer.send("ondragstart", filepaths);
  };

  const onDropHandler = (e) => {
    let filelist = [];
    console.log(e.dataTransfer);
    for (let i = 0; i < e.dataTransfer.files.length; i++) {
      filelist.push(e.dataTransfer.files[i].path);
    }
    ipcRenderer.send("filesDropped", {
      fileList: filelist,
      tags: selectedTags,
    });
    setAllowFileDrop(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === " ") {
      e.preventDefault();
      console.log("send");
      ipcRenderer.send("openQL", files[selectList.last].path);
      e.preventDefault();
    } else if (e.key === "Enter") {
      viewFile(selectList.last);
      e.preventDefault();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (
        (selectList.last || Object.keys(files).length) <
        Object.keys(files).length
      ) {
        select(e, Object.keys(files)[selectList.last + 1], selectList.last + 1);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if ((selectList.last || 0) > 0) {
        select(
          e,
          Object.keys(files)[selectList.last - 1].original.key,
          selectList.last + 1
        );
      }
    }
  };

  const select = (e, id, dex) => {
    let selected;

    if (e.metaKey) {
      selected = selectList;
      if (!selected.first) {
        selected.first = dex;
      }
      selected[id] = true;
      selected.last = dex;
      setSelectList(selected);
    } else if (e.shiftKey) {
      selected = selectList;
      selected[id] = true;
      console.log(!selected.first);
      if (!selected.first) {
        selected.first = dex;
      } else {
        for (
          let i = selected.last;
          i != dex;
          i += 1 * Math.sign(dex - selected.last)
        ) {
          selected[Object.keys(files)[i]] = true;
        }
      }
      selected.last = dex;
      setSelectList(selected);
    } else {
      selected = { first: dex };
      selected[id] = true;
      selected.last = dex;
      setSelectList(selected);
    }
    console.log(selected);
    trr(!rr);
  };

  return (
    <section
      className="filelist flex-grow min-h-0"
      onBlur={(e) => {
        setSelectList({});
      }}
      tabIndex="0"
      onKeyDown={handleKeyDown}
      onDragOver={(e) => {
        if (!preventDrop) {
          e.preventDefault();
          setAllowFileDrop(true);
        }
      }}
      onDragLeave={() => setAllowFileDrop(false)}
      onDrop={onDropHandler}
    >
      {allowFileDrop && (
        <div className="absolute w-full h-full top-0 border-rounded ">
          you can drop files here!
        </div>
      )}
      <section className="w-full overflow-auto h-full min-h-0 grid grid-flow-rows grid-cols-5 auto-rows-min gap-4">
        {Object.keys(files).map((key, index) => (
          <div key={key}>
            <div
              className={
                "max-h-64 " + (!!selectList[key] ? "bg-blue-200 white" : "")
              }
              onDoubleClick={() => {
                shell.openPath(files[key].path);
              }}
              onClick={(e) => {
                if (selectList[key]) {
                  viewFile(key);
                } else {
                  viewFile(key);
                  select(e, key, index);
                }
              }}
              onKeyDown={(e) => handleKeyDown(e, key)}
              onDragStart={(e) => {
                onDragHandler(e, key);
              }}
              onDragEnd={() => setPreventDrop(false)}
            >
              <section className="max-w-xs max-h-48 ">
                <img className="w-full " src={files[key].preview || null} />
              </section>
              <section>
                <h4 className="center text-center">{files[key].name}</h4>
              </section>
            </div>
          </div>
        ))}
      </section>
    </section>
  );
};

export default FileCards;
