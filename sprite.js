/* This the library file for the Sprite Javascript framework -- sprite.js */

(function(){

function Sprite() {
    // positions
    this.x = 0;
    this.y = 0;
    // x velocity
    this.xv = 0;
    // y velocity
    this.yv = 0;

    // image
    this.img = null;
    this.img_natural_width = 0;
    this.img_natural_height = 0;

    // width and height of the sprite view port
    this.w = null;
    this.h = null;

    // offsets of the image within the viewport
    this.xoffset=0;
    this.yoffset=0;

    this.dom = null;

    this.xscale = 1;
    this.yscale = 1;
    // radial position
    this.r = 0;

    this.transform_changed = false;

    var d = document.createElement('div');
    d.className = 'sprite';
    this.dom = d;
    document.body.appendChild(this.dom);
    return this;
}

Sprite.prototype.constructor = Sprite;

Sprite.prototype.init = function() {

};

Sprite.prototype.rotate = function (v) {
    this.transform_changed = true;
    this.r = this.r+v;
    return this;
};

Sprite.prototype.scale = function (x, y) {
    this.transform_changed = true;
    this.xscale = x;
    if(y === undefined)
        this.yscale = x;
    else
        this.yscale = y;
    return this;
};

Sprite.prototype.move = function (x, y) {
    this.x = this.x+x;
    this.y = this.y+y;
    return this;
};

Sprite.prototype.update = function updateCssText () {
    /* my tests show that cssText is way more efficient on firefox.
     * somewhat better on webkit and a bit worse on Opera. */
    var cssText = "";
    cssText+='width:'+this.w+'px;';
    cssText+='height:'+this.h+'px;';
    cssText+='top:'+this.y+'px;';
    cssText+='left:'+this.x+'px;';
    this.img.style.left=this.xoffset+'px';
    this.img.style.top=this.yoffset+'px';
    // this has pretty bad perfs implication on Opera, don't update the value if nothing changed
    if(this.transform_changed) {
        cssText+=sjs.cproperty+':rotate('+this.r+'rad) scale('+this.xscale+', '+this.yscale+');';
        this.transform_changed = false;
    }
    this.dom.style.cssText = cssText;
    return this;
};

Sprite.prototype.update2 = function updateDomProperties () {
    /* alternative update function. This might be faster in some situation, especially
     * when few properties have been changed. */
    var style = this.dom.style;
    style.width=this.w;
    style.height=this.h;
    style.top=this.y+'px';
    style.left=this.x+'px';
    this.img.style.left=this.xoffset+'px';
    this.img.style.top=this.yoffset+'px';
    if(this.transform_changed) {
        style[sjs.tproperty] = 'rotate('+this.r+'rad) scale('+this.xscale+', '+this.yscale+')';
        this.transform_changed = false;
    }
    return this;
};

Sprite.prototype.update3 = function updateCssText () {
    /* Try an alternative scale method. Tests don't
     * produce any noticeable improvement. */
    var cssText = "";
    var xs = Math.abs(this.xscale);
    var ys = Math.abs(this.yscale);
    cssText+='width:'+xs*this.w+'px;';
    cssText+='height:'+ys*this.h+'px;';
    cssText+='top:'+this.y+'px;';
    cssText+='left:'+this.x+'px;';
    this.img.style.left=xs*this.xoffset+'px';
    this.img.style.top=ys*this.yoffset+'px';

    this.img.style.width=xs*this.img_natural_width+'px';
    this.img.style.height=ys*this.img_natural_height+'px';

    // this has pretty bad perfs implication on Opera, don't update the value if nothing changed
    if(this.transform_changed) {
        cssText+=sjs.cproperty+':rotate('+this.r+'rad);';
        this.transform_changed = false;
    }
    this.dom.style.cssText = cssText;
};

Sprite.prototype.toString = function () {
    return String(this.x) + ',' + String(this.y);
};

Sprite.prototype.loadImg = function (src) {
    this.img = new Image();
    var there = this;
    this.img.onload = function() {
        var img = there.img;
        there.dom.appendChild(img);
        there.img_natural_width = img.width;
        there.img_natural_height = img.img_natural_height;
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

Cycle.prototype.next = function () {
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
    this.tick = this.tick + 1;
    return this;
};

function SquaredSprite() {

};

SquaredSprite.prototype = new Sprite();
SquaredSprite.prototype.constructor = SquaredSprite;

var sjs = {
    Sprite: Sprite,
    SquareSprite: SquaredSprite,
    Cycle: Cycle,
    tproperty: false,
    cproperty: false
};

function getTransformProperty() {
    var properties = ['transform', 'WebkitTransform', 'MozTransform', 'OTransform'];
    var css_properties = ['transform', '-webkit-transform', '-moz-transform', '-o-transform'];
    var p = false;
    while (p = properties.shift()) {
        var c = css_properties.shift();
        if (typeof document.body.style[p] !== 'undefined') {
            sjs.tproperty = p;
            sjs.cproperty = c;
        }
    }
}
 // TODO: be sure the body is loaded before doing that
getTransformProperty();
window.sjs = sjs;

})();
