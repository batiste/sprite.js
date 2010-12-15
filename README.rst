===========
sprite.js
===========

The sprite.js framework lets you create animations and games
using sprites in an efficient way. The goal is to have common
framework for Desktop and mobile browsers.

sprite.js has been tested on Chromium, Firefox, Android emulator and Opera.

For an example of the what the framework offers, have a look at test_sprites.html.

You can see some demos online here:

http://batiste.dosimple.ch/sprite.js/test_particules.html

http://batiste.dosimple.ch/sprite.js/test_game.html

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

    // change the offset of the image in the sprite (this works the opposite way of a CSS background)
    sp.xoffset=50;
    sp.yoffset=50;

    // diverse transformations
    sp.move(100, 100);
    sp.rotate(3.14 / 4);
    sp.scale(2);
    sp.opacity = 0.8;

    sp.update();
    </script>



Performance and backends
========================

The library provides 2 rendering backends: HTML and canvas. By default the HTML
backend is used. The HTML backend displays sprites using DOM elements.

Switching to the canvas backend is done by setting the 'use_canvas' flag before
creating sprites::

    sjs.use_canvas = true;

Tests show that *the canvas backend is slower* on Firefox, Opera and Chrome.
Especially with a high number of sprites and a large canvas. Clearing and
redrawing the whole canvas is expensive.

Canvas seems faster when there is a lot of transformations applied to the sprite.

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
    Sprite.angle // use radians
    Sprite.opacity // use float in the range 0-1

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

To update the view after modifying the sprite, call "update"::

    Sprite.update()

Ticker object
==============

Keeping track of time in javascript is tricky. Sprite.js provides a Ticker object to deal with
this issue.

A ticker is an object that keeps track of time properly, so it's straight
forward to render the changes in the scene. The ticker gives accurate ticks.
A game tick is the time between every Sprites/Physics update in your engine.
To setup a ticker::

    function paint() {

        my_cycles.next(ticker.lastTicksElapsed);
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


Layer object
=============

If you need to separate you sprites into logical layers, you can use the Layer
object::

    var background = new sjs.Layer('background')
    var sprite = new sjs.Sprite('bg.png', background);

You should then pass the layer as the second argument of the contructor of your sprite.
