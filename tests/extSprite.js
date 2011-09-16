//author: Jonathan Bieler

sjs.Sprite.prototype.targetx=0;
sjs.Sprite.prototype.targety=0;
sjs.Sprite.prototype.hastarget=0;
sjs.Sprite.prototype.selected=0;

sjs.Sprite.prototype.health = 50;

sjs.Sprite.prototype.setTarget = function setTarget(tx,ty) {
    this.targetx = tx- this.w/2 ;
    this.targety = ty- this.h/2 ;
    this.hastarget = 1;
}

sjs.Sprite.prototype.updateUnit = function updateUnit(ticks) {

    if(this.hastarget){
    
        var tx = this.targetx -this.x;
        var ty = this.targety -this.y;
        
        var tn = sjs.math.hypo(tx,ty);
        if( tn > 10){
            tx = 400*tx/tn;
            ty = 400*ty/tn;
            this.addForce(tx,ty)
        } else {
            
            this.hastarget = 0;
        }
    }
    
    this.updatePhysic(ticks);
}


//// Add some physics ////
sjs.Sprite.prototype.setForce = function setForce(fx,fy) {
    this.fx = fx;
    this.fy = fy;	
}

sjs.Sprite.prototype.addForce = function addForce(fx,fy) {
    this.fx = this.fx + fx;
    this.fy = this.fy + fy;	
}
