import React, { useEffect, useRef, useState } from "react";
import { Resizable } from "react-resizable";
import TagSelector from "./TagSelector";
import closeButton from "../assets/xbutton.svg";
const { ipcRenderer, shell } = window.require("electron");

const FileInfo = ({
  fileID,
  graph,
  closeFile,
  addFilter,
  clearFilters,
  viewFile,
}) => {
  const contref = useRef();
  const [drag, setDrag] = useState(false);
  const [width, setWidth] = useState(200);
  const [pos, setPos] = useState(null);
  const onMouseDown = (e) => {
    console.log(e.button);
    if (e.button !== 0) return;
    setDrag(true);
    setPos(e.pageX);
    e.stopPropagation();
    e.preventDefault();
  };

  const onMouseUp = (e) => {
    setDrag(false);
    e.stopPropagation();
    e.preventDefault();
  };

  const addTag = (id) => {
    ipcRenderer.send("addEdge", [
      {
        source: { id: fileID, type: "files" },
        destination: { id: id, type: "tags" },
      },
    ]);
  };

  const removeTag = (id) => {
    ipcRenderer.send("removeEdge", {
      source: { id: fileID, type: "files" },
      destination: { id: id, type: "tags" },
    });
  };

  useEffect(() => {
    if (drag) {
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
      console.log("startdrag");
    } else if (!drag) {
      console.log("endDrag");
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [drag]);

  const onMouseMove = (e) => {
    if (!drag) return;
    let w = width + (pos - e.pageX);
    console.log(w);
    setWidth(w);
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <div
      style={{ width: width + "px" }}
      className="w-48 w-min-32 right-0 absolute  overflow-none z-20 h-full item bg-white"
    >
      <span
        clickable
        className="dragbar w-2 h-full border absolute z-20 pointer bg-gray-400"
        onMouseDown={onMouseDown}
      ></span>
      <div className="inline-block flex flex-col h-full items-center p-4 w-full overflow-hidden">
        <button
          className="absolute top-0  w-4 h-4 bg-grey right-0 p-4"
          style={{ backgroundImage: closeButton }}
          onClick={closeFile}
        ></button>
        <section
          className="max-w-xs max-h-48 border"
          onClick={() => {
            shell.openPath(graph.files[fileID].path);
          }}
        >
          <img className="w-full " src={graph.files[fileID].preview || null} />
        </section>
        <section className="max-w-xs my-1">
          <h2 className="text-xl">{graph.files[fileID].name}</h2>
        </section>
        <section className="w-full my-1">
          <TagSelector
            selectedTags={graph.files[fileID].tags}
            possibleTagList={Object.keys(graph.tags).filter(
              (t) => !graph.files[fileID]["tags"][t]
            )}
            selectTag={addTag}
            removeTag={removeTag}
          />
        </section>
        <section className="max-w-xs my-1">
          <table className="divide-y">
            <tr>
              <td>Type:</td>
              <td>{graph.files[fileID].filetype}</td>
            </tr>
            <tr>
              <td>Size:</td>
              <td>{String(graph.files[fileID].size) + " bytes"}</td>
            </tr>

            <tr>
              <td>Last Modified:</td>
              <td>{graph.files[fileID].mtime.toString()}</td>
            </tr>
            <tr>
              <td>Created:</td>
              <td>{graph.files[fileID].birthtime.toString()}</td>
            </tr>
          </table>
        </section>
      </div>
    </div>
  );
};

export default FileInfo;
