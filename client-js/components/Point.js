function Point(x,y) {
	this.x = x || 0;
	this.y = y || 0;	
}

Point.prototype = {
	scale: function(c) {
		return new Point(c*this.x,c*this.y);
	},
	
	add: function(point) {
		return new Point(this.x+point.x, this.y+point.y);
	},
	
	subtract: function(point) {
		return this.add(point.scale(-1));
	},
	
	dot: function(point) {
		return (this.x*point.x + this.y*point.y);
	},
	
	distanceToPoint: function(point) {
		var vec = this.subtract(point);
		return Math.sqrt(vec.dot(vec));
	},
	
	distanceFromOrigin: function() {
		return this.distanceToPoint(new Point(0,0));
	}
}