/*
Sprite.js v1.2.0 collision extension
Copyright (c) 2011 Batiste Bieler and contributors, https://github.com/batiste/sprite.js
*/

(function(global){

var Sprite = sjs.Sprite;

function inPolygon(polygonA, polygonB, debug) {

    var h, i, j,
        collision = false;

    // test to see if just a point coordinate (x,y) was sent in
    if (polygonA.hasOwnProperty('x')) {
        // convert to single-length array for traversal
        polygonA = [polygonA];
    }

    for (h = 0; h < polygonA.length; h += 1) {
        if (collision === false) {
            for (i = 0, j = polygonB.length - 1; i < polygonB.length; j = i++) {
                if (((polygonB[i].y > polygonA[h].y) !== (polygonB[j].y > polygonA[h].y))
                    && (polygonA[h].x < (polygonB[j].x - polygonB[i].x) * (polygonA[h].y - polygonB[i].y) / (polygonB[j].y - polygonB[i].y) + polygonB[i].x)
                ) {
                    collision = !collision;
                }
            }
        }
    }
 
    return collision;
}

function pointToLineDistance(x, y, x1, y1, x2, y2) {
    var A = x - x1;
    var B = y - y1;
    var C = x2 - x1;
    var D = y2 - y1;

    var dot = A * C + B * D;
    var len_sq = C * C + D * D;
    var param = dot / len_sq;

    var xx, yy;

    if (param < 0 || (x1 == x2 && y1 == y2)) {
        xx = x1;
        yy = y1;
    }
    else if (param > 1) {
        xx = x2;
        yy = y2;
    }
    else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    var dx = x - xx;
    var dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy);
};

// TODO: most expensive function, make it faster
function rectangleEdges(rect) {
    // Return the 4 edges coordinate of the rectangle according the the rotation
    // at the center of the rectangle.
    var distance = sjs.math.hypo(rect.w / 2, rect.h / 2);
    var angle = Math.atan2(rect.h, rect.w);
    // 4 angles to reach the edges, starting up left (down left in the sprite.js coordinate)
    // and turning counter-clockwise
    var angles = [Math.PI - angle, angle, -angle, Math.PI + angle];
    var points = [];
    for(var i=0; i < 4; i++) {
        points.push([
            distance * Math.cos(rect.angle + angles[i]) + rect.x + rect.w/2,
            distance * Math.sin(rect.angle + angles[i]) + rect.y + rect.h/2
        ]);
    }
    return points;
};

function shapeCenter(s) {
    return {
        x:(s.x + s.w / 2),
        y:(s.y + s.h / 2)
    };
}

function makeBoundingBox(a) {
    if(!a.shape) {
        return a;
    }
    return {
        x:a.x + a.shape.x,
        y:a.y + a.shape.y,
        type: a.shape.type || a.type,
        w:a.shape.w,
        h:a.shape.h,
        angle:a.angle
    };
}

function shapeCollides(a, b) {

    a = makeBoundingBox(a);
    b = makeBoundingBox(b);

    // quick shortcut
    if(Math.abs(a.x - b.x) > a.w + b.w)
       return false;

    if(Math.abs(a.y - b.y) > a.h + b.h)
       return false;

    if(a.type == "rectangle") {
        if(b.type == "rectangle") {
            return rectangleCollides(a, b);
        }
        if(b.type == "circle") {
            return rectangleCircleCollides(a, b);
        }
    }

    if(a.type == "circle") {
        if(b.type == "circle") {
            return circleCollides(a, b)
        }
        if(b.type == "rectangle") {
            return rectangleCircleCollides(b, a);
        }
    }
}

function rectangleCollides(a, b) {

    // shortcut for unrotated rectangles.
    if(a.angle == 0 && b.angle == 0) {
        if(a.x > b.x) {
            var x_inter = a.x - b.x < b.w;
        } else {
            var x_inter = b.x - a.x < a.w;
        }
        if(x_inter == false)
            return false;

        if(a.y > b.y) {
            var y_inter = a.y - b.y < b.h;
        } else {
            var y_inter = b.y - a.y < a.h;
        }
        return y_inter;
    };

    // cache the expensive edges function
    a.edges = rectangleEdges(a);
    b.edges = rectangleEdges(b);

    for(var i=0; i<4; i++) {
        if(isPointInRectangle(b.edges[i][0], b.edges[i][1], a))
            return true
    }
    for(var i=0; i<4; i++) {
        if(isPointInRectangle(a.edges[i][0], a.edges[i][1], b))
            return true
    }
    return false;
}

function rectangleCircleCollides(r, c) {
    var edges = rectangleEdges(r);
    var c1 = shapeCenter(c);
    for(var i=0; i < 4; i++) {
        if(pointToLineDistance(c1.x, c1.y,
            edges[i][0], edges[i][1],
            edges[(i+1) % 4][0], edges[(i+1) % 4][1])
            < c.w / 2) {
            return true;
        }
    }
    return false;
}

function circleCollides(a, b) {
    var c1 = shapeCenter(a);
    var c2 = shapeCenter(b);
    return sjs.math.hypo(c1.x - c2.x, c1.y - c2.y) < a.w / 2 + b.w / 2;
}

function isPointInRectangle(x, y, rect) {
    // Return true if the point is within the rectangle surface.
    // the edges need to the be precalcualted
    if(rect.angle == 0 || rect.angle === undefined)
        return (x >= rect.x && x < rect.x+rect.w
            && y >= rect.y && y < rect.y+rect.h);

    for(var i=0; i<4; i++) {
        var j = i+1;
        if(j>3)
            j=0;
        // if on the right of the line, the point
        // cannot be in the rectangle
        if(sjs.math.lineSide(
            rect.edges[i][0], rect.edges[i][1],
            rect.edges[j][0], rect.edges[j][1],
            x, y
        )) {
            return false
        }
    }
    return true;
};

var image_data_cache = {};

function isPointInImage(x, y, w, h, img) {
    x = x | 0;
    y = y | 0;
    if(x < 0 || y < 0) {
        return false;
    }
    if(x > w || y > h) {
        return false;
    }

    var imgd;
    if(!image_data_cache[img.src]) {
        var canvas = global.document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.width;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, img.width, img.height);
        imgd = ctx.getImageData(0, 0, img.width, img.height);
        image_data_cache[img.src] = imgd;
    } else {
        imgd = image_data_cache[img.src];
    }

    var index = (y *  img.width * 4 + x * 4) + 3;
    var alpha = imgd.data[index];

    return alpha > 50;
}

Sprite.prototype.isPointIn = function isPointIn(x, y) {
    this.edges = rectangleEdges(this);
    return isPointInRectangle(x, y, this);
}

Sprite.prototype.collidesWith = function collidesWith(sprite) {
    if(this.id == sprite.id)
        return true;
    return shapeCollides(this, sprite);
};

Sprite.prototype.edges = function edges() {
    return rectangleEdges(this);
};

Sprite.prototype.collidesWith = function collidesWith(sprite) {
    if(this.id == sprite.id)
        return true;
    return shapeCollides(this, sprite);
};

Sprite.prototype.collidesWithArray = function collidesWithArray(sprites) {
    // Return a sprite if the current sprite has any collision with the Array provided
    // a sprite cannot collides with itself.

    // Make the List works
    if(sprites.list)
        sprites = sprites.list;

    for(var i=0, sprite; sprite = sprites[i]; i++) {
        if(this!=sprite && this.collidesWith(sprite)) {
            return sprite;
        }
    }
    return false;
};

function resolveCollisions() {
    // return each pair of collision
    var collisions = {};
    // the function accept any amount of array of elements
    if(arguments.length == 1)
        var elements = arguments[0];
    else
        var elements = Array.prototype.concat.apply([], arguments);
    // search collisions elements by elements
    // O(N/2 * N/2)
    for(var i=0; i<elements.length; i++) {
        var el = elements[i];
        for(var j=i+1; j<elements.length; j++) {
            if(el.collidesWith(elements[j])) {
                collisions[el] = elements[j];
                collisions[elements[j]] = el;
            }
        }
    }
    return collisions;
}

global.sjs.collision = {
    'find': resolveCollisions,
    'isPointInImage': isPointInImage,
    'isPointInRectangle': isPointInRectangle,
    'inPolygon': inPolygon
};

})(this);
