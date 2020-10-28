let dragging = false;
let drawing = false;

let svg = d3.select("#map > svg"),
    width = +svg.style("width").replace("px", ""),
    height = +svg.style("height").replace("px", "");

let g;

// Store points when creating polygon
let points = [];

// All created polygons
let polygons = [];

// All created lines
let lines = [];

let startEndGroup = svg.append("g");
let linesGroup = svg.append("g");

const ptsOffset = 63;
let startPoint = [ptsOffset, height/2];
let endPoint = [width-ptsOffset, height/2];
points.push([startPoint, endPoint]);
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
    else
        drawing = true;

    startPoint = [d3.mouse(this)[0], d3.mouse(this)[1]];

    if (svg.select('g.drawPoly').empty()) {
        g = svg.append('g').attr('class', 'drawPoly');
    }

    if (d3.event.target.hasAttribute('is-handle')) {
        closePolygon();
        return;
    }

    points.push(d3.mouse(this));
    g.select('polyline').remove();

    let polyline = g.append('polyline')
        .attr('points', points)
        .style('fill', 'none')
        .attr('stroke', '#000');

    for (let i = 0; i < points.length; i++) {
        g.append('circle')
            .attr('cx', points[i][0])
            .attr('cy', points[i][1])
            .attr('r', 4)
            .attr('fill', 'yellow')
            .attr('stroke', '#000')
            .attr('is-handle', 'true')
            .style({cursor: 'pointer'});
    }
});

function drawPolygon(_points) {
    let g = svg.append('g');

    let polygon = g.append('polygon')
        .attr('points', _points)
        .style('fill', getRandomColor());

    for (let i = 0; i < _points.length; i++) {
        let circle = g.selectAll('circles')
            .data([_points[i]])
            .enter()
            .append('circle')
            .attr('cx', _points[i][0])
            .attr('cy', _points[i][1])
            .attr('r', 4)
            .attr('fill', '#FDBC07')
            .attr('stroke', '#000')
            .attr('is-handle', 'true')
            .style({cursor: 'move'})
            .call(dragger);
    }

    polygons.push(polygon);
}

function closePolygon() {
    svg.select('g.drawPoly').remove();
    drawPolygon(points);
    points = [];
    drawing = false;
}

svg.on('mousemove', function () {
    if (!drawing)
        return;

    let g = d3.select('g.drawPoly');

    // Remove the previous line
    g.select('line').remove();

    // Add the new line
    g.append('line')
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
    let line = linesGroup.append('line')
        .style("stroke", "lightgreen")
        .style("stroke-width", 3)
        .attr("x1", start[0])
        .attr("y1", start[1])
        .attr("x2", end[0])
        .attr("y2", end[1]);

    return line
}

// Add some polygon for testing purposes
drawPolygon([[293, 196], [414, 64], [431, 190]]);
