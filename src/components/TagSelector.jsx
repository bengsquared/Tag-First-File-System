import React, { useEffect, useRef, useState } from "react";
import closeButton from "../assets/xbutton.svg";
import "./TagSelector.css";

function TagSelector({ possibleTagList, selectedTags, selectTag, removeTag }) {
  const [results, setResults] = useState(possibleTagList.slice(0, 20));
  const [focused, setFocused] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [allowCreate, setAllowCreate] = useState(false);
  const [chosenel, setChosenel] = useState(0);
  const ref = useRef();
  let closeTimeout;

  useEffect(() => {
    if (focused) {
      ref.current.focus();
    } else {
      setResults([]);
      setAllowCreate(false);
      setFocused(false);
    }
  }, [focused, selectedTags]);

  const close = () => {
    setFocused(false);
  };

  function onBlurHandler() {
    closeTimeout = setTimeout(() => {
      setFocused(false);
    }, 50);
  }

  // If a child receives focus, do not close the popover.
  function onFocusHandler() {
    clearTimeout(closeTimeout);
  }

  const searchListUpdate = (s) => {
    let list = "";
    if (s === "") {
      setAllowCreate(false);
      list = possibleTagList.slice(0, 20);
    } else {
      list = possibleTagList.filter((i) => i.includes(s)).slice(0, 20);
    }
    setResults(list);
    let create = true;
    for (const i of list) {
      console.log(i + " == " + s);
      if (i == s) {
        create = false;
      }
    }
    setAllowCreate(create);
    setChosenel(0);
  };

  const keyhandler = (e) => {
    if (e.key === "ArrowDown") {
      if (chosenel < allowCreate ? results.length + 1 : results.length) {
        setChosenel(chosenel + 1);
      }
    } else if (e.key === "ArrowUp") {
      if (chosenel > 0) {
        setChosenel(chosenel - 1);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (chosenel < results.length) {
        chooseTag(results[chosenel].id);
      } else if (chosenel === results.length && allowCreate) {
        chooseTag(searchTerm);
      }
    }
  };

  const chooseTag = (tag) => {
    selectTag(tag);
    setSearchTerm("");
    setResults(possibleTagList.slice(0, 20));
    setAllowCreate(false);
    setFocused(false);
  };

  const updateSearchTerm = (e) => {
    let exactMatch = false;
    setSearchTerm(e.target.value);
    if (e.target.value === "") {
      setAllowCreate(false);
      setResults(possibleTagList);
      return;
    }

    setResults(
      possibleTagList.filter(([tag, set]) => {
        if (tag === e.target.value) {
          exactMatch = true;
        }
        return tag.includes(e.target.value);
      })
    );
    setAllowCreate(!exactMatch);
  };

  return (
    <div className="relative">
      <div className="tag-selector">
        {focused ? (
          <div
            className="tag-selector-inner-editing"
            onFocus={onFocusHandler}
            onBlur={onBlurHandler}
          >
            <span className="tag-selector-label" role="img" aria-label="tags">
              {"🏷️  "}
            </span>
            {selectedTags &&
              Object.keys(selectedTags).map((tag) => (
                <div className="tag-pill">
                  {tag}
                  <button
                    className="tag-pill-delete"
                    onClick={() => {
                      removeTag(tag);
                    }}
                  >
                    <img src={closeButton} alt-text="close"></img>
                  </button>
                </div>
              ))}
            <div className="tag-search">
              <input
                aria-haspopup="true"
                aria-expanded={focused}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  searchListUpdate(e.target.value);
                }}
                onKeyDown={keyhandler}
                className="tag-search-input"
                ref={ref}
              ></input>
            </div>
            <div className="tag-search-results">
              <div className="text-xs text-gray-700">
                type to search for a tag, or create a new one
              </div>
              {results.map((t, dex) => (
                <button
                  className={
                    "hover:bg-gray-400 block w-full text-left" +
                    (dex === chosenel ? " bg-blue-400" : "")
                  }
                  key={t}
                  onClick={(e) => {
                    chooseTag(t);
                    e.preventDefault();
                  }}
                >
                  {t}
                </button>
              ))}
              <div>
                <button
                  className={
                    (allowCreate && searchTerm !== "" ? "" : "hidden") +
                    (chosenel === results.length ? " bg-gray-400" : "")
                  }
                  onClick={(e) => {
                    chooseTag(searchTerm);
                    e.preventDefault();
                  }}
                >
                  {"create tag "}
                  {searchTerm}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            role="button"
            className="tag-selector-inner selectable"
            onClick={() => {
              setFocused(true);
            }}
          >
            <span className="tag-selector-label" role="img" aria-label="tags">
              {"🔖"}
            </span>
            {Object.keys(selectedTags).length === 0
              ? " none"
              : Object.keys(selectedTags).map((tag) => (
                  <div className="tag-pill">{tag}</div>
                ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TagSelector;
