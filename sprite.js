/* This the library file for the Sprite Javascript framework -- sprite.js */

/* coding style:
 *
 *
 * camelCase for methods
 * camelCase for public attributes
 */

(function(){

var sjs = {
    Sprite: Sprite,
    Cycle: Cycle,
    tproperty: false,
    Ticker: Ticker,
    Input: Input,
    Layer: Layer,
    use_canvas: (window.location.href.indexOf('canvas') != -1),
    layers: {},
};

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


function error(msg) {alert(msg)}

function Sprite(src, layer) {

    var sp = this;
    this._dirty = {};
    this.changed = false;

    function property(name, default_value) {
        if(default_value === undefined)
            sp['_'+name] = 0;
        else
            sp['_'+name] = default_value;

        sp.__defineGetter__(name, function() {
            return sp['_'+name];
        });

        sp.__defineSetter__(name, function(value) {
            sp['_'+name] = value;
            if(!sjs.use_canvas) {
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
    this.img_natural_width = null;
    this.img_natural_height = null;

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
        // important to delay the creation so use_canvas
        // can still be changed
        if(sjs.layers['default'] === undefined)
            sjs.layers["default"] = new Layer("default");
        layer = sjs.layers['default'];
    }
    this.layer = layer;

    if(sjs.use_canvas == false) {
        var d = document.createElement('div');
        d.style.position = 'absolute';
        this.dom = d;
        layer.dom.appendChild(d);
    }

    if(src)
        this.loadImg(src)
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
        var y = x;
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
    if(sjs.use_canvas == false) {
        this.layer.dom.removeChild(this.dom);
        this.dom = null;
    }
    this.layer = null;
    this.img = null;
}

Sprite.prototype.update = function updateDomProperties () {
    /* This is the CPU heavy function. */
    if(sjs.use_canvas == true) {
        return this.canvasUpdate();
    }
    if(this.changed == false)
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
    if(this.img_loaded && this.img) {
        if(this.img_natural_width < this.w || this.img_natural_height < this.h) {
            var repeat_w = Math.floor(this.w / this.img_natural_width);
            while(repeat_w > 0) {
                repeat_w = repeat_w-1;
                var repeat_y = Math.floor(this.h / this.img_natural_height);
                while(repeat_y > 0) {
                    repeat_y = repeat_y-1;
                    ctx.drawImage(this.img, this.xoffset, this.yoffset, this.img_natural_width,
                                this.img_natural_height, repeat_w*this.img_natural_width, repeat_y*this.img_natural_width,
                                this.img_natural_width, this.img_natural_height);
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

Sprite.prototype.loadImg = function (src, resetSize) {
    this.img = new Image();
    var there = this;
    this.img.onload = function(e) {
        there.img_loaded = true;
        var img = this;
        if(!sjs.use_canvas)
            there.dom.style.backgroundImage = 'url('+src+')';
        there.img_natural_width = img.width;
        there.img_natural_height = img.height;
        if(there.w === null || resetSize)
            there.w = img.width;
        if(there.h === null || resetSize)
            there.h = img.height;
        there.update();
    };
    this.img.src = src;
    return this;
};


Sprite.prototype.isPointIn = function pointIn(x, y) {
    // return true if the point is in the sprite surface
    return (x >= this.x && x <= this.x+this.w
        && y >= this.y && y <= this.y+this.h)
}

Sprite.prototype.areVerticesIn = function areVerticesIn(sprite) {
    return (this.isPointIn(sprite.x, sprite.y)
       || this.isPointIn(sprite.x+sprite.w, sprite.y)
       || this.isPointIn(sprite.x+sprite.w, sprite.y)
       || this.isPointIn(sprite.x, sprite.y + sprite.h));
}

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
}

function Cycle(triplets) {
    /* Cycle for the Sprite image.
    A cycle is a list of triplet (x offset, y offset, game tick duration) */
    this.triplets = triplets;
    // total duration of the animation in ticks
    this.cycle_duration = 0;
    // this array knows on which ticks in the animation
    // an image change is needed
    this.changing_ticks = [];
    for(var i=0, triplet; triplet=triplets[i]; i++) {
        this.cycle_duration = this.cycle_duration + triplet[2];
        this.changing_ticks.push(this.cycle_duration);
    }
    this.sprites = [];
    // if set to false, the animation will stop automaticaly after one run
    this.repeat = true;
    this.tick = 0;
};

Cycle.prototype.next = function (ticks) {
    if(ticks === undefined)
        ticks = 1;
    this.tick = this.tick + ticks;
    if(this.tick > this.cycle_duration) {
        if(this.repeat)
            this.tick = 0;
        else
            return this;
    }
    for(var i=0; i<this.changing_ticks.length; i++) {
        if(this.tick == this.changing_ticks[i]) {
            for(var j=0, sprite; sprite = this.sprites[j]; j++) {
                sprite.xoffset = this.triplets[i][0];
                sprite.yoffset = this.triplets[i][1];
            }
        }
    }
    return this;
};

Cycle.prototype.reset = function reset_cycle() {
    this.tick = 0;
    for(var j=0, sprite; sprite = this.sprites[j]; j++) {
        sprite.xoffset = this.triplets[0][0];
        sprite.yoffset = this.triplets[0][1];
    }
    return this;
}

function Ticker(tick_duration, paint) {
    this.paint = paint;
    if(tick_duration === undefined)
        this.tick_duration = 25;
    else
        this.tick_duration = tick_duration;

    this.start = new Date().getTime();
    this.ticks_elapsed = 0;
    this.current_tick = 0;
}

Ticker.prototype.next = function() {
    var ticks_elapsed = Math.round((this.now - this.start) / this.tick_duration);
    this.lastTicksElapsed = ticks_elapsed - this.current_tick;
    this.current_tick = ticks_elapsed;
    return this.lastTicksElapsed;
}

Ticker.prototype.run = function() {
    var t = this;
    this.now = new Date().getTime();
    var ticks_elapsed = this.next();
    // no update needed, this happen on the first run
    if(ticks_elapsed == 0) {
        // this is not a cheap operation
        setTimeout(function(){t.run()}, this.tick_duration);
        return;
    }

    if(sjs.use_canvas) {
        for(var name in sjs.layers) {
            var layer = sjs.layers[name];
            layer.ctx.clearRect(0, 0, layer.dom.width, layer.dom.height);
            // trick to clear canvas, doesn't seems to do any better according to tests
            // http://skookum.com/blog/practical-canvas-test-charlottejs/
            // canvas.width = canvas.width
        }
    }
    this.paint(this);

    this.time_to_paint = (new Date().getTime()) - this.now;
    this.load = Math.round((this.time_to_paint / this.tick_duration) * 100);
    // We need some pause to let the browser catch up the update. Here at least 12 ms of pause
    var next_paint = Math.max(this.tick_duration - this.time_to_paint, 12);
    setTimeout(function(){t.run()}, next_paint);
}

function Input() {

    this.keyboard = {};
    var that = this;
    this.mousedown = false;
    this.keydown = true;

    // this is handling WASD, and arrows keys
    function update_keyboard(e, val) {
        if(e.keyCode==40 || e.keyCode==83)
            that.keyboard['down'] = val;
        if(e.keyCode==38 || e.keyCode==87)
            that.keyboard['up'] = val;
        if(e.keyCode==39 || e.keyCode==68)
            that.keyboard['right'] = val;
        if(e.keyCode==37 || e.keyCode==65)
            that.keyboard['left'] = val;
        if(e.keyCode==32)
            that.keyboard['space'] = val;
        if(e.keyCode==17)
            that.keyboard['ctrl'] = val;
        if(e.keyCode==13)
            that.keyboard['enter'] = val;
    };

    document.ontouchstart = function(event) {
        that.mousedown = true;
    }
    document.ontouchend = function(event) {
        that.mousedown = false;
    }
    document.ontouchmove = function(event) {}

    document.onmousedown = function(event) {
        that.mousedown = true;
    }
    document.onmouseup = function(event) {
        that.mousedown = false;
    }
    document.onclick = function(event) {
        that.click(event);
    }
    document.onmousemove = function(event) {
        that.xmouse = event.clientX;
        that.ymouse = event.clientY;
    }
    document.onkeydown = function(e) {
        that.keydown = true;
        update_keyboard(e, true);
    };
    document.onkeyup = function(e) {
        that.keydown = false;
        update_keyboard(e, false);
    };
    // can be used to avoid key jamming
    document.onkeypress = function(e) {

    };
    // make sure that the keyboard is rested when
    // the user leave the page
    window.onblur = function (e) {
        that.keyboard = {}
        that.keydown = false;
        that.mousedown = false;
    }
}

Input.prototype.arrows = function arrows() {
    /* Return true if any arrow key is pressed */
    return this.keyboard.right || this.keyboard.left || this.keyboard.up || this.keyboard.down;
}

Input.prototype.click = function click(event) {
    // to override
}

var layer_zindex = 1;

function Layer(name) {
    this.name = name;
    if(sjs.layers[name] === undefined)
        sjs.layers[name] = this;
    else
        error('Layer '+ name + ' already exist.');

    var dom = initDom();

    if(sjs.use_canvas) {
        var canvas = document.createElement('canvas');
        canvas.height = sjs.h;
        canvas.width = sjs.w;
        canvas.style.position = 'absolute';
        canvas.style.zIndex = String(layer_zindex);
        canvas.style.top = '0px';
        canvas.style.left = '0px';
        dom.appendChild(canvas);
        this.dom = canvas;
        this.ctx = canvas.getContext('2d');
    } else {
        var div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.top = '0px';
        div.style.left = '0px';
        div.style.zIndex = String(layer_zindex);
        this.dom = div;
        dom.appendChild(this.dom);
    }
    layer_zindex += 1;
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
        div.style.position = 'relative';
        div.id = 'sjs';
        document.body.appendChild(div);
        sjs.dom = div;
        sjs.w = 480;
        sjs.h = 320;
    }
    return sjs.dom;
}

window.addEventListener("load", init, false);
window.sjs = sjs;

})();
