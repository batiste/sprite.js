/*
Copyright (c) 2011 Batiste Bieler, https://github.com/batiste/sprite.js

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/* Sprite.js v1.1.0
 *
 * coding guideline
 *
 * CamelCase everywhere (I don't like it but it seems to the standard these days).
 * Private attributes should start with an underline.
 * Tabs have to be 4 spaces (python style).
 * If you contribute don't forget to add your name in the AUTHORS file.
 */

(function(global, undefined){

var sjs = {
    Cycle: Cycle,
    Input: Input,
    Scene: Scene,
    SpriteList:SpriteList,
    Sprite:_Sprite,
    overlay:overlay,
    SrollingSurface:SrollingSurface,
    scenes:[],
    math:{hypo:hypo, mod:mod, normalVector:normalVector}
};

// math function

function mod(n, base) {
    // strictly positive modulo
    return ((n%base)+base)%base;
}

function hypo(x, y) {
    return Math.sqrt(x * x + y * y);
}

function normalVector(vx, vy, intensity) {
    var n = hypo(vx, vy);
    if(n==0)
        return {x:vx, y:vy}
    if(intensity) {
        return {x:((vx/n)*intensity), y:((vy/n)*intensity)}
    }
    return {x:vx/n, y:vy/n};
}

// global z-index
var zindex = 1;

function init_transform_property() {
    var properties = ['transform', 'WebkitTransform', 'MozTransform', 'OTransform', 'msTransform'];
    var p = false;
    while (p = properties.shift()) {
        if (typeof document.body.style[p] !== 'undefined') {
            sjs.tproperty = p;
        }
    }
}

function optionValue(options, name, default_value) {
    if(options && options[name] !== undefined) {
        return options[name];
    }
    return default_value
}

function overlay(x, y, w, h) {
    var div = document.createElement('div');
    var s = div.style;
    s.top = y + 'px';
    s.left = x + 'px';
    s.width = w + 'px';
    s.height = h + 'px';
    s.color = '#fff';
    s.zIndex = 100;
    s.position = 'absolute';
    s.backgroundColor = '#000';
    s.opacity = 0.7;
    return div;
};

var nb_scene = 0;

function Scene(options) {

    if(this.constructor !== arguments.callee)
        return new Scene(options);

    if(!sjs.tproperty)
        init_transform_property();

    this.autoPause = optionValue(options, 'autoPause', true);
    // main function
    this.main = false;

    var div = document.createElement('div');
    div.style.overflow = 'hidden';
    div.style.position = 'relative';
    div.className = 'sjs';
    div.id = 'sjs' + nb_scene;
    this.id = nb_scene;
    nb_scene = nb_scene + 1;
    document.body.appendChild(div);
    this.w = optionValue(options, 'w', 480);
    this.h = optionValue(options, 'h', 320);
    this.dom = div;
    this.dom.style.width = this.w + 'px';
    this.dom.style.height = this.h + 'px';
    this.layers = {};
    this.ticker = null;
    this.useCanvas = optionValue(options, "useCanvas",
        window.location.href.indexOf('canvas') != -1)

    // needs to be done after this.useCanvas
    this.Layer("default");
    sjs.scenes.push(this);
    return this;
}

Scene.prototype.constructor = Scene;

Scene.prototype.Sprite = function SceneSprite(src, layer) {
    /* an actual shortcut for sjs.Sprite */
    return new _Sprite(this, src, layer);
}

Scene.prototype.Layer = function SceneLayer(name, options) {
    return Layer(this, name, options);
}

// just for convenience
Scene.prototype.Cycle = function SceneCycle(triplets) {
    return new Cycle(triplets);
}

Scene.prototype.Input = function SceneInput() {
    return Input();
}

Scene.prototype.reset = function reset() {
    if(this.ticker)
        this.ticker.pause();
    for(l in this.layers) {
        if(this.layers.hasOwnProperty(l)) {
            this.layers[l].dom.parentNode.removeChild(this.layers[l].dom)
            delete this.layers[l];
        }
    }
    // remove remaining children
    while ( this.dom.childNodes.length >= 1 ) {
        this.dom.removeChild( this.dom.firstChild );
    }
    this.layers = {};
    this.Layer("default");
}

Scene.prototype.Ticker = function Ticker(tickDuration, paint) {
    if(this.ticker) {
        this.ticker.pause();
        this.ticker.paint = function(){}
    }
    this.ticker = new _Ticker(this, tickDuration, paint);
    return this.ticker;
};

Scene.prototype.dialogEvent = function dialogEvent(div, el, event, callback) {
    var that = this;
    var event = function() {
        el.removeEventListener("click", event, false);
        that.dom.removeChild(div);
        callback();
    }
    el.addEventListener("click", event, false);
}

Scene.prototype.dialog = function dialog(options) {
    var div = document.createElement("div");
    div.className = "dialog " + optionValue(options, "class", "");
    var html = optionValue(options, "html");
    div.innerHTML = html;
    var buttons = optionValue(options, "buttons", []);
    for(var i=0; i<buttons.length; i++) {
        var b = buttons[i];
        var button = document.createElement("button");
        button.innerHTML = optionValue(b, "text", "Ok");
        div.appendChild(button);
        var callback = optionValue(b, "callback", function(){})
        this.dialogEvent(div, button, "click", callback);
    }
    div.style.position = "absolute";
    zindex += 1;
    div.style.zIndex = String(zindex);
    this.dom.appendChild(div);
}

// a global cache to load each sprite only one time
var spriteList = {};

// the shameful error function
function error(msg) {alert(msg);}

Scene.prototype.loadImages = function loadImages(images, callback) {
    /* function used to preload the sprite images */
    if(!callback)
        callback = this.main;

    var toLoad = 0;
    for(var i=0; i<images.length; i++) {
        if(!spriteList[images[i]]) {
            toLoad += 1;
            spriteList[images[i]] = {src:images[i], loaded:false, loading:false};
        }
    }
    if(toLoad == 0)
        return callback();

    var total = toLoad;
    var div = sjs.overlay(0, 0, this.w, this.h);
    div.style.textAlign = 'center';
    div.style.paddingTop = (this.h / 2 - 16) + 'px';

    div.innerHTML = 'Loading';
    this.dom.appendChild(div);
    var scene = this;

    function _loadImg(src) {
        spriteList[src].loading = true;
        var img = new Image();
        spriteList[src].img = img;
        img.addEventListener('load', function() {
            spriteList[src].loaded = true;
            toLoad -= 1;
            if(toLoad == 0) {
                scene.dom.removeChild(div);
                callback();
            } else {
                div.innerHTML = 'Loading ' + ((total - toLoad) / total * 100 | 0) + '%';
            }
        }, false);
        img.src = src;
    }

    for(src in spriteList) {
        if(!spriteList[src].loading) {
            _loadImg(src);
        }
    }
}

function _Sprite(scene, src, layer) {

    this.scene = scene;
    this._dirty = {};
    this.changed = false;

    // positions
    this.y = 0;
    this.x = 0;
    this._x_before = 0;
    this._x_rounded = 0;
    this._y_before = 0;
    this._y_rounded = 0;

    //velocity
    this.xv = 0;
    this.yv = 0;
    this.rv = 0;

    this.mass = 0;

    // image
    this.src = null;
    this.img = null;
    this.imgNaturalWidth = null;
    this.imgNaturalHeight = null;

    // width and height of the sprite view port
    this.w = null;
    this.h = null;

    // offsets of the image within the viewport
    this.xoffset = 0;
    this.yoffset = 0;

    this.dom = null;
    this.cycle = null;

    this.xscale = 1;
    this.yscale = 1;
    this.angle = 0;

    this.opacity = 1;
    this.color = false;

    // necessary to get set
    this.layer = null;

    // if it doesn't seems to kouak like a Layer object
    if(layer) {
        // this is a layer object
        if(layer.sprites) {
            this.layer = layer;
        } else {
            // we can receive things like this
            // {x:10, y:10, w:10, h:50, size:[20, 30], layer:var}
            var properties = layer;

            for(p in properties) {
                var value = properties[p];
                var target = this[p];
                if(typeof target == "function")
                    this[p].apply(this, value);
                else if(target !== undefined) {
                    // this is necessary to set cache value properly
                    var setF = 'set'+p.charAt(0).toUpperCase() + p.slice(1);
                    if(this[setF]) {
                        this[setF].apply(this, [value]);
                    } else {
                        // necessary for layer option
                        this[p] = value;
                    }
                }
            }

        }
    }

    // can be set by the properties
    if(!this.layer)
        this.layer = scene.layers['default'];

    if(!this.layer.useCanvas) {
        var d = document.createElement('div');
        d.style.position = 'absolute';
        this.dom = d;
        this.layer.dom.appendChild(d);
    }
    if(src)
        this.loadImg(src);
    return this;
}

_Sprite.prototype.constructor = _Sprite;

/* boilerplate setter functions */

_Sprite.prototype.setX = function setX(value) {
    this.x = value;
    // this secessary for the physic
    this._x_rounded = value | 0;
    this.changed = true;
    return this;
}

_Sprite.prototype.setY = function setY(value) {
    this.y = value;
    this._y_rounded = value | 0;
    this.changed = true;
    return this;
}

_Sprite.prototype.setW = function setW(value) {
    this.w = value;
    this._dirty['w'] = true;
    this.changed = true;
    return this;
}

_Sprite.prototype.setH = function setH(value) {
    this.h = value;
    this._dirty['h'] = true;
    this.changed = true;
    return this;
}

_Sprite.prototype.setXOffset = function setXoffset(value) {
    this.xoffset = value;
    this._dirty['xoffset'] = true;
    this.changed = true;
    return this;
}

_Sprite.prototype.setYOffset = function setYoffset(value) {
    this.yoffset = value;
    this._dirty['yoffset'] = true;
    this.changed = true;
    return this;
}

_Sprite.prototype.setAngle = function setAngle(value) {
    this.angle = value;
    this._dirty['angle'] = true;
    this.changed = true;
    return this;
}

_Sprite.prototype.setColor = function setColor(value) {
    this.color = value;
    this._dirty['color'] = true;
    this.changed = true;
    return this;
}

_Sprite.prototype.setOpacity = function setOpacity(value) {
    this.opacity = value;
    this._dirty['opacity'] = true;
    this.changed = true;
    return this;
}

_Sprite.prototype.setXScale = function setXscale(value) {
    this.xscale = value;
    this._dirty['xscale'] = true;
    this.changed = true;
    return this;
}

_Sprite.prototype.setYScale = function setYscale(value) {
    this.yscale = value;
    this._dirty['yscale'] = true;
    this.changed = true;
    return this;
}

/* end of boilerplate setters */

_Sprite.prototype.rotate = function (v) {
    this.setAngle(this.angle + v);
    return this;
};

_Sprite.prototype.scale = function (x, y) {
    if(this.xscale != x) {
        this.setXScale(x);
    }
    if(y === undefined)
        y = x;
    if(this.yscale != y) {
        this.setYScale(y);
    }
    return this;
};

_Sprite.prototype.move = function (x, y) {
    this.setX(this.x+x);
    this.setY(this.y+y);
    return this;
};

_Sprite.prototype.position = function (x, y) {
    this.setX(x);
    this.setY(y);
    return this;
};

_Sprite.prototype.applyVelocity = function (ticks) {
    if(ticks === undefined)
        ticks = 1;
    if(this.xv != 0)
        this.setX(this.x+this.xv*ticks);
    if(this.yv != 0)
        this.setY(this.y+this.yv*ticks);
    if(this.rv != 0)
        this.setAngle(this.angle+this.rv*ticks);
    return this;
};

_Sprite.prototype.reverseVelocity = function (ticks) {
    if(ticks === undefined)
        ticks = 1;
    if(this.xv != 0)
        this.setX(this.x-this.xv*ticks);
    if(this.yv != 0)
        this.setY(this.y-this.yv*ticks);
    if(this.rv != 0)
        this.setAngle(this.angle-this.rv*ticks);
    return this;
};

_Sprite.prototype.applyXVelocity = function (ticks) {
    if(ticks === undefined)
        ticks = 1;
    if(this.xv != 0)
        this.setX(this.x+this.xv*ticks);
}

_Sprite.prototype.reverseXVelocity = function (ticks) {
    if(ticks === undefined)
        ticks = 1;
    if(this.xv != 0)
        this.setX(this.x-this.xv*ticks);
}

_Sprite.prototype.applyYVelocity = function (ticks) {
    if(ticks === undefined)
        ticks = 1;
    if(this.yv != 0)
        this.setY(this.y+this.yv*ticks);
}

_Sprite.prototype.reverseYVelocity = function (ticks) {
    if(ticks === undefined)
        ticks = 1;
    if(this.yv != 0)
        this.setY(this.y-this.yv*ticks);
}

_Sprite.prototype.rotateVelocity = function (a) {
    var x = this.xv * Math.cos(a) - this.yv * Math.sin(a);
    this.yv = this.xv * Math.sin(a) + this.yv * Math.cos(a);
    this.xv = x;
};

_Sprite.prototype.pointVelocityTo = function (x, y) {
    var intensity = hypo(this.xv, this.yv);
    var v = normalVector(x, y, intensity);
    this.xv = v.x;
    this.yv = v.y;
};


_Sprite.prototype.offset = function (x, y) {
    this.setXOffset(x);
    this.setYOffset(y);
    return this;
};

_Sprite.prototype.size = function (w, h) {
    this.setW(w);
    this.setH(h);
    return this;
};

_Sprite.prototype.remove = function remove() {
    if(this.cycle)
        this.cycle.removeSprite(this);
    if(this.layer && !this.layer.useCanvas) {
        this.layer.dom.removeChild(this.dom);
        this.dom = null;
    }
    //delete this.layer.sprites[this.layerIndex];
    this.layer = null;
    this.img = null;
};

_Sprite.prototype.update = function updateDomProperties () {
    // This is the CPU heavy function.

    if(this.layer.useCanvas == true) {
        return this.canvasUpdate();
    }

    var style = this.dom.style;
    // using Math.round to round integers before changing seems to improve a bit performances
    if(this._x_before != this._x_rounded)
       style.left=(this.x | 0)+'px';
    if(this._y_before != this._y_rounded)
        style.top=(this.y | 0)+'px';

    // cache rounded positions, it's used to avoid unecessary update
    this._x_before = this._x_rounded
    this._y_before = this._y_rounded;

    if(!this.changed)
        return this;

    if(this._dirty['w'])
        style.width=(this.w | 0) +'px';
    if(this._dirty['h'])
        style.height=(this.h | 0)+'px';
    // translate and translate3d doesn't seems to offer any speedup
    // in my tests.
    if(this._dirty['xoffset'] || this._dirty['yoffset'])
        style.backgroundPosition=-(this.xoffset | 0)+'px '+-(this.yoffset | 0)+'px';

    if(this._dirty['opacity'])
        style.opacity = this.opacity;

    if(this._dirty['color'])
        style.backgroundColor = this.color;

    // those transformation have pretty bad perfs implication on Opera,
    // don't update those values if nothing changed
    if(this._dirty['xscale'] || this._dirty['yscale'] || this._dirty['angle']) {
        var trans = "";
        if(this.angle!=0)
            trans += 'rotate('+this.angle+'rad) ';
        if(this.xscale!=1 || this.yscale!=1) {
            trans += ' scale('+this.xscale+', '+this.yscale+')';
        }
        style[sjs.tproperty] = trans;
    }
    // reset
    this.changed = false;
    this._dirty = {};
    return this;
};

_Sprite.prototype.canvasUpdate = function updateCanvas(layer) {
    if(layer)
        var ctx = layer.ctx;
    else
        var ctx = this.layer.ctx;
    ctx.save();
    ctx.translate(this.x + this.w/2 | 0, this.y + this.h/2 | 0);
    ctx.rotate(this.angle);
    if(this.xscale != 1 || this.yscale != 1)
        ctx.scale(this.xscale, this.yscale);
    ctx.globalAlpha = this.opacity;
    ctx.translate(-this.w/2 | 0, -this.h/2 | 0);
    // handle background colors.
    if(this.color) {
        ctx.fillStyle = this.color;
        ctx.fillRect(0, 0, this.w, this.h);
    }
    // handle repeating images, a way to implement repeating background in canvas
    if(this.imgLoaded && this.img) {
        if(this.imgNaturalWidth < this.w || this.imgNaturalHeight < this.h) {
            var repeat_w = Math.floor(this.w / this.imgNaturalWidth);
            while(repeat_w > 0) {
                repeat_w = repeat_w-1;
                var repeat_y = Math.floor(this.h / this.imgNaturalHeight);
                while(repeat_y > 0) {
                    repeat_y = repeat_y-1;
                    ctx.drawImage(this.img, this.xoffset, this.yoffset,
                        this.imgNaturalWidth,
                        this.imgNaturalHeight,
                        repeat_w * this.imgNaturalWidth,
                        repeat_y * this.imgNaturalHeight,
                        this.imgNaturalWidth,
                        this.imgNaturalHeight);
                }

            }
        } else {
            // image with normal size or with
            ctx.drawImage(this.img, this.xoffset, this.yoffset, this.w, this.h, 0, 0, this.w, this.h);
        }
    }
    ctx.restore();
    return this;
};

_Sprite.prototype.toString = function () {
    return String(this.x) + ',' + String(this.y);
};

_Sprite.prototype.onload = function(callback) {
    if(this.imgLoaded && this._callback) {
        this._callback = callback;
    }
};

_Sprite.prototype.loadImg = function (src, resetSize) {
    // the image exact source value will change according to the
    // hostname, this is useful to retain the original source value here.
    this.src = src;
    // check if the image is already in the cache
    if(!spriteList[src]) {
        // if not we create the image in the cache
        this.img = new Image();
        spriteList[src] = {src:src, img:this.img, loaded:false, loading:true};
        var _loaded = false;
    } else {
        // if it's already there, we set img object and check if it's loaded
        this.img = spriteList[src].img;
        var _loaded = spriteList[src].loaded;
    }
    var there = this;
    // actions to perform when the image is loaded
    function imageReady(e) {
        spriteList[src].loaded = true;
        there.imgLoaded = true;
        var img = there.img;
        if(!there.layer.useCanvas)
            there.dom.style.backgroundImage = 'url('+src+')';
        there.imgNaturalWidth = img.width;
        there.imgNaturalHeight = img.height;
        if(there.w === null || resetSize)
            there.setW(img.width);
        if(there.h === null || resetSize)
            there.setH(img.height);
        there.onload();
    }
    if(_loaded)
        imageReady();
    else {
        this.img.addEventListener('load', imageReady, false);
        this.img.src = src;
    }
    return this;
};


_Sprite.prototype.isPointIn = function isPointIn(x, y) {
    // Return true if the point is within the sprite surface
    if(this.angle == 0)
        return (x >= this.x && x < this.x+this.w
            && y >= this.y && y < this.y+this.h);
    return this.isPointInAngle(x, y);
};

sjs.lineSide = function(ax, ay, bx, by, cx, cy) {
    // return true if the point is on the right of the line
    var v = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    if(v == 0)
        return null;
    return v > 0;
}

_Sprite.prototype.isPointInAngle = function pointInAngle(x, y) {
    // Return true if the point is within the sprite surface
    // handle the case where the sprite has an angle
    var edges = this.edges();
    for(var i=0; i<4; i++) {
        var j = i+1;
        if(j>3)
            j=0;
        // if on the right of the line, the point
        // cannot be in the rectangle
        if(sjs.lineSide(
            edges[i][0], edges[i][1],
            edges[j][0], edges[j][1],
            x, y
        )) {
            return false
        }
    }
    return true;
}

_Sprite.prototype.collidesWith = function collidesWith(sprite) {
    // Return true if the current sprite has any collision with the Sprite provided
    if(this.angle != 0 || sprite.angle != 0) {
        return this.collidesWithAngle(sprite);
    }

    if(sprite.x > this.x) {
        var x_inter = sprite._x_rounded - this._x_rounded < this.w - 1;
    } else {
        var x_inter = this._x_rounded - sprite._x_rounded  < sprite.w;
    }
    if(x_inter == false)
        return false;

    if(sprite.y > this.y) {
        var y_inter = sprite._y_rounded - this._y_rounded < this.h;
    } else {
        var y_inter = this._y_rounded - sprite._y_rounded < sprite.h;
    }
    return y_inter;
};

_Sprite.prototype.collidesWithAngle = function collidesWithAngle(sprite) {
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

_Sprite.prototype.edges = function edges() {
    // Return the 4 edges coordinate of the rectangle
    var distance = hypo(this.w / 2, this.h / 2);
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

_Sprite.prototype.distance = function distance(x, y) {
    // Return the distance between this sprite and the point (x, y) or a Sprite
    if(typeof x == "number") {
        return Math.sqrt(Math.pow(this.x + this.w/2 - x, 2) +
            Math.pow(this.y + this.h/2 - y, 2));
    } else {
        return Math.sqrt(Math.pow(this.x + (this.w / 2) - (x.x + (x.w / 2)), 2) +
            Math.pow(this.y + (this.h / 2) - (x.y + (x.h / 2)), 2));
    }
}

_Sprite.prototype.center = function center() {
    return [this.x + this.w/2, this.y + this.h/2];
}

_Sprite.prototype.collidesWithArray = function collidesWithArray(sprites) {
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

_Sprite.prototype.explode2 = function explode(v, horizontal, layer) {
    if(!layer)
        layer = this.layer;
    if(v == undefined) {
        if(horizontal)
            v = this.h / 2;
        else
            v = this.w / 2;
    }
    v = v | 0;
    var s1 = layer.scene.Sprite(this.src, layer);
    var s2 = layer.scene.Sprite(this.src, layer);
    if(horizontal) {
        s1.size(this.w, v);
        s1.position(this.x, this.y);
        s2.size(this.w, this.h - v);
        s2.position(this.x, this.y + v);
        s2.setYOffset(v);
    } else {
        s1.size(v, this.h);
        s1.position(this.x, this.y);
        s2.size(this.w - v, this.h);
        s2.position(this.x + v, this.y);
        s2.setXOffset(v);
    }
    return [s1, s2];
}

_Sprite.prototype.explode4 = function explode(x, y, layer) {
    if(x == undefined)
        x = this.w / 2;
    if(y == undefined)
        y = this.h / 2;
    x = x | 0;
    y = y | 0;
    if(!layer)
        layer = this.layer;
    // top left sprite, going counterclockwise
    var s1 = layer.scene.Sprite(this.src, layer);
    s1.size(x, y);
    s1.position(this.x, this.y);

    var s2 = layer.scene.Sprite(this.src, layer);
    s2.size(this.w - x, y);
    s2.position(this.x + x, this.y);
    s2.offset(x, 0);

    var s3 = layer.scene.Sprite(this.src, layer);
    s3.size(this.w - x, this.h - y);
    s3.position(this.x + x, this.y + y);
    s3.offset(x, y);

    var s4 = layer.scene.Sprite(this.src, layer);
    s4.size(x, this.h - y);
    s4.position(this.x, this.y + y);
    s4.offset(0, y);

    return [s1, s2, s3, s4];
}

function Cycle(triplets) {

    if(this.constructor !== arguments.callee)
        return new Cycle(triplets);

    // Cycle for the Sprite image.
    // A cycle is a list of triplet (x offset, y offset, game tick duration)
    this.triplets = triplets;
    // total duration of the animation in ticks
    this.cycleDuration = 0;
    // this array knows on which ticks in the animation
    // an image change is needed
    this.changingTicks = [0];
    for(var i=0, triplet; triplet=triplets[i]; i++) {
        this.cycleDuration = this.cycleDuration + triplet[2];
        this.changingTicks.push(this.cycleDuration);
    }
    this.changingTicks.pop()
    // suppose to be private
    this.sprites = [];
    // if set to false, the animation will stop automaticaly after one run
    this.repeat = true;
    this.tick = 0;
    this.done = false;
}

Cycle.prototype.addSprite = function addSprite(sprite) {
    this.sprites.push(sprite);
    sprite.cycle = this;
}

Cycle.prototype.update = function update() {
    var sprites = this.sprites;
    for(var i=0, sp; sp = sprites[i]; i++) {
        sp.update();
    }
}

Cycle.prototype.addSprites = function addSprites(sprites) {
    this.sprites = this.sprites.concat(sprites);
    for(var j=0, sp; sp = sprites[j]; j++) {
        sp.cycle = this;
    }
}

Cycle.prototype.removeSprite = function removeSprite(sprite) {
    for(var j=0, sp; sp = this.sprites[j]; j++) {
        if(sprite == sp) {
            sp.cycle = null;
            this.sprites.splice(j, 1);
        }
    }
}

Cycle.prototype.next = function (ticks, update) {
    if(this.tick > this.cycleDuration) {
        if(this.repeat)
            this.tick = 0;
        else {
            this.done = true;
            return this;
        }
    }
    for(var i=0; i<this.changingTicks.length; i++) {
        if(this.tick == this.changingTicks[i]) {
            for(var j=0, sprite; sprite = this.sprites[j]; j++) {
                sprite.setXOffset(this.triplets[i][0]);
                sprite.setYOffset(this.triplets[i][1]);
                if(update)
                    sprite.update();
            }
        }
    }
    ticks = ticks || 1; // default tick: 1
    this.tick = this.tick + ticks;
    return this;
};

Cycle.prototype.reset = function resetCycle() {
    this.tick = 0;
    this.done = false;
    for(var j=0, sprite; sprite = this.sprites[j]; j++) {
        sprite.setXOffset(this.triplets[0][0]);
        sprite.setYOffset(this.triplets[0][1]);
    }
    return this;
};

Cycle.prototype.goto = function gotoCycle(n) {
    for(var j=0, sprite; sprite = this.sprites[j]; j++) {
        sprite.setXOffset(this.triplets[n][0]);
        sprite.setYOffset(this.triplets[n][1]);
    }
    return this;
};

function _Ticker(scene, tickDuration, paint) {

    this.scene = scene;

    if(this.constructor !== arguments.callee)
        return new _Ticker(tickDuration, paint);

    this.paint = paint;
    if(tickDuration === undefined)
        this.tickDuration = 25;
    else
        // FF behave weirdly with anything less than 25
        this.tickDuration = Math.max(tickDuration, 25);

    this.start = new Date().getTime();
    this.ticksElapsed = 0;
    this.currentTick = 0;
    this._saved = 0;
}

_Ticker.prototype.next = function() {
    // number of ticks that have happen tile the last pause
    var ticksElapsed = ((this.now - this.start) / this.tickDuration) | 0;
    this.lastTicksElapsed = ticksElapsed - this.currentTick;
    this.currentTick = ticksElapsed + this._saved;
    return this.lastTicksElapsed;
};

_Ticker.prototype.run = function() {
    if(this.paused)
        return
    var t = this;
    this.now = new Date().getTime();
    var ticksElapsed = this.next();
    // no update needed, this happen on the first run
    if(ticksElapsed == 0) {
        // this is not a cheap operation
        setTimeout(function(){t.run()}, this.tickDuration);
        return;
    }

    for(var name in this.scene.layers) {
        var layer = this.scene.layers[name];
        if(layer.useCanvas && layer.autoClear) {
            layer.clear();
        }
    }

    this.paint(this);
    // reset the keyboard change
    inputSingleton.next();

    this.timeToPaint = (new Date().getTime()) - this.now;
    // spread the load value on 2 frames so the value is more stable
    this.load = ((this.timeToPaint / this.tickDuration * 100) + this.load) / 2 | 0;
    // We need some pause to let the browser catch up the update. Here at least 16 ms of pause
    var _nextPaint = Math.max(this.tickDuration - this.timeToPaint, 16);

    //window.webkitRequestAnimationFrame(function(){t.run()});
    this.timeout = setTimeout(function(){t.run()}, _nextPaint);
}

_Ticker.prototype.pause = function() {
    global.clearTimeout(this.timeout);
    this.paused = true;
}

_Ticker.prototype.resume = function() {
    // useful to keep the accurate number of ticks after resume
    this._saved += ((this.now - this.start) / this.tickDuration) | 0
    this.start = new Date().getTime();
    this.ticksElapsed = 0;
    this.currentTick = 0;
    this.paused = false;
    this.run();
}


var inputSingleton = false;
function Input(scene){
    if(!inputSingleton)
        inputSingleton = new _Input(scene);
    return inputSingleton
};

function _Input(scene) {

    if(scene)
        this.dom = scene.dom;
    else
        this.dom = global;

    var that = this;

    this.keyboard = {};
    this.mouse = {};
    this.keyboardChange = {};
    this.mousedown = false;
    this.keydown = false;

    this.next = function() {
        that.keyboardChange = {};
        that.mouse.click = false;
    }

    this.keyPressed = function(name) {
        return that.keyboardChange[name] !== undefined && that.keyboardChange[name];
    };

    this.keyReleased = function(name) {
        return that.keyboardChange[name] !== undefined && !that.keyboardChange[name];
    };

    function updateKeyChange(name, val) {
        if(that.keyboard[name] != val) {
            that.keyboard[name] = val;
            that.keyboardChange[name] = val;
        }
    }

    // this is handling WASD, and arrows keys
    function updateKeyboard(e, val) {
        if(e.keyCode==40 || e.keyCode==83) {
            updateKeyChange('down', val);
        }
        if(e.keyCode==38 || e.keyCode==87) {
            updateKeyChange('up', val);
        }
        if(e.keyCode==39 || e.keyCode==68) {
            updateKeyChange('right', val);
        }
        if(e.keyCode==37 || e.keyCode==65) {
            updateKeyChange('left', val);
        }
        if(e.keyCode==32) {
            updateKeyChange('space', val);
        }
        if(e.keyCode==17) {
            updateKeyChange('ctrl', val);
        }
        if(e.keyCode==13) {
            updateKeyChange('enter', val);
        }
    }

    var addEvent = function(name, fct) {
        global.addEventListener(name, fct, false);
    }

    addEvent("touchstart", function(event) {
        that.mousedown = true;
    });

    addEvent("touchend", function(event) {
        that.mousedown = false;
    });

    addEvent("touchmove", function(event) {});

    addEvent("mousedown", function(event) {
        that.mousedown = true;
        // prevent unwanted browser drag and drop behavior
        event.preventDefault();
    });

    addEvent("mouseup", function(event) {
        that.mousedown = false;
    });

    addEvent("click", function(event) {
        that.mouse.click = {
            x:event.clientX - that.dom.offsetLeft,
            y:event.clientY - that.dom.offsetTop
        };
    });

    addEvent("mousemove", function(event) {
        that.mouse.position = {
            x:event.clientX - that.dom.offsetLeft,
            y:event.clientY - that.dom.offsetTop
        };
    });

    addEvent("keydown", function(e) {
        that.keydown = true;
        updateKeyboard(e, true);
    });

    addEvent("keyup", function(e) {
        that.keydown = false;
        updateKeyboard(e, false);
    });

    // can be used to avoid key jamming
    addEvent("keypress", function(e) {});
    // make sure that the keyboard is reseted when
    // the user leave the page
}

_Input.prototype.arrows = function arrows() {
    /* Return true if any arrow key is pressed */
    return this.keyboard.right || this.keyboard.left || this.keyboard.up || this.keyboard.down;
};

// Add an automatic pause to all the scenes when the user
// quit the current window.
global.addEventListener("blur", function (e) {
    for(var i=0; i < sjs.scenes.length; i++) {
        var scene = sjs.scenes[i];
        if(!scene.autoPause)
            continue;
        var anon = function(scene) {
            inputSingleton.keyboard = {};
            inputSingleton.keydown = false;
            inputSingleton.mousedown = false;
            // create a semi transparent layer on the game
            if(scene.ticker && !scene.ticker.paused) {
                scene.ticker.pause();
                var div = overlay(0, 0, scene.w, scene.h);
                div.innerHTML = '<h1>Paused</h1><p>Click or press any key to resume.</p>';
                div.style.textAlign = 'center';
                div.style.paddingTop = ((scene.h/2) - 32)  + 'px';
                var listener = function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    scene.dom.removeChild(div);
                    document.removeEventListener('click', listener, false);
                    document.removeEventListener('keyup', listener, false);
                    scene.ticker.resume();
                }
                document.addEventListener('click', listener, false);
                document.addEventListener('keyup', listener, false);
                scene.dom.appendChild(div);
            }
        }
        anon(scene);
    }
}, false);

function Layer(scene, name, options) {

    if(this.constructor !== arguments.callee)
        return new Layer(scene, name, options);

    this.sprites = {};
    this.scene = scene;

    if(options === undefined)
        options = {useCanvas:scene.useCanvas, autoClear:true}

    if(options.autoClear === undefined)
        this.autoClear = true;
    else
        this.autoClear = options.autoClear;

    if(options.useCanvas === undefined)
        this.useCanvas = this.scene.useCanvas;
    else
        this.useCanvas = options.useCanvas;

    this.name = name;
    if(this.scene.layers[name] === undefined)
        this.scene.layers[name] = this;
    else
        error('Layer '+ name + ' already exist.');

    var domElement = document.getElementById(name);
    if(!domElement)
        var needToCreate = true;
    else
        var needToCreate = false;

    if(this.useCanvas) {
        if (domElement && domElement.nodeName.toLowerCase() != "canvas") {
            error("Cannot use HTMLElement " + domElement.nodeName + " with canvas renderer.");
        }
        if (needToCreate) {
            domElement = document.createElement('canvas');
        }
        this.ctx = domElement.getContext('2d');
    } else {
        if (needToCreate) {
            domElement = document.createElement('div');
        }
    }

    if(!needToCreate) {
        var domH = domElement.height || domElement.style.height;
        var domW = domElement.width || domElement.style.width;
    } else {
        var domH = false;
        var domW = false;
    }

    if(options.parent)
        this.parent = options.parent;
    else
        this.parent = this.scene.dom;
    this.parent.appendChild(domElement);
    domElement.id = domElement.id || 'sjs'+scene.id+'-'+name;
    if(!options.disableAutoZIndex) {
        zindex += 1;
        domElement.style.zIndex = String(zindex);
    }
    domElement.style.backgroundColor = options.color || domElement.style.backgroundColor;
    this.h = options.h || domH || scene.h;
    this.w = options.w || domW || scene.w;
    if (domElement.nodeName == "CANVAS") {
        domElement.height = this.h;
        domElement.width = this.w;
    } else {
        domElement.style.height = this.h + 'px';
        domElement.style.width = this.w +'px';
    };
    domElement.style.position = 'absolute';
    domElement.style.top = domElement.style.top || '0px';
    domElement.style.left =  domElement.style.left || '0px';

    this.dom = domElement;

}

Layer.prototype.clear = function clear() {
    this.ctx.clearRect(0, 0, this.dom.width, this.dom.height);
}

Layer.prototype.remove = function remove() {
    this.parent.removeChild(this.dom);
    delete this.scene.layers[this.name];
}

Layer.prototype.addSprite = function addSprite(sprite) {
    var index = Math.random() * 11;
    this.sprites[index] = sprite;
    return index
}

Layer.prototype.setColor = function setColor(color) {
    this.dom.style.backgroundColor = color;
}

Layer.prototype.onTop = function onTop(color) {
    zindex += 1;
    this.dom.style.zIndex = String(zindex);
}

function SpriteList(list) {
    if(this.constructor !== arguments.callee)
        return new SpriteList(list);
    this.list = list || [];
    this.length = this.list.length;
    this.index = -1;
}

SpriteList.prototype.add = function add(sprite) {
    if(sprite.length)
        this.list.push.apply(this.list, sprite);
    else
        this.list.push(sprite);
    this.length = this.list.length;
}

SpriteList.prototype.remove = function remove(sprite) {
    for(var i=0, el; el = this.list[i]; i++) {
        if(el==sprite) {
            this.list.splice(i, 1);
            // delete during the iteration is possible
            if(this.index > -1)
                this.index = this.index - 1;
            this.length = this.list.length;
            return true;
        }
    }
}

SpriteList.prototype.iterate = function iterate() {
    this.index += 1;
    if(this.index >= this.list.length) {
        this.index = -1;
        return false;
    }
    return this.list[this.index];
}

function SrollingSurface(scene, w, h, redrawCallback) {

    if(this.constructor !== arguments.callee)
        return new SrollingSurface(scene, w, h, redrawCallback);

    this.redrawCallback = redrawCallback;
    this.block_h = Math.ceil(h / 2.0);
    this.block_w = Math.ceil(w / 2.0);
    this.x = 0;
    this.y = 0;
    this.w = w;
    this.h = h;
    this.scene = scene;
    this.dom = document.createElement('div');
    this.dom.style.position = "relative";
    scene.dom.appendChild(this.dom);

    this.bufferCanvas = scene.Layer("buffer-"+Math.random(),
            {w:1.5*this.w, h:1.5*this.h, x:0, y:0, autoClear:false,
            useCanvas:true, parent:this.dom, disableAutoZIndex:true});

    this.callbackCanvas = scene.Layer("buffer-"+Math.random(),
            {w:this.block_w , h:this.block_h, x:0, y:0, autoClear:false,
            useCanvas:true, parent:this.dom, disableAutoZIndex:true});

    this.bufferCanvas.dom.style.display = 'none';
    this.callbackCanvas.dom.style.display = 'none';

    this.front = scene.Layer("front-"+Math.random(),
        {w:this.w, h:this.h, x:0, y:0, autoClear:false,
        useCanvas:true, parent:this.dom, disableAutoZIndex:true});

    // block actually in use
    this.rendered_blocks = [];
    // layer available for rendering
    this.available_blocks = [];
}

SrollingSurface.prototype.neededBlocks = function neededBlocks() {
    // Return a list of needed block for the surface,
    // the block is a int pair eg: (0,0), (10,12) that indicates the position
    // (x / this.block_w, y / this.block_h) within the map.
    var needed_blocks = [];
    var x_block_start = Math.floor((this.x + (this.w / 2)) / this.block_w) -1;
    var y_block_start = Math.floor((this.y + (this.h / 2)) / this.block_h) -1;

    for(var x=0; x<3; x++) {
        for(var y=0; y<3; y++) {
            needed_blocks.push([x_block_start + x, y_block_start + y])
        }
    }
    return needed_blocks
}

SrollingSurface.prototype.blockToRender = function blockToRender() {
    // Return the blocks that need rendering
    var neededBlocks = this.neededBlocks();
    var toRender = [];
    var rendered = this.rendered_blocks;
    for(var i=0; i<neededBlocks.length; i++) {
        var needed_block =  neededBlocks[i];
        var found = false;
        for(var j=0; j<rendered.length; j++) {
            if(rendered[j].block[0] == needed_block[0] && rendered[j].block[1] == needed_block[1]) {
                found = true;
                break;
            }
        }
        if(!found)
            toRender.push(needed_block);
    }
    return toRender
}

SrollingSurface.prototype.renderBlocks = function renderBlocks() {
    // render blocks in the buffer.

    // new blocks to that need rendering
    var render_list = this.blockToRender();
    for(var i=0; i<render_list.length; i++) {
        var toRender = render_list[i];
        // real map coordinates
        var x = toRender[0] * this.block_w;
        var y = toRender[1] * this.block_h;

        this.redrawCallback(this.callbackCanvas, x, y);
        // buffer position in pixels
        var buffer_pos = [
            mod(toRender[0], 3) * this.block_w,
            mod(toRender[1], 3) * this.block_h
        ];

        this.bufferCanvas.ctx.drawImage(this.callbackCanvas.dom, buffer_pos[0], buffer_pos[1]);

        this.rendered_blocks.push({block:[toRender[0], toRender[1]], pos:[x, y], buffer_pos:buffer_pos});
    }
}

SrollingSurface.prototype.recomposeBlocks = function recomposeBlocks() {
    // draw all the blocks on the surface. My tests show that it's more efficient
    // than redrawing the canvas on itself.
    for(var i=0; i<this.rendered_blocks.length; i++) {
        var block = this.rendered_blocks[i];
        // draw the block on the front canvas
        this.front.ctx.drawImage(this.bufferCanvas.dom,
            block.buffer_pos[0], block.buffer_pos[1],
            this.block_w, this.block_h,
            block.pos[0] - this.x, block.pos[1] - this.y,
            this.block_w, this.block_h);
    }
}

SrollingSurface.prototype.move = function move(x, y) {
    this.x = this.x + x;
    this.y = this.y + y;
}

SrollingSurface.prototype.position = function position(x, y) {
    this.x = x;
    this.y = y;
}

SrollingSurface.prototype.deleteBlocks = function moveBlocks() {
    for(var i=0; i<this.rendered_blocks.length; i++) {
        var block = this.rendered_blocks[i];
        if(
            (block.pos[0] + this.block_w) < this.x ||
            (block.pos[1] + this.block_h) < this.y ||
            block.pos[0] > this.x + (this.w / 2) + this.block_w  ||
            block.pos[1] > this.y + (this.h / 2) + this.block_h
        ) {
            delete block;
            this.rendered_blocks.splice(i, 1);
            i = i-1;
        }
    }
}

SrollingSurface.prototype.update = function update() {
    this.deleteBlocks();
    this.renderBlocks();
    this.recomposeBlocks();
}

global.sjs = sjs;

})(this);

