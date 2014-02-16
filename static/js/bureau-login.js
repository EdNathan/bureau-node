function applyColours() {
	var a = [];
	
	a.push(makeColourItem($I('login-box'), 'backgroundColor'));
		
	colourItems(a);
}

function openRegister() {
	location.hash = '#register';
}

function hideRegister() {
	document.getElementById('register-link').style.display = 'none';
}