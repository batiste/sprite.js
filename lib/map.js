(function (global) {

    var TileMap,
        MAPS_DIR = 'assets/maps/';

    TileMap = function (file, Scene, startPositionID, callback) {

        var that = this,
            MapObj, Node,
            tileLayers = [],
            tileProperties = [];

        this.file = file;
        this.Scene = Scene;
        this.startPositionID = startPositionID;
        this.callback = callback;

        this.playerStart = {};
        this.activeObjects = [];
        this.collisionObjects = [];
    
        function _getGid(x, y) {
    
            var index;
    
            if (x < 0 || y < 0 || x >= MapObj.width || y >= MapObj.height) {
                return;
            }
    
            index = x + y * this.width;
    
            return this.data[index];
        }
    
        function findTileset(gid) {
    
            var tileSet = null,
                i;
    
            for (i = 0; i < MapObj.tilesets.length; i += 1) {
                tileSet = MapObj.tilesets[i];
    
                if (gid < tileSet.firstgid) {
                    tileSet = MapObj.tilesets[i - 1];
                    break;
                }
            }
    
            return tileSet;
        }
    
        function getSprite(gid) {
    
            var tileset, localGid, nbX, nbY, x, y, sprite;
    
            tileset = findTileset(gid);
            localGid = gid - (tileset.firstgid);

            nbX = (tileset.imagewidth / tileset.tilewidth) | 0;
            nbY = (tileset.imageheight / tileset.tileheight) | 0;
    
            x = localGid % nbX;
            y = (localGid / nbX) | 0;
    
            sprite = that.Scene.Sprite(MAPS_DIR + tileset.image, {
                'w': tileset.tilewidth,
                'h': tileset.tileheight,
                'xoffset': (x * tileset.tilewidth),
                'yoffset': (y * tileset.tileheight),
                'layer': null
            });

            return sprite;
        }
    
        // map editor [Tiled] will output polygon coordinates in relative space to a fixed x,y
        function makePolygon(object) {
    
            var points = [],
                i;

            if (object.polygon || object.polyline) {
                if (object.polygon) {
                    points = object.polygon;
                } else {
                    points = object.polyline;
                }

                // iterate through each x,y coordinate pair and convert from relative to absolute
                for (i = 0; i < points.length; i += 1) {
                    points[i].x = object.x + points[i].x;
                    points[i].y = object.y + points[i].y;
                }
            } else {
                // object is a rectangle but only top left is defined; build it from width and height
                points = [
                    {'x': object.x, 'y': object.y},
                    {'x': object.x + object.width, 'y': object.y},
                    {'x': object.x + object.width, 'y': object.y + object.height},
                    {'x': object.x, 'y': object.y + object.height}
                ];
            }
    
            return points;
        }
    
        // converts the map layer objects into Sprite.js shapes
        function buildMapObjects(layer) {

            var object, shape,
                teleportIDs = [],
                i;

            for (i = 0; i < layer.objects.length; i += 1) {
                object = layer.objects[i];

                if (layer.hasOwnProperty('properties') && layer.properties.type === 'collision') {
                    shape = makePolygon(object);
                    that.collisionObjects.push(shape);
                } else {
                    switch (object.type) {
                    case 'player_start':
                        that.playerStart.x = object.x;
                        that.playerStart.y = object.y;
                        break;
                    case 'teleport_to':
                        shape = {
                            'type': 'teleport_to',
                            'map': object.properties.map,
                            'to_id': object.properties.id,
                            'polygon': makePolygon(object)
                        };
                        that.activeObjects.push(shape);
                        break;
                    case 'teleport_from':
                        teleportIDs[object.properties.id] = {
                            'x': object.x,
                            'y': object.y
                        };
                        break;
                    case 'dialog':
                        shape = {
                            'type': 'dialog',
                            'dialog': object.properties,
                            'polygon': makePolygon(object)
                        };
                        shape.sprite = that.Scene.Sprite('assets/images/arrow.png', {
                            'w': 24,
                            'h': 28,
                            'x': object.x,
                            'y': (object.y - 28)
                        });
                        that.activeObjects.push(shape);
                        break;
                    case 'entity':
                        // right now this is just a pig but needs to be converted to anything
                        shape = {
                            'type': 'entity',
                            'gid': object.gid,
                            'properties': object.properties,
                            'polygon': makePolygon(object),
                            'sprite': getSprite(object.gid)
                        };
                        that.activeObjects.push(shape);
                        break;
                    } // end switch
                } // end if/else
            } // end for

            // when a start position is passed in, use it instead of built-in player start
            // this is typically if not always from a teleport scenario
            if (that.startPositionID !== undefined && teleportIDs[that.startPositionID] !== undefined) {
                that.playerStart = teleportIDs[that.startPositionID];
            }
            if (that.playerStart.length === 0) {
                that.playerStart = {
                    'x': 0,
                    'y': 0
                };
            }
        } // end buildObjectMap()
    
        // merge all the tile properties into a big object
        function buildTileProperties() {
    
            var i,
                prop, tileset;
    
            for (i = 0; i < MapObj.tilesets.length; i += 1) {
                tileset = MapObj.tilesets[i];
    
                for (prop in tileset.tileproperties) {
                    if (tileset.tileproperties.hasOwnProperty(prop)) {
                        // parseInt takes a radix (here and typically it will be base10)
                        tileProperties[parseInt(prop, 10) + tileset.firstgid] = tileset.tileproperties[prop];
                    }
                }
            }
        }
    
        // iterate over the layers/objects provided in the JSON map file
        function buildMap(parsedMap) {

            var layer,
                images = [],
                i;

            MapObj = parsedMap;

            for (i = 0; i < MapObj.layers.length; i += 1) {
                layer = MapObj.layers[i];

                // tilelayer and objectgroup etc. are defined internally by Tiled [map editor]
                if (layer.type === 'tilelayer') {
                    // assign private method to each layer
                    layer.getGid = _getGid;
                    tileLayers.push(layer);
                } else if (layer.type === 'objectgroup') {
                    buildMapObjects(layer);
                }
            }

            buildTileProperties();
    
            for (i = 0; i < MapObj.tilesets.length; i += 1) {
                images.push(MAPS_DIR + MapObj.tilesets[i].image);
            }

            // preload images (sprite.js method)
            that.Scene.loadImages(images, that.callback);
        }
    
        function loadMap(callback) {
    
            var xObject = new XMLHttpRequest(),
                file;

            xObject.onreadystatechange = function () {
                if (xObject.readyState === 4) {
                    callback(xObject.responseText);
                }
            };

            file = that.file + '?t=' + (new Date()).getTime();
            xObject.open('GET', file, true);
            xObject.send(null);
        }

        Node = function (x, y, parent) {
    
            this.parent = parent;
            this.x = x;
            this.y = y;
        };
    
        Node.prototype.neighbors = function () {
    
            return [
                new Node(this.x - MapObj.tilewidth, this.y, this),
                new Node(this.x + MapObj.tilewidth, this.y, this),
                new Node(this.x, this.y + MapObj.tileheight, this),
                new Node(this.x, this.y - MapObj.tileheight, this)
            ];
        };
    
        Node.prototype.distance = function (node) {
    
            return SpriteJS.math.hypo(this.x - node.x, this.y - node.y);
        };
    
        Node.prototype.equals = function (node) {
    
            return this.x === node.x && this.y === node.y;
        };
    
        this.dimensions = function () {
    
            var mapDimensions = {};
    
            mapDimensions.w = MapObj.tilewidth * MapObj.width;
            mapDimensions.h = MapObj.tileheight * MapObj.height;
    
            return mapDimensions;
        };

        this.getTileProperties = function (gid) {
    
            if (tileProperties[gid]) {
                return tileProperties[gid];
            }
    
            return {};
        };

        this.removeObject = function (index) {
    
            return that.activeObjects.splice(index, 1);
        };
    
        this.findPath = function (x1, y1, x2, y2) {
    
            var start, end;
    
            x1 = ((x1 / MapObj.tilewidth) | 0) * MapObj.tilewidth;
            y1 = ((y1 / MapObj.tileheight) | 0) * MapObj.tileheight;
            x2 = ((x2 / MapObj.tilewidth) | 0) * MapObj.tilewidth;
            y2 = ((y2 / MapObj.tileheight) | 0) * MapObj.tileheight;
    
            start = new Node(x1 + (MapObj.tilewidth / 2), y1 + (MapObj.tileheight / 2));
            end = new Node(x2 + (MapObj.tilewidth / 2), y2 + (MapObj.tileheight / 2));
    
            return SpriteJS.path.find(start, end);
        };
    
        // return the cell coordinates according to relative coordinates
        this.align = function (x, y) {
    
            x = (x / MapObj.tilewidth) | 0;
            y = (y / MapObj.tileheight) | 0;
    
            return {
                'x': x,
                'y': y
            };
        };
    
        this.paint = function (layer, x, y) {
    
            var xOffset, yOffset,
                tilelayer, tile, gid,
                i, n, p;
    
            xOffset = (x % MapObj.tilewidth);
            yOffset = (y % MapObj.tileheight);
    
            x = (x / MapObj.tilewidth) | 0;
            y = (y / MapObj.tileheight) | 0;

            for (i = 0; i < (1 + layer.w / MapObj.tilewidth); i += 1) {
                for (n = 0; n < (1 + layer.h / MapObj.tileheight); n += 1) {
                    for (p = 0; p < tileLayers.length; p += 1) {
                        tilelayer = tileLayers[p];
                        gid = tilelayer.getGid(x + i, y + n);
    
                        if (gid) {
                            tile = getSprite(gid);
                            // we need to update the position as the sprites are shared
                            tile.position((MapObj.tilewidth * i) - xOffset, (MapObj.tileheight * n) - yOffset);
                            tile.canvasUpdate(layer);
                        }
                    }
                }
            }
        };

        loadMap(function (text) {
            buildMap(JSON.parse(text));
        });
    }; // end TileMap{}

    // do our best not to pollute the global variables by creating a pseudo-namespace object attached
    // to the browser's window [global variable]
    global.TileMap = TileMap;
}(window));