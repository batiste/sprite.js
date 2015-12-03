================================
Sprite.js API documentation
================================

This documentation does not document all of Sprite.js features, but only those that are considered stable.

Scene object
==============

The scene object is a DOM container where all the Sprites will be drawn. You always need to start by creating a Scene object.

.. code-block:: javascript

    // create a Scene object
    var scene = sjs.Scene({w:640, h:480});

.. js:class:: sjs.Scene(options)

    Create a new Scene.

Options details:

.. js:attribute:: Scene.options.parent

    DOM parent of the scene. The default is document.body.

.. js:attribute:: Scene.options.w

    Width of the scene.

.. js:attribute:: Scene.options.h

    Height of the scene.

.. js:attribute:: Scene.options.autoPause

    Pause the scene when the user quit the current window. The default is true.


This is the list of the different methods available on the Scene object:

.. js:function:: Scene.loadImages(images, callback)

    :param Array images: An array of image sources.
    :param function callback: This gets called once all images are loaded.

    Load the given array of image sources. When all images are loaded, the callback is executed.


.. js:function:: Scene.reset()

    Delete all layers present in this scene, delete the sprites and layers, and pause the ticker.


.. js:class:: Scene.Layer(name[, options])

    Create a Layer object, see :ref:`the Layer section <layer>`.

.. js:class:: Scene.Sprite([source, layer|options])

    :param string source: source of the image.
    :param Layer layer: the layer object.
    :param object options: options.

    Create a Sprite object, see :ref:`the Sprite section <sprite>`.

.. js:class:: Scene.Ticker(paint, options)

    :param function paint: Gets called on every game tick. The ticker is passed as first paramater.
    :param object options: The possible options, see :ref:`the Ticker section <ticker>`.

    Create a Ticker object for this scene or reset the previous one.

.. js:class:: Scene.Cycle(triplets)

    :param Array triplets: The triplets array.

    Alias for sjs.Cycle, see :ref:`the Cycle section <cycle>`.

.. js:class:: Scene.Input()

    Alias for sjs.Input, see :ref:`the Input section <input>`.


.. _sprite:

Sprite object
===========================================


To create a sprite you should use the Scene.Sprite constructor:

.. js:class:: Scene.Sprite([src, options])

    :param src: source of the sprite's image.
    :param object options: possible sprite options.

    A Sprite can be instantiated from different objects and with a range of options. eg:

    .. code-block:: javascript

        var foreground = scene.Layer("foreground");
        var player = scene.Sprite("player.png", foreground);

    You can create the sprite using the Layer directly instead of the Scene:

    .. code-block:: javascript

        var foreground = scene.Layer("foreground");
        var player = layer.Sprite("player.png");

    You can also initialize any Sprite properties by passing an options object instead of the Layer object, eg:

    .. code-block:: javascript

        var options = {layer:layer, x:10, size:[20, 20], y:15};
        var sprite = scene.Sprite("mysprite.png", options);

    All parameters are optional. If the layer is not specified, the default layer will be used.
    If you want to set the layer but not any image you can do so like this:

    .. code-block:: javascript

        var sprite = scene.Sprite(false, {layer:layer, color:"#f11"});

Important methods
-------------------

To update any visual changes to the view you should call the *update* method:

.. js:function:: Sprite.update()

    Apply the latest changes to the sprite's layer.

.. js:function:: Sprite.loadImg(source[, resetSize])

    :param string source: new image source.
    :param boolean resetSize: if true the size of the sprite will be reset by the new image.

    Change the image sprite.

.. js:function:: Sprite.remove()

    Remove the DOM element if the HTML engine is used and enable the garbage collection of the object.


.. js:function:: Sprite.canvasUpdate(layer)

    Draw the sprite on a given Canvas layer. This doesn't work with an HTML layer.




With a canvas engine, the surface will be automatically cleared before each game tick. You will need to call update
to draw the sprite on the canvas again. If you don't want to do this you can set the layer autoClear attribute to false.


Read only attributes
------------------------------

For technichal and performance reasons a Sprite's attributes needs to be changed using a setters method. The following
attributes are *READ ONLY*:


.. js:attribute:: Sprite.x

    The horizontal position of the sprite as measured against the top left corner of the scene.

.. js:attribute:: Sprite.y

    The vertical position of the sprite as measured top left corder of the scene.


.. js:attribute:: Sprite.w

    Controls the horizontal visible surface of the image. To have a repeating sprite background you can set the width or height value bigger than the size of the image.

.. js:attribute:: Sprite.h

    Controls the vertical visible surface of the image.

.. js:attribute:: Sprite.xoffset

    The horizontal offset within the sprite's image from where to start painting the sprite's surface.

.. js:attribute:: Sprite.yoffset

    The verical offset within the sprite's from where to start painting the sprite's surface.

.. js:attribute:: Sprite.xscale

    Horizontal scaling.

.. js:attribute:: Sprite.yscale

    Vertical scaling.

.. js:attribute:: Sprite.angle

    Rotation of the sprite in radians.

.. js:attribute:: Sprite.color

    Background color of the sprite. Use the rgb/hexadecimal CSS notation.


Setters
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
.. js:function:: Sprite.setBackgroundRepeat("repeat-y")

Or one of those helper methods:

.. js:function:: Sprite.rotate(radians)
.. js:function:: Sprite.scale(xscale[, yscale])

    If y is not defined, y will take the same value as x.

.. js:function:: Sprite.move(x, y)

    Move the sprite in the direction of the vector (x, y) argument.

.. js:function:: Sprite.position(x, y)

    Set the position of the sprite (left, top)

.. js:function:: Sprite.offset(x, y)
.. js:function:: Sprite.size(w, h)

    Set the width and height of the visible sprite.


Physics Engine
-------------------

Sprites have methods to help you implement a basic physics engine:



.. js:attribute:: Sprite.xv

    Horizontal velocity.

.. js:attribute:: Sprite.yv

    Vertical velocity.

.. js:attribute:: Sprite.rv

    Radial velocity

.. js:function:: Sprite.applyVelocity()

    Apply all velocities on the current Sprite.

.. js:function:: Sprite.reverseVelocity()

    Reverse all velocities on the current Sprite.

.. js:function:: Sprite.applyXVelocity()

    Apply the horizontal xv velocity.

.. js:function:: Sprite.applyYVelocity()

    Apply the vertical yv velocity.

.. js:function:: Sprite.reverseXVelocity()

    Apply the horizontal xv velocity negatively.

.. js:function:: Sprite.reverseYVelocity()

    Apply the vertical yv velocity negatively.

.. js:function:: Sprite.rotateVelocity(angle)

    Rotate the velocity vector according to the provided angle.

.. js:function:: Sprite.orientVelocity(x, y)

    Point the velocity vector in the direction of the point (x, y). The velocity intensity remains unchanged.

.. js:function:: Sprite.distance(sprite)

    Returns the distance between the calling sprite's center and it's argument sprites center.

.. js:function:: Sprite.distance(x, y)

    Return the distance between the sprite's center and the point (x, y)




Collision Detection
-------------------------

These methods are not included in the sprite.js core and needs to be loaded indenpendantly::

    <script src="lib/collision.js"></script>


.. js:function:: Sprite.isPointIn(x, y)

    Returns true if the point (x, y) is within the sprite's surface.

.. js:function:: Sprite.collidesWith(sprite)

    Returns true if the sprite is in collision with the passed sprite

.. js:function:: Sprite.collidesWithArray(sprites)

    :param Array sprites: An array of Sprite objects.

    Searches the passed array of sprites for a colliding sprite. If found, that sprite is returned.




Special Effects
-------------------

There are two methods useful for creating special effects. You can use explode2 to separate the current sprite in two parts:

.. js:function:: Sprite.explode2([position, horizontal=true, layer])

    :param number position: The cut offset / position.
    :param boolean horizontal: Cut horizontaly if true, verticaly if false.

    Returns an array of two new sprites that are the two parts of the sprite according to the given position.
    The default value for position is half the size of the sprite.

.. js:function:: Sprite.explode4([x, y, layer])

    :param number x: The x position where to cute.
    :param number y: The y position where to cute.
    :param Layer layer: the Layer where to create the new Sprites, default being the current sprite's Layer.

    Return an array of four new sprites that are the split from the center (x, y).
    The default value for (x, y) is the center of the sprite.



List Object
==================

A List is an iterable object that simplifies the management of an sprite (or any other object) array:

.. js:class:: sjs.List([objects])

    :param Array objects: An array of objects.

    Create the object list.

.. js:function:: List.add(object | objects)

    Add an object or an array of objects to the list.

.. js:function:: List.remove(object)

    Remove the first matching object from the list.

.. js:function:: List.iterate()

    Returns an object and increment the pointer. Returns false at the end of the list.

.. js:attribute:: List.list.length

    The length of the list.

.. js:attribute:: List.list

    Returns the underlying array that the List is managing.

Example of use:

.. code-block:: javascript

    var crates = sjs.List([crate1, crate2]);

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


.. _ticker:

Ticker Object
==============

Keeping track of time in javascript can be difficult. Sprite.js provides a Ticker object to deal with
this issue.

A Ticker is an object that keeps track of time properly, so it's straight
forward to render the changes in the scene. The Ticker gives accurate ticks.
A game tick is the time between every Sprites/Physics update in your engine.
To setup a ticker:

.. code-block:: javascript

    function paint(ticker) {

        myCycles.next(ticker.lastTicksElapsed);
        // do your animation and physics here

    }
    var ticker = scene.Ticker(paint);


.. js:class:: Scene.Ticker(callback, options)

    :param function paint: Gets called at every game tick.
    :param object options: The possible options:

        .. js:attribute:: options.tickDuration

            Duration in milliseconds of each game tick.

        .. js:attribute:: options.useAnimationFrame

            If true the ticker will use a `requestAnimationFrame <https://developer.mozilla.org/en/DOM/window.mozRequestAnimationFrame>`_ callback instead of a standard setTimeout.


.. js:function:: Ticker.run()

    Start the ticker.

.. js:function:: Ticker.pause()

    Pause the ticker.

.. js:function:: Ticker.resume()

    Resume after a pause.

.. js:attribute:: Ticker.lastTicksElapsed

    lastTicksElapsed is the number of ticks elapsed during two runs of the paint
    function. If performances are good the value should be 1. If the number
    is higher than 1, it means that there have been more game ticks than calls
    to the paint function since the last time paint was called. In essence,
    there were dropped frames. The game loop can use the tick count to make
    sure that it's physics end up in the right state, regardless of what has been
    rendered.

.. js:attribute:: Ticker.currentTick

    The number of elapsed ticks that have been occurred since the creation the the ticker.

.. _cycle:

Cycle Object
============


A Cycle object manages sprite animations by moving the offsets within the viewport of the sprites.

This is an example cycle with 3 different offset, each lasting 5 game ticks:

.. code-block:: javascript

    var cycle = scene.Cycle([[0, 2, 5],
                             [30, 2, 5],
                             [60, 2, 5]);
    var sprite = scene.Sprite("walk.png");
    cycle.addSprite(sprite);
    cycle.update();

    cycle.next(5).update();


Cycle complete reference:


.. js:class:: sjs.Cycle(triplets)

    :param Array triplets: An array of triplets (xoffset, yoffset, ticks duration).

.. js:function:: Cycle.addSprite(sprite)

    :param Sprite sprite: Add a sprite to the cycle.

.. js:function:: Cycle.addSprites(sprites)

    :param Array sprites: Add an array of sprites to the cycle.

.. js:function:: Cycle.removeSprite(sprite)

    :param Sprite sprite: Remove a sprite from the cycle.

.. js:function:: Cycle.next([ticks, update])

    :param number ticks: The number of ticks you want to go forward. The default value is 1.
    :param boolean update: If true, the sprite's offsets will be automaticaly updated.

    Calling the next method doesn't necessarily involve an offset change. It does only when all the ticks on current
    triplet have been consumed.

.. js:function:: Cycle.go(tick)

    :param number tick: Go to the passed tick in the triplets and apply the offsets.

.. js:function:: Cycle.reset(update)

    :param boolean update: If true, the sprite's offsets will be automaticaly updated.

    Resets the cycle offsets to the original position.

.. js:function:: Cycle.update()

    Calls the update method on all the sprites.

.. js:attribute:: Cycle.done

    This attribute can be checked to determine if the cycle has completed. The value stays false if cycle is repeating.

.. js:attribute:: Cycle.repeat

    If set to false, the cycle will stop automaticaly after one run. The default value is true.

.. _input:

Input Object
=============

The input object remembers user inputs within each game tick:

.. code-block:: javascript

    var input  = scene.Input();
    if(input.keyboard.right) {
        sprite.move(5, 0);
    }
    if(input.keyboard.z)
        console.log("Key z is down")

.. js:class:: scene.Input()

    Creates an Input object for the scene.


.. js:attribute:: Input.keyboard

    Input.keyboard is a record of which key has been pressed or released.
    In addition to the normal keyboard keys, the keyboard object also keep track of these special keyboard states:

    .. code-block:: javascript

        keyboard.up
        keyboard.right
        keyboard.up
        keyboard.down
        keyboard.enter
        keyboard.space
        keyboard.ctrl
        keyboard.esc

.. js:attribute:: Input.keydown

    True if any key is down.

.. js:attribute:: Input.mousedown

    True if any mouse button is down.

If you need to know which key has been pressed or released during the last game tick, use these methods:

.. js:function:: Input.keyPressed(code)

    :param string code: The type of key you want to test. eg: "up", "left"

.. js:function:: Input.keyReleased(code)

    :param string code: The type of key you want to test. eg: "up", "left"

.. js:attribute:: Input.mouse

    The mouse object contains the position of the mouse and if the mouse is clicked.

    .. code-block:: javascript

        if(mouse.position.x < scene.w / 2)
            player.move(-2, 0);

        if(mouse.click)
            console.log(mouse.click.x, mouse.click.y);

Touch Events
----------------------------

A small swipe updates the keyboard in the wanted direction and a tap will
act as the spacebar being pressed. The mouse position and clicks are also updated by the touch events.

.. _layer:

Layer object
=============

If you need to separate your sprites into logical layers, you can crate a Layer:

.. code-block:: javascript

    var background = scene.Layer('background', {
        useCanvas:true,
        autoClear:false
    });
    var sprite = background.Sprite('background.png');

.. js:class:: Scene.Layer(name[, options])

    :param string name: The name of the layer
    :param object options: an option object

    Create the Layer object.

.. js:attribute:: Layer.options.useCanvas

    If true this layer will use the canvas element to draw the sprites. This enables you to mix HTML and canvas.

.. js:attribute:: Layer.options.autoClear

    If false this disables the automatic clearing of the canvas before every paint call.

.. js:attribute:: Layer.options.parent

    Sets a different DOM parent instead of the scene.



Dealing With Events
=====================

Sprite.js provides the Input helper object for managing keyboard input. If you need more complex
events handling the recommanded way is to use event delegation on the Scene object or a specific Layer object:

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

If you need to use events on a Sprite level you can do it if you use the HTML engine:

.. code-block:: javascript

    sprite.dom.addEventListener('click', function(e) {
        sprite.dom.className = 'selected';
    }, true);

Extra Features
==============

To use some of these feature, you must include an extra javascript files in your web page.

ScrollingSurface object
-------------------------
Scro
This object is not included in sprite.js core and needs to be loaded independantly::

    <script src="lib/scrolling.js"></script>

This object provide a simple and efficent way to display a moving background within a scene. The object buffers parts that have
already been drawn and only redraw the necessary parts instead of the whole scene at every frame.


.. code-block:: javascript

    var surface = sjs.ScrollingSurface(scene, w, h, redrawCallback);

    function redrawCallback(layer, x, y) {
        // draw the necessary sprites on the layer
        sprite.canvasUpdate(layer);
    }

    surface.move(5, 0);
    surface.update();

The redrawCallback is called whenever a part of the surface needs to be updated. The absolute position on the surface
is provided for you as an argument to redrawCallback so you may determine what to draw on this layer. The layer object has a width and height (layer.w, layer.h).

.. js:class:: sjs.ScrollingSurface(scene, w, h, redrawCallback)

    :param Scene scene: The scene that will hold the surface.
    :param number w: The width of the surface.
    :param number h: The height of the surface.
    :param function redrawCallback: A function the surface will call when a piece of surface needs to be painted.

.. js:function:: redrawCallback(layer, x, y)

    :param Layer layer: A layer where you need to draw your sprites. The layer object has a width and height (layer.w, layer.h) that is smaller than the surface size.
    :param number x: The x position of the layer within the scrolling surface.
    :param number y: The y position of the layer within the scrolling surface.

.. js:function:: ScrollingSurface.move(x, y)

    Moves the surface offset in direction (x, y).

.. js:function:: ScrollingSurface.position(x, y)

    Sets the surface offset position to (x, y)

.. js:function:: ScrollingSurface.update()

    Updates the latest changes to the surface and call the redrawCallback if necessary.


Math
-------------------------


Sprite.js comes packaged with a few basic math functions:


.. js:function:: sjs.math.hypo(x, y)

    Hypotenuse

.. js:function:: sjs.math.mod(n, base)

    A modulo function that return strictly positive result.

.. js:function:: sjs.normalVector(vx, vy[, intensity])

    Return a normal vector {x, y}. If you define the intensity, the vector will be multiplied by it.

Path Finding
-------------------------

This object is not included in sprite.js core and needs to be loaded independently::

    <script src="lib/path.js"></script>

Sprite.js has a flexible path finding function:

.. js:function:: sjs.path.find(startNode, endNode[, maxVisit=1000])

    The algorithm return undefined if no path has been found and the startNode if a path is found.
    You can then follow the path using this code:

    .. code-block:: javascript

        var node = sjs.path.find(startNode, endNode);
        while(node) {
            console.log(node);
            node = node.parent;
        }

A node object should implement those 4 methods:

.. js:class:: Node(...)

    Define your own Node object.

.. js:function:: Node.neighbors()

    Must return a list of Nodes that are the neighbors of the current one.


.. js:function:: Node.distance(node)

    Returns the distance from this node to another one. It's mainly used as
    a hint for the algorithm to find a quicker way to the end. You may return 0 if you don't
    want to implement this method.


.. js:function:: Node.equals(node)

    Returns true if two nodes are identical, eg:

    .. code-block:: javascript

        return this.x == node.x && this.y == node.y;

.. js:function:: Node.disabled()

    Returns true if the current node cannot be used to find the path.


The Entity/Component Model
------------------------------------------

If you wish to use a entity component model with Sprite.js I would recommend the use of this external library https://github.com/batiste/component-entity
