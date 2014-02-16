var Bureau = require('./bureau.js'),
	utils = require('./utils.js'),
	express = require('express'),
	cons = require('consolidate'),
	swig = require('swig'),
	app = express();





var pages = {
	get: {
		login: function(req, res) {
			Bureau.db.collection('bacon').find({}).toArray(function(err, results) {
				res.render('login', results[0])
			})
		}
	},
	post: {
		dologin: function(req, res) {
			res.send('cheeky post to login i see')
		},
		doRegister: function(req, res) {
			var email = req.body.email.replace('@dur.ac.uk', '@durham.ac.uk'),
				password = req.body.password,
				passwordconfirm = req.body.passwordconfirm,
				forename = req.body.forename,
				surname = req.body.surname,
				address = req.body.address,
				liverin = req.body.liverin,
				course = req.body.course,
				college = req.body.college,
				gamegroup = req.body.gamegroup,
				consent = (req.body.consent.toLowerCase() === 'i agree'),
				errors=[];
			
				
		}
	}
	
}



//Setup middleware
app.use(express.static('static'))
app.use(express.bodyParser())


app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.set('view cache', false); 
swig.setDefaults({ cache: false });

app.get('/', function(req, res) {
	res.send('Hello yes, this is dog');
})

//Login and register pages
app.get('/login', pages.get.login)
app.post('/dologin', pages.post.dologin)
//app.post('/doregister', pages.post.doRegister);


app.get('/personal', function(req, res) {
	res.send('Let\'s get personal ;)')
})



//Handle 404
app.use(function(req, res, next) {
	res.send(404, 'Hello yes this is dog.<br><br>Dog cannot find your page :(')
})

Bureau.init(function (err, db) {
	if(err) throw err;
	
	var port = (process.env.VMC_APP_PORT || 3000);
	var host = (process.env.VCAP_APP_HOST || 'localhost');
	app.listen(port, host)
})


//
//
//$email 				= isset($_POST['email']) ? esc(trim($_POST['email'])) : ''; $email = str_replace("@dur.ac.uk", "@durham.ac.uk", $email);
//$password 			= isset($_POST['password']) ? $_POST['password'] : '';
//$passwordconfirm 	= isset($_POST['passwordconfirm']) ? $_POST['passwordconfirm'] : '';
//$forename 			= isset($_POST['forename']) ? stripcleantohtml($_POST['forename']) : '';
//$surname 			= isset($_POST['surname']) ? stripcleantohtml($_POST['surname']) : '';
//$address 			= isset($_POST['address']) ? stripcleantohtml($_POST['address']) : '';
//$liverin 			= isset($_POST['liverin']) ? $_POST['liverin'] : '';
//$course 			= isset($_POST['course']) ? stripcleantohtml($_POST['course']) : '';
//$college 			= isset($_POST['college']) ? $_POST['college'] : '';
//$gamegroup 			= isset($_POST['gamegroup']) ? $_POST['gamegroup']: '';
//$consent 			= isset($_POST['consent']) ? strtolower($_POST['consent']) : '';