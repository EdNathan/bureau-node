//Transitioned Selector 

function TransitionedSelector(el) {
	this.container = el;
	this.options = [];
	this.selected = {};
	this.__value = '';
	this.__index = 0;
	this.__isAccelerated = !!getTransformProperty(document.body);
	
	
	
	if(!el.children || el.children.length < 1) {
		throw 'Your transitioned selector container must have at least 1 option';
	} else {
	
		var frag = document.createDocumentFragment();
		//Add the hidden input for form compatiability
		this.__input = document.createElement('input');
		this.__input.type = 'hidden';
		this.__input.name = 'ui_style';
		frag.appendChild(this.__input);
		
		//Add the previous and next buttons
		this.__previousButton = document.createElement('div');
		this.__nextButton = document.createElement('div');
		this.__previousButton.className = this.__nextButton.className = 'transitioned-selector-button';
		this.__previousButton.className += ' previous-button'; this.__nextButton.className += ' next-button';
		this.__previousButton.style.left = '0';
		this.__nextButton.style.right = '0';
		var self = this
		this.__previousButton.addEventListener('click',function(e){self.select(-1, true)},false);
		this.__nextButton.addEventListener('click',function(e){self.select(1, true)},false);
		frag.appendChild(this.__previousButton);
		frag.appendChild(this.__nextButton);

	
		//Process the options: Clone the original node, save it, delete the original node's contents
		var itemList = el.cloneNode(true).children;
		el.innerHTML = '';
		for(var i = 0; i<itemList.length; i++) {
			this.addOption(itemList[i].innerHTML, (itemList[i].getAttribute('selected')!==null));
		}
		
		this.container.appendChild(frag);
		
		if(empty(this.selected)) {
			//If there is no default option set, then set the selected item to be the first in the list
			this.value = this.options[0].value;
		}
				
		
	}
}


TransitionedSelector.prototype = {
	get value() {
		return this.__value;
	},
	
	set value(val) {
		
		var isInOptions = false;
		
		for(var i = 0; i<this.options.length; i++) {
			if(this.options[i].value === val) {
				isInOptions = true;
				this.selected = this.options[i];
				this.__value = val;
				this.__input.value = val;
				this.__index = i;
			}
		}
		
		if(isInOptions === false) {
			throw 'Incorrect value: \"'+val+'\" is not a valid option';
		} else {
			this.updateView();
			this.onchange(this.__value);
			return this.__value;
		}
	},
	
	select: function(index, relative) {
		if(!!relative) {
			if(this.__index+index < 0 || this.__index+index > this.options.length-1) {
				//Do nothing
			} else {
				this.value = this.options[this.__index+index].value;
			}
		} else {
			if(index < 0 || index > this.options.length-1) {
				//Do nothing
			} else {
				this.value = this.options[index].value;
			}
		}
	},
	
	addOption: function(value, selected) {
		var item = {
			'value': value,
			'el': document.createElement('div'),
			'uid': this.options.length+1
		}
		item.el.innerHTML = value;	
		item.el.className = 'transitioned-selector-option';
		this.options.push(item);
		this.container.appendChild(item.el);
		if(!!selected) {
			this.value = value;
		} else {
			this.updateView();
		}
	},
	
	updateView: function() {
		var i = 0,
			ind = this.__index,
			o = this.options,
			l = this.options.length,
			transform = getTransformProperty(document.body);
		for(i;i<l;i++) {
			var pos = ((i-ind)*100) + '%';
			if(this.__isAccelerated)
				o[i].el.style[transform] = 'translateX('+pos+')';
			else
				o[i].el.style.left = pos;
		}
		//Disable buttons as appropriate"
		if(ind === 0 && this.__previousButton.className.indexOf('disabled') === -1) {
			this.__previousButton.className += ' disabled';
		} else if(ind !== 0){
			this.__previousButton.className = this.__previousButton.className.replace(' disabled', '');
		}
		if(ind === (l-1) && this.__nextButton.className.indexOf('disabled') === -1) {
			this.__nextButton.className += ' disabled';
		} else if(ind !== (l-1)){
			this.__nextButton.className = this.__nextButton.className.replace(' disabled', '');
		}
	},
	
	onchange: function(value) {
		
	} //Implement your own onchange
}