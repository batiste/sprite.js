=================
sprite.js v1.1.1
=================

The sprite.js framework lets you create animations and games
using sprites in an efficient way. The goal is to have common
framework for Desktop and mobile browsers.

sprite.js has been tested on Chromium, Firefox, Android emulator, Opera and IE9.

For an example of a game made with sprite.js there is an example game named "The invasion of the evil lords":

http://batiste.dosimple.ch/games/rpg/game.html

For an example of the what the framework offers, have a look at the test files:

http://batiste.dosimple.ch/sprite.js/tests/

Example usage
=================

Example of a basic use::

    <script src="sprite.js"></script>

    <script>
    // set the Scene object
    var scene = sjs.Scene({w:640, h:480});

    // load the images in parallel. When all the images are
    // ready, the callback function is called.
    scene.loadImages(['character.png'], function() {

        // create the Sprite object;
        var sp = scene.Sprite('character.png');

        // change the visible size of the sprite
        sp.size(55, 30);

        // apply the latest visual changes to the sprite (draw if canvas, update attribute if DOM);
        sp.update();

        // change the offset of the image in the sprite (this works the opposite way of a CSS background)
        sp.offset(50, 50);

        // diverse transformations
        sp.move(100, 100);
        sp.rotate(3.14 / 4);
        sp.scale(2);
        sp.opacity = 0.8;

        sp.update();
    });
    </script>



Performance and different ways to draw
=======================================

This library provides 2 rendering backends: HTML and canvas.

By default the HTML backend is used. The HTML backend displays sprites using DOM elements when the canvas
backend draw the sprites on the canvas. Each layer of the application can have a different backend.
This enable you to mix the 2 technics if needed.

To use canvas with a layer you need to specify it in the options::

    var background = scene.Layer('background', {useCanvas:true});

The canvas will be automaticaly cleared by the game ticker. If you don't need it you can set the autoClear to false when building a layer::

    var background = scene.Layer('background', {useCanvas:true, autoClear:false});

Performances on particle test can be quite different depending on the device and browser and plateform:

+------------------------+---------------+-------------+---------------+---------------------+-------+
| Browsers               | Chrome linux  | Opera linux | Firefox linux | HTC Desire (webkit) | IE9   |
+========================+===============+=============+===============+=====================+=======+
| HTML backend           | 2000          | 60          | 500           | 120                 | 30    |
+------------------------+---------------+-------------+---------------+---------------------+-------+
| Canvas backend         | 1300          | 100         | 300           | 80                  | 600   |
+------------------------+---------------+-------------+---------------+---------------------+-------+


Scene object
==============

The scene object is where all the Sprites will be drawned. You always need to start by creating a scene::

    var scene = sjs.Scene({w:640, h:680});

Scene constructor options are:

 * parent : a dom object to attach the scene to. By default the scene is added at the end of the HTML body element.
 * w and h: width and height of the scene element
 * useCanvas : the default mode for the Layer that will be created in this Scene

The list of the different methods available on the Scene object::

    scene.loadImages(Array(image source), callback)     // load the array of image source. When all is loaded, the callback is called.

    scene.Layer(name, <options>)                    // build a Layer object, see Layer section

    scene.Sprite(<src>, <layer|options>)            // build a Sprite object, see Sprite section

    scene.Ticker(tickDuration, paint function) // build a Ticker object for this scene or reset the previous one

    scene.reset()                                  // Delete all layers present in this scene,
                                                   // delete dom from HTML Sprite in layers, pause the ticker.

    scene.Cycle(Array(triplets))                   // alias for sjs.Cycle, look at Cycle section

    scene.Input()                                  // alias for sjs.Input, look at Input section


Sprite object public methods and attributes
===========================================


To create a sprite you should use the scene.Sprite constructor::

    var sprite = scene.Sprite(<src>, <layer|options>);

Or if you have Layer object you can also create the sprite using the layer::

    var layer = scene.Layer("foreground");
    var player = layer.Sprite(<src>, <options>);

Both parameters are optionnal. If the layer is not specified, the default layer will be used. If you want to set the layer but not any image::

    var sprite = scene.Sprite(false, layer);

You can also init any Sprite properties by passing an options object instead of the Layer object, eg::

    var sprite = scene.Sprite("mysprite.png", {layer:layer, x:10, size:[20, 20], y:15});

For technichal and performance reasons Sprite's attributes needs to be changed using a setters method. The following
attributes are *READ ONLY*::

    sprite.x        // position of the sprite from the left corner of the scene
    sprite.y        // position of the sprite from the top corner of the scene

    sprite.w        // controls the visible surface of the image. To have a repeating sprite background
                    // you can set the width or height value bigger than the size of the image.
    sprite.h

    sprite.xoffset  // horizontal offset in the image from where to start painting the sprite surface.
    sprite.yoffset  // verical offset
    sprite.xscale   // vertical and horizontal scaling
    sprite.yscale
    sprite.angle    // use radians
    sprite.opacity  // use float in the range 0-1
    sprite.color    // background color of the sprite. Use the rgb/hexadecimal CSS notation.

If you want to change any of those attributes use the following setters::

    sprite.setX(10);
    sprite.setY(12);
    sprite.setW(32);
    sprite.setH(32);
    sprite.setXOffset(10);
    sprite.setYOffset(5);
    sprite.setXScale(2);
    sprite.setYScale(3);
    sprite.setAngle(Math.PI / 2);
    sprite.setColor('#333');
    sprite.setOpacity(0.5);

Or one of those helper methods::

    sprite.rotate(radians);
    sprite.scale(x, y);      // if y is not defined, y take the same value as x
    sprite.move(x, y);       // move the sprite in the direction of the provided vector (x, y)
    sprite.position(x, y);   // set the position of the sprite (left, top)
    sprite.offset(x, y);
    sprite.size(w, h);       // set the width and height of the visible sprite

Sprites comes with methods that can help you implement a basic physic engine::

    sprite.xv                  // horizontal velocity
    sprite.yv                  // vertical velocity
    sprite.rv                  // radial velocity
    sprite.applyVelocity()     // apply all velocities on the current Sprite
    sprite.reverseVelocity()   // apply all the negative velocities on the current Sprite

    sprite.applyXVelocity()    // apply the horizontal xv velocity
    sprite.applyYVelocity()    // apply the vertical yv velocity
    sprite.reverseXVelocity()  // apply the horizontal xv velocity negatively
    sprite.reverseYVelocity()  // apply the vertical yv velocity negatively

    sprite.isPointIn(x, y)      // return true if the point (x, y) is within the sprite surface

    sprite.collidesWith(sprite) // return true if the sprite is in collision with the other sprite

    sprite.collidesWithArray([sprites]) // Search in  an array of sprite for a colliding sprite.
                                        // If found, a sprite is returned.

    sprite.distance(sprite)     // return the distance between 2 sprite center
    sprite.distance(x, y)       // return the distance between the sprite center and the point (x, y)

There is also 2 methods that can help to create special effects. You can use explode2 to separate the current sprite in 2 parts::

    // return 2 new sprites that are the 2 parts of the sprite according to the given position.
    // Default value for position is half the size of the sprite.
    [sprite1, sprite2] = sprite.explode2(<position>, <bool horizontal>, <layer>)

    // Return 4 new sprites that are the split from the center (x, y).
    // Default value for the center is the center of the sprite.
    [sprite1, sprite2, sprite3, sprite4] = sprite.explode4(<x>, <y>, <layer>)

Other important methods::

    sprite.loadImg(src, <bool resetSize>)    // change the image sprite. The size of the sprite will be reseted by
                                             // the new image if resetSize is true.

    sprite.remove()              // Remove the dom element if the HTML backend is used and 
                                 // enable the garbage collection of the object.


    sprite.canvasUpdate(layer)  // draw the sprite on a given Canvas layer. This doesn't work with an HTML layer.


To update any visual changes to the view you should call the "update" method::

    Sprite.update()

With a canvas backend, the surface will be automaticaly cleared before each game tick. You will need to call update
to draw the sprite on the canvas again. If you don't want to do this you can set the layer autoClear attribute to false.

SpriteList object
==================

SpriteList is a convenience list type object that enable you to delete and add sprites without having to care
about indexes and for loop syntax::

    var sprite_list = sjs.SpriteList(<array of sprites>)

    sprite_list.add(sprite | array of sprite)  // add to the list
    sprite_list.remove(sprite)                  // delete from the list
    sprite_list.iterate()                       // iterate on the entire list then stops
    sprite_list.list.length                     // length of the list
    sprite_list.list                            // the actual list of sprite

Example of use::

    var crates = sjs.SpriteList([crate1, crate2]);

    var crate;
    while(crate = crates.iterate()) {
        crate.applyVelocity();
        if(crate.y > 200) {
            // remove it from the list
            crates.remove(crate);
            // remove it from the DOM
            crate.remove();
        }
    }


Ticker object
==============

Keeping track of time in javascript is tricky. Sprite.js provides a Ticker object to deal with
this issue.

A ticker is an object that keeps track of time properly, so it's straight
forward to render the changes in the scene. The ticker gives accurate ticks.
A game tick is the time between every Sprites/Physics update in your engine.
To setup a ticker::

    function paint() {

        myCycles.next(ticker.lastTicksElapsed);
        // do your animation and physic here

    }
    var ticker = scene.Ticker(35, paint); // we want a tick every 35ms
    ticker.run();

    ticker.pause();
    ticker.resume();

lastTicksElapsed is the number of ticks elapsed during 2 runs of the paint
function. If performances are good the value should be 1. If the number
is higher than 1, it means that there have been more game ticks than calls
to the paint function since the last time paint was called. In essence,
there were dropped frames. The game loop can use the tick count to make
sure it's physics end up in the right state, regardless of what has been
rendered.

Cycle object
============

A cycle object handles sprite animations by moving the offsets within the viewport of the sprites.
A cycle is defined by a list of tuples: (x offset, y offset, game tick duration) and a list of sprites. 
This is an example cycle with 3 different offset, each lasting 5 game ticks::

    var cycle = scene.Cycle([[0, 2, 5],
                              [30, 2, 5],
                              [60, 2, 5]);
    var sprite = scene.Sprite("walk.png");
    cycle.addSprite(sprite);

    var sprites = [sprite1, sprite2];
    cycle.addSprites(sprites);  // add an Array of sprites to the cycle

    cycle.removeSprite(sprite); // remove the sprite from the cycle

    cycle.next()         // apply the next tick to the sprites
    cycle.next(1, true)  // apply the next tick *and* call update() on the sprites
    cycle.next(2)        // apply the second game tick to the sprites (jump a frame)

The next function doesn't necessarly involve an offset sprite change. It does only when all the ticks on current
triplet have been consumed. Cycle has others useful methods and attributes::

    cycle.goto(1)        // go to the second game tick in the triplet and apply the offsets
    cycle.reset()        // reset the cycle offsets to the original position
    cycle.repeat = false // if set to false, the cycle will stop automaticaly after one run
    cycle.done           // can be used to check if the cycle has completed
                         // stays false if cycle is set to repeat = true

    cycle.update()       // calls update() on all the sprites in the cycle

Input object
=============

The input object deals with user input. There are a number of flags for keys
that will be true if the key is pressed::

    var input  = scene.Input();
    if(input.keyboard.right) {
        sprite.move(5, 0);
    }

Input.keyboard is a memory of which key is down and up. This is a list of the flags available in the keyboard object::

    keyboard.up
    keyboard.right
    keyboard.up
    keyboard.down
    keyboard.enter
    keyboard.space
    keyboard.ctrl

You also have access to those helpers on the input object::

    input.arrows() // arrows return true if any directionnal keyboard arrows are pressed
    input.keydown  // this is true if any key is down

If you need to know which key has just been pressed or released during the last game tick you can use those methods::

    input.keyPressed('up')
    input.keyReleased('up')



Layer object
=============

If you need to separate you sprites into logical layers, you can use the Layer
object::

    var background = scene.Layer('background', options);

You should then pass the layer as the second argument of the contructor of your sprites::

    var sprite = scene.Sprite('bg.png', background);

The layer object can take those options::

    var options = {
        useCanvas:true,   // force the use of the canvas on this layer, that enable you to mix HTML and canvas
        autoClear:false   // disable the automatic clearing of the canvas before every paint call.
    }


ScrollingSurface object
========================

This object provide a simple and efficent way to display a moving static background within a scene. The surface
only redraw the necessary parts instead of the whole scene at every frame.

A scrolling surface is build this way::

    var surface = sjs.SrollingSurface(scene, scene.w, scene.h, redrawCallback);

    function redrawCallback(layer, x, y) {
        // draw the necessary sprites on the layer
        sprite.canvasUpdate(layer);
    }

    surface.move(x, y);       // move the surface in direction (x, y)
    surface.position(x, y);   // set the surface position to (x, y)
    surface.update();         // update the latest changes to the surface and call the redrawCallback

The redrawCallback is called everytime a part of the surface need to be updated. The absolute position on the surface
is provided for you to determine what to draw on this layer. The layer object has a width and height (layer.w, layer.h).


Dealing with events
=====================

Sprite.js provides the Input helper object to know which keyboard key has been pressed. If you want to play with more complex
events the recommanded way to handle them is to use event delegation on the Scene object or a specific Layer object::

    var scene = sjs.Scene({w:640, h:480});
    var frontLayer = scene.Layer("front");

    frontLayer.dom.onclick = function(e) {
        var target = e.target || e.srcElement;
        target.className = 'selected';
    }

    scene.dom.onclick = function(e) {
        var target = e.target || e.srcElement;
        target.className = 'selected';
    }

If you need to use event on a Sprite level you can do it if you use the HTML backend::

    sprite.dom.addEventListener('click', function(e) {
        sprite.dom.className = 'selected';
    }, true);

Extra features
==============

Sprite.js comes packed with a few basic math functions::

    sjs.math.hypo(x, y)                     // hypotenuse
    sjs.math.mod(n, base)                   // a modulo function that return strictly positive result
    sjs.normalVector(vx, vy, <intensity>)   // return a normal vector {x, y}. If you define the intensity
                                            // the vestor will be multiplied by it

Sprite.js comes with a flexible path finding function::

    sjs.path.find(startNode, endNode, <maxVisit=1000>)

A node object should implement those 4 methods::

    Node.neighbors()        // return a list of Nodes that are the neighbor of the current one
    Node.distance(node)     // return the distance from this node to another one. It's mainly used as a hint for
                            // the algorithm to find a quicker way to the end. You can just return 0 if don't
                            // want to implement this method.
    Node.equals(node)       // return true if 2 nodes are identical, eg: return this.x == node.x && this.y == node.y;
    Node.disabled()         // return true if the current node cannot be used to find the path.

The algorithm return undefined if no path has been fund and the startNode if a path is found.
You can then follow the path using this code::

    var node = sjs.path.find(startNode, endNode);
    while(node) {
        console.log(node);
        node = node.parent;
    }

Troubleshooting
====================

When using canvas, I get an "Uncaught Error: INDEX_SIZE_ERR: DOM Exception 1" in updateCanvas
----------------------------------------------------------------------------------------------------

This error appears when canvas try to read an image out of the boundary of the image itself. Check that your cycle doesn't
go off the boundaries, and that the size and offset are correct.

