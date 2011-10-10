//author: Jonathan Bieler

sjs.Sprite.prototype.targetx = 0;
sjs.Sprite.prototype.targety = 0;
sjs.Sprite.prototype.hastarget = 0;
sjs.Sprite.prototype.selected = 0;

sjs.Sprite.prototype.health = 50;

sjs.Sprite.prototype.setTarget = function setTarget(tx,ty) {
    this.targetx = tx- this.w/2 ;
    this.targety = ty- this.h/2 ;
    this.hastarget = 1;
}

sjs.Sprite.prototype.updateUnit = function updateUnit(ticks) {

    if(this.hastarget) {
    
        var tx = this.targetx - this.x;
        var ty = this.targety - this.y;
        
        var tn = sjs.math.hypo(tx,ty);
        
        if(tn > 40) {
            this.addForce(tx / 2, ty / 2);
        } else {
            this.addForce(tx / 12, ty / 12);
        }
       
    }
    
    this.applyForce(ticks);
    this.applyVelocity(ticks);
}
