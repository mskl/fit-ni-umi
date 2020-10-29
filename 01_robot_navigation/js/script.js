let dragging = false;
let drawing = false;

let svg = d3.select("#map > svg"),
    width = +svg.style("width").replace("px", ""),
    height = +svg.style("height").replace("px", "");

// Original variables
let points = [];
let startPoint;

// All created polygons
let polygons = [];

// Polygon that is currently being drawn
let currentlyDrawing = svg.append("g");

let startEndGroup = svg.append("g");
let linesGroup = svg.append("g");

let robotStartPoint = [63, height/2];
let robotEndPoint = [width-63, height/2];

// All created lines
let lines = [];

startEndGroup.append("circle")
    .attr("cx", robotStartPoint[0])
    .attr("cy", robotStartPoint[1])
    .attr("r", 5)
    .attr("fill", "green");

startEndGroup.append("circle")
    .attr("cx", robotEndPoint[0])
    .attr("cy", robotEndPoint[1])
    .attr("r", 5)
    .attr("fill", "red");

// behaviors
let dragger = d3.behavior.drag()
    .on('drag', handleDrag)
    .on('dragend', function (d) {
        dragging = false;
    });

svg.on('mouseup', function () {
    if (dragging)
        return;
    drawing = true;

    startPoint = [d3.mouse(this)[0], d3.mouse(this)[1]];

    if (d3.event.target.hasAttribute('is-handle')) {
        closePolygon();
        return;
    }

    points.push(startPoint);

    currentlyDrawing.select('polyline').remove();

    let polyline = currentlyDrawing.append('polyline')
        .attr('points', points)
        .style('fill', 'none')
        .attr('stroke', '#000');

    points.forEach(point => {
        currentlyDrawing.append('circle')
            .attr('cx', point[0])
            .attr('cy', point[1])
            .attr('r', 4)
            .attr('fill', 'yellow')
            .attr('stroke', '#000')
            .attr('is-handle', 'true')
            .style({cursor: 'pointer'});
    });
});

function closePolygon() {
    currentlyDrawing.remove();
    currentlyDrawing = svg.append("g");

    drawPolygon(points);

    points = [];
    drawing = false;
}

svg.on('mousemove', function () {
    if (!drawing)
        return;

    // Remove the previous line
    currentlyDrawing.select('line').remove();

    // Add the new line
    currentlyDrawing.append('line')
        .attr('x1', startPoint[0])
        .attr('y1', startPoint[1])
        .attr('x2', d3.mouse(this)[0] + 2)
        .attr('y2', d3.mouse(this)[1])
        .attr('stroke', '#53DBF3')
        .attr('stroke-width', 1);
});

function handleDrag() {
    if (drawing)
        return;
    dragging = true;

    let dragCircle = d3.select(this);
    let newPoints = [];

    let poly = d3.select(this.parentNode).select('polygon');
    let circles = d3.select(this.parentNode).selectAll('circle');

    dragCircle.attr('cx', d3.event.x).attr('cy', d3.event.y);

    circles[0].forEach(circle => {
        circle = d3.select(circle);
        newPoints.push([circle.attr('cx'), circle.attr('cy')]);
    });

    poly.attr('points', newPoints);
}

function drawLine(start, end) {
    // Check intersections with all existing polygons
    for (let p = 0; p < polygons.length; p++) {
        let polygonPoints = pointsFromPolygon(polygons[p][0][0]);
        for (let r = 0; r < polygonPoints.length; r++) {
            let polyStart = polygonPoints[r];
            let polyEnd = polygonPoints[(r+1) % polygonPoints.length];
            if (intersects(start, end, polyStart, polyEnd)) {
                return null;
            }
        }
    }

    let line = linesGroup.append('line')
        .style("stroke", "black")
        .style("stroke-width", 1)
        .attr("x1", start[0])
        .attr("y1", start[1])
        .attr("x2", end[0])
        .attr("y2", end[1]);

    lines.push(line);
}

function drawPolygon(polyPoints) {
    let polygonGroup = svg.append('g');

    let polygon = polygonGroup.append('polygon')
        .attr('points', polyPoints)
        .style('fill', getRandomColor());

    for (let i = 0; i < polyPoints.length; i++) {
        let circle = polygonGroup.selectAll('circles')
            .data([polyPoints[i]])
            .enter()
            .append('circle')
            .attr('cx', polyPoints[i][0])
            .attr('cy', polyPoints[i][1])
            .attr('r', 4)
            .attr('fill', '#FDBC07')
            .attr('stroke', '#000')
            .attr('is-handle', 'true')
            .style({cursor: 'move'})
            .call(dragger);
    }

    // Add all new possible lines
    polyPoints.forEach(polyPoint => {
        drawLine(polyPoint, robotStartPoint);
        drawLine(polyPoint, robotEndPoint);

        polygons.forEach(polygon => {
            let points = pointsFromPolygon(polygon[0][0]);
            points.forEach(p2Point => {
                drawLine(polyPoint, p2Point);
            })
        });
    });

    // Delete all intersecting lines
    for (let startIndex = 0; startIndex < polyPoints.length; startIndex++) {
        let endIndex = (startIndex+1) % polyPoints.length;
        lines = lines.filter(line => {
            let [start, end] = pointsFromLine(line);
            let intersection = intersects(polyPoints[startIndex], polyPoints[endIndex], start, end);
            if (intersection) {
                line.remove();
            }
            return !intersection;
        });
    }

    polygons.push(polygon);
}

// Draw the baseline
drawLine(robotStartPoint, robotEndPoint);

// Add some polygon for testing purposes
drawPolygon([[293, 196], [414, 64], [431, 190]]);


