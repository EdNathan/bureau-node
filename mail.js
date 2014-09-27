var nodemailer = require('nodemailer'),
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
		}
	}


module.exports = exports = Mail