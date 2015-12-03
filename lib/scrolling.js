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

(function (global) {

    var ScrollingSurface;

    ScrollingSurface = function (Scene, w, h, redrawCallback) {

        var i,
            buffer,
            doc;

        if (this.constructor !== arguments.callee) {
            return new ScrollingSurface(Scene, w, h, redrawCallback);
        }

        doc = window.document;
        this.divider = 2.0;
        // be sure that the sizes are divisible by the block divider size
        this.w = w - (w % this.divider);
        this.h = h - (h % this.divider);

        this.minimum_free_buffer = (this.divider + 1) * (this.divider + 1);

        this.redrawCallback = redrawCallback;
        this.block_h = Math.ceil(this.h / this.divider);
        this.block_w = Math.ceil(this.w / this.divider);
        this.x = 0;
        this.y = 0;
        this.Scene = Scene;
        this.dom = doc.createElement('div');
        this.dom.style.position = "relative";
        Scene.dom.appendChild(this.dom);
    
        // buffers
        this.free_buffers = sjs.List();

        for (i = 0; i < (4 * this.minimum_free_buffer); i += 1) {
            buffer = Scene.Layer("buffer-" + Math.random(), {
                'w': this.block_w,
                'h': this.block_h,
                'x': 0,
                'y': 0,
                'autoClear': false,
                'useCanvas': true,
                'parent': this.dom,
                'disableAutoZIndex': true
            });
            buffer.dom.style.display = 'none';
            buffer.ctx.fillStyle = "#666";
            this.free_buffers.append(buffer);
        }

        // the front style
        this.front = Scene.Layer("front-" + Math.random(), {
            'w': this.w,
            'h': this.h,
            'x': 0,
            'y': 0,
            'autoClear': false,
            'useCanvas': true,
            'parent': this.dom,
            'disableAutoZIndex': true
        });
        this.front.ctx.fillStyle = "#f00";

        // all the rendered blocks
        this.drew = {};
    };

    ScrollingSurface.prototype.getBuffer = function getBuffer() {

        if (this.free_buffers.length === 0) {
            this.freeBuffers();
        }

        return this.free_buffers.shift();
    };

    ScrollingSurface.prototype.freeBuffers = function freeBuffers() {

        var distanceList = [],
            key, b, i, block;

        for (key in this.drew) {
            if (this.drew.hasOwnProperty(key)) {
                b = this.drew[key];

                distanceList.push({
                    'd': sjs.math.hypo(b.x - (this.x - this.w / 2), b.y - (this.y - this.h / 2)),
                    'key': key
                });
            }
        }

        distanceList = distanceList.sort(function(a, b) {
            return b.d - a.d;
        });

        for (i = 0; i < this.minimum_free_buffer; i += 1) {
            key = distanceList[i].key;
            block = this.drew[key];
            delete this.drew[key];
            this.free_buffers.append(block.buffer);
        }
    };

    ScrollingSurface.prototype.createBlock = function createBlock(blockX, blockY) {

        // Create a block for a position
        var key, buffer, x, y, block;

        key = blockX + '|' + blockY;
        if (this.drew[key]) {
            return this.drew[key];
        }

        buffer = this.getBuffer();
        // by painting the callback canvas, we don't need to clear it nor the bufferCanvas
        buffer.ctx.fillRect(0,  0, this.block_w, this.block_h);
        // redraw to copy on the necessary part of the buffer
        x = blockX * this.block_w;
        y = blockY * this.block_h;

        this.redrawCallback(buffer, x, y);

        block = {
            'x': x,
            'y': y,
            'block_x': blockX,
            'block_y': blockY,
            'buffer': buffer
        };
        this.drew[key] = block;

        return block;
    };

    ScrollingSurface.prototype.neededBlocks = function neededBlocks() {

        // Return a list of needed block for the surface,
        // the block is a int pair eg: (0,0), (10,12) that indicates the position
        // (x / this.block_w, y / this.block_h) within the map.
        var needed = [],
            xBlockStart, yBlockStart,
            x, y;

        xBlockStart = Math.floor((this.x) / this.block_w) - 1;
        yBlockStart = Math.floor((this.y) / this.block_h) - 1;

        for (x = 0; x < this.divider + 2; x += 1) {
            for (y = 0; y < this.divider + 2; y += 1) {
                needed.push({
                    'x': xBlockStart + x,
                    'y': yBlockStart + y
                });
            }
        }

        return needed;
    };
    
    ScrollingSurface.prototype.blockToRender = function blockToRender() {

        // Return the blocks that need rendering
        var neededBlocks = this.neededBlocks(),
            toRender = [],
            i, block, key;

        for (i = 0; i < neededBlocks.length; i += 1) {
            block = neededBlocks[i];
            key = block.x + '|' + block.y;

            if (!this.drew[key]) {
                toRender.push(block);
            }
        }

        return toRender;
    };

    ScrollingSurface.prototype.renderBlocks = function renderBlocks() {

        // new blocks to that need rendering
        var renderList = this.blockToRender(),
            i, toRender, block;

        for (i = 0; i < renderList.length; i += 1) {
            toRender = renderList[i];
            block = this.createBlock(toRender.x, toRender.y);
        }
    };

    ScrollingSurface.prototype.recomposeBlocks = function recomposeBlocks() {

        // draw all the blocks on the surface. My tests show that it's more efficient
        // than redrawing the canvas on itself.
        var toRecompose = this.neededBlocks(),
            i, b, key, block, x, y, w, h,
            leftSource, topSource;

        for (i = 0; i < toRecompose.length; i += 1) {
            b = toRecompose[i];
            key = b.x + '|' + b.y;
            
            if (this.drew[key]) {
                block = this.drew[key];
                // draw the block on the front canvas
                x = block.x - this.x;
                w = Math.min(this.w - x, this.block_w);
                y = block.y - this.y;
                h = Math.min(this.h - y, this.block_h);
    
                leftSource = 0;
                if (x < 0) {
                    leftSource = -x;
                    w = w + x;
                    x = 0;
                }
    
                topSource = 0;
                if (y < 0) {
                    topSource = -y;
                    h = h + y;
                    y = 0;
                }
    
                if (w > 0 && h > 0) {
                    this.front.ctx.drawImage(
                        block.buffer.ctx.canvas,
                        leftSource, topSource,
                        w, h,
                        x, y,
                        w, h
                    );
                }
            }
        }
    };

    ScrollingSurface.prototype.move = function move(x, y) {

        this.x = this.x + x;
        this.y = this.y + y;

        return this;
    };

    ScrollingSurface.prototype.position = function position(x, y) {

        this.x = x;
        this.y = y;

        return this;
    };

    ScrollingSurface.prototype.update = function update() {

        this.renderBlocks();
        this.recomposeBlocks();
    };

    ScrollingSurface.prototype.remove = function remove() {

        this.Scene.dom.removeChild(this.dom);
        this.bufferCanvas = null;
        this.front = null;
    };

    global.sjs.ScrollingSurface = ScrollingSurface;
}(this));
