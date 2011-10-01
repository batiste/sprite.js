
(function(global) {

    var map = null;
    var tilelayers = [];
    var _scene = null;
    var staticCollision = {};
    
    function loadMap(src, scene) {
        var map_source = document.createElement('script');
        map_source.src = src;
        document.head.appendChild(map_source);
        _scene = scene;
    }

    function mapCallback(_map) {
        map = _map;
        
        for(index in map.layers) {
            var layer = map.layers[index];
            if(layer.type=="tilelayer") {
                tilelayers.push(layer);
            }
        }
        buildTileProperties();
        buildStaticCollisions();
        
        var to_load = [];
        for(var i=0; i<map.tilesets.length; i++) {
            to_load.push(map.tilesets[i].image);
        }

        _scene.loadImages(to_load, main);
       
    }
    window.mapCallback = mapCallback;
    
    var tileProp = {}
    function buildTileProperties() {
        for(var i=0; i<map.tilesets.length; i++) {
            var tileset = map.tilesets[i];
            for(var j=0; j<tileset.tiles.length; j++) {
                var tile = tileset.tiles[j];
                tileProp[(tile.id + tileset.firstgid)] = tile;
            }
        }
    }
    
    function buildStaticCollisions() {
        for(var i=0; i<tilelayers.length; i++) {
            var tilelayer = tilelayers[i];
            for(index in tilelayer.grid) {
                var gid = tilelayer.grid[index];
                var prop = getTileProperties(gid);
                if(prop.collision) {
                    staticCollision[index] = true;
                }
            }
        }
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
            if(gid < tileset.gid) {
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
    
    // TODO: naming
    sjs.map = {
        loadMap:loadMap, 
        findTileset:findTileset,
        getSprite:getSprite,
        tilelayers:tilelayers,
        map:map,
        buildStaticCollisions:buildStaticCollisions,
        staticCollision:staticCollision,
        getTileProperties:getTileProperties,
    };

})(this);