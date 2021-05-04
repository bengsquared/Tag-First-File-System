const appicon = require("osx-fileicon");

class FileGraph {
  constructor(obj) {
    this.files = obj ? obj.files || {} : {};
    this.tags = obj ? obj.tags || {} : {};
  }

  addVertex(vertex) {
    if (!!vertex.id && !!vertex.type && !this[vertex.type][vertex.id]) {
      this[vertex.type][vertex.id] = {
        files: {},
        tags: {},
        ...vertex,
      };
    }
  }

  addEdge(source, destination) {
    if (!this[destination.type][destination.id]) {
      this.addVertex(destination);
    }
    if (!this[source.type][source.id]) {
      this.addVertex(source);
    }
    if (
      this[destination.type][destination.id] &&
      this[source.type][source.id]
    ) {
      this[source.type][source.id][destination.type][destination.id] = true;
      this[destination.type][destination.id][source.type][source.id] = true;
    }
  }

  removeEdge(source, destination) {
    delete this[source.type][source.id][destination.type][destination.id];
    delete this[destination.type][destination.id][source.type][source.id];
    if (source.type === "tags") {
      if (Object.keys(this.tags[source.id].files).length === 0) {
        this.removeVertex(this.tags[source.id]);
      }
    } else if (destination.type === "tags") {
      if (Object.keys(this.tags[destination.id].files).length === 0) {
        this.removeVertex(this.tags[destination.id]);
      }
    }
  }

  removeVertex(vertex) {
    for (const type of Object.keys(this)) {
      for (const key of Object.keys(this[type])) {
        delete this[type][key][vertex.type][vertex.id];
      }
    }
    delete this[vertex.type][vertex.id];
  }

  updateVertex(vertex) {
    if (!!this[vertex.type][vertex.id]) {
      this[vertex.type][vertex.id] = {
        ...this[vertex.type][vertex.id],
        ...vertex,
        files: { ...this[vertex.type][vertex.id].files },
        tags: { ...this[vertex.type][vertex.id].tags },
      };
    }
  }

  async makePreview(fileid) {
    this.files[fileid].ptime = this.files[fileid].mtime;

    appicon(this.files[key].path, (pngData) => {
      this.files[key].preview =
        "data:image/png;base64, " + pngData.toString("base64");
      cnt.count += 1;
      if (cnt.count === len) {
        return true;
      }
    });
  }

  async makePreviews() {
    let cnt = { count: 1 };
    let len = Object.keys(this.files).length;
    for (const key of Object.keys(this.files)) {
      // only do this if the file has been modified since the last preview
      if (this.files[key].mtime > (this.files[key].ptime || 0)) {
        this.files[key].ptime = this.files[key].mtime;

        appicon(this.files[key].path, (pngData) => {
          this.files[key].preview =
            "data:image/png;base64, " + pngData.toString("base64");
          cnt.count += 1;
          if (cnt.count === len) {
            return true;
          }
        });
      }
    }
  }
}

module.exports = FileGraph;
