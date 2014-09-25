b = {
	init: function() {
		b.displayWelcome()
	},
	
	displayWelcome: function() {
		$('h2 span').each(function(i) {
			this.style.webkitTransitionDelay = this.style.transitionDelay = 0.6+Math.random()*0.8+'s'
			//this.style.webkitTransitionDelay = this.style.transitionDelay = (i+1)*0.1+'s'
		})
		$('h2 span+span').each(function() {
			this.style.webkitTransitionDelay = this.style.transitionDelay = parseFloat($(this).prev()[0].style.webkitTransitionDelay.replace('s', '')) + 0.2 + 's'
		})
		$('h2').addClass('on')
		
		$('#zoom div').each(function(i) {
			var num = (i+1)*0.2
			this.setAttribute('style', '-webkit-animation-name: zoom;animation-name: zoom;-webkit-animation-delay: '+num+'s;animation-delay: '+num+'s;')
		})
		
		b.canvas = document.getElementsByTagName('canvas')[0]
		b.tempCanvas = document.createElement('canvas')
		b.canvas.width = b.tempCanvas.width = innerWidth
		b.canvas.height = b.tempCanvas.height = innerHeight
		b.ctx = b.canvas.getContext('2d')
		b.tempCtx = b.tempCanvas.getContext('2d')
		
		noise.seed(new Date())
		if(innerWidth > 860)
			setTimeout(function(){
				console.log('bg')
				b.canvas.className='showing'
				requestAnimationFrame(b.drawBG)
			},2.4*1000)
		
	},
	drawBG: function() {
		var data = b.data,
			now = new Date(),
			width = 24,
			spacing = 120
			
		b.tempCtx.clearRect(0,0,b.tempCanvas.width,b.tempCanvas.height)
		for(var x = 0; x < b.tempCanvas.width; x+= spacing) {
			for(var y = 0; y < b.tempCanvas.height; y+= spacing) {
				var value = noise.perlin3(x / 25, y / 25, now/5000);
					value *= 0.2;
				b.tempCtx.globalAlpha = Math.abs(value)
				b.tempCtx.fillColor = 'black'
				b.tempCtx.fillRect(x,y,width,width)
			}
		}
		
		var d = b.tempCtx.getImageData(0,0,b.tempCanvas.width,b.tempCanvas.height)
		b.ctx.putImageData(d, 0, 0);
		
		requestAnimationFrame(b.drawBG)
	}
}

$(function() {
	b.init()
})