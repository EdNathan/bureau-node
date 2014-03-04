function ProgressivePrinter(el, startText) {
	this.__running = false;
	this.__queue = [];
	this.el = el;
	this.__queue.push(startText);
}

ProgressivePrinter.prototype = {
	queue: function (str) {
		this.__queue.push(str);
		if(!this.__running) {
			this.tick();
		}
	},
	
	tick: function () {
		this.el.innerHTML = this.__queue.shift();
		self = this;
		var f = function(){self.tick()};
		if(this.__queue.length > 0) {
			this.__running = true;
			setTimeout(f, 0);
		} else {
			this.__running = false;
		}
	}
}