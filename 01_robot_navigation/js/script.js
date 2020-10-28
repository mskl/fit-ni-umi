let dragging = false;
let drawing = false;

let svg = d3.select("#map > svg"),
    width = +svg.style("width").replace("px", ""),
    height = +svg.style("height").replace("px", "");

// Store points when creating polygon
let points = [];

// All created polygons
let polygons = [];

// Polygon that is currently being drawn
let currentlyDrawing = svg.append("g");

let startEndGroup = svg.append("g");
let linesGroup = svg.append("g");

let startPoint = [63, height/2];
let endPoint = [width-63, height/2];

// All created lines
let lines = [];

startEndGroup.append("circle")
    .attr("cx", startPoint[0])
    .attr("cy", startPoint[1])
    .attr("r", 5)
    .attr("fill", "green");

startEndGroup.append("circle")
    .attr("cx", endPoint[0])
    .attr("cy", endPoint[1])
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

    points.push(d3.mouse(this));
    currentlyDrawing.select('polyline').remove();

    let polyline = currentlyDrawing.append('polyline')
        .attr('points', points)
        .style('fill', 'none')
        .attr('stroke', '#000');

    for (let i = 0; i < points.length; i++) {
        currentlyDrawing.append('circle')
            .attr('cx', points[i][0])
            .attr('cy', points[i][1])
            .attr('r', 4)
            .attr('fill', 'yellow')
            .attr('stroke', '#000')
            .attr('is-handle', 'true')
            .style({cursor: 'pointer'});
    }
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
    else
        dragging = true;

    let dragCircle = d3.select(this);
    let newPoints = [];
    let circle;

    let poly = d3.select(this.parentNode).select('polygon');
    let circles = d3.select(this.parentNode).selectAll('circle');

    dragCircle.attr('cx', d3.event.x).attr('cy', d3.event.y);

    for (let i = 0; i < circles[0].length; i++) {
        circle = d3.select(circles[0][i]);
        newPoints.push([circle.attr('cx'), circle.attr('cy')]);
    }

    poly.attr('points', newPoints);
}

function drawLine(start, end) {
    // Check intersections with all existing polygons
    // for (let p = 0; p < polygons.length; p++) {
    //     let polygonPoints = pointsFromPolygon(polygons[p]);
    //     for (let r = 0; r < polygonPoints.length; r++) {
    //         let polyStart = polygonPoints[r];
    //         let polyEnd = polygonPoints[(r+1) % polygonPoints.length];
    //         if (intersects(start, end, polyStart, polyEnd)) {
    //             return null;
    //         }
    //     }
    // }

    let line = linesGroup.append('line')
        .style("stroke", "black")
        .style("stroke-width", 3)
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

    // Delete all intersecting lines
    // for (let startIndex = 0; startIndex < polyPoints.length; startIndex++) {
    //     let endIndex = (startIndex+1) % polyPoints.length;
    //     lines = lines.filter(line => {
    //         let [start, end] = pointsFromLine(line);
    //         let intersection = intersects(polyPoints[startIndex], polyPoints[endIndex], start, end);
    //         if (intersection) {
    //             line.remove();
    //         }
    //         return !intersection;
    //     });
    // }

    // Add all new possible lines
    polyPoints.forEach(polyPoint => {
        drawLine(polyPoint, startPoint);
        drawLine(polyPoint, endPoint);

        polygons.forEach(polygon => {
           pointsFromPolygon(polygon).forEach(p2Point => {
               drawLine(polyPoint, p2Point);
           })
        });
    });

    polygons.push(polygon);
}

// Draw the baseline
drawLine(startPoint, endPoint);

// Add some polygon for testing purposes
drawPolygon([[293, 196], [414, 64], [431, 190]]);


