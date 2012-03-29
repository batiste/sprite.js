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

/* Sprite.js v1.1.1 Scrolling surface class
 *
 */

(function(global){

var doc = global.document;

function SrollingSurface(scene, w, h, redrawCallback) {

    if(this.constructor !== arguments.callee)
        return new SrollingSurface(scene, w, h, redrawCallback);

    this.divider = 2.0;
    // be sure that the sizes are divisible by the block divider size
    this.w = w - w % this.divider;
    this.h = h - h % this.divider;

    this.minimum_free_buffer = (this.divider + 1) * (this.divider + 1);

    this.redrawCallback = redrawCallback;
    this.block_h = Math.ceil(this.h / this.divider);
    this.block_w = Math.ceil(this.w / this.divider);
    this.x = 0;
    this.y = 0;
    this.scene = scene;
    this.dom = doc.createElement('div');
    this.dom.style.position = "relative";
    scene.dom.appendChild(this.dom);

    // buffers
    this.free_buffers = sjs.List();
    for(var i=0; i< (4*this.minimum_free_buffer); i++) {
        var buffer = scene.Layer("buffer-"+Math.random(),
                {w:this.block_w , h:this.block_h, x:0, y:0, autoClear:false,
                useCanvas:true, parent:this.dom, disableAutoZIndex:true});
        buffer.dom.style.display = 'none';
        buffer.ctx.fillStyle = "#666";
        this.free_buffers.append(buffer);
    }
    // the front style
    this.front = scene.Layer("front-"+Math.random(),
        {w:this.w, h:this.h, x:0, y:0, autoClear:false,
        useCanvas:true, parent:this.dom, disableAutoZIndex:true});

    this.front.ctx.fillStyle = "#f00";

    // all the rendered block
    this.drawned = {};
}

SrollingSurface.prototype.getBuffer = function getBuffer() {
    if(this.free_buffers.length==0) {
        this.freeBuffers();
    }
    var b = this.free_buffers.shift();
    return b;
}

SrollingSurface.prototype.freeBuffers = function freeBuffers() {
    var distance_list = [];
    for(var key in this.drawned) {
        if(this.drawned.hasOwnProperty(key)) {
            var b = this.drawned[key];
            distance_list.push({d:sjs.math.hypo(
                b.x - (this.x - this.w / 2),
                b.y - (this.y - this.h / 2)),
                key:key});
        }
    }
    distance_list = distance_list.sort(function(a, b) { return b.d - a.d; });
    var amount = this.minimum_free_buffer;
    for(var i=0; i<amount; i++) {
        var key = distance_list[i].key;
        var block = this.drawned[key];
        delete this.drawned[key];
        this.free_buffers.append(block.buffer);
    }
}

SrollingSurface.prototype.createBlock = function createBlock(block_x, block_y) {
    // Create a block for a position
    var key = block_x+'|'+block_y;
    if(this.drawned[key]) {
        return this.drawned[key];
    }
    var buffer = this.getBuffer();
    // by painting the callback canvas, we don't need to clear it nor the bufferCanvas
    buffer.ctx.fillRect(0,  0, this.block_w, this.block_h);
    // redraw to copy on the necessary part of the buffer
    var x = block_x * this.block_w;
    var y = block_y * this.block_h;
    this.redrawCallback(buffer, x, y);
    var b =  {
        x:x,
        y:y,
        block_x:block_x,
        block_y:block_y,
        buffer:buffer
    }
    this.drawned[key] = b;
    return b;
}

SrollingSurface.prototype.neededBlocks = function neededBlocks() {
    // Return a list of needed block for the surface,
    // the block is a int pair eg: (0,0), (10,12) that indicates the position
    // (x / this.block_w, y / this.block_h) within the map.
    var needed_blocks = [];
    var x_block_start = Math.floor((this.x) / this.block_w) -1;
    var y_block_start = Math.floor((this.y) / this.block_h) -1;

    for(var x=0; x<this.divider+2; x++) {
        for(var y=0; y<this.divider+2; y++) {
            needed_blocks.push({x:x_block_start + x, y:y_block_start + y});
        }
    }
    return needed_blocks
}

SrollingSurface.prototype.blockToRender = function blockToRender() {
    // Return the blocks that need rendering
    var neededBlocks = this.neededBlocks();
    var toRender = [];
    for(var i=0; i<neededBlocks.length; i++) {
        var b = neededBlocks[i];
        var key = b.x+'|'+b.y;
        if(!this.drawned[key])
            toRender.push(b);
    }
    return toRender
}

SrollingSurface.prototype.renderBlocks = function renderBlocks() {
    // new blocks to that need rendering
    var render_list = this.blockToRender();
    for(var i=0; i<render_list.length; i++) {
        var toRender = render_list[i];
        var b = this.createBlock(toRender.x, toRender.y);
    }
}

SrollingSurface.prototype.recomposeBlocks = function recomposeBlocks() {
    // draw all the blocks on the surface. My tests show that it's more efficient
    // than redrawing the canvas on itself.
    var toRecompose = this.neededBlocks();
    for(var i=0; i<toRecompose.length; i++) {
        var b = toRecompose[i];
        var key = b.x+'|'+b.y;
        var block = this.drawned[key];
        // draw the block on the front canvas
        var x = block.x - this.x;
        var w = Math.min(this.w - x, this.block_w);
        var y = block.y - this.y;
        var h = Math.min(this.h - y, this.block_h);

        left_source = 0;
        if(x < 0) {
            var left_source = -x;
            w = w + x;
            x = 0;
        }

        top_source = 0;
        if(y < 0) {
            var top_source = -y;
            h = h + y;
            y = 0;
        }

        if(w>0 && h>0) {
            this.front.ctx.drawImage(block.buffer.ctx.canvas,
            left_source, top_source,
            w, h,
            x, y,
            w, h);
        }
    }
}

SrollingSurface.prototype.move = function move(x, y) {
    this.x = this.x + x;
    this.y = this.y + y;
    return this;
}

SrollingSurface.prototype.position = function position(x, y) {
    this.x = x;
    this.y = y;
    return this;
}

SrollingSurface.prototype.update = function update() {
    this.renderBlocks();
    this.recomposeBlocks();
}

SrollingSurface.prototype.remove = function remove() {
    this.scene.dom.removeChild(this.dom);
    this.bufferCanvas = null;
    this.front = null;
}

global.sjs.SrollingSurface = SrollingSurface;

})(this);