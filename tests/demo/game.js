var Game = window.Game || {};

Game = (function (SpriteJS) {

    var Scene, Map, MapSurface, Player, Input,
        mapDimensions, currentPlayerAnimation, walk, attack,
        
        gameMode = 'play',
        debug = {'output': false},
        
        MAPS_DIR = 'assets/maps/';

    function getAnimation(moveX, moveY) {

        if (Input.keyboard.enter || Input.keyboard.space) {
            if (moveX < 0) {
                currentPlayerAnimation = attack.left;
            } else {
                currentPlayerAnimation = attack.right;
            }

            if (currentPlayerAnimation.tick === 1) {
                SoundJS.play('swish');
            }
            currentPlayerAnimation.next(Scene.ticker.lastTicksElapsed);

            return currentPlayerAnimation;
        }

        if (moveY === 0 && moveX === 0) {
            currentPlayerAnimation = walk.down;
            currentPlayerAnimation.go(0);

            return;
        }

        if (moveY < 0) {
            currentPlayerAnimation = walk.up;
        } else if (moveY > 0) {
            currentPlayerAnimation = walk.down;
        } else if (moveX > 0) {
            currentPlayerAnimation = walk.right;
        } else if (moveX < 0) {
            currentPlayerAnimation = walk.left;
        }

        currentPlayerAnimation.next(Scene.ticker.lastTicksElapsed);
    } // end getAnimation()

    function startDialog(dialog, branch) {

        /*
        format in the tile editor:
        1) I am hungry : I have no food
        2) I want a drink : What do you want?
        2.1) Just water : there you go.
        2.2) Wine : there you go.
        */

        // filter the dialog branches
        var validDialogs = [], choices = [],
            prefix, after, div, button, doc, i,
            currentChoice = 0,
            updateSelected, moveUp, moveDown, selectAction, thisChoice;

        if (branch) {
            for (i in dialog) {
                if (dialog.hasOwnProperty(i)) {
                    prefix = i.split(')')[0];

                    // eg: if branch is "1.1", we want "1.1.1 and "1.1.2"
                    if (prefix.indexOf(branch) === 0 && prefix.length === (branch.length + 2)) {
                        after = i.split(')')[1];

                        validDialogs.push({
                            'question': after,
                            'answer': dialog[i],
                            'branch': prefix
                        });
                    }
                }
            }
        } else {
            for (i in dialog) {
                if (dialog.hasOwnProperty(i)) {
                    prefix = i.split(')')[0];

                    if (prefix.length === 1) {
                        after = i.split(')')[1];

                        validDialogs.push({
                            'question': after,
                            'answer': dialog[i],
                            'branch': prefix
                        });
                    }
                }
            }
        }

        validDialogs.push({
            'question': "Bye!",
            'answer': false,
            'branch': false
        });

        gameMode = 'dialog';

        doc = window.document;
        div = doc.createElement('div');
        div.id = 'dialogBox';
        div.className = 'dialog';
        div.style.top = '0';
        div.style.left = '50px';
        div.style.width = (Scene.w - 140) + 'px';
        div.style.position = 'absolute';
        div.style.zIndex = String(1000);

        if (dialog.answer) {
            div.innerHTML = '<p>' + dialog.title + ' : ' + dialog.answer + '</p>';
        } else if (dialog.start) {
            div.innerHTML = '<p>' + dialog.title + ' : ' + dialog.start + '</p>';
        }

        for (i = 0; i < validDialogs.length; i += 1) {
            button = document.createElement('button');
            button.innerHTML = validDialogs[i].question;
            button.id = 'b' + i;

            div.appendChild(button);

            choices[button.id] = {
                'dom': button,
                'branch': validDialogs[i].branch,
                'answer': validDialogs[i].answer
            };
        }

        updateSelected = function (selectedID) {
            // clear selections first
            for (i = 0; i < validDialogs.length; i += 1) {
                choices['b' + i].dom.className = '';
            }

            choices['b' + selectedID].dom.className = 'selected';
        };

        Scene.dom.appendChild(div);

        moveUp = function (evt) {
            if (evt.value) {
                currentChoice = Math.max(0, currentChoice - 1);
                SoundJS.play('click');
                updateSelected(currentChoice);
            }
        };
        Input.dom.addEventListener('sjsup', moveUp);

        moveDown = function (evt) {
            if (evt.value) {
                currentChoice = Math.min(currentChoice + 1, validDialogs.length - 1);
                SoundJS.play('click');
                updateSelected(currentChoice);
            }
        };
        Input.dom.addEventListener('sjsdown', moveDown);

        selectAction = function (evt) {
            if (!evt.value) {
                thisChoice = choices['b' + currentChoice];

                Scene.dom.removeChild(div);

                evt.stopPropagation();
                evt.preventDefault();
                Input.dom.removeEventListener('sjsup', moveUp);
                Input.dom.removeEventListener('sjsdown', moveDown);

                if (thisChoice && thisChoice.answer) {
                    dialog.answer = thisChoice.answer;

                    return startDialog(dialog, thisChoice.branch);
                }

                dialog.answer = false;
                gameMode = 'exit_dialog';

                Input.dom.removeEventListener('sjsaction', selectAction);
                Scene.ticker.resume();
            }
        };
        Input.dom.addEventListener('sjsaction', selectAction);

        updateSelected(currentChoice);
    } // end startDialog()

    function paint(ticker) {

        // so many vars here because js performance is increased slightly by not accessing
        // object chains
        var pixels,
            moveX = 0, moveY = 0,
            boundaryX, boundaryY,
            absoluteX, absoluteY,
            playerBounds, boundsCheckX, boundsCheckY,
            collideX = false, collideY = false,
            collisionObjects, activeObjects,
            objectCollides = false,
            hitObject, curObject,
            moveTrigger,
            entityX, entityY,
            i, j;

        // safe guard to avoid any excess cycles
        if (gameMode === 'dialog') {
            return;
        }
        if (gameMode === 'exit_dialog') {
            if (Input.keyReleased('action')) {
                gameMode = 'play';
            }

            return;
        }

        // speed of movement
        pixels = 4 * ticker.lastTicksElapsed;
        if (Input.keyboard.enter || Input.keyboard.space) {
            pixels = 2 * ticker.lastTicksElapsed;
        }

        if (Input.keyboard.up) {
            moveY = -pixels;
        }
        if (Input.keyboard.down) {
            moveY = pixels;
        }
        if (Input.keyboard.left) {
            moveX = -pixels;
        }
        if (Input.keyboard.right) {
            moveX = pixels;
        }

        absoluteX = MapSurface.x + Player.x;
        absoluteY = MapSurface.y + Player.y;
            
        // set up bounding box around player object to check for collision and object interaction
        // this runs clockwise from leftX, topY
        playerBounds = [
            {'x': absoluteX + moveX + 10, 'y': absoluteY + moveY + 5}, // left top
            {'x': absoluteX + moveX + (Player.w / 2), 'y': absoluteY + moveY + 5}, // mid top
            {'x': absoluteX + moveX + Player.w - 10, 'y': absoluteY + moveY + 5}, // right top
            {'x': absoluteX + moveX + Player.w - 10, 'y': absoluteY + moveY + (Player.h / 2)}, // right mid
            {'x': absoluteX + moveX + Player.w - 10, 'y': absoluteY + moveY + Player.h - 5}, // right bottom
            {'x': absoluteX + moveX + (Player.w / 2), 'y': absoluteY + moveY + Player.h - 5}, // mid bottom
            {'x': absoluteX + moveX + 10, 'y': absoluteY + moveY + Player.h - 5}, // left bottom
            {'x': absoluteX + moveX + 10, 'y': absoluteY + moveY + (Player.h / 2)}, // left mid
        ];

        if (Input.arrows()) {
            // these will be checked against when player moves to ensure map is not moved if
            // they get close to the boundary of the scene/viewport
            boundaryX = (MapSurface.w / 2) - (Player.w / 2);
            boundaryY = (MapSurface.h / 2) - (Player.h / 2);

            collisionObjects = Map.collisionObjects;

            boundsCheckX = [];
            if (moveX > 0) {
                // right
                boundsCheckX.push(playerBounds[2]); // right top
                boundsCheckX.push(playerBounds[3]); // right mid
                boundsCheckX.push(playerBounds[4]); // right bottom
            } else if (moveX < 0) {
                // left
                boundsCheckX.push(playerBounds[0]); // left top
                boundsCheckX.push(playerBounds[7]); // left mid
                boundsCheckX.push(playerBounds[6]); // left bottom
            }
            boundsCheckY = [];
            if (moveY > 0) {
                // down
                boundsCheckY.push(playerBounds[6]); // left bottom
                boundsCheckY.push(playerBounds[5]); // mid bottom
                boundsCheckY.push(playerBounds[4]); // right bottom
            } else if (moveY < 0) {
                // up
                boundsCheckY.push(playerBounds[0]); // left top
                boundsCheckY.push(playerBounds[1]); // mid top
                boundsCheckY.push(playerBounds[2]); // right top
            }

            // go through all collision surfaces and test against the set of point coordinates for the player position
            if (boundsCheckX.length > 0) {
                i = 0;
                while (!collideX && i < collisionObjects.length) {
                    collideX = SpriteJS.collision.inPolygon(boundsCheckX, collisionObjects[i], true);
    
                    i += 1;
                }
            }
            if (boundsCheckY.length > 0) {
                i = 0;
                while (!collideY && i < collisionObjects.length) {
                    collideY = SpriteJS.collision.inPolygon(boundsCheckY, collisionObjects[i], true);
                    i += 1;
                }
            }

            if (!collideX || !collideY) {
                if (!collideX) {
                    // do not allow the map to go outside bounds of viewport, also not allowing
                    // map to be moved unless player center threshold is crossed
                    if ((moveX > 0 && (MapSurface.w + MapSurface.x) < mapDimensions.w && Player.x >= boundaryX)
                            || (moveX < 0 && MapSurface.x >= Math.abs(moveX) && Player.x <= boundaryX)) {
                        MapSurface.move(moveX, 0);
                    } else {
                        Player.move(moveX, 0);

                        if (Player.x < 0) {
                            Player.setX(0);
                        }
                        if (Player.x > MapSurface.w - Player.w) {
                            Player.setX(MapSurface.w - Player.w);
                        }
                    }
                }
                if (!collideY) {
                    // do not allow the map to go outside bounds of viewport, also not allowing
                    // map to be moved unless player center threshold is crossed
                    if ((moveY > 0 && (MapSurface.h + MapSurface.y) < mapDimensions.h && Player.y >= boundaryY)
                            || (moveY < 0 && MapSurface.y >= Math.abs(moveY) && Player.y <= boundaryY)) {
                        MapSurface.move(0, moveY);
                    } else {
                        Player.move(0, moveY);

                        if (Player.y < 0) {
                            Player.setY(0);
                        }
                        if (Player.y > MapSurface.h - Player.h) {
                            Player.setY(MapSurface.h - Player.h);
                        }
                    }
                }
            } // end if collides
        } // end if Input.arrows()

        activeObjects = Map.activeObjects;

        // go through all object surfaces and test for player position (for actions such as teleport, dialog, fight etc.)
        i = 0;
        while (!objectCollides && i < activeObjects.length) {
            // don't attempt to calculate collision unless the object is a polygon that can be run into
            if (activeObjects[i].hasOwnProperty('polygon')) {
                objectCollides = SpriteJS.collision.inPolygon(playerBounds, activeObjects[i].polygon);
                if (objectCollides) {
                    hitObject = activeObjects[i];
                }
            }
            i += 1;
        }

        if (hitObject !== undefined) {
            if (hitObject.type === 'teleport_to') {
                // case when player goes in our out of the current map
                ticker.pause();
                // pass the position ID to teleport to as well as the callback when finished with setup
                Map = new TileMap(MAPS_DIR + hitObject.map, Scene, hitObject.to_id, Scene.main);

                return;
            }
            if (hitObject.type === 'dialog' && Input.keyReleased('action')) {
                // case where player interacts with an object that creates dialog
                ticker.pause();
                startDialog(hitObject.dialog);

                return;
            }
            if (hitObject.type === 'entity' && Input.keyboard.action) {
                // case where player kills a pig :P
                SoundJS.play('pig');
                // remove hit pig from available objects
                Map.removeObject(i);
            }
        }

        // player animation for movement, attack etc.
        getAnimation(moveX, moveY);
    
        // determine automatic movement for some object entities (such as pigs)
        moveTrigger = (Scene.ticker.currentTick % 300);

        // deal with active objects (dialogs, entities, etc.)
        for (i = 0; i < activeObjects.length; i += 1) {
            curObject = activeObjects[i];

            // display
            if (curObject.type === 'dialog') {
                entityX = curObject.x - MapSurface.x + (curObject.w / 2) - (curObject.sprite.w / 2);
                entityY = curObject.y - MapSurface.y - curObject.sprite.h + (5 * Math.cos(Scene.ticker.currentTick / 8.0));

                curObject.sprite.position(entityX, entityY);
                curObject.sprite.canvasUpdate(MapSurface.front);
            } else if (curObject.type === 'entity') {
                if (SpriteJS.Map.collides(curObject.x + 24, curObject.y + 24)) {
                    curObject.xv = -curObject.xv;
                    curObject.yv = -curObject.yv;
                }

                if (moveTrigger < 10) {
                    curObject.xv = 1.5 * (Math.random() - 0.5);
                    curObject.yv = 1.5 * (Math.random() - 0.5);
                } else if (moveTrigger > 200) {
                    curObject.x = curObject.x + curObject.xv;
                    curObject.y = curObject.y + curObject.yv;
                }

                // bitwise (integer) comparison
                entityX = (curObject.x - MapSurface.x) | 0;
                entityY = (curObject.y - MapSurface.y) | 0;

                curObject.sprite.position(entityX, entityY);
                curObject.sprite.canvasUpdate(MapSurface.front);
            }
        } // end for

        Player.update();
        MapSurface.update();

        if (debug.output && Scene.ticker.currentTick % 20 === 0) {
            debug.fps.innerHTML = ticker.fps;
            debug.load.innerHTML = ticker.load;
            debug.dropped.innerHTML = ticker.droppedFrames;
        }
    } // end paint()

    function main() {

        var surfaceX, surfaceY;

        if (MapSurface) {
            MapSurface.remove();
        }

        MapSurface = new sjs.ScrollingSurface(Scene, Scene.w, Scene.h, function (layer, x, y) {
            Map.paint(layer, x, y);
        });
        mapDimensions = Map.dimensions();

        // check if the map is bigger than the display viewport and adjust accordingly
        if (mapDimensions.w > MapSurface.w) {
            surfaceX = Map.playerStart.x - ((MapSurface.w - Player.w) / 2);
            if (surfaceX < 0) {
                surfaceX = 0;
            } else if (surfaceX + MapSurface.w > mapDimensions.w) {
                surfaceX = mapDimensions.w - MapSurface.w;
            }
        } else {
            surfaceX = 0;
        }
        if (mapDimensions.h > MapSurface.h) {
            surfaceY = Map.playerStart.y - ((MapSurface.h - Player.h) / 2);
            if (surfaceY < 0) {
                surfaceY = 0;
            } else if (surfaceY + MapSurface.h > mapDimensions.h) {
                surfaceY = mapDimensions.h - MapSurface.h;
            }
        } else {
            surfaceY = 0;
        }

        MapSurface.position(surfaceX, surfaceY);
        MapSurface.update();

        Player.position(Map.playerStart.x - surfaceX, Map.playerStart.y - surfaceY);
        Player.update();

        Scene.Ticker(paint, {'useAnimationRequest': true}).run();
    } // end main()

    function setupGame(callback) {

        var layer, soundList, direction, doc;

        doc = window.document;

        if (debug.output) {
            debug.fps = doc.getElementById('fps');
            debug.load = doc.getElementById('load');
            debug.dropped = doc.getElementById('dropped');
        }

        layer = Scene.Layer('front', {'useCanvas': true});
        Player = layer.Sprite('assets/images/character.png', {'w': 48, 'h': 46, 'layer': layer});

        Map = new TileMap('assets/maps/town.json', Scene);

        Input = Scene.Input();
        Input.enableCustomEvents = true;

        soundList = [
            {'name': 'swish', 'src': ['assets/sound/swish.ogg'], 'instances': 3},
            {'name': 'click', 'src': ['assets/sound/click.ogg'], 'instances': 4},
            {'name': 'pig', 'src': ['assets/sound/pig.ogg'], 'instances': 3},
            {'name': 'music', 'src': ['assets/sound/abeth.ogg'], 'instances': 1, 'volume': 0.2}
        ];
        SoundJS.addBatch(soundList);
        SoundJS.onLoadQueueComplete = function () {
            //SoundJS.play('music', null, 0.1, true);
            SoundJS.setVolume(0.2, 'pig');
        };

        walk = {
            'down': SpriteJS.Cycle([
                [0, 0, 10], [48, 0, 10], [96, 0, 10], [144, 0, 10]
            ]),
            'up': SpriteJS.Cycle([
                [0, 96, 10], [48, 96, 10], [96, 96, 10], [144, 96, 10]
            ]),
            'left': SpriteJS.Cycle([
                [0, 144, 10], [48, 144, 10], [96, 144, 10], [144, 144, 10]
            ]),
            'right': SpriteJS.Cycle([
                [0, 48, 10], [48, 48, 10], [96, 48, 10], [144, 48, 10]
            ])
        };
        attack = {
            'right': SpriteJS.Cycle([
                [0, 192, 2], [48, 192, 4], [0, 240, 3], [48, 240, 3], [0, 288, 4], [48, 288, 5]
            ]),
            'left': SpriteJS.Cycle([
                [144, 192, 2], [96, 192, 4], [144, 240, 3], [96, 240, 3], [144, 288, 4], [96, 288, 5]
            ])
        };

        for (direction in walk) {
            if (walk.hasOwnProperty(direction)) {
                walk[direction].addSprite(Player);
            }
        }
        for (direction in attack) {
            if (attack.hasOwnProperty(direction)) {
                attack[direction].addSprite(Player);
            }
        }

        currentPlayerAnimation = walk.down;

        callback();
    } // end setupGame()

    function makeScene() {

        var width, height, theScene;

        width = Math.min(window.innerWidth, 600);
        height = Math.min(window.innerHeight, 400);

        theScene = SpriteJS.Scene({
            'w': width,
            'h': height,
            'useCanvas': true,
            'autoPause': false
        });
        
        return theScene;
    }

    return {
        'make': function () {
            return makeScene();
        },
        'init': function (sceneObject) {
            debug.output = true;

            Scene = sceneObject;
            setupGame(function () {
                Scene.main = main;
            });
        }
    };
}(sjs)); // end Game{}

Game.init(Game.make());
