function applyColours () {
	var a = [];
	
	a.push(
		makeColourItem($I('personal-header'), 'borderColor'),
		makeColourItem($I('personal-page'), 'borderColor')
	);
	

	
	var d = document.querySelectorAll('#details input'),
		k = d.length,
		j = 0;
	
	for(j; j<k; j++) {
		a.push(makeColourItem(d[j], 'outlineColor'));
	}
	
	colourItems(a);
}

function setup() {
	//Setup the editable regions with their forms
	var editButtons = document.querySelectorAll('.edit-button'),
		l = editButtons.length,
		i = 0,
		toggleEdit = function(e) {
			var container = e.target.parentNode,
				editing;
			
			if(container.className.indexOf('edit') === -1) {
				container.className += ' edit';
				sexyInnerHTML(e.target, 'submit request');
				editing = true;
			} else {
				switch (container.id) {
					case "details":
						var r = confirm("Are you sure you want to submit a details change request?");
						if(r) {
							container.querySelector('form').submit();
						}
						return;
						break;
				}
				
			}
			
			var inputs = container.querySelectorAll('.editable-row > input'),
				l = inputs.length,
				i = 0
			
			for(i;i<l && editing;i++) {
				inputs[i].disabled = '';
			}
			
		};
	
	for(i;i<l;i++) {
		editButtons[i].addEventListener('click', toggleEdit, false);
	}
	
	//Setup display picture changer
	$I('picture-form').onchange = function() {
		$I('picture-form').submit();
	}
}