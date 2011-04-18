=================
sprite.js v0.9.0
=================

The sprite.js framework lets you create animations and games
using sprites in an efficient way. The goal is to have common
framework for Desktop and mobile browsers.

sprite.js has been tested on Chromium, Firefox, Android emulator, Opera and IE9.

For an example of the what the framework offers, have a look at test_sprites.html.

You can see the tests demos online here:

http://batiste.dosimple.ch/sprite.js/tests/

Example usage
=================

Example of a basic use::

    <script src="sprite.js"></script>

    <script>
    // set the viewport size (default 480x320)
    var scene = sjs.Scene({w:640, h:480});

    // load the images that gonna be used in parallel. When all the images are
    // ready, the callback function is called.
    scene.loadImages(['character.png'], function() {

        // create the Sprite object;
        var sp = scene.Sprite('character.png');

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

A list of the different methods available on the Scene object::

    scene.loadImages(Arrar(<src>), callback)       // load the array of image source. When all is loaded, the callback is called.

    scene.Layer(<name>, <options>)                 // build a Layer object, see next Layer section

    scene.Sprite(<src>, <layer>)                   // build a Sprite object, see Sprite section

    scene.Ticker(<tickDuration>, <paint function>) // build a Ticker object for this scene or reset the previous one

    scene.reset()                                  // Delete all layer present in this scene, delete ticker.

    scene.Cycle(<triplets>)                        // alias for sjs.Cycle, look at Cycle section

    scene.Input()                                  // alias for sjs.Input, look at Input section


Sprite object public methods and attributes
===========================================


To create a sprite you should use the scene.Sprite constructor::

    var sprite = scene.Sprite(<src>, <layer>)

Both parameters are optionnal. If you want to set the layer but not any image::

    var sprite = scene.Sprite(false, <layer>)

For technichal and performance reasons most Sprite's attributes needs to changed by using a setters. The following
are *READ ONLY* attributes::

    sprite.x        // position of the sprite from the left corner of the scene
    sprite.y        // position of the sprite from the top corner of the scene

    sprite.w        // controls the visible surface of the image. To have a repeating sprite background
                    // you can set the width or height value bigger than the size of the image.
    sprite.h

    sprite.xoffset  // offset in the image to start painting in the view surface
    sprite.yoffset
    sprite.xscale
    sprite.yscale
    sprite.angle    // use radians
    sprite.opacity  // use float in the range 0-1
    sprite.color    // background color of the sprite. Use the rgb/hexadecimal CSS notation.

If you want to change any of those attributes use the following setters::

    sprite.setX(10);
    sprite.setY(12);
    sprite.setW(32);
    sprite.setH(32);
    sprite.setXOffset(10); // offset in the image to start painting in the view surface
    sprite.setYOffset(5);
    sprite.setXScale(2);
    sprite.setYScale(3);
    sprite.setAngle(Math.PI / 2);
    sprite.setColor('#333');
    sprite.setOpacity(0.5);

Or one of those helper methods::

    sprite.rotate(radians)
    sprite.scale(x, y)     // if y is not defined, y take the same value as x
    sprite.move(x, y)      // move the sprite in the direction of the provided vector (x, y)
    sprite.position(x, y)  // set the position of the sprite
    sprite.offset(x, y)
    sprite.size(w, h)      // set the width and height of the visible sprite

To appy handle simple physic with the sprites you can use those helpers::

    sprite.xv                // horizontal velocity
    sprite.yv                // vertical velocity
    sprite.rv                // radial velocity
    sprite.applyVelocity()   // apply all velocities on the current Sprite
    sprite.reverseVelocity() // apply all the negative velocities on the current Sprite

    sprite.applyXVelocity()    // apply the horizontal xv velocity
    sprite.applyYVelocity()    // apply the vertical yv velocity
    sprite.reverseXVelocity()  // apply the horizontal xv velocity negatively
    sprite.reverseYVelocity()  // apply the vertical yv velocity negatively

    sprite.isPointIn(x, y) // return true if the point (x, y) is within
                           // the sprite surface (angles don't affect this function)

    sprite.collidesWith(sprite) // return true if the sprite is in
                                // collision with the other sprite (angles don't affect this function).

    sprite.collidesWithArray([sprites]) // Search in  an array of sprite for a colliding sprite.
                                        // If found, a sprite is returned.

    sprite.distance(sprite)     // return the distance between 2 sprite center
    sprite.distance(x, y)       // return the distance between the sprite center and the point (x, y)

Other important methods::

    sprite.onload(callback)     // DEPRECATED


    sprite.loadImg(src, bool resetSize)    // change the image sprite. The size of the sprite will be rested by
                                           // the new image if resetSize is true.

    sprite.remove // Remove the dom element if the HTML backend is used and facilite the garbage collection of the object.


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

A cycle object handles sprite animations. A cycle is defined by list of
tuples: (x offset, y offset, game tick duration), and the sprites the
cycle applies to. this is a cycle with 3 position, each lasting 5 game ticks::

    var cycle = scene.Cycle([[0, 2, 5],
                              [30, 2, 5],
                              [60, 2, 5]);
    var sprite = scene.Sprite("walk.png")
    cycle.addSprite(sprite);

    var sprites = [sprite1, sprite2]
    cycle.addSprites(sprites);  // add an Array of sprites to the cycle

    cycle.removeSprite(sprite); // remove the sprite from the cycle

    cycle.next()  // apply the next cycle to the sprite
    cycle.next(2) // apply the second next cycle to the sprite
    cycle.goto(1) // go to the second game tick in the triplet
    cycle.reset() // reset the cycle to the original position
    cycle.repeat = false // if set to false, the animation will stop automaticaly after one run


Input object
=============

The input object deals with user input. There are a number of flags for keys
that will be true if the key is pressed::

    var input  = scene.Input();
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

    var background = scene.Layer('background', options);

You should then pass the layer as the second argument of the contructor of your sprites::

    var sprite = scene.Sprite('bg.png', background);

The layer object can take those options::

    var options = {
        useCanvas:true,   // force the use of the canvas on this layer, that enable you to mix HTML and canvas
        autoClear:false   // disable the automatic clearing of the canvas before every paint call.
    }

