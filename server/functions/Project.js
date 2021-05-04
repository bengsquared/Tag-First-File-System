const FileGraph = require("./FileGraph");

class Project {
  constructor({ path, graph, name }) {
    this.graph = new FileGraph(graph);
    this.name = name || "New Project";
    this.path = path;
  }
}

module.exports = Project;
