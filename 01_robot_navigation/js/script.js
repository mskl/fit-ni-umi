let drawing = false;

let svg = d3.select("#map > svg"),
    width = +svg.style("width").replace("px", ""),
    height = +svg.style("height").replace("px", "");

// Original variables
let currentNodes = [];

let allConnections = [];
class Connection {
    static tryCreate(node1, node2, inner) {
        allConnections.forEach(connection => {
            // Remove intersecting lines and possibly fail
            if (intersects(node1.position, node2.position, connection.node1.position, connection.node2.position)) {
                if (connection.inner === true) {
                    return null;
                } else {
                    connection.destroy();
                }
            }
        });

        return new Connection(node1, node2, inner);
    }

    constructor(node1, node2, inner) {
        this.node1 = node1;
        this.node2 = node2;

        // Is the connection non-breaking - on the edge of polygon
        this.inner = inner;

        this.graphic_line = this.draw(node1, node2);

        allConnections.push(this);
        node1.connections.push(this);
        node2.connections.push(this);
    }

    destroy() {
        allConnections = allConnections.filter(obj => obj !== this);
        this.node1.connections = this.node1.connections.filter(obj => obj !== this);
        this.node2.connections = this.node2.connections.filter(obj => obj !== this);
        this.graphic_line.remove();
    }

    contains(node) {
        return node === this.node1 || node === this.node2;
    }

    other(node) {
        if (node === this.node1) {
            return this.node2;
        } else if (node === this.node2) {
            return this.node1;
        } else {
            throw Error("Connection does not contain node");
        }
    }

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

class Node {
    constructor(position) {
        this.position = position;
        this.connections = [];
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
        let new_inner_connections = [];

        for (let i = 0; i < nodes.length; i++) {
            let iNode = nodes[i];
            let jNode = nodes[(i+1) % nodes.length];

            // Adds a connection into the connections array
            let inner_connection = Connection.tryCreate(iNode, jNode, true);
            if (inner_connection !== null) {
                new_inner_connections.push(inner_connection);
            } else {
                return null;
            }
        }

        return new Polygon(nodes, new_inner_connections);
    }

    constructor(nodes, inner_connections) {
        this.nodes = nodes;
        this.inner_connections = inner_connections;

        this.graphic_polygon = this.draw();
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

    currentNodes.push(new Node([d3.mouse(this)[0], d3.mouse(this)[1]]));

    if (currentNodes.length === 3) {
        // Try to create a polygon
        Polygon.tryCreate(currentNodes);

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


// Start and end node
let startNode = new Node([63, height/2]);
let endNode = new Node([width-63, height/2]);

// Draw the connection between the two basic nodes
let defaultConnection = new Connection(startNode, endNode);

// Draw the points for start and end
startNode.drawCircle(startEndGroup, "green");
endNode.drawCircle(startEndGroup, "red");

// Add some polygon for testing purposes
let examplePolygon = Polygon.tryCreate([
    new Node([293, 196]),
    new Node([414, 64]),
    new Node([431, 190])
]);

