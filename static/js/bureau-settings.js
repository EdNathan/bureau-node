function updateSettings(json) {
	var uid = document.getElementsByName('uid')[0].value;
	apiRequest(uid, 'write', 'settings', json);
}

function showError(err) {
	if(!$I('error-display')) {
		var d = document.createElement('div');
		d.id = 'error-display';
	}
}

function setup() {
	styleSelector = new TransitionedSelector(document.querySelector('.transitioned-selector'));
	styleSelector.onchange = function(value) {
		document.body.className = value;
		updateSettings({
			'ui_style':value
		});
	}
	
	$I('notifications-form').onchange = function(e) {
		var inputs = this.querySelectorAll('input[type="checkbox"]'),
			l = inputs.length,
			i = 0,
			j = {};
		
		for (i;i<l;i++) {
			j[inputs[i].name] = inputs[i].checked ? 'on' : 'off';
		}
		
		console.log(j);
		
		updateSettings({
			'notifications': j
		});
	}
}