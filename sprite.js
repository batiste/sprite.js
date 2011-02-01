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

/* Sprite.js coding guideline
 *
 * CamelCase everywhere (I don't like it but it seems to the standard these days).
 * Private attributes should start with an underline.
 * Tabs have to be 4 spaces (python style).
 * If you contribute don't forget to add your name in the AUTHORS file.
 */

(function(global, undefined){

var sjs = {
    Sprite: Sprite,
    Cycle: Cycle,
    tproperty: false,
    Ticker: Ticker,
    Input: Input,
    Layer: Layer,
    useCanvas: (window.location.href.indexOf('canvas') != -1),
    layers: {},
    dom:null
};

// a cache to load each sprite only one time
var spriteList = {};

sjs.loadImages = function loadImages(images, callback) {
    /* function used to preload the sprite images */
    var toLoad = 0;
    for(var i=0; i<images.length; i++) {
        if(!spriteList[images[i]]) {
            toLoad += 1;
        }
    }

    function _loadImg(src) {
        var img = new Image();
        spriteList[src] = [img, false];
        img.addEventListener('load', function() {
            spriteList[src][1] = true;
            toLoad -= 1;
            if(toLoad == 0)
                callback();
        }, false);
        img.src = src;
    }

    for(var i=0; i<images.length; i++) {
        var src = images[i];
        if(!spriteList[src]) {
            _loadImg(src);
        }
    }
}

sjs.__defineGetter__('h', function() {
    return this._h;
});

sjs.__defineSetter__('h', function(value) {
    this._h = value;
    this.dom.style.height = value + 'px';
});

sjs.__defineGetter__('w', function() {
    return this._w;
});

sjs.__defineSetter__('w', function(value) {
    this._w = value;
    this.dom.style.width = value + 'px';
});


function error(msg) {alert(msg);}

function Sprite(src, layer) {

    if(this.constructor !== arguments.callee)
        return new Sprite(src, layer);

    var sp = this;
    this._dirty = {};
    this.changed = false;

    function property(name, defaultValue) {
        if(defaultValue === undefined)
            sp['_'+name] = 0;
        else
            sp['_'+name] = defaultValue;

        sp.__defineGetter__(name, function() {
            return sp['_'+name];
        });

        sp.__defineSetter__(name, function(value) {
            sp['_'+name] = value;
            if(!sp.layer.useCanvas) {
                sp._dirty[name] = true;
                sp.changed = true;
            }
        });
    }

    // positions
    property('y', 0);
    property('x', 0);

    // image
    this.img = null;
    this.imgNaturalWidth = null;
    this.imgNaturalHeight = null;

    // width and height of the sprite view port
    property('w', null);
    property('h', null);

    // offsets of the image within the viewport
    property('xoffset', 0);
    property('yoffset', 0);

    this.dom = null;

    property('xscale', 1);
    property('yscale', 1);
    property('angle', 0);

    property('opacity', 1);
    property('color', false);

    if(layer === undefined) {
        // important to delay the creation so useCanvas
        // can still be changed
        if(sjs.layers['default'] === undefined)
            sjs.layers["default"] = new Layer("default");
        layer = sjs.layers['default'];
    }
    this.layer = layer;

    if(!this.layer.useCanvas) {
        var d = document.createElement('div');
        d.style.position = 'absolute';
        this.dom = d;
        layer.dom.appendChild(d);
    }
    if(src)
        this.loadImg(src);
    return this;
}

Sprite.prototype.constructor = Sprite;

Sprite.prototype.rotate = function (v) {
    this.angle = this.angle + v;
    return this;
};

Sprite.prototype.scale = function (x, y) {
    if(this.xscale != x) {
        this.xscale = x;
    }
    if(y === undefined)
        y = x;
    if(this.yscale != y) {
        this.yscale = y;
    }
    return this;
};

Sprite.prototype.move = function (x, y) {
    this.x = this.x+x;
    this.y = this.y+y;
    return this;
};

Sprite.prototype.offset = function (x, y) {
    this.xoffset=x;
    this.yoffset=y;
    return this;
};

Sprite.prototype.size = function (w, h) {
    this.w=w;
    this.h=h;
    return this;
};

Sprite.prototype.remove = function remove() {
    if(this.layer.useCanvas == false) {
        this.layer.dom.removeChild(this.dom);
        this.dom = null;
    }
    this.layer = null;
    this.img = null;
};

Sprite.prototype.update = function updateDomProperties () {
    /* This is the CPU heavy function. */
    if(this.layer.useCanvas == true) {
        return this.canvasUpdate();
    }
    if(!this.changed)
        return;

    var style = this.dom.style;
    if(this._dirty['w'])
        style.width=this.w+'px';
    if(this._dirty['h'])
        style.height=this.h+'px';
    if(this._dirty['y'])
        style.top=this.y+'px';
    if(this._dirty['x'])
        style.left=this.x+'px';
    if(this._dirty['xoffset'] || this._dirty['yoffset'])
        style.backgroundPosition=-this.xoffset+'px '+-this.yoffset+'px';

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

Sprite.prototype.canvasUpdate = function updateCanvas () {
    var ctx = this.layer.ctx;
    ctx.save();
    ctx.translate(this.x + (this.w/2), this.y + (this.h/2));
    ctx.rotate(this.angle);
    ctx.scale(this.xscale, this.yscale);
    ctx.globalAlpha = this.opacity;
    ctx.translate(-(this.w/2), -(this.h/2));
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
                    ctx.drawImage(this.img, this.xoffset, this.yoffset, this.imgNaturalWidth,
                                this.imgNaturalHeight, repeat_w*this.imgNaturalWidth, repeat_y*this.imgNaturalHeight,
                                this.imgNaturalWidth, this.imgNaturalHeight);
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

Sprite.prototype.toString = function () {
    return String(this.x) + ',' + String(this.y);
};

Sprite.prototype.onload = function(callback) {
    if(this.imgLoaded && this._callback) {
        this._callback = callback;
    }
};

Sprite.prototype.loadImg = function (src, resetSize) {
    // check if the image is already in the cache
    if(!spriteList[src]) {
        // if not we create the image in the cache
        this.img = new Image();
        spriteList[src] = [this.img, false];
        var _loaded = false;
    } else {
        // if it's already there, we set img object and check it's loaded
        this.img = spriteList[src][0];
        var _loaded = spriteList[src][1];
    }
    var there = this;
    function imageReady(e) {
        spriteList[src][1] = true;
        there.imgLoaded = true;
        var img = there.img;
        if(!there.layer.useCanvas)
            there.dom.style.backgroundImage = 'url('+src+')';
        there.imgNaturalWidth = img.width;
        there.imgNaturalHeight = img.height;
        if(there.w === null || resetSize)
            there.w = img.width;
        if(there.h === null || resetSize)
            there.h = img.height;
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


Sprite.prototype.isPointIn = function pointIn(x, y) {
    // return true if the point is in the sprite surface
    return (x >= this.x && x <= this.x+this.w
        && y >= this.y && y <= this.y+this.h)
};

Sprite.prototype.areVerticesIn = function areVerticesIn(sprite) {
    return (this.isPointIn(sprite.x, sprite.y)
       || this.isPointIn(sprite.x+sprite.w, sprite.y)
       || this.isPointIn(sprite.x+sprite.w, sprite.y)
       || this.isPointIn(sprite.x, sprite.y + sprite.h));
};

Sprite.prototype.collidesWith = function hasCollision(sprites) {
    // detect arrays
    if(sprites.length !== undefined) {
        for(var i=0, sprite; sprite = sprites[i]; i++) {
            if(this.areVerticesIn(sprite) || sprite.areVerticesIn(this)) {
                return true;
            }
        }
        return false;
    }
    return this.areVerticesIn(sprites) || sprites.areVerticesIn(this);
};

function Cycle(triplets) {
    /* Cycle for the Sprite image.
    A cycle is a list of triplet (x offset, y offset, game tick duration) */
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
    this.sprites = [];
    // if set to false, the animation will stop automaticaly after one run
    this.repeat = true;
    this.tick = 0;
}

Cycle.prototype.next = function (ticks) {
	ticks = ticks || 1; // default tick: 1
    this.tick = this.tick + ticks;
    if(this.tick > this.cycleDuration) {
        if(this.repeat)
            this.tick = 0;
        else
            return this;
    }
    for(var i=0; i<this.changingTicks.length; i++) {
        if(this.tick == this.changingTicks[i]) {
            for(var j=0, sprite; sprite = this.sprites[j]; j++) {
                sprite.xoffset = this.triplets[i][0];
                sprite.yoffset = this.triplets[i][1];
            }
        }
    }
    return this;
};

Cycle.prototype.reset = function resetCycle() {
    this.tick = 0;
    for(var j=0, sprite; sprite = this.sprites[j]; j++) {
        sprite.xoffset = this.triplets[0][0];
        sprite.yoffset = this.triplets[0][1];
    }
    return this;
};

function Ticker(tickDuration, paint) {

    if(this.constructor !== arguments.callee)
        return new Ticker(tickDuration, paint);

    this.paint = paint;
    if(tickDuration === undefined)
        this.tickDuration = 25;
    else
        // FF behave weirdly with anything less than 25
        this.tickDuration = Math.max(tickDuration, 25);

    this.start = new Date().getTime();
    this.ticksElapsed = 0;
    this.currentTick = 0;
}

Ticker.prototype.next = function() {
    var ticksElapsed = Math.round((this.now - this.start) / this.tickDuration);
    this.lastTicksElapsed = ticksElapsed - this.currentTick;
    this.currentTick = ticksElapsed;
    return this.lastTicksElapsed;
};

Ticker.prototype.run = function() {
    var t = this;
    this.now = new Date().getTime();
    var ticksElapsed = this.next();
    // no update needed, this happen on the first run
    if(ticksElapsed == 0) {
        // this is not a cheap operation
        setTimeout(function(){t.run()}, this.tickDuration);
        return;
    }

    for(var name in sjs.layers) {
        var layer = sjs.layers[name];
        if(layer.useCanvas && layer.autoClear)
            layer.clear();
        // trick to clear canvas, doesn't seems to do any better according to tests
        // http://skookum.com/blog/practical-canvas-test-charlottejs/
        // canvas.width = canvas.width
    }

    this.paint(this);
    // reset the keyboard change
    inputSingleton.keyboardChange = {};

    this.timeToPaint = (new Date().getTime()) - this.now;
    this.load = Math.round((this.timeToPaint / this.tickDuration) * 100);
    // We need some pause to let the browser catch up the update. Here at least 16 ms of pause
    var _nextPaint = Math.max(this.tickDuration - this.timeToPaint, 16);
    setTimeout(function(){t.run()}, _nextPaint);
}


function _Input() {

    var that = this;

    this.keyboard = {};
    this.keyboardChange = {};
    this.mousedown = false;
    this.keydown = true;

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
        document.addEventListener(name, fct, false);
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
    });

    addEvent("mouseup", function(event) {
        that.mousedown = false;
    });

    //document.onclick = function(event) {
        //that.click(event);
    //}
    addEvent("mousemove", function(event) {
        that.xmouse = event.clientX;
        that.ymouse = event.clientY;
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
    global.addEventListener("blur", function (e) {
        that.keyboard = {}
        that.keydown = false;
        that.mousedown = false;
    }, false);
}

_Input.prototype.arrows = function arrows() {
    /* Return true if any arrow key is pressed */
    return this.keyboard.right || this.keyboard.left || this.keyboard.up || this.keyboard.down;
};

var inputSingleton = new _Input();
function Input(){return inputSingleton};

var layerZindex = 1;

function Layer(name, options) {

    var canvas, domElement;

    if(this.constructor !== arguments.callee)
        return new Layer(name, options);

    if(options === undefined)
        options = {useCanvas:sjs.useCanvas, autoClear:true}

    if(options.autoClear === undefined)
        this.autoClear = true;
    else
        this.autoClear = options.autoClear;

    if(options.useCanvas === undefined)
        this.useCanvas = sjs.useCanvas;
    else
        this.useCanvas = options.useCanvas;

    this.name = name;
    if(sjs.layers[name] === undefined)
        sjs.layers[name] = this;
    else
        error('Layer '+ name + ' already exist.');

    domElement = document.getElementById(name);

    if(this.useCanvas) {
        if (domElement && domElement.nodeName.toLowerCase() != "canvas") {
            error("Cannot use HTMLElement " + domElement.nodeName + " with canvas renderer.");
        }
        if (!domElement) {
            domElement = document.createElement('canvas');
            domElement.height = options.h || sjs.h;
            domElement.width = options.w || sjs.w;
            domElement.style.position = 'absolute';
            domElement.style.zIndex = String(layerZindex);
            domElement.style.top = '0px';
            domElement.style.left = '0px';
            domElement.id = name;
            sjs.dom.appendChild(domElement);
        }
        this.dom = domElement;
        this.ctx = domElement.getContext('2d');
    } else {
        if (!domElement) {
            domElement = document.createElement('div');
            domElement.style.position = 'absolute';
            domElement.style.top = '0px';
            domElement.style.left = '0px';
            domElement.style.zIndex = String(layerZindex);
            domElement.id = name;
            sjs.dom.appendChild(domElement);
        }
        this.dom = domElement;
    }
    layerZindex += 1;
}

Layer.prototype.clear = function() {
    this.ctx.clearRect(0, 0, this.dom.width, this.dom.height);
}

function init() {
	initDom();
    var properties = ['transform', 'WebkitTransform', 'MozTransform', 'OTransform'];
    var p = false;
    while (p = properties.shift()) {
        if (typeof document.body.style[p] !== 'undefined') {
            sjs.tproperty = p;
        }
    }
}

function initDom() {
    if(!sjs.dom) {
        var div = document.createElement('div');
        div.style.overflow = 'hidden';
        div.style.position = 'absolute';
        div.id = 'sjs';
        document.body.appendChild(div);
        sjs.dom = div;
        sjs.w = 480;
        sjs.h = 320;
    }
    return sjs.dom;
}

global.addEventListener("load", init, false);
global.sjs = sjs;

})(this);
