/* Grabber Class */
function SidebarGrabber() {
	this.el = $I('grabber');
	var toolbar = $I('toolbar');
	var maxdx = 100;
	
	//State management
	this.dragging = false;
	this.extended = false;
	
	this.__isAccelerated = !!getTransformProperty(document.body);
	this.__transformProperty = getTransformProperty(document.body);

	this.__isAccelerated = false;


	//Use appropriate handler for touching/clicking
	var down = "mousedown", up = "mouseup", move="mousemove";
	if ('createTouch' in document) {
		down = "touchstart";
		up = "touchend";
		move = "touchmove";
		console.log('using touches');
	}
	if (window.navigator.msPointerEnabled) {
		down = "MSPointerDown";
		up = "MSPointerUp";
		move = "MSPointerMove";
		console.log('fuck microsoft');
	}
	
	var self = this;
	function cancelDrag() {
		return (function () {
			if(self.dragging && (self.dx == 0 || !self.dx)) {
				self.dragging = false;
				toolbar.className = self.el.className = '';

				if(self.extended) {
					console.log('closing');
					self.extended = false;
					if (self.__isAccelerated) {
						toolbar.style[self.__transformProperty] = self.el.style[self.__transformProperty] = 'translateX(0px)';
					} else {
						self.el.style.left = '0px';
						toolbar.style.left = -100+'px';
					}
				} else {
					console.log('opening');
					self.extended = true;
					if (self.__isAccelerated) {
						toolbar.style[self.__transformProperty] = self.el.style[self.__transformProperty] = 'translateX('+maxdx+'px)';
					} else {
						self.el.style.left = maxdx+'px';
						toolbar.style.left = -100+maxdx+'px';
					}
				}
				self.dx = 0;
				return;
			}
			
			if(self.dragging) {
				self.dragging = false;
				
				if(self.dx >= maxdx/2) {
					self.extended = true;
					if (self.__isAccelerated) {
						toolbar.style[self.__transformProperty] = self.el.style[self.__transformProperty] = 'translateX('+maxdx+'px)';
					} else {
						self.el.style.left = maxdx+'px';
						toolbar.style.left = -100+maxdx+'px';
					}
					
				} else {
					self.extended = false;
					if (self.__isAccelerated) {
						toolbar.style[self.__transformProperty] = self.el.style[self.__transformProperty] = 'translateX(0px)';
					} else {
						self.el.style.left = '0px';
						toolbar.style.left = -100+'px';
					}
					
				}
				
				self.dx = 0;
				toolbar.className = self.el.className = '';
				return;
			}
		})()
	}
	
	this.el.addEventListener(down, function(e) {
		self.dragging = true;
		self.start = new Point(e.pageX,e.pageY);
		toolbar.className = self.el.className = 'dragging';
		stopEvent(e);
	}, false);
	
	document.body.addEventListener(up, cancelDrag, false);
	//this.el.addEventListener('mouseout', cancelDrag, false);
	
	document.body.addEventListener(move, function(e) {
		if(self.dragging) {
			self.dx = (new Point(e.pageX,e.pageY)).subtract(self.start).x;
			console.log(self.dx);
			
			if(self.extended) {
				t = Math.min(0,Math.max(self.dx, -maxdx)) + 100;
			} else {
				t = Math.max(0,Math.min(self.dx, maxdx));
			}
			
			if (self.__isAccelerated) {
				toolbar.style[self.__transformProperty] = self.el.style[self.__transformProperty] = 'translateX('+t+'px)';
			} else {
				self.el.style.left = t+'px';
				toolbar.style.left = -100+t+'px';
			}
		}
	}, false);
}