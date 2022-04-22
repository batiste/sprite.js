
How to use sprite.js?
=======================


Example of basic sprite transformations:

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

        // apply the latest visual changes to the sprite
        // (draw if canvas, update attribute if DOM);
        sp.update();

        // change the offset of the image in the sprite
        // (this works the opposite way of a CSS background)
        sp.offset(50, 50);

        // various transformations
        sp.move(100, 100);
        sp.rotate(3.14 / 4);
        sp.scale(2);
        sp.setOpacity(0.8);

        sp.update();
    });

If you want a more interactive demonstration of basic sprite manipulation, there is a good example in the tests: http://batiste.github.io/sprite.js/tests/visual_guide.html


Performance and different ways to draw
=======================================

This library provides three rendering engines: HTML and canvas and WebGl. Please note that WebGl is still in an experimental state.

By default the HTML engine is used. The HTML engine displays sprites using DOM elements, while the canvas
engine draw the sprites on the canvas. Each layer of the application can have a different engine.
This enable you to mix the two techniques if needed.

To make use of canvas with a layer you need to specify it in the options:

.. code-block:: javascript

    var background = scene.Layer('background', {useCanvas:true});

The canvas will be automaticaly cleared by the game ticker. If you don't need it you can set the autoClear to false when building a layer:

.. code-block:: javascript

    var background = scene.Layer('background', {useCanvas:true, autoClear:false});

Performances with the particle test vary widely depending on the device, browser and platform:

+------------------------+---------------+-------------+---------------+---------------------+-------+
| Browsers               | Chrome linux  | Opera linux | Firefox linux | HTC Desire (webkit) | IE9   |
+========================+===============+=============+===============+=====================+=======+
| HTML engine            | 2000          | 60          | 500           | 120                 | 30    |
+------------------------+---------------+-------------+---------------+---------------------+-------+
| Canvas engine          | 1300          | 100         | 300           | 80                  | 600   |
+------------------------+---------------+-------------+---------------+---------------------+-------+


Troubleshooting
====================

* When using canvas, I get an "Uncaught Error: INDEX_SIZE_ERR: DOM Exception 1" in updateCanvas*

This error appears when canvas try to read an image out of the boundary of the image itself. Check that your cycle doesn't
go off the boundaries, and that the size and offset are correct.

For any other undocumented issue, please fill a bug on this page: https://github.com/batiste/sprite.js/issues
