/* This the library file for the Sprite Javascript framework -- sprite.js */

(function(){

var canvas = document.createElement('canvas');
canvas.height = 400;
canvas.width = 1200;
canvas.style.position = 'absolute';
canvas.style.top = '0px';
canvas.style.left = '0px';
document.body.appendChild(canvas);
var ctx = canvas.getContext('2d');

var sjs = {
    use_canvas: false,
    Sprite: Sprite,
    Cycle: Cycle,
    tproperty: false,
    Ticker: Ticker,
    Input: Input,
};

function Sprite(src) {

    var sp = this;
    this.changed = {};

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
            sp.changed[name] = true;
        });
    }

    // positions
    property('y');
    property('x');

    // image
    this.img_natural_width = 0;
    this.img_natural_height = 0;

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

    if(sjs.use_canvas == false) {
        var d = document.createElement('div');
        d.className = 'sprite';
        d.style.position = 'absolute';
        this.dom = d;
        document.body.appendChild(this.dom);
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
};

Sprite.prototype.size = function (w, h) {
    this.w=w;
    this.h=h;
};

Sprite.prototype.update = function updateDomProperties () {
    /* alternative update function. This might be faster in some situation, especially
     * when few properties have been changed. */
    if(sjs.use_canvas == true) {
        return this.canvasUpdate();
    }
    var style = this.dom.style;
    if(this.changed['w'])
        style.width=this.w+'px';
    if(this.changed['h'])
        style.height=this.h+'px';
    if(this.changed['y'])
        style.top=this.y+'px';
    if(this.changed['x'])
        style.left=this.x+'px';
    if(this.changed['xoffset'] || this.changed['yoffset'])
        this.dom.style.backgroundPosition=-this.xoffset+'px '+-this.yoffset+'px';

    // those transformation have pretty bad perfs implication on Opera,
    // don't update those values if nothing changed
    if(this.changed['xscale'] || this.changed['yscale'] || this.changed['angle']) {
        var trans = "";
        if(this.angle!=0)
            trans += 'rotate('+this.angle+'rad) ';
        if(this.xscale!=1 || this.yscale!=1) {
            trans += ' scale('+this.xscale+', '+this.yscale+')';
        }
        style[sjs.tproperty] = trans;
    }
    // reset
    this.changed = {};
    return this;
};

Sprite.prototype.canvasUpdate = function updateCanvas () {
    ctx.save();
    ctx.translate(this.x + (this.w/2), this.y + (this.h/2));
    ctx.rotate(this.angle);
    ctx.scale(this.xscale, this.yscale)
    ctx.translate(-(this.w/2), -(this.h/2));
    ctx.drawImage(this.img, this.xoffset, this.yoffset, this.w, this.h, 0, 0, this.w, this.h);
    ctx.restore();
    return this;
};

Sprite.prototype.toString = function () {
    return String(this.x) + ',' + String(this.y);
};

Sprite.prototype.loadImg = function (src) {
    this.img = new Image();
    var there = this;
    this.img.onload = function() {
        var img = there.img;
        if(!sjs.use_canvas)
            there.dom.style.backgroundImage = 'url('+src+')';
        there.img_natural_width = img.width;
        there.img_natural_height = img.height;
        if(there.w === null)
            there.w = img.width;
        if(there.h === null)
            there.h = img.height;
    };
    this.img.src = src;
    return this;
};

function Cycle(triplet) {
    /* Cycle for the Sprite image.
    A cycle is a list of triplet (x offset, y offset, game tick duration) */
    this.triplet = triplet;
    this.cycle_duration = 0;
    this.changing_ticks = [];
    for(var i=0; i<triplet.length; i++) {
        this.cycle_duration = this.cycle_duration + triplet[i][2];
        this.changing_ticks.push(this.cycle_duration);
    }
    this.sprites = [];
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
            for(j=0; j<this.sprites.length; j++) {
                this.sprites[j].xoffset = this.triplet[i][0];
                this.sprites[j].yoffset = this.triplet[i][1];
            }
        }
    }
    return this;
};

Cycle.prototype.reset = function reset_cycle() {
    this.tick = 0;
    for(j=0; j<this.sprites.length; j++) {
        this.sprites[j].xoffset = this.triplet[0][0];
        this.sprites[j].yoffset = this.triplet[0][1];
    }
    return this;
}

function Ticker(tick_duration) {
    if(tick_duration === undefined)
        this.tick_duration = 25;
    else
        this.tick_duration = tick_duration;

    this.start = new Date().getTime();
    this.tick_elapsed = 0;
    this.current_tick = 0;
}

Ticker.prototype.next = function() {
    var now = new Date().getTime();
    var tick_elapsed = Math.round((now - this.start) / this.tick_duration);
    this.last_tick_elapsed = tick_elapsed - this.current_tick;
    this.current_tick = tick_elapsed;
    return this.last_tick_elapsed;
}

Ticker.prototype.run = function(paint) {
    if(paint)
        this.paint = paint;
    var t = this;
    setTimeout(function(){t.run()}, this.tick_duration/2);
    var ticks_elapsed = this.next();
    // no update needed
    if(ticks_elapsed == 0)
        return
    if(sjs.use_canvas) {
        ctx.clearRect(0,0, canvas.width, canvas.height);
        // trick to clear canvas, doesn't seems to do any better according to tests
        // http://skookum.com/blog/practical-canvas-test-charlottejs/
        // canvas.width = canvas.width
    }
    this.paint(this);
}

function Input() {

    this.keyboard = {};
    var that = this;

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
        that.mouse_down = false;
    }
    document.onclick = function(event) {
        //this.click(event);
    }
    document.onmousemove = function(event) {
        //this.mousemove(event);
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
}

Input.prototype.arrows = function arrows() {
    /* Return true if any arrow key is pressed */
    return this.keyboard.right || this.keyboard.left || this.keyboard.up || this.keyboard.down;
}

Input.prototype.click = function click(event) {

}

Input.prototype.mousemove = function mousemouve(event) {

}

function getTransformProperty() {
    var properties = ['transform', 'WebkitTransform', 'MozTransform', 'OTransform'];
    var p = false;
    while (p = properties.shift()) {
        if (typeof document.body.style[p] !== 'undefined') {
            sjs.tproperty = p;
        }
    }
}
 // TODO: be sure the body is loaded before doing that
getTransformProperty();
window.sjs = sjs;

})();
