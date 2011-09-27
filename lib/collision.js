(function(global){

function resolveCollisions() {
    var collisions = {};
    if(arguments.length == 1)
        var elements = arguments[0];
    else
        var elements = Array.prototype.concat.apply([], arguments);
    // search collisions elements by elements
    // O(N/2 * N/2)
    for(var i=0; i<elements.length; i++) {
        var el = elements[i];
        for(var j=i+1; j<elements.length; j++) {
            if(el.collidesWith(elements[j])) {
                collisions[el] = elements[j];
                collisions[elements[j]] = el;   
            }
        }
    }
    return collisions;
}

global.sjs.collision = {find:resolveCollisions};

})(this);