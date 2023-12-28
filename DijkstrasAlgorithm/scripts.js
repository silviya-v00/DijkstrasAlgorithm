
// Graph data
let maxNodesLimit = 26;
let nodes = [];
let edges = [];
let clickedNode = null;

const svg = d3.select("#original-graph")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%");

function UpdateGraph() {
    const nodeSelection = svg.selectAll(".node")
        .data(nodes, d => d.id)
        .join("circle")
        .attr("class", "node")
        .attr("r", 20)
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .style("fill", "blue")
        .text(d => d.label);
    
    const labelSelection = svg.selectAll(".node-label")
        .data(nodes, d => d.id)
        .join("text")
        .attr("class", "node-label")
        .attr("x", d => d.x)
        .attr("y", d => d.y)
        .attr("dy", 5)
        .attr("text-anchor", "middle")
        .style("fill", "white")
        .text(d => d.label);

    const edgeSelection = svg.selectAll(".edge")
        .data(edges)
        .join("line")
        .attr("class", "edge")
        .attr("x1", d => {
            const sourceNode = nodes.find(node => node.id === d.source);
            return sourceNode ? sourceNode.x : 0;
        })
        .attr("y1", d => {
            const sourceNode = nodes.find(node => node.id === d.source);
            return sourceNode ? sourceNode.y : 0;
        })
        .attr("x2", d => {
            const targetNode = nodes.find(node => node.id === d.target);
            return targetNode ? targetNode.x : 0;
        })
        .attr("y2", d => {
            const targetNode = nodes.find(node => node.id === d.target);
            return targetNode ? targetNode.y : 0;
        });

    const edgeTextSelection = svg.selectAll(".edge-text")
        .data(edges)
        .join("text")
        .attr("class", "edge-text")
        .attr("x", d => {
            const sourceNode = nodes.find(node => node.id === d.source);
            const targetNode = nodes.find(node => node.id === d.target);
            return (sourceNode && targetNode) ? ((sourceNode.x + targetNode.x) / 2) : 0;
        })
        .attr("y", d => {
            const sourceNode = nodes.find(node => node.id === d.source);
            const targetNode = nodes.find(node => node.id === d.target);
            return (sourceNode && targetNode) ? ((sourceNode.y + targetNode.y) / 2) : 0;
        })
        .text(d => d.weight);
        
    d3.selectAll(".node, .node-label").raise();
}

function GetNextLabel() {
    const usedLabels = nodes.map(node => node.label);
    let nextLabel = 'A';

    while (usedLabels.includes(nextLabel)) {
        nextLabel = String.fromCharCode(nextLabel.charCodeAt(0) + 1);
    }

    return nextLabel;
}

svg.on("click", function(event) {
    const coords = d3.pointer(event);
    
    const existingNode = nodes.find(node => {
        const dx = coords[0] - node.x;
        const dy = coords[1] - node.y;
        return Math.sqrt(dx * dx + dy * dy) < 20;
    });

    if (existingNode) {
        if (!clickedNode) {
            clickedNode = existingNode;
        } else if (clickedNode.id !== existingNode.id) {
            const existingEdge = edges.find(
                edge =>
                    (edge.source === clickedNode.id && edge.target === existingNode.id) ||
                    (edge.source === existingNode.id && edge.target === clickedNode.id)
            );

            if (!existingEdge) {
                edges.push({
                    source: clickedNode.id,
                    target: existingNode.id,
                    weight: Math.floor(Math.random() * 10) + 1
                });
                UpdateGraph();
            }

            clickedNode = null;
        }
    } else if (nodes.length < maxNodesLimit) {
        clickedNode = null;
        const newNodeLabel = GetNextLabel();
        const newNode = {
            id: nodes.length + 1,
            label: newNodeLabel,
            x: coords[0],
            y: coords[1]
        };
        nodes.push(newNode);
        UpdateGraph();
    }
    
    PopulateNodeDropdown();
});

UpdateGraph();

// Dijkstra's Algorithm
let queue = [];
let V = null;
let adj = new Array(V);

function PriorityEnqueue(element, priority) {
    queue.push({ element, priority });
    queue.sort((a, b) => a.priority - b.priority);
}

function PriorityDequeue() {
    if (IsQueueEmpty()) {
        return null;
    }
    return queue.shift().element;
}

function IsQueueEmpty() {
    return queue.length === 0;
}

function AddEdgeToList(u, v, w) {
    adj[u].push({ v, w });
    adj[v].push({ v: u, w });
}

function FindShortestPath(src) {
    const dist = new Array(V).fill(Infinity);
    const path = new Array(V).fill([]);
    const visited = new Array(V).fill(false);
    const distanceSection = document.getElementById('distance-section');
    distanceSection.innerHTML = ''; // Clear previous content

    PriorityEnqueue(src, 0);
    dist[src] = 0;

    while (!IsQueueEmpty()) {
        const u = PriorityDequeue();

        if (visited[u]) continue;
        visited[u] = true;

        for (const { v, w } of adj[u]) {
            if (!visited[v] && dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                path[v] = [...path[u], u];
                PriorityEnqueue(v, dist[v]);
            }
        }
    }

    const resultHTML = document.createElement('pre');
    resultHTML.appendChild(document.createTextNode('Node Label - Distance from Source (Node Path)\n'));
    for (let i = 0; i < V; i++) {
        const nodeLabel = nodes[i].label;
        const nodePath = GetPathString(path[i], nodeLabel);
        resultHTML.appendChild(document.createTextNode(`${nodeLabel} - ${dist[i] === Infinity ? "Infinity" : dist[i]} ${nodePath}\n`));
    }
    distanceSection.appendChild(resultHTML);
}

function GetPathString(path, nodeLabel) {
    if (path.length === 0 || !nodes[path[0]]) {
        return "";
    } else {
        let pathString = `(${nodes[path[0]].label}`;
        for (let i = 1; i < path.length; i++) {
            const targetLabel = nodes[path[i]].label;
            pathString += ` -> ${targetLabel}`;
        }
        pathString += ` -> ${nodeLabel}`;
        return pathString + ')';
    }
}

function PopulateNodeDropdown() {
    const selectNode = document.getElementById('startNode');
    selectNode.innerHTML = '';
    nodes.forEach(node => {
        const option = document.createElement('option');
        option.value = node.id - 1;
        option.text = `${node.label}`;
        selectNode.appendChild(option);
    });
}

function ApplyDijkstrasAlgorithm() {
    V = nodes.length;

    if (V > 0) {				
        for (let i = 0; i < V; i++) {
            adj[i] = [];
        }

        nodes.forEach(node => {
            edges.forEach(edge => {
                if (edge.source === node.id) {
                    const targetNode = nodes.find(n => n.id === edge.target);
                    if (targetNode) {
                        AddEdgeToList((node.id-1),(targetNode.id-1),edge.weight);
                    }
                }
            });
        });
        
        const startNodeIndex = document.getElementById('startNode').value;
        FindShortestPath(parseInt(startNodeIndex));
    }
}
