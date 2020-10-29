// returns true iff the line from (s1[0],s1[1])->(e1[0],e1[1]) intersects with (s2[0],s2[1])->(e2[0],e2[1])
// src: https://stackoverflow.com/questions/9043805/test-if-two-lines-intersect-javascript-function
function intersects(s1, e1, s2, e2) {
    var det, gamma, lambda;
    det = (e1[0] - s1[0]) * (e2[1] - s2[1]) - (e2[0] - s2[0]) * (e1[1] - s1[1]);
    if (det === 0) {
        return false;
    } else {
        lambda = ((e2[1] - s2[1]) * (e2[0] - s1[0]) + (s2[0] - e2[0]) * (e2[1] - s1[1])) / det;
        gamma = ((s1[1] - e1[1]) * (e2[0] - s1[0]) + (e1[0] - s1[0]) * (e2[1] - s1[1])) / det;
        return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
    }
}


function getRandomColor() {
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += '0123456789ABCDEF'.split('')[Math.floor(Math.random() * 16)];
    }

    return color;
}

function pointsFromPolygon(elem) {
    return [...elem.points].map((pt) => [pt.x, pt.y]);
}

function pointsFromLine(line) {
    return [
        [line[0][0].x1.baseVal.value, line[0][0].y1.baseVal.value],
        [line[0][0].x2.baseVal.value, line[0][0].y2.baseVal.value]
    ];
}

function pointsFromCircle(circle) {
    return [circle[0][0].getAttribute("cx"), circle[0][0].getAttribute("cy")]
}