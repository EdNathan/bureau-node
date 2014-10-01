var nodemailer = require('nodemailer'),
	swig = require('swig'),
	passwords = require('./passwords')
	Address = passwords.mail.address,
	Transporter = nodemailer.createTransport({
		host: passwords.mail.host,
		secure: passwords.mail.secure,
		port: passwords.mail.port,
		auth: {
			user: passwords.mail.user,
			pass: passwords.mail.pass
		}
	})
	
var Mail = {
		sendText: function(to, subject, text, callback) {
			console.log('MAIL: '+to+'['+subject+'] - '+text)
			Transporter.sendMail({
				to: to,
				from: '"Bureau" <'+Address+'>',
				subject: subject,
				text: text
			}, function(err, res) {
				if(err) {
					callback(err, res)
				} else {
					callback(null, res)
				}
			})
		},
		
		sendWelcome: function(data, callback) {
			var to = data.email,
				subject = 'Welcome To Bureau',
				text = swig.renderFile('./mail/welcome.txt', data)
				
			Mail.sendText(to, subject, text, callback)
		}
	}


module.exports = exports = Mail