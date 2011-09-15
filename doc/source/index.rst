.. sprite.js documentation master file, created by
   sphinx-quickstart on Thu Sep 15 14:56:05 2011.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

=====================================
Welcome to sprite.js's documentation!
=====================================

The sprite.js framework lets you create animations and games
using sprites in an efficient way. The goal is to have common
framework for Desktop and mobile browsers.

sprite.js has been tested on Chromium, Firefox, Android emulator, Opera and IE9.

For an example of a game made with sprite.js there is an example game named "The invasion of the evil lords":

http://batiste.dosimple.ch/games/rpg/game.html

For an example of the what the framework offers, have a look at the test files:

http://batiste.dosimple.ch/sprite.js/tests/


Contents:

.. toctree::
   :maxdepth: 2

Indices and tables
==================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`


Example usage
=================


Example of a basic use:

.. code-block:: javascript

    // create the Scene object
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


Performance and different ways to draw
=======================================

This library provides 2 rendering engines: HTML and canvas.

By default the HTML engine is used. The HTML engine displays sprites using DOM elements when the canvas
engine draw the sprites on the canvas. Each layer of the application can have a different engine.
This enable you to mix the 2 technics if needed.

To use canvas with a layer you need to specify it in the options:

.. code-block:: javascript

    var background = scene.Layer('background', {useCanvas:true});

The canvas will be automaticaly cleared by the game ticker. If you don't need it you can set the autoClear to false when building a layer:

.. code-block:: javascript

    var background = scene.Layer('background', {useCanvas:true, autoClear:false});

Performances on particle test can be quite different depending on the device and browser and plateform:

+------------------------+---------------+-------------+---------------+---------------------+-------+
| Browsers               | Chrome linux  | Opera linux | Firefox linux | HTC Desire (webkit) | IE9   |
+========================+===============+=============+===============+=====================+=======+
| HTML engine            | 2000          | 60          | 500           | 120                 | 30    |
+------------------------+---------------+-------------+---------------+---------------------+-------+
| Canvas engine          | 1300          | 100         | 300           | 80                  | 600   |
+------------------------+---------------+-------------+---------------+---------------------+-------+


Scene object
==============

The scene object is a dom container where all the Sprites will be drawned. You always need to start by creating a Scene object.

.. js:class:: sjs.Scene(options)

    :param number w: width of the scene.
    :param number h: height of the scene.

The list of the different methods available on the Scene object:

.. js:function:: Scene.loadImages(images, callback)

    :param Array images: An array of images source.
    :param function callback: Get's called when all images are loaded.

    Load the given array of image source. When all is loaded, the callback is called.


.. js:function:: Scene.reset()

    Delete all layers present in this scene and delete the Sprites and layers, pause the ticker.


.. js:class:: Scene.Layer(name[, options])

    Create a Layer object, see the Layer section.

.. js:class:: Scene.Sprite([<src>, layer|options])

    :param string src: source of the image.
    :param Layer layer: the layer object.
    :param object options: options.

    Create a Sprite object, see the Sprite section.

.. js:class:: Scene.Ticker(tickDuration, paint)

    :param numer tickDuration: duration in milli seconds of each game tick.
    :param function paint: Get's called at every game tick.

    Create a Ticker object for this scene or reset the previous one.

.. js:class:: Scene.Cycle(triplets)

    :param Array triplets: The triplets array.

    Alias for sjs.Cycle, look at the Cycle section.

.. js:class:: Scene.Input()       

    Alias for sjs.Input, look at Input section                           


Sprite object public methods and attributes
===========================================


To create a sprite you should use the Scene.Sprite constructor:

.. js:class:: Scene.Sprite([src, options])

    :param src: source of the sprite's image.
    :param object options: possible sprite options.

    A Sprite can be instanciated from different object and with a range of options. eg:

    .. code-block:: javascript

        var foreground = scene.Layer("foreground");
        var player = scene.Sprite("player.png", foreground);

    You can also create the sprite using the Layer directly instead of the Scene:

    .. code-block:: javascript

        var foreground = scene.Layer("foreground");
        var player = layer.Sprite("player.png");

    All parameters are optionnal. If the layer is not specified, the default layer will be used. 
    If you want to set the layer but not any image you can do:

    .. code-block:: javascript

        var sprite = scene.Sprite(false, layer);

    You can also init any Sprite properties by passing an options object instead of the Layer object, eg:

    .. code-block:: javascript

        var options = {layer:layer, x:10, size:[20, 20], y:15};
        var sprite = scene.Sprite("mysprite.png", options);


Sprite attributes
-------------------

For technichal and performance reasons Sprite's attributes needs to be changed using a setters method. The following
attributes are *READ ONLY*:


.. js:attribute:: Sprite.x

    Teft position of the sprite from the top left corder of the scene.

.. js:attribute:: Sprite.y

    Top position of the sprite from top left corder of the scene.


.. js:attribute:: Sprite.w

    Controls the horizontal visible surface of the image. To have a repeating sprite background you can set the width or height value bigger than the size of the image.

.. js:attribute:: Sprite.h

    Controls the vertical visible surface of the image.

.. js:attribute:: Sprite.xoffset

    Horizontal offset in the sprite's image from where to start painting the sprite surface.

.. js:attribute:: Sprite.yoffset
    
    Verical offset.

.. js:attribute:: Sprite.xscale

    Horizontal scaling.

.. js:attribute:: Sprite.yscale

    Vertical scaling.

.. js:attribute:: Sprite.angle

    Rotation of the sprite in radians.

.. js:attribute:: Sprite.color

    Background color of the sprite. Use the rgb/hexadecimal CSS notation.


Sprite setters
-------------------

If you want to change any of those attributes use the following setters:

.. js:function:: Sprite.setX(x)
.. js:function:: Sprite.setY(y)
.. js:function:: Sprite.setW(w)
.. js:function:: Sprite.setH(h)
.. js:function:: Sprite.setXOffset(x)
.. js:function:: Sprite.setYOffset(y)
.. js:function:: Sprite.setXScale(xscale)
.. js:function:: Sprite.setYScale(yscale)
.. js:function:: Sprite.setAngle(radian)
.. js:function:: Sprite.setColor('#333')
.. js:function:: Sprite.setOpacity(0.5)

Or one of those helper methods:

.. js:function:: Sprite.rotate(radians)
.. js:function:: Sprite.scale(xscale, yscale)

    If y is not defined, y take the same value as x.

.. js:function:: Sprite.move(x, y)

    Move the sprite in the direction of the provided vector (x, y)

.. js:function:: Sprite.position(x, y)

    Set the position of the sprite (left, top)

.. js:function:: Sprite.offset(x, y)
.. js:function:: Sprite.size(w, h)

    Set the width and height of the visible sprite.

Sprites comes with methods that can help you implement a basic physic engine:

.. code-block:: javascript

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

There is also 2 methods that can help to create special effects. You can use explode2 to separate the current sprite in 2 parts:

.. code-block:: javascript

    // return 2 new sprites that are the 2 parts of the sprite according to the given position.
    // Default value for position is half the size of the sprite.
    [sprite1, sprite2] = sprite.explode2(<position>, <bool horizontal>, <layer>)

    // Return 4 new sprites that are the split from the center (x, y).
    // Default value for the center is the center of the sprite.
    [sprite1, sprite2, sprite3, sprite4] = sprite.explode4(<x>, <y>, <layer>)

Other important methods:

.. code-block:: javascript

    sprite.loadImg(src, <bool resetSize>)    // change the image sprite. The size of the sprite will be reseted by
                                             // the new image if resetSize is true.

    sprite.remove()              // Remove the dom element if the HTML engine is used and 
                                 // enable the garbage collection of the object.


    sprite.canvasUpdate(layer)  // draw the sprite on a given Canvas layer. This doesn't work with an HTML layer.


To update any visual changes to the view you should call the "update" method:

.. code-block:: javascript

    Sprite.update()

With a canvas engine, the surface will be automaticaly cleared before each game tick. You will need to call update
to draw the sprite on the canvas again. If you don't want to do this you can set the layer autoClear attribute to false.

SpriteList object
==================

SpriteList is a convenience list type object that enable you to delete and add sprites without having to care
about indexes and for loop syntax:

.. code-block:: javascript

    var sprite_list = sjs.SpriteList(<array of sprites>)

    sprite_list.add(sprite | array of sprite)  // add to the list
    sprite_list.remove(sprite)                  // delete from the list
    sprite_list.iterate()                       // iterate on the entire list then stops
    sprite_list.list.length                     // length of the list
    sprite_list.list                            // the actual list of sprite

Example of use:

.. code-block:: javascript

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
To setup a ticker:

.. code-block:: javascript

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
This is an example cycle with 3 different offset, each lasting 5 game ticks:

.. code-block:: javascript

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
triplet have been consumed. Cycle has others useful methods and attributes:

.. code-block:: javascript

    cycle.go(1)          // go to the second game tick in the triplet and apply the offsets
    cycle.reset()        // reset the cycle offsets to the original position
    cycle.repeat = false // if set to false, the cycle will stop automaticaly after one run
    cycle.done           // can be used to check if the cycle has completed
                         // stays false if cycle is set to repeat = true

    cycle.update()       // calls update() on all the sprites in the cycle

Input object
=============

The input object deals with user input. There are a number of flags for keys
that will be true if the key is pressed:

.. code-block:: javascript

    var input  = scene.Input();
    if(input.keyboard.right) {
        sprite.move(5, 0);
    }

Input.keyboard is a memory of which key is down and up. This is a list of the flags available in the keyboard object:

.. code-block:: javascript

    keyboard.up
    keyboard.right
    keyboard.up
    keyboard.down
    keyboard.enter
    keyboard.space
    keyboard.ctrl

You also have access to those helpers on the input object:

.. code-block:: javascript

    input.arrows() // arrows return true if any directionnal keyboard arrows are pressed
    input.keydown  // this is true if any key is down

If you need to know which key has just been pressed or released during the last game tick you can use those methods:

.. code-block:: javascript

    input.keyPressed('up')
    input.keyReleased('up')



Layer object
=============

If you need to separate you sprites into logical layers, you can use the Layer
object:

.. code-block:: javascript

    var background = scene.Layer('background', options);

You should then pass the layer as the second argument of the contructor of your sprites:

.. code-block:: javascript

    var sprite = scene.Sprite('bg.png', background);

The layer object can take those options:

.. code-block:: javascript

    var options = {
        useCanvas:true,   // force the use of the canvas on this layer, that enable you to mix HTML and canvas
        autoClear:false   // disable the automatic clearing of the canvas before every paint call.
    }


ScrollingSurface object
========================

This object provide a simple and efficent way to display a moving static background within a scene. The surface
only redraw the necessary parts instead of the whole scene at every frame.

A scrolling surface is build this way:

.. code-block:: javascript

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
events the recommanded way to handle them is to use event delegation on the Scene object or a specific Layer object:

.. code-block:: javascript

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

If you need to use event on a Sprite level you can do it if you use the HTML engine:

.. code-block:: javascript

    sprite.dom.addEventListener('click', function(e) {
        sprite.dom.className = 'selected';
    }, true);

Extra features
==============

Sprite.js comes packed with a few basic math functions:

.. code-block:: javascript

    sjs.math.hypo(x, y)                     // hypotenuse
    sjs.math.mod(n, base)                   // a modulo function that return strictly positive result
    sjs.normalVector(vx, vy, <intensity>)   // return a normal vector {x, y}. If you define the intensity
                                            // the vestor will be multiplied by it

Sprite.js comes with a flexible path finding function:

.. code-block:: javascript

    sjs.path.find(startNode, endNode, <maxVisit=1000>)

A node object should implement those 4 methods:

.. code-block:: javascript

    Node.neighbors()        // return a list of Nodes that are the neighbor of the current one
    Node.distance(node)     // return the distance from this node to another one. It's mainly used as a hint for
                            // the algorithm to find a quicker way to the end. You can just return 0 if don't
                            // want to implement this method.
    Node.equals(node)       // return true if 2 nodes are identical, eg: return this.x == node.x && this.y == node.y;
    Node.disabled()         // return true if the current node cannot be used to find the path.

The algorithm return undefined if no path has been fund and the startNode if a path is found.
You can then follow the path using this code:

.. code-block:: javascript

    var node = sjs.path.find(startNode, endNode);
    while(node) {
        console.log(node);
        node = node.parent;
    }

Troubleshooting
====================

* When using canvas, I get an "Uncaught Error: INDEX_SIZE_ERR: DOM Exception 1" in updateCanvas*

This error appears when canvas try to read an image out of the boundary of the image itself. Check that your cycle doesn't
go off the boundaries, and that the size and offset are correct.

