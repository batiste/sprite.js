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

    // be sure that the size are divisible by 2
    this.w = w - w % 2;
    this.h = h - h % 2;
    
    this.redrawCallback = redrawCallback;
    this.block_h = Math.ceil(this.h / 2.0);
    this.block_w = Math.ceil(this.w / 2.0);
    this.x = 0;
    this.y = 0;
    this.scene = scene;
    this.dom = doc.createElement('div');
    this.dom.style.position = "relative";
    scene.dom.appendChild(this.dom);
    
    // the place where we buffer the drawings
    this.bufferCanvas = scene.Layer("buffer-"+Math.random(),
            {w:1.5*this.w, h:1.5*this.h, x:0, y:0, autoClear:false,
            useCanvas:true, parent:this.dom, disableAutoZIndex:true});

    // the canvas passed to the callback
    this.callbackCanvas = scene.Layer("buffer-"+Math.random(),
            {w:this.block_w , h:this.block_h, x:0, y:0, autoClear:false,
            useCanvas:true, parent:this.dom, disableAutoZIndex:true});

    this.bufferCanvas.dom.style.display = 'none';
    this.callbackCanvas.dom.style.display = 'none';

    // the front style
    this.front = scene.Layer("front-"+Math.random(),
        {w:this.w, h:this.h, x:0, y:0, autoClear:false,
        useCanvas:true, parent:this.dom, disableAutoZIndex:true});

    this.callbackCanvas.ctx.fillStyle = "#666";
    this.bufferCanvas.ctx.fillStyle = "#0f0";
    this.front.ctx.fillStyle = "#f00";
    
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
            needed_blocks.push([x_block_start + x, y_block_start + y]);
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
    //if(render_list.length) {
        var toRender = render_list[i];
        // real map coordinates
        var x = toRender[0] * this.block_w;
        var y = toRender[1] * this.block_h;

        // by painting the callback canvas, we don't need to clear it nor the bufferCanvas 
        this.callbackCanvas.ctx.fillRect(0,  0, this.block_w, this.block_h);
        // redraw to copy on the necessary part of the buffer
        this.redrawCallback(this.callbackCanvas, x, y);
        
        // buffer position in pixels
        var buffer_pos = [
            sjs.math.mod(toRender[0], 3) * this.block_w | 0,
            sjs.math.mod(toRender[1], 3) * this.block_h | 0
        ];

        // copy on the buffer
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
        var x = block.pos[0] - this.x;
        var w = Math.min(this.w - x, this.block_w);
        var y = block.pos[1] - this.y;
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
            this.front.ctx.drawImage(this.bufferCanvas.dom,
            block.buffer_pos[0] + left_source, block.buffer_pos[1] + top_source,
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

SrollingSurface.prototype.remove = function remove() {
    this.scene.dom.removeChild(this.dom);
    this.bufferCanvas = null;
    this.callbackCanvas = null;
    this.front = null;
}

global.sjs.SrollingSurface = SrollingSurface;

})(this);