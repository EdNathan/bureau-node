var nodemailer = require('nodemailer'),
	swig = require('swig'),
	Address = process.env.BUREAU_MAIL_ADDRESS,
	Transporter = nodemailer.createTransport({
		host: process.env.BUREAU_MAIL_HOST,
		secure: true,
		port: Number(process.env.BUREAU_MAIL_PORT),
		auth: {
			user: process.env.BUREAU_MAIL_USER,
			pass: process.env.BUREAU_MAIL_PASS
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
