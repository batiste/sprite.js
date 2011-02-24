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

// fixing the bad boys that don't have defineProperty
if(!Object.defineProperty) {
    Object.defineProperty = function(obj, name, dict) {
        obj.__defineGetter__(name, dict['get']);
        obj.__defineSetter__(name, dict['set']);
    }
}
defineProperty = Object.defineProperty

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

function overlay(x, y, w, h) {
    var div = document.createElement('div');
    var s = div.style;
    s.top = x + 'px';
    s.left = y + 'px';
    s.width = w + 'px';
    s.height = h + 'px';
    s.color = '#fff';
    s.zIndex = 100;
    s.position = 'absolute';
    s.backgroundColor = '#000';
    s.opacity = 0.8;
    return div;
}

// a cache to load each sprite only one time
var spriteList = {};

// the shameful error function
function error(msg) {alert(msg);}

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

defineProperty(sjs, 'h', {
    get:function() {return this._h},
    set:function(value) {
        this._h = value;
        this.dom.style.height = value + 'px';
    }
});

defineProperty(sjs, 'w', {
    get:function() {return this._w},
    set:function(value) {
        this._w = value;
        this.dom.style.width = value + 'px';
    }
});

function Sprite(src, layer) {

    if(this.constructor !== arguments.callee)
        return new Sprite(src, layer);

    var sp = this;
    this._dirty = {};
    this.changed = false;

    function property(name, defaultValue, type) {
        if(defaultValue === undefined)
            sp['_'+name] = 0;
        else
            sp['_'+name] = defaultValue;

        defineProperty(sp, name, {
            get:function get() {return sp['_'+name]},
            set:function set(value) {
                sp['_'+name] = value;
                if(!sp.layer.useCanvas) {
                    sp._dirty[name] = true;
                    sp.changed = true;
                }
            }
        });
    }

    // positions
    this.y = 0;
    this.x = 0;

    //velocity
    this.xv = 0;
    this.yv = 0;
    this.rv = 0;

    // image
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

    this.xscale = 1;
    this.yscale = 1;
    this.angle = 0;

    this.opacity = 1;
    this.color = false;

    if(layer === undefined) {
        // important to delay the creation so useCanvas
        // can still be changed
        if(sjs.layers['default'] === undefined)
            sjs.layers["default"] = new Layer("default");
        layer = sjs.layers['default'];
    }
    this.layer = layer;
    //this.layerIndex = layer.addSprite(this);

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

/* boilerplate setter functions */

Sprite.prototype.setX = function setX(value) {
    this.x = value;
    this._dirty['x'] = true;
    this.changed = true;
    return this;
}

Sprite.prototype.setY = function setX(value) {
    this.y = value;
    this._dirty['y'] = true;
    this.changed = true;
    return this;
}

Sprite.prototype.setW = function setW(value) {
    this.w = value;
    this._dirty['w'] = true;
    this.changed = true;
    return this;
}

Sprite.prototype.setH = function setH(value) {
    this.h = value;
    this._dirty['h'] = true;
    this.changed = true;
    return this;
}

Sprite.prototype.setXOffset = function setXoffset(value) {
    this.xoffset = value;
    this._dirty['xoffset'] = true;
    this.changed = true;
    return this;
}

Sprite.prototype.setYOffset = function setYoffset(value) {
    this.yoffset = value;
    this._dirty['yoffset'] = true;
    this.changed = true;
    return this;
}

Sprite.prototype.setAngle = function setAngle(value) {
    this.angle = value;
    this._dirty['angle'] = true;
    this.changed = true;
    return this;
}

Sprite.prototype.setColor = function setColor(value) {
    this.color = value;
    this._dirty['color'] = true;
    this.changed = true;
    return this;
}

Sprite.prototype.setXScale = function setXscale(value) {
    this.xscale = value;
    this._dirty['xscale'] = true;
    this.changed = true;
    return this;
}

Sprite.prototype.setYScale = function setYscale(value) {
    this.yscale = value;
    this._dirty['yscale'] = true;
    this.changed = true;
    return this;
}

/* end of boilerplate setters */

Sprite.prototype.rotate = function (v) {
    this.setAngle(this.angle + v);
    return this;
};

Sprite.prototype.scale = function (x, y) {
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

Sprite.prototype.move = function (x, y) {
    this.setX(this.x+x);
    this.setY(this.y+y);
    return this;
};

Sprite.prototype.applyVelocity = function (ticks) {
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

Sprite.prototype.reverseVelocity = function (ticks) {
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

Sprite.prototype.applyXVelocity = function (ticks) {
    if(ticks === undefined)
        ticks = 1;
    if(this.xv != 0)
        this.setX(this.x+this.xv*ticks);
}

Sprite.prototype.reverseXVelocity = function (ticks) {
    if(ticks === undefined)
        ticks = 1;
    if(this.xv != 0)
        this.setX(this.x-this.xv*ticks);
}

Sprite.prototype.applyYVelocity = function (ticks) {
    if(ticks === undefined)
        ticks = 1;
    if(this.yv != 0)
        this.setY(this.y+this.yv*ticks);
}

Sprite.prototype.reverseYVelocity = function (ticks) {
    if(ticks === undefined)
        ticks = 1;
    if(this.yv != 0)
        this.setY(this.y-this.yv*ticks);
}

Sprite.prototype.offset = function (x, y) {
    this.setXOffset(x);
    this.setYOffset(y);
    return this;
};

Sprite.prototype.size = function (w, h) {
    this.setW(w);
    this.setH(h);
    return this;
};

Sprite.prototype.remove = function remove() {
    if(this.layer.useCanvas == false) {
        this.layer.dom.removeChild(this.dom);
        this.dom = null;
    }
    delete this.layer.sprites[this.layerIndex];
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
    // using Math.round to round integers before changing seems to improve a bit performances
    if(this._dirty['w'])
        style.width=(this.w | 0) +'px';
    if(this._dirty['h'])
        style.height=(this.h  | 0)+'px';
    // translate and translate3d doesn't seems to offer any speedup
    // in my tests.
    if(this._dirty['y'])
        style.top=(this.y | 0)+'px';
    if(this._dirty['x'])
       style.left=(this.x | 0)+'px';
    if(this._dirty['xoffset'] || this._dirty['yoffset'])
        style.backgroundPosition=-Math.round(this.xoffset)+'px '+-Math.round(this.yoffset)+'px';

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

Sprite.prototype.canvasUpdate = function updateCanvas (layer) {
    if(layer)
        var ctx = layer.ctx;
    else
        var ctx = this.layer.ctx;
    ctx.save();
    ctx.translate(this.x + this.w/2 | 0, this.y + this.h/2 | 0);
    ctx.rotate(this.angle);
    if(this.xscale != 1 || this.xscale != 1)
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


Sprite.prototype.isPointIn = function pointIn(x, y) {
    // return true if the point is in the sprite surface
    return (x >= this.x && x <= this.x+this.w - 1
        && y >= this.y && y <= this.y+this.h - 1)
};

Sprite.prototype.areVerticesIn = function areVerticesIn(sprite) {
    return (this.isPointIn(sprite.x, sprite.y)
       || this.isPointIn(sprite.x + sprite.w - 1, sprite.y)
       || this.isPointIn(sprite.x + sprite.w - 1, sprite.y + sprite.h - 1)
       || this.isPointIn(sprite.x, sprite.y + sprite.h - 1));
};

Sprite.prototype.distance = function distance(x, y) {
    return Math.sqrt(Math.pow(this.x + this.w/2 - x, 2) + Math.pow(this.y + this.h/2 - y, 2));
}

Sprite.prototype.center = function center() {
    return [this.x + this.w/2, this.y + this.h/2];
}

Sprite.prototype.collidesWith = function collidesWith(sprites) {
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
                sprite.setXOffset(this.triplets[i][0]);
                sprite.setYOffset(this.triplets[i][1]);
            }
        }
    }
    return this;
};

Cycle.prototype.reset = function resetCycle() {
    this.tick = 0;
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

// the way things works, I don't see the point of having more
// than one of those.
var tickerSingleton = false;
function Ticker(tickDuration, paint) {
    if(!tickerSingleton)
        tickerSingleton = _Ticker(tickDuration, paint);
    else
        error("This framework doesn't support multiple tickers object.")
    return tickerSingleton;
};

function _Ticker(tickDuration, paint) {

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
}

_Ticker.prototype.next = function() {
    var ticksElapsed = Math.round((this.now - this.start) / this.tickDuration);
    this.lastTicksElapsed = ticksElapsed - this.currentTick;
    this.currentTick = ticksElapsed;
    return this.lastTicksElapsed;
};

_Ticker.prototype.run = function() {
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
        if(layer.useCanvas && layer.autoClear) {
            // try a smarter way to clear
            /*var xmin=0, ymin=0, xmax=0, ymax=0;
            for(var index in layer.sprites) {
                var sp = layer.sprites[index];
                if(sp.x < xmin)
                    xmin = sp.x
                if(sp.y < ymin)
                    ymin = sp.y
                if(sp.x + sp.w > xmax)
                    xmax = sp.x + sp.w
                if(sp.y + sp.h > ymax)
                    ymax = sp.y + sp.h
            }
            layer.ctx.clearRect(xmin, ymin, xmax - xmin, ymax - ymin);*/
            layer.clear();

        }
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
    this.timeout = setTimeout(function(){t.run()}, _nextPaint);
}

_Ticker.prototype.pause = function() {
    global.clearTimeout(this.timeout);
    this.paused = true;
}

_Ticker.prototype.resume = function() {
    this.start = new Date().getTime();
    this.ticksElapsed = 0;
    this.currentTick = 0;
    this.paused = false;
    this.run();
}


var inputSingleton = new _Input();
function Input(){return inputSingleton};

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
    /*global.addEventListener("blur", function (e) {
        that.keyboard = {}
        that.keydown = false;
        that.mousedown = false;
        // create a semi transparent layer on the game
        if(tickerSingleton && !tickerSingleton.paused) {
            tickerSingleton.pause();
            var div = overlay(0, 0, sjs.w, sjs.h);
            div.innerHTML = 'Game paused,<br>click to resume.';
            div.style.textAlign = 'center';
            div.style.paddingTop = ((sjs.h/2) - 16)  + 'px';
            var listener = function() {
                sjs.dom.removeChild(div);
                document.removeEventListener('click', listener, false);
                tickerSingleton.resume();
            }
            document.addEventListener('click', listener, false);
            sjs.dom.appendChild(div);
        }
    }, false);*/
}

_Input.prototype.arrows = function arrows() {
    /* Return true if any arrow key is pressed */
    return this.keyboard.right || this.keyboard.left || this.keyboard.up || this.keyboard.down;
};

var layerZindex = 1;

function Layer(name, options) {

    var canvas, domElement;

    if(this.constructor !== arguments.callee)
        return new Layer(name, options);

    this.sprites = {};

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

Layer.prototype.addSprite = function addSprite(sprite) {
    var index = Math.random() * 11;
    this.sprites[index] = sprite;
    return index
}

function init() {
    initDom();
    var properties = ['transform', 'WebkitTransform', 'MozTransform', 'OTransform', 'msTransform'];
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
