/*
Sprite.js v1.1.1 path finding function extension
Copyright (c) 2011 Batiste Bieler and contributors, https://github.com/batiste/sprite.js
*/

(function(global){
    
var doc = global.document;

function find_path(startNode, endNode, maxVisit) {
    if(maxVisit == undefined)
        maxVisit = 1000;

    // we start to search from the end so the
    // final node is the start
    endNode.cost = 0;
    endNode.distance_to_start = endNode.distance(startNode);
    var to_visit = [endNode];
    var visited = [];
    var current_node = false;
    while(to_visit.length) {
        current_node = to_visit[0];

        // discard the node
        if(current_node.disabled()) {
            to_visit.shift();
            continue;
        }

        // to avoid infinite search
        if(visited.length > maxVisit) {
            break
        }

        if(current_node.equals(startNode)) {
            return current_node;
        }

        // check if the node is not already visited
        var already_visited = false;
        for(var i=0; i<visited.length; i++) {
            if(visited[i].equals(current_node)) {
                already_visited = true;
                break;
            }
        }
        if(already_visited) {
            to_visit.shift();
            continue;
        }

        visited.push(current_node);
        to_visit.shift();

        // add neighbors nodes
        var neighbors = current_node.neighbors();
        for(var i=0; i<neighbors.length; i++) {
            neighbors[i].distance_to_start = endNode.distance(neighbors[i]);
            neighbors[i].cost = neighbors[i].parent.cost + 4;
        }
        to_visit.push.apply(to_visit, neighbors);

        // put the best candidate on top
        to_visit.sort(function(a, b) {
            // Less than 0: Sort "a" to be a lower index than "b", so on top of the list
            return (a.cost + a.distance_to_start) - (b.cost + b.distance_to_start);
        });
    }
}

global.sjs.path = {find:find_path};

})(this);