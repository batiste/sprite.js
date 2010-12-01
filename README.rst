===========
sprite.js
===========

This framework is there to help you creates animations and games
using sprites in an efficient way.

For an example of the what the framework offers, have a look at test_sprites.html.

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

Sprite object public methods and attributes
============================================

You can use those attributes methods to modify the sprite object::

    Sprite.y
    Sprite.x
    Sprite.w
    Sprite.h
    Sprite.xoffset
    Sprite.yoffset
    Sprite.xscale
    Sprite.yscale
    Sprite.angle

    Sprite(src)
    Sprite.rotate(radiant)
    Sprite.scale(x, y)
    Sprite.move(x, y)
    Sprite.offset(x, y)

At the end, you must call the visual update to see any real change::

    Sprite.update()

Ticker object
==============

Keeping track of time in javascript is tricky, setInterval and setTimeout are not accurate enough. Sprite.js provide
a Ticker object to deal with those issues.

A ticker object is an object that will help you keeping track of time properly to render the changes in the sprite scene.
The ticker gives accurate ticks. A game tick is the time duration between every Sprites and Physic update in your engine. To setup
a game ticker::

    var ticker = new sjs.Ticker(35); // we want a tick every 35ms

    function paint() {

        my_cycles.next(ticker.ticks_elapsed);

        // do your stuff

    }
    ticker.run(paint);


Cycle object
============

A cycle object can help you to handle an sprite animation. A cycle is defined by list of triplet (x offset, y offset, game tick duration)
and the sprites the cycle work on. Here we have a cycle with 3 position, during 5 game tick each::

    var cycle = new sjs.Cycle([[0, -2, 5],
                            [-30, -2, 5],
                            [-60, -2, 5]);
    cycle.sprites = [sjs.Sprite("walk.png")];
