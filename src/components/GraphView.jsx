import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import Graph from "react-graph-vis";

const GraphView = ({ files, tags }) => {
  const options = {
    layout: {
      hierarchical: false,
    },
    edges: {
      color: "#000000",
    },
    height: "500px",
  };

  const events = {
    select: function (event) {
      var { nodes, edges } = event;
    },
  };

  var graphJSON = {
    nodes: [],
    edges: [],
  };

  for (let key of Object.keys(tags)) {
    graphJSON.nodes.push({ id: key, label: key });
  }
  for (let key of Object.keys(files)) {
    graphJSON.nodes.push({ id: key, label: files[key].name });
    for (let tag of Object.keys(files[key].tags)) {
      graphJSON.edges.push({ from: tag, to: key, id: tag + key });
    }
  }
  console.log(graphJSON);

  return <Graph graph={graphJSON} options={options} events={events} />;
};

export default GraphView;
