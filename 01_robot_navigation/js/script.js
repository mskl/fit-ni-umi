let drawing = false;

let svg = d3.select("#map > svg"),
    width = +svg.style("width").replace("px", ""),
    height = +svg.style("height").replace("px", "");

// Original variables
let currentNodes = [];

let allConnections = [];
class Connection {
    /** Factory method to that tries to generate a connections and possibly returns null if failed */
    static tryCreate(node1, node2, inner) {
        let connectionsToDestroy = [];

        for (let c = 0; c < allConnections.length; c++) {
            let connection = allConnections[c];
            if (intersects(node1.position, node2.position, connection.node1.position, connection.node2.position)) {
                if (inner === true && connection.inner === true) {
                    // Both connections are inner, stop creating polygon
                    return null;
                } else if (inner === true) {
                    // This connection is inner, destroy the other one
                    connectionsToDestroy.push(connection);
                } else if (connection.inner === true) {
                    // Other connection is inner, do not create
                    return null;
                }
            }
        }

        // Destroy all scheduled connections
        connectionsToDestroy.forEach(connection=>{
            connection.destroy();
        });

        return new Connection(node1, node2, inner);
    }

    /** Store the connection inside global array and nodes and draw a visible line */
    constructor(node1, node2, inner) {
        this.node1 = node1;
        this.node2 = node2;
        this.inner = inner;

        node1.connections.push(this);
        node2.connections.push(this);
        this.graphic_line = this.draw(node1, node2);

        allConnections.push(this);
    }

    /** Destroy the connection by removing all references and also the graphical object */
    destroy() {
        allConnections = allConnections.filter(obj => obj !== this);
        this.node1.connections = this.node1.connections.filter(obj => obj !== this);
        this.node2.connections = this.node2.connections.filter(obj => obj !== this);
        this.graphic_line.remove();
    }

    /** Check if the connection contains a given node */
    contains(node) {
        return node === this.node1 || node === this.node2;
    }

    /** Get the other node from the connection. Return null if neither was present */
    other(node) {
        if (node === this.node1) {
            return this.node2;
        } else if (node === this.node2) {
            return this.node1;
        } else {
            return null;
        }
    }

    /** Get the length of the connection */
    length() {
        let dx = this.node1.position[0] - this.node2.position[0];
        let dy = this.node1.position[1] - this.node2.position[1];

        return Math.sqrt( Math.pow(dx, 2) + Math.pow(dy, 2) );
    }

    /** Draw the line between the points and return a reference */
    draw() {
        return linesGroup.append('line')
            .style("stroke", "black")
            .style("stroke-width", 1)
            .attr("x1", this.node1.position[0])
            .attr("y1", this.node1.position[1])
            .attr("x2", this.node2.position[0])
            .attr("y2", this.node2.position[1]);
    }
}

let allNodes = [];
class Node {
    constructor(position) {
        this.position = position;
        this.connections = [];

        // Djiskra data
        this.distance = Infinity;
        this.previous_connection = null;

        allNodes.push(this);
    }

    destroy() {
        allNodes = allNodes.filter(obj => obj !== this);

        let connectionsCopy = this.connections.slice();
        connectionsCopy.forEach(connection => {
           connection.destroy();
        });
    }

    drawCircle(group, color) {
        group.append("circle")
            .attr("cx", this.position[0])
            .attr("cy", this.position[1])
            .attr("r", 5)
            .attr("fill", color);
    }
}

// All created polygons
let polygons = [];
class Polygon {
    static tryCreate(nodes) {
        // Create the inner connections within inner nodes
        for (let i = 0; i < nodes.length; i++) {
            let iNode = nodes[i];
            let jNode = nodes[(i+1) % nodes.length];

            // Adds a connection into the connections array
            if (Connection.tryCreate(iNode, jNode, true) === null) {
                return null;
            }
        }

        // Create connections with all of the other nodes
        nodes.forEach(thisNode => {
            allNodes.forEach(otherNode => {
                if (thisNode !== otherNode) {
                    Connection.tryCreate(thisNode, otherNode, false);
                }
            });
        });

        return new Polygon(nodes);
    }

    constructor(nodes, inner_connections) {
        this.nodes = nodes;
        this.graphic_polygon = this.draw();

        runDjiskra();
        polygons.push(this);
    }

    draw() {
        return polygonGroup.append('polygon')
            .attr('points', this.nodes.map(x => x.position))
            .style('fill', getRandomColor())
            .style('opacity', 0.2);
    }
}

// Polygon that is currently being drawn
let currentlyDrawing = svg.append("g");
let polygonGroup = svg.append("g");
let startEndGroup = svg.append("g");
let linesGroup = svg.append("g");

svg.on('mouseup', function () {
    drawing = true;

    currentNodes.push(
        new Node([d3.mouse(this)[0], d3.mouse(this)[1]])
    );

    if (currentNodes.length === 3) {
        let newPolygon = Polygon.tryCreate(currentNodes);
        if (newPolygon === null) {
            currentNodes.forEach(node => {
                node.destroy();
            });
        }

        currentlyDrawing.remove();
        currentlyDrawing = svg.append("g");
        currentNodes = [];
        drawing = false;

        return;
    }

    // Redraw the polyline
    currentlyDrawing.select('polyline').remove();
    currentlyDrawing.append('polyline')
        .attr('points', currentNodes.map(x=>x.position))
        .style('fill', 'none')
        .attr('stroke', '#000');
});

svg.on('mousemove', function () {
    if (!drawing) return;

    // Remove the previous line
    currentlyDrawing.select('line').remove();

    // Add the new line
    currentlyDrawing.append('line')
        .attr('x1', currentNodes.last().position[0])
        .attr('y1', currentNodes.last().position[1])
        .attr('x2', d3.mouse(this)[0] + 2)
        .attr('y2', d3.mouse(this)[1])
        .attr('stroke', '#53DBF3')
        .attr('stroke-width', 1);
});

/** Run the djiskra from the staring node to the end node and show the result */
function runDjiskra() {
    // Reset the distances
    allNodes.forEach(node => {
       node.distance = Infinity;
       node.previous_connection = null;
    });

    // Reset the line widths
    allConnections.forEach(connection => {
        connection.graphic_line.style("stroke-width", 1);
    });

    // Do a shallow copy of all nodes
    let queue = new TinyQueue(allNodes.slice(), nodeCompare);

    // Run the Djiskra search algorithm
    startNode.distance = 0;

    let endNodeFound = false;
    while (queue.length > 0) {
        let bestNode = queue.pop();
        bestNode.connections.forEach(connection=>{
            let otherNode = connection.other(bestNode);

            if (otherNode === endNode) {
                endNodeFound = true;
            }

            let alt = bestNode.distance + connection.length();
            if (alt < otherNode.distance) {
                otherNode.distance = alt;
                otherNode.previous_node = bestNode;
                otherNode.previous_connection = connection;
            }
        })
    }

    let prevConnection = endNode.previous_connection;
    let prevNode = endNode;

    let sumDistance = 0;

    // Do the backtracking step
    while (prevConnection !== null) {
        prevConnection.graphic_line.style("stroke-width", 3);

        sumDistance += prevConnection.length();

        if (prevConnection.other(prevNode).previous_connection === null) {
            if (prevConnection.other(prevNode) !== startNode) {
                throw Error("Did not reach the previous node");
            }
        }

        prevNode = prevConnection.other(prevNode);
        prevConnection = prevNode.previous_connection
    }

    return sumDistance;
}

// Start and end node
let startNode = new Node([63, height/2]);
let endNode = new Node([width-63, height/2]);

// Draw the connection between the two basic nodes
Connection.tryCreate(startNode, endNode, false);

// Draw the points for start and end
startNode.drawCircle(startEndGroup, "green");
endNode.drawCircle(startEndGroup, "red");

// Add some polygon for testing purposes
let examplePolygon = Polygon.tryCreate([
    new Node([293, 300]),
    new Node([414, 64]),
    new Node([431, 190])
]);
