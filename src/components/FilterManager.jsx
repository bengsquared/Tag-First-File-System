import React, { useEffect, useState } from "react";
import TagSelector from "./TagSelector";
import "./FilterManager.css";
import closeButton from "../assets/xbutton.svg";

const FilterManager = ({ currentTags, data, addFilter, remFilter }) => {
  const [possibleTags, setPossibleTags] = useState(
    Object.keys(data.graph.tags).filter((tag) => !currentTags.includes(tag))
  );
  const [results, setResults] = useState([]);
  const [focused, setFocused] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [chosenel, setChosenel] = useState(0);
  let closeTimeout;

  useEffect(() => {
    if (focused) {
    } else {
      setResults([]);
      setFocused(false);
    }
    setPossibleTags(
      Object.keys(data.graph.tags).filter((tag) => !currentTags.includes(tag))
    );
  }, [focused, currentTags]);

  function onBlurHandler() {
    closeTimeout = setTimeout(() => {
      setFocused(false);
    }, 1);
  }

  // If a child receives focus, do not close the popover.
  function onFocusHandler() {
    console.log(true);
    setFocused(true);
    clearTimeout(closeTimeout);
  }

  const searchListUpdate = (s) => {
    let list = "";
    if (s === "") {
      list = possibleTags.slice(0, 20);
    } else {
      list = possibleTags.filter((i) => i.includes(s)).slice(0, 20);
    }
    setResults(list);
    setChosenel(0);
  };

  const keyhandler = (e) => {
    if (e.key === "Backspace" && searchTerm === "" && currentTags.length > 0) {
      remFilter(currentTags[currentTags.length - 1]);
    }
    if (e.key === "ArrowDown") {
      if (chosenel < results.length) {
        setChosenel(chosenel + 1);
      }
    } else if (e.key === "ArrowUp") {
      if (chosenel > 0) {
        setChosenel(chosenel - 1);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      results[chosenel] && addFilter(results[chosenel].id);
    }
  };

  const chooseTag = (tag) => {
    addFilter(tag);
    setResults(possibleTags.slice(0, 20));
    setFocused(false);
  };

  const updateSearchTerm = (e) => {
    let exactMatch = false;
    setSearchTerm(e.target.value);
    if (e.target.value === "") {
      setResults([]);
      return;
    }

    setResults(
      possibleTags.filter((tag) =>
        tag.toLowerCase().includes(e.target.value.toLowerCase())
      )
    );
  };

  function inputKeyHandler(e) {
    if (e.key === "Backspace" && searchTerm === "" && currentTags.length > 0) {
      console.log(currentTags);
      remFilter(currentTags[currentTags.length - 1]);
    }
  }

  return (
    <section className="filters max-w-full w-min-0">
      <div className="filter-manager-tag-select">
        tags:
        {currentTags.map((tag) => (
          <div className="tag-pill">
            <p className="inline-block">{tag}</p>
            <button
              className="tag-pill-delete"
              onClick={() => {
                remFilter(tag);
              }}
              style={{ backgroundImage: `url(${closeButton})` }}
              alt-text="closed"
            ></button>
          </div>
        ))}
        <div
          className="filter-manager-tag-selector"
          onFocus={onFocusHandler}
          onBlur={onBlurHandler}
        >
          <input
            className="filter-manager-input"
            placeholder="+ filter by tag"
            onFocus={onFocusHandler}
            value={searchTerm}
            onChange={updateSearchTerm}
            onKeyDown={keyhandler}
          />
          {focused && results.length > 0 && (
            <div className="filter-manager-results">
              {results.map((t, dex) => (
                <button
                  className={
                    "hover:bg-gray-400 block w-full text-left m-t-1 p-1 rounded" +
                    (dex === chosenel ? " bg-grey-400" : "")
                  }
                  key={t}
                  onClick={(e) => {
                    addFilter(t);
                    e.preventDefault();
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {currentTags.length > 0 && (
        <div className="suggested-tags">
          related tags:
          {Object.keys(data.graph.tags)
            .filter((tag) => !currentTags.includes(tag))
            .map((tag) => ({
              name: tag,
              size: Object.keys(data.graph.tags[tag].files).length,
            }))
            .slice(0, 5)
            .sort((a, b) => b.size - b.size)
            .map((tag) => (
              <button
                onClick={(e) => {
                  addFilter(tag.name);
                  e.preventDefault();
                }}
                key={"suggestedTag" + tag.name}
                className="suggested-tags-tag"
              >
                {tag.name}
              </button>
            ))}
        </div>
      )}
    </section>
  );
};

export default FilterManager;
