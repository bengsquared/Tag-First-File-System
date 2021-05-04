import React, { useEffect, useState } from "react";
import "./SideBar.css";
const { ipcRenderer } = window.require("electron");

const SideBar = ({
  currentDir,
  dirs,
  selectDir,
  addDir,
  tags,
  addFilter,
  hideTag,
  unhideTag,
  hiddenTags,
}) => {
  const [hoverTag, setHoverTag] = useState(null);

  const handleDrop = (e, tag) => {
    let filelist = [];
    console.log(e.dataTransfer);
    for (let i = 0; i < e.dataTransfer.files.length; i++) {
      filelist.push(e.dataTransfer.files[i].path);
    }
    ipcRenderer.send("filesDropped", {
      fileList: filelist,
      tags: [tag],
    });
    setHoverTag(null);
  };

  return (
    <nav className="w-full align-center">
      <div className="project-select">
        <select
          name="Projects"
          value={currentDir}
          onChange={(e) => {
            if (e.target.value == "Create a New Directory") {
              addDir();
            } else {
              selectDir(e.target.value);
            }
          }}
        >
          {dirs.map((dir) => (
            <option value={dir.key} key={dir.key}>
              {dir.name}
            </option>
          ))}
          <option value="Create a New Directory">{"+ Create New"}</option>
        </select>
      </div>
      <div className="tag-list">
        <div className="tag-entry">
          <div className="tag-button">
            <div className="pip invisible"></div>

            <div className="tag-name">
              <span style={{ color: "gray" }}>Tags:</span>
            </div>
          </div>
        </div>
        {tags
          ? Object.keys(tags).map((tag) => {
              return (
                <div
                  key={tag}
                  className={
                    "tag-entry" + (tag === hoverTag ? " hover-tag" : "")
                  }
                  onDragOver={(e) => {
                    e.preventDefault();
                    setHoverTag(tag);
                  }}
                  onDragLeave={() => setHoverTag(null)}
                  onDrop={(e) => {
                    handleDrop(e, tag);
                  }}
                >
                  <div
                    className={
                      (!!hiddenTags.includes(tag)
                        ? "opacity-100"
                        : "opacity-0") + " hover:opacity-100"
                    }
                  >
                    <button
                      className={"inline-block border "}
                      onClick={() =>
                        !!hiddenTags.includes(tag)
                          ? unhideTag(tag)
                          : hideTag(tag)
                      }
                    >
                      👻
                    </button>
                  </div>
                  <div className="tag-button" onClick={() => addFilter(tag)}>
                    <div className="pip"></div>
                    <div className="tag-name">{tag}</div>
                  </div>
                  <span className="tag-count">
                    {Object.keys(tags[tag].files).length}
                  </span>
                </div>
              );
            })
          : "no tags yet :("}
      </div>
    </nav>
  );
};

export default SideBar;
