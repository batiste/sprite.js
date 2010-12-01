/* This the library file for the Sprite Javascript framework -- sprite.js */

(function(){

function Sprite() {

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
    this.img = null;
    this.img_natural_width = 0;
    this.img_natural_height = 0;

    // width and height of the sprite view port
    property('w', null);
    property('h', null);

    // offsets of the image within the viewport
    property('xoffset');
    property('yoffset');

    this.dom = null;

    property('xscale', 1);
    property('yscale', 1);
    property('r');

    var d = document.createElement('div');
    d.className = 'sprite';
    this.dom = d;
    document.body.appendChild(this.dom);
    return this;
}

Sprite.prototype.constructor = Sprite;

Sprite.prototype.rotate = function (v) {
    this.r = this.r + v;
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

Sprite.prototype.update = function updateDomProperties () {
    /* alternative update function. This might be faster in some situation, especially
     * when few properties have been changed. */
    var style = this.dom.style;
    if(this.changed['w'])
        style.width=this.w+'px';
    if(this.changed['h'])
        style.height=this.h+'px';
    if(this.changed['y'])
        style.top=this.y+'px';
    if(this.changed['x'])
        style.left=this.x+'px';
    if(this.changed['xoffset'])
        this.img.style.left=this.xoffset+'px';
    if(this.changed['yoffset'])
        this.img.style.top=this.yoffset+'px';
    // those transformation have pretty bad perfs implication on Opera,
    // don't update those values if nothing changed
    if(this.changed['xscale'] || this.changed['yscale'] || this.changed['r']) {
        var trans = "";
        if(this.r!=0)
            trans += 'rotate('+this.r+'rad) ';
        if(this.xscale!=1 || this.yscale!=1) {
            trans += ' scale('+this.xscale+', '+this.yscale+')';
        }
        style[sjs.tproperty] = trans;
    }
    this.changed = {};
    return this;
};

Sprite.prototype.update2 = function updateCssText () {
    /* my tests show that cssText is way more efficient on firefox.
     * somewhat better on webkit and a bit worse on Opera. */
    var cssText = "";
    cssText+='width:'+this.w+'px;';
    cssText+='height:'+this.h+'px;';
    cssText+='top:'+this.y+'px;';
    cssText+='left:'+this.x+'px;';
    this.img.style.left=this.xoffset+'px';
    this.img.style.top=this.yoffset+'px';
    // those transformation have pretty bad perfs implication on Opera,
    // don't update those values if nothing changed
    if(this.xscale!=1 || this.yscale!=1) {
        cssText+=sjs.cproperty+':rotate('+this.r+'rad) scale('+this.xscale+', '+this.yscale+');';
    }
    // this has the annoying side effect of reseting values like transforms
    this.dom.style.cssText = cssText;
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
    cssText+=sjs.cproperty+':rotate('+this.r+'rad);';
    this.transform_changed = false;
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
