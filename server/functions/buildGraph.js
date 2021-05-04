const FileGraph = require("./FileGraph");
const fs = require("fs");
const filetypes = require("./filetypes");
const pathUtil = require("path");

const buildGraph = async ({ path, fg, universalTags }) => {
  const directory = fs.readdirSync(path, { withFileTypes: true });
  for (const dirent of directory) {
    dirent.path = pathUtil.join(path, dirent.name);
    if (
      dirent.isDirectory() &&
      !dirent.name.startsWith(".") &&
      universalTags.length < 4
    ) {
      let newTag = { type: "tags", id: dirent.name, files: {} };
      fg.addVertex(newTag);
      let tagstack = [...universalTags, newTag];
      await buildGraph({
        path: dirent.path,
        fg: fg,
        universalTags: tagstack,
      });
    } else if (!dirent.name.startsWith(".")) {
      let stat = await fs.statSync(dirent.path);
      let filetype =
        filetypes.filetypes[pathUtil.extname(dirent.name).toUpperCase()] ||
        pathUtil.extname(dirent.name).substring(1);
      let newFile = {
        id: stat.ino,
        type: "files",
        filetype: filetype,
        name: dirent.name,
        path: dirent.path,
        ...stat,
      };
      fg.addVertex(newFile);
      for (const tag of universalTags) {
        fg.addEdge(tag, newFile);
      }
    }
  }
  return fg;
};

const updateGraph = async ({ oldGraph, newGraph }) => {
  const keys = Object.keys({ ...oldGraph.files, ...newGraph.files });
  for (const key of keys) {
    if (!!newGraph.files[key]) {
      if (!!oldGraph.files[key]) {
        //do not update tags from rescans:
        newGraph.files[key].tags = oldGraph.files[key].tags;
        oldGraph.updateVertex(newGraph.files[key]);
      } else {
        oldGraph.addVertex(newGraph.files[key]);
        for (tag of Object.keys(newGraph.files[key].tags)) {
          oldGraph.addEdge(newGraph.tags[tag], newGraph.files[key]);
        }
      }
    } else {
      if (oldGraph.files[key].filetype !== "Link") {
        oldGraph.removeVertex(oldGraph.files[key]);
      }
    }
  }
};

const graphFromPath = async ({ path, graph, universalTags }) => {
  let newGraph = new FileGraph({});
  await buildGraph({
    path: path,
    fg: newGraph,
    universalTags: universalTags || [],
  });

  // for all existingfilekeys-
  // if its in the new files:
  // update the old data, delete from new files object
  // add
  //
  // delete from new files, delete it from each of the tags it belongs to
  if (!!graph) {
    await updateGraph({ oldGraph: graph, newGraph: newGraph });
    delete newGraph;
  } else {
    graph = newGraph;
  }

  return graph;
};

module.exports = { buildGraph, graphFromPath, updateGraph };
