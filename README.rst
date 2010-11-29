===========
sprite.js
===========

This framework is there to help you creates animations and games
using sprites in an efficient way.

For an example of the what the framework offers, have a look at test_sprites.html.

Example usage
=================

    <style>
    .sprite {overflow:hidden;position:absolute;}
    .sprite img{position:relative;}
    </style>

    <script src="sprite.js"></script>
    <script>
    // create the Sprite object;
    var sp = new sjs.Sprite();
    // Bind the object with a DOM element in the page
    sp.init();
    // load the sprite image
    sp.loadImg('character.png');
    // change the visible size of the sprite
    sp.h=55;
    sp.w=30;
    // apply the latest visual changes to the sprite;
    sp.update();

    // change the offset of the image in the sprite
    sp.xoffset=-50;
    sp.yoffset=-50;

    // diverse transformation
    sp.move(100, 100);
    sp.rotate(3.14 / 4);
    sp.scale(2);

    sp.update();
    </script>