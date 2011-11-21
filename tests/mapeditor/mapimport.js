
(function(global) {

    var map, tilelayers, tilelayers, _scene, staticCollision, tileProp, playerStart, activeObjects;
    activeObjects = [];
    tilelayers = [];
    
    function load(src, callback) {
        var xobj = new XMLHttpRequest();
        xobj.onreadystatechange = function () {
            if (xobj.readyState == 4) {
                var text = xobj.responseText;
                callback(text);
            }
        }
        src = src + "?t=" + (new Date()).getTime();
        xobj.open('GET', src, true);
        xobj.send(null);
    }
        
    function loadMap(src, scene, callback) {
        tileProp = {};
        map = null;
        tilelayers = [];
        _scene = null;
        staticCollision = {};
        sjs.map.activeObjects = [];
        sjs.map.positions = [];
        
        load(src, function(text) {
            jsonCallback(JSON.parse(text), callback);
        });
        _scene = scene;
    }

    function _getGid(x, y) {

        if(x < 0 || y < 0 || x >= map.width || y >= map.height)
            return;
        
        var index = x + y * this.width;
        return this.data[index];
    }

    function jsonCallback(_map, callback) {
        map = _map;
        
        for(index in map.layers) {
            var layer = map.layers[index];
            if(layer.type=="tilelayer") {
                layer.getGid = _getGid;
                tilelayers.push(layer);
            }

            if(layer.type=="objectgroup") {
                objectGroup(layer);
            }
        }
        buildTileProperties();
        buildStaticCollisions();
        
        var to_load = [];
        for(var i=0; i<map.tilesets.length; i++) {
            to_load.push(map.tilesets[i].image);
        }
        
        _scene.loadImages(to_load, callback);
       
    }

    // converts the objects into Sprite.js shape
    function objectGroup(group) {
        for(index in group.objects) {
            var object = group.objects[index];
            if(object.type=="playerStart") {
                var playerStart = {x:object.x, y:object.y};
                sjs.map.playerStart = playerStart;
            }
            if(object.type=="teleport") {
                var shape = {x:object.x, y:object.y, w:object.width, h:object.height, type:"rectangle", class:"teleport", map:object.properties.map};
                sjs.map.activeObjects.push(shape);
            }
            if(object.type == "position") {
                var position = {x:object.x, y:object.y};
                sjs.map.positions[position.name] = position;
            }
            if(object.type == "dialog") {
                var shape = {x:object.x, y:object.y, w:object.width, h:object.height, type:"rectangle", class:"dialog", dialog:object.properties};
                var arrow = scene.Sprite("arrow.png", {w:24, h:28, x:shape.x, y:shape.y-28});
                shape.sprite = arrow;
                sjs.map.activeObjects.push(shape);
            }
            if(object.type == "entity") {
                var shape = {x:object.x, y:object.y, w:48, h:48, type:"rectangle", class:"entity", gid:object.gid, props:object.properties};
                var entity = sjs.map.getSprite(object.gid);
                shape.sprite = entity;
                sjs.map.activeObjects.push(shape);
            }
        }
    }
    
    function paintOn(layer, _x, _y) {
        
        var x_offset = _x % map.tilewidth;
        var y_offset = _y % map.tileheight;
        
        _x = _x / map.tilewidth | 0;
        _y = _y / map.tileheight | 0;
        
        for(var x = 0; x < (1 + layer.w / map.tilewidth); x++) {
            for(var y = 0; y < (1 + layer.h / map.tileheight); y++) {
                for(var i in tilelayers) {
                    var tilelayer = tilelayers[i];
                    var gid = tilelayer.getGid(_x + x, _y + y);
                    if(gid) {
                        var tile = getSprite(gid);
                        // we need to update the position as the Sprites are shared
                        tile.position(map.tilewidth * x - x_offset, map.tileheight * y - y_offset);
                        tile.canvasUpdate(layer);
                    }
                }
            }
        }
    }
    
    // just merge all the tile props into a big object

    function buildTileProperties() {
        for(var i=0; i<map.tilesets.length; i++) {
            var tileset = map.tilesets[i];
            for(index in tileset.tileproperties) {
                var props = tileset.tileproperties[index];
                tileProp[parseInt(index)+tileset.firstgid] = props;
            }
        }
    }
    
    function capitalise(string)
    {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    
    // merge the collisions from the different layers
    function buildStaticCollisions() {
        for(var i=0; i<tilelayers.length; i++) {
            var tilelayer = tilelayers[i];
            for(index in tilelayer.data) {
                var gid = tilelayer.data[index];
                var prop = getTileProperties(gid);
                var collision = staticCollision[index];
                if(!collision)
                    collision = {};
                
                var pos = ['left', 'top', 'right', 'bottom'];
                
                if(prop.collision) {
                    collision.whole = true;
                }
                
                for(var p in pos) {
                    var propName = 'collision'+capitalise(pos[p]);
                    if(prop[propName])
                        collision[propName] = parseInt(prop[propName]);
                    var propName = 'pass'+capitalise(pos[p]);
                    if(prop[propName])
                        collision[propName] = parseInt(prop[propName]);
                }
                
                staticCollision[index] = collision;
            }
        };
    };
    
    // test collision with real world (x, y)
    function collides(x, y) {
        var _x = x / map.tilewidth;
        var _y = y / map.tileheight;
        if(x < 0 || y < 0 || _x > map.width || _y > map.height)
            return true;
        var index = map.width * (_y | 0) + (_x | 0);

        var collision = staticCollision[String(index)];

        if(!collision)
            return false;
        
        if(collision.passRight) {
            var col = x % map.tilewidth >=  map.tilewidth - collision.passRight;
            if(col)
                return false;
        }
        if(collision.passLeft) {
            var col = x % map.tilewidth <=  collision.passLeft;
            if(col)
                return false;
        }
        if(collision.passTop) {
            var col = y % map.tileheight <= collision.passTop;
            if(col)
                return false;
        }
        if(collision.passBottom) {
            var col = y % map.tileheight >= map.tileheight - collision.passBottom;
            if(col)
                return false;
        }
        
        if(collision.whole) {
            return true;
        }
        
        if(collision.collisionRight) {
            var col = x % map.tilewidth >=  map.tilewidth - collision.collisionRight;
            if(col)
                return true;
        }
        if(collision.collisionLeft) {
            var col = x % map.tilewidth <=  collision.collisionLeft;
            if(col)
                return true;
        }
        if(collision.collisionTop) {
            var col = y % map.tileheight <= collision.collisionTop;
            if(col)
                return true;
        }
        if(collision.collisionBottom) {
            var col = y % map.tileheight >= map.tileheight - collision.collisionBottom;
            if(col)
                return true;
        }
        
        return false;
    }
    
    function getTileProperties(gid) {
        if(tileProp[gid]) {
            return tileProp[gid];
        }
        return {};
    }
    
    function findTileset(gid) {
        // find the tileset for the gid
        var tileset = null;
        for(var i=0; i<map.tilesets.length; i++) {
            tileset = map.tilesets[i];
            if(gid < tileset.firstgid) {
                tileset = map.tilesets[i-1];
                break;
            }
        }
        return tileset;
    }

    function getSprite(gid) {
        // return the sprite according to the gid
        var tileset = findTileset(gid);
        var localGid = gid - (tileset.firstgid);

        var tw = tileset.tilewidth;
        var th = tileset.tileheight;

        var nb_x = tileset.imagewidth / tw | 0;
        var nb_y = tileset.imageheight / th | 0;
        
        var x = localGid % nb_x;
        var y = localGid / nb_x | 0;

        var sp = _scene.Sprite(tileset.image, {w:tw, h:th, xoffset:x * tw, yoffset:y * th, layer:null});
        return sp;
    }
    
    function align(x, y) {
        // return the cell coordinates according to relative coordinates
        x = x / map.tilewidth | 0;
        y = y / map.tileheight | 0;
        return {x:x, y:y};
    }
    
    function findPath(x1, y1, x2, y2) {
        x1 = (x1 / map.tilewidth | 0) * map.tilewidth;
        y1 = (y1 / map.tileheight | 0) * map.tileheight;
        x2 = (x2 / map.tilewidth | 0) * map.tilewidth;
        y2 = (y2 / map.tileheight | 0) * map.tileheight;
        var start = new Node(x1 + map.tilewidth / 2, y1 + map.tileheight / 2);
        var end = new Node(x2 + map.tilewidth / 2, y2 + map.tileheight / 2);
        return sjs.path.find(start, end);
    }
    
    function Node(x, y, parent) {
        this.parent = parent;
        this.x = x;
        this.y = y;
    }

    Node.prototype.neighbors = function() {
        return [
            new Node(this.x-map.tilewidth, this.y, this), 
            new Node(this.x+map.tilewidth, this.y, this),
            new Node(this.x, this.y + map.tileheight, this),
            new Node(this.x, this.y - map.tileheight, this)
        ];
    }

    Node.prototype.distance = function(node) {
        return sjs.math.hypo(this.x - node.x, this.y-node.y);
    }

    Node.prototype.disabled = function() {
        
        return collides(this.x, this.y)
            || collides(this.x + 12, this.y)
            || collides(this.x, this.y + 12)
            || collides(this.x, this.y - 12)
            || collides(this.x - 12, this.y);
    }

    Node.prototype.equals = function(node) {
        return this.x == node.x && this.y == node.y;
    }
    
    // TODO: naming
    global.sjs.map = {
        activeObjects:[],
        positions:{},
        playerStart:playerStart,
        findPath:findPath,
        loadMap:loadMap,
        align:align,
        findTileset:findTileset,
        getSprite:getSprite,
        tilelayers:tilelayers,
        map:map,
        paintOn:paintOn,
        buildStaticCollisions:buildStaticCollisions,
        staticCollision:staticCollision,
        getTileProperties:getTileProperties,
        collides:collides
    };

})(this);