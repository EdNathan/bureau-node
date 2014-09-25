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
		
		b.canvas = document.getElementsByTagName('canvas')[0];
		b.canvas.width = innerWidth/4;
		b.canvas.height = innerHeight/4;
		b.ctx = b.canvas.getContext('2d');
		b.image = b.ctx.createImageData(b.canvas.width, b.canvas.height);
		b.data = b.image.data;
		
		noise.seed(new Date())
		/*if(innerWidth > 860)
			setTimeout(function(){
				console.log('bg')
				b.canvas.className='showing'
				requestAnimationFrame(b.drawBG)
			},2.4*1000)*/
		
	},
	drawBG: function() {
		var data = b.data,
			now = new Date()
		for (var x = 0; x < b.canvas.width; x++) {
			for (var y = 0; y < b.canvas.height; y++) {
				var cell = (x + y * b.canvas.width) * 4;
				if(x%30 < 6 && y%30 < 6) {
					var value = noise.perlin3(x / 100, y / 100, now/5000);
					value *= 30;
					data[cell] = data[cell + 1] = data[cell + 2] = 0;
					data[cell + 3] = value; // alpha.
				} else {
					data[cell] = data[cell + 1] = data[cell + 2] = data[cell + 3] = 0
				}
				
			}
		}

		b.ctx.fillColor = 'black';
		b.ctx.fillRect(0, 0, 100, 100);
		b.ctx.putImageData(b.image, 0, 0);
		requestAnimationFrame(b.drawBG)
	}
}

$(function() {
	b.init()
})