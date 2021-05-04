import React, { useEffect, useState } from "react";
import {
  useTable,
  useFlexLayout,
  useResizeColumns,
  useSortBy,
  useRowSelect,
} from "react-table";
import "./FileList.css";
const { ipcRenderer, shell } = window.require("electron");

const FileList = ({
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
  const headerProps = (props, { column }) => getStyles(props, column.align);
  const cellProps = (props, { cell }) => getStyles(props, cell.column.align);
  const getStyles = (props, align = "left") => [
    props,
    {
      style: {
        justifyContent: align === "right" ? "flex-end" : "flex-start",
        display: "block",
        position: "relative",
      },
    },
  ];

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

  const data = React.useMemo(
    () =>
      Object.keys(files).map((key) => ({
        key: key,
        name: (
          <span className="w-full">
            <img
              className="h-8 w-8 px-1 inline-block object-contain"
              src={files[key].preview}
            />
            {files[key].name}
          </span>
        ),
        tags: (
          <div className="file-tag-container">
            {Object.keys(files[key].tags).map((t) => (
              <p className="file-tag" key={t}>
                {t}
              </p>
            ))}
          </div>
        ),
        type: files[key].filetype,
        size: String(files[key].size) + " bytes",
        lastmodified: files[key].mtime.toString(),
        created: files[key].birthtime.toString(),
      })),
    [files]
  );
  let columns = React.useMemo(
    () => [
      {
        Header: "File Name",
        accessor: "name", // accessor is the "key" in the data
      },
      {
        Header: "Tags",
        accessor: "tags",
        sortType: "basic",
      },
      {
        Header: "Kind",
        accessor: "type",
      },
      {
        Header: "Last Modified",
        accessor: "lastmodified",
      },
      {
        Header: "Created",
        accessor: "created",
      },
    ],
    []
  );

  const defaultColumn = React.useMemo(
    () => ({
      minWidth: 40,
      maxWidth: 800,
    }),
    []
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    state,
  } = useTable(
    {
      columns,
      data,
      defaultColumn,
    },
    useSortBy,
    useResizeColumns,
    useFlexLayout
  );

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
      if ((selectList.last || rows.length) < rows.length) {
        select(e, rows[selectList.last + 1].original.key, selectList.last + 1);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if ((selectList.last || 0) > 0) {
        select(e, rows[selectList.last - 1].original.key, selectList.last + 1);
      }
    }
  };

  const getRowProps = (row) => ({
    style: {
      background: selectList[row.original.key] ? "blue" : "white",
      color: selectList[row.original.key] ? "white" : "black",
    },
  });

  const select = (e, id, dex) => {
    let selected;
    console.log(e.metaKey);
    console.log(e.shiftKey);

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
        console.log("loop");
        for (
          let i = selected.last;
          i != dex;
          i += 1 * Math.sign(dex - selected.last)
        ) {
          selected[rows[i].original.key] = true;
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
      <section className="w-full overflow-auto h-full min-h-0">
        <div
          {...getTableProps()}
          className="table w-min-full h-full text-xs min-h-full"
        >
          <div className="sticky table-header">
            {headerGroups.map((headerGroup) => (
              <div
                {...headerGroup.getHeaderGroupProps({
                  // style: { paddingRight: '15px' },
                })}
                className="tr"
              >
                {headerGroup.headers.map((column) => (
                  <div
                    {...column.getHeaderProps(column.getSortByToggleProps())}
                    className="th"
                  >
                    {column.render("Header")}
                    <span>
                      {column.isSorted
                        ? column.isSortedDesc
                          ? " 🔽"
                          : " 🔼"
                        : ""}
                    </span>
                    {/* Use column.getResizerProps to hook up the events correctly */}
                    {column.canResize && (
                      <div
                        {...column.getResizerProps()}
                        className={`resizer ${
                          column.isResizing ? "isResizing" : ""
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="tbody">
            {rows.map((row) => {
              prepareRow(row);
              return (
                <div
                  {...row.getRowProps(getRowProps(row))}
                  className={
                    "tr" + selectList[row.original.key] ? " selected-row" : ""
                  }
                  onDoubleClick={() => {
                    shell.openPath(files[row.original.key].path);
                  }}
                  onClick={(e) => {
                    if (selectList[row.original.key]) {
                      viewFile(row.original.key);
                    } else {
                      select(e, row.original.key, row.index);
                    }
                  }}
                  onKeyDown={(e) => handleKeyDown(e, row.original.key)}
                  draggable="true"
                  onDragStart={(e) => {
                    onDragHandler(e, row.original.key);
                  }}
                  onDragEnd={() => setPreventDrop(false)}
                >
                  {row.cells.map((cell) => {
                    return (
                      <div
                        {...cell.getCellProps(cellProps)}
                        className="td ellipsis"
                      >
                        {cell.render("Cell")}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </section>
  );
};

export default FileList;
