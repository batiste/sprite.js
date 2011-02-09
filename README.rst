===========
sprite.js
===========

The sprite.js framework lets you create animations and games
using sprites in an efficient way. The goal is to have common
framework for Desktop and mobile browsers.

sprite.js has been tested on Chromium, Firefox, Android emulator and Opera.

For an example of the what the framework offers, have a look at test_sprites.html.

You can see the tests demos online here:

http://batiste.dosimple.ch/sprite.js/tests/

Example usage
=================

Example of a basic use::

    <script src="sprite.js"></script>

    <script>
    // set the viewport size (default 480x320)
    sjs.w = 640;
    sjs.h = 480;

    // load the images that gonna be used in parallel. When all the images are
    // ready, the callback function is called.
    sjs.loadImages(['character.png'], function() {

        // create the Sprite object;
        var sp = new sjs.Sprite('character.png');

        // change the visible size of the sprite
        sp.h=55;
        sp.w=30;
        // apply the latest visual changes to the sprite;
        sp.update();

        // change the offset of the image in the sprite (this works the opposite way of a CSS background)
        sp.xoffset=50;
        sp.yoffset=50;

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

Switching sprites.js to use the canvas backend is done by setting the 'useCanvas' flag before
creating sprites::

    sjs.useCanvas = true;

You can also add a canvas GET parameter in the URL of any sprite.js application::

    index.html?canvas=1

Finaly, you can always overrides those defaults by using the useCanvas options when you create a layer.

    var background = Layer('background', {useCanvas:true});

Tests show that the canvas backend can be somewhat slower on Firefox, Opera and Chrome.
Especially with a high number of sprites and a large canvas. Clearing and redrawing the whole canvas can expensive if you have a lot of sprites.
Canvas seems faster when there is a lot of transformations applied to the sprite.

The canvas will be automaticaly cleared by the game ticker. If you don't need it you can set the autoClear to false when building a layer::

    var background = Layer('background', {useCanvas:true, autoClear:false});

Mobile performances can be very weak depending on the phone. Here is what we got using the particules test::

    * Android emulator: 10 sprites
    * HTC Hero: 10 sprites
    * iPhone 3G: 20-25 sprites
    * HTC Desire: 40-45 sprites


Sprite object public methods and attributes
===========================================

Sprites provide the following attributes and methods::

    Sprite.y
    Sprite.x
    Sprite.w // Controls the visible surface of the image. To have repeating sprites
             // set the width or height value bigger than the size of the image.
    Sprite.h
    Sprite.xoffset // offset in the image to start painting in the view surface
    Sprite.yoffset
    Sprite.xscale
    Sprite.yscale
    Sprite.angle   // use radians
    Sprite.opacity // use float in the range 0-1
    Sprite.color   // Background color of the sprite. Use the rgb/hexadecimal CSS notation.

    Sprite(src)
    Sprite.rotate(radians)
    Sprite.scale(x, y)   // if y is not defined, y take the same value as x
    Sprite.move(x, y)
    Sprite.offset(x, y)
    Sprite.size(w, h)    // set the width and height of the visible sprite

    Sprite.loadImg(src, bool resetSize)    // change the image sprite. The size of the sprite will be rested by
                                           // the new image if resetSize is true.

    Sprite.isPointIn(x, y) // return true if the point (x,y) is within
                           // the sprite surface (angles don't affect this function)

    Sprite.collidesWith(Sprite) // return true if the Sprite is in
                                // collision with the other Sprite (angles don't affect this function).
                                // You can also pass an array of sprites to the method.

    Sprite.onload(callback)     // call the function "callback" when the sprite's image is loaded.
                                // If the image is already loaded the function is called immediatly.


    Sprite.remove // Remove the dom element if the HTML backend is used and facilite the garbage collection of the object.


    Sprite.canvasUpdate(layer)  // draw the sprite on a given layer, even if the sprite's layer use a HTML backend


To update the view after modifying the sprite, call "update"::

    Sprite.update()

With a canvas backend, the surface will be automaticaly cleared before each game tick. You will need to call update
to draw the sprite on the canvas again. If you don't want to do this you can set the layer autoClear attribute to false.


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
        // do your stuff

    }
    var ticker = new sjs.Ticker(35, paint); // we want a tick every 35ms
    ticker.run();

lastTicksElapsed is the number of ticks elapsed during 2 runs of the paint
function. If performances are good the value should be 1. If the number
is higher than 1, it means that there have been more game ticks than calls
to the paint function since the last time paint was called. In essence,
there were dropped frames. The game loop can use the tick count to make
sure it's physics end up in the right state, regardless of what has been
rendered.

Cycle object
============

A cycle object handles sprite animations. A cycle is defined by list of
tuples: (x offset, y offset, game tick duration), and the sprites the
cycle applies to. this is a cycle with 3 position, each lasting 5 game ticks::

    var cycle = new sjs.Cycle([[0, 2, 5],
                              [30, 2, 5],
                              [60, 2, 5]);
    var sprite = sjs.Sprite("walk.png")
    cycle.sprites = [sprite];

    cycle.next() // apply the next cycle to the sprite
    cycle.next(2) // apply the second next cycle to the sprite
    cycle.reset() // reset the cycle to the original position
    cycle.repeat = false // if set to false, the animation will stop automaticaly after one run


Input object
=============

The input object deals with user input. There are a number of flags for keys
that will be true if the key is pressed::

    var input  = new sjs.Input();
    if(input.keyboard.right) {
        sprite.move(5, 0);
    }

    // arrows is true if any directionnal keyboard arrows are pressed
    if(input.arrows())
        cycle.next();
    else
        cycle.reset();

    // input.keyboard is a memory of which key is down and up. If you need to know which key
    // has just been pressed or released you can use those functions

    input.keyPressed('up')
    input.keyReleased('up')

Layer object
=============

If you need to separate you sprites into logical layers, you can use the Layer
object::

    var background = new sjs.Layer('background', options);

You should then pass the layer as the second argument of the contructor of your sprites::

    var sprite = new sjs.Sprite('bg.png', background);

The layer object can take those options::

    var options = {
        useCanvas:true,   // force the use of the canvas on this layer, that enable you to mix HTML and canvas
        autoClear:false   // disable the automatic clearing of the canvas before every paint call.
    }

