(function(global){

sjs.Sprite.prototype.isPointIn = function isPointIn(x, y) {
    // Return true if the point is within the sprite surface
    if(this.angle == 0)
        return (x >= this.x && x < this.x+this.w
            && y >= this.y && y < this.y+this.h);
    return this.isPointInAngle(x, y);
};

sjs.Sprite.prototype.isPointInAngle = function pointInAngle(x, y) {
    // Return true if the point is within the sprite surface
    // handle the case where the sprite has an angle
    var edges = this.edges();
    for(var i=0; i<4; i++) {
        var j = i+1;
        if(j>3)
            j=0;
        // if on the right of the line, the point
        // cannot be in the rectangle
        if(sjs.math.lineSide(
            edges[i][0], edges[i][1],
            edges[j][0], edges[j][1],
            x, y
        )) {
            return false
        }
    }
    return true;
}

sjs.Sprite.prototype.collidesWith = function collidesWith(sprite) {
    // Return true if the current sprite has any collision with the Sprite provided
    if(this.angle != 0 || sprite.angle != 0) {
        return this.collidesWithAngle(sprite);
    }

    if(sprite.x > this.x) {
        var x_inter = sprite.x - this.x < this.w - 1;
    } else {
        var x_inter = this.x - sprite.x  < sprite.w;
    }
    if(x_inter == false)
        return false;

    if(sprite.y > this.y) {
        var y_inter = sprite.y - this.y < this.h;
    } else {
        var y_inter = this.y - sprite.y < sprite.h;
    }
    return y_inter;
};

sjs.Sprite.prototype.collidesWithAngle = function collidesWithAngle(sprite) {
    var edges = sprite.edges();
    for(var i=0; i<4; i++) {
        if(this.isPointInAngle(edges[i][0], edges[i][1]))
            return true
    }
    var edges = this.edges();
    for(var i=0; i<4; i++) {
        if(sprite.isPointInAngle(edges[i][0], edges[i][1]))
            return true
    }
    return false;
}

sjs.Sprite.prototype.edges = function edges() {
    // Return the 4 edges coordinate of the rectangle
    var distance = sjs.math.hypo(this.w / 2, this.h / 2);
    var angle = Math.atan2(this.h, this.w);
    // 4 angles to reach the edges, starting up left (down left in the sprite.js coordinate)
    // and turning counter-clockwise
    var angles = [Math.PI - angle, angle, -angle, Math.PI + angle];
    var points = [];
    for(var i=0; i < 4; i++) {
        points.push([
            distance * Math.cos(this.angle + angles[i]) + this.x + this.w/2,
            distance * Math.sin(this.angle + angles[i]) + this.y + this.h/2
        ]);
    }
    return points;
};

sjs.Sprite.prototype.collidesWithArray = function collidesWithArray(sprites) {
    // Return a sprite if the current sprite has any collision with the Array provided
    // a sprite cannot collides with itself
    // Make the SpriteList works
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
    var collisions = {};
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

global.sjs.collision = {find:resolveCollisions};

})(this);