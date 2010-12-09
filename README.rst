===========
sprite.js
===========

This framework is there to help you creates animations and games
using sprites in an efficient way. The goal is to have common
framework for Desktop and mobile browsers.

sprite.js is has been tested on Chromium, Firefox, Android emulator and Opera.

For an example of the what the framework offers, have a look at test_sprites.html.

You can see some demos online here:

http://batiste.dosimple.ch/sprite.js/test_sprites.html

http://batiste.dosimple.ch/sprite.js/test_input.html

Example usage
=================

Example of a basic use::

    <script src="sprite.js"></script>

    <script>
    // create the Sprite object;
    var sp = new sjs.Sprite('character.png');

    // change the visible size of the sprite
    sp.h=55;
    sp.w=30;
    // apply the latest visual changes to the sprite;
    sp.update();

    // change the offset of the image in the sprite
    sp.xoffset=-50;
    sp.yoffset=-50;

    // diverse transformations
    sp.move(100, 100);
    sp.rotate(3.14 / 4);
    sp.scale(2);

    sp.update();
    </script>

Performance
====================

The HTML backend has received a particular attention to be as efficient as possible.

Activate canvas backend
========================

Sprite.js provides 2 rendering backend: HTML, canvas. By default HTML rendering is used. You can switch
to cavnas by setting the use_canvas settings before creating your sprites::

    sjs.use_canvas = true;

Tests show that *canvas backend is slower* on Firefox, Opera and Chrome. Especially with high number of sprites
and large canvas (clearing and redrawing the whole canvas is expensive).

Sprite object public methods and attributes
============================================

You can use those attributes methods to modify the sprite object::

    Sprite.y
    Sprite.x
    Sprite.w // this is a way to control the view surface of the image. To have repeating sprites
             // set the width or height value bigger than the natural size of the image.
    Sprite.h
    Sprite.xoffset // offset in the image where you want to start painting in the view surface
    Sprite.yoffset
    Sprite.xscale
    Sprite.yscale
    Sprite.angle // use radiant
    Sprite.opacity

    Sprite(src)
    Sprite.rotate(radiant)
    Sprite.scale(x, y)   // if y is not defined, y take the same value as x
    Sprite.move(x, y)
    Sprite.offset(x, y)
    Sprite.size(w, h)    // set the width and height of the visible sprite

    Sprite.isPointIn(x, y) // return true if the point (x,y) is within
                           // the sprite surface (angles don't affect this function)

    Sprite.hasCollision(Sprite) // return true if the Sprite is in
                                // collision with the other Sprite (angles don't affect this function)

At the end, you must call the visual update to see any real change::

    Sprite.update()

Ticker object
==============

Keeping track of time in javascript is tricky, setInterval and setTimeout are not accurate enough. Sprite.js provide
a Ticker object to deal with those issues.

A ticker object is an object that will help you keeping track of time properly to render the changes in the sprite scene.
The ticker gives accurate ticks. A game tick is the time duration between every Sprites and Physic update in your engine. To setup
a game ticker::

    function paint() {

        my_cycles.next(ticker.ticks_elapsed); // tick elapsed is the number of ticks elapsed during 2 runs of the paint function.
                                              // If performances are good the value should be 1. If it's more than 1 it mean that
                                              // some frames were dropped and we need to drop a certain amount of cycle as well.

        // do your stuff

    }
    var ticker = new sjs.Ticker(35, paint); // we want a tick every 35ms
    ticker.run();


Cycle object
============

A cycle object can help you to handle an sprite animation. A cycle is defined by list of triplet (x offset, y offset, game tick duration)
and the sprites the cycle work on. Here we have a cycle with 3 position, during 5 game tick each::

    var cycle = new sjs.Cycle([[0, 2, 5],
                            [30, 2, 5],
                            [60, 2, 5]);
    var sprite = sjs.Sprite("walk.png")
    cycle.sprites = [sprite];

    cycle.next() // apply the next cycle to the sprite
    cycle.next(2) // apply the second next cycle to the sprite
    cycle.reset() // reset the cycle to the original position

Input object
==============

The input object help you with the annoyance of dealing with user input::

    var input  = new sjs.Input();
    if(input.keyboard.right) {
        sprite.move(5, 0);
    }
    // arrows is true if any directionnal keyboard arrows are pressed
    if(input.arrows())
        cycle.next();
    else
        cycle.reset();


Layer object
=============

If you need to separate you sprites into logical layer, you should user the Layer object::

    var background = new sjs.Layer('background')
    var sprite = new sjs.Sprite('bg.png', background);

You should then pass the layer as the second argument of the contructor of your sprite.


