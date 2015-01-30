/*
	endpoints:
	GET		/submissions?access_token	returns a list of submissions (should this redirect to the stored JSFS document containing the list?)
	POST	/submissions				returns a new submission URL and access_token, updates submissions list
	PUT		/submissions?access_token	updates an existing submission (should this target the stored JSFS document directly?)
	DELETE	/submissions?access_token	deletes a submission (again should this just target the JSFS document?), updates submissions list
	
	GET		/jurors						returns a list of jurors (necissary?)
	POST	/jurors						returns a new juror URL and access_token, updates jurors list
	PUT		/jurors						updates an existing juror (should this target the JSFS document?)
	DELETE	/jurors						deletes a juror (again, target JSFS direct?)
	
	GET		/reviews					returns a list of reviews
	POST	/reviews					returns a new review URL and access_token, updates reviews list
	PUT		/reviews					updates existing review
	DELETE	/reviews					removes a review and updates the reviews list
	
	/reviews
*/

// includes
var restify = require("restify");
//var jsfs = require("./jsos_jsfs.js");
var redis_url = process.env.REDIS_URL || 'redis://localhost:6379';
var redis = require("redis-url").connect(redis_url);
var nodemailer = require("nodemailer");

// config
//var JSFS_SERVER = "http://localhost:7302";

// simple logging
var log = {
        INFO: 0,
        WARN: 1,
        ERROR: 2,
        level: 0, // default log level
        message: function(severity, log_message){
                if(severity >= this.level){
                        console.log(Date() + "\t" + severity + "\t" + log_message);
                }
        }
};

// init JSFS connection
//jsfs_server = jsfs.connect(JSFS_SERVER);

// configure REST server
var server = restify.createServer();
server.use(restify.bodyParser({ mapParams: false }));
server.use(restify.CORS());

// CORS pre-flight support
function unknownMethodHandler(req, res) {
    if (req.method.toLowerCase() === 'options') {
        var allowHeaders = ['Accept', 'Accept-Version', 'Content-Type', 'Api-Version', 'Origin', 'X-Requested-With','Range'];
        if (res.methods.indexOf('OPTIONS') === -1){
            res.methods.push('OPTIONS');
        }
        res.header('Access-Control-Allow-Credentials', true);
        res.header('Access-Control-Allow-Headers', allowHeaders.join(', '));
        res.header('Access-Control-Allow-Methods', res.methods.join(', '));
        res.header('Access-Control-Allow-Origin', req.headers.origin);
        return res.send(204);
    } else {
        // debug, log methods we don't handle explicitly
        log.message(log.WARN,req.method.toLowerCase);
        return res.send(new restify.MethodNotAllowedError());
    }
}
server.on('MethodNotAllowed', unknownMethodHandler);

// service endpoint handlers
function genres_list(req, res, next){
	log.message(log.INFO, "got genres_list");

	var genres = ["Blues","Classical","Country","Dance & Electronic","Folk","Instrumental","Jazz","Pop","Rap & Hip Hop","Rock","Spiritual"];

	res.send(genres);
	return next;
}

function submissions_list(req, res, next){
	log.message(log.INFO, "got submissions_list");
	
	// return submission index from REDIS
	var submissions = [];
	redis.smembers("submissions", function(err, value){
		
		if(err){
			log.message(log.ERROR,err);
			res.send(500,err);
			return next;
		}

		log.message(log.INFO,value);

		for(var i=0;i<value.length;i++){
			submissions.push(value[i]);
		}

		res.send(submissions);
		return next;
	});

	/*
	// return submission index from JSFS
	jsfs_server.load_object("/submissions/submission_index.json", function(obj){
		if(obj){
			res.send(obj);
		} else {
			res.send(500, "error reading submissions list");
		}
		return next;
	});
	*/
}

function get_submission(req, res, next){
	log.message(log.INFO, "got get_submission");
	log.message(log.INFO,req.params.slug);

	redis.get("submission:" + req.params.slug, function(err, value){

		if(err){
			log.message(log.ERROR, err);
			res.send(500,err);
			return next;
		}

		log.message(log.INFO,value);

		res.send(JSON.parse(value));
		return next;
	});
}

function create_submission(req, res, next){
	log.message(log.INFO, "got create_submission");
	log.message(log.INFO,JSON.stringify(req.body.submission));

	// store submission in REDIS
	var submission = req.body.submission;
	redis.set("submission:" + submission.slug, JSON.stringify(submission), function(err, value){

		if(err){
			log.message(log.ERROR,err);
			res.send(500,err);
			return next;
		}

		log.message(log.INFO,value);

		// add submission to submission index
		redis.sadd("submissions", submission.slug, function(err, value){

			if(err){
				log.message(log.ERROR,err);
				res.send(500,err);
				return next;
			}

			log.message(log.INFO,value);

			// todo: this notification should be sent by the client, but for now
			// its hard-coded for now
			//var recipient = "";
			//var subject = "";
			//var message = "";
			// todo: enable once we have the credentials
			//send_email(recipient, subject, message);

  		var recipient = submission.submitter_email;
  		var subject = "Capital City Records submission confirmed!";
  		var message = "<p><p>Hello,<p>Thanks for your submission to Capital City Records. Your tracks and information have been uploaded for jury review.<p>We will follow up with you a few weeks after the submission period closes. For more information about Capital City Records see our FAQ at <a href=http://www.capitalcityrecords.ca/about>http://www.capitalcityrecords.ca/about</a><p>Thanks much,<br>Capital City Records<br><br>--&nbsp;<br>http://capitalcityrecords.ca/<br>localmusic@epl.ca";

  		send_email(recipient, subject, message);

			res.send(200,value);
			return next;
		});
	});

	/*	
	// store submission in JSFS
	var submission = JSON.parse(req.body.submission);
	jsfs_server.store_object(submission, "/submissions/" + submission.slug, true, false, function(submission_store_result){
		if(submission_store_result.success){
			// update submission index
			jsfs_server.load_object("/submissions/submission_index.json", function(obj){
				if(obj){
					var submission_idx_entry = {"url":submission_store_result.url,"access_token":submission_store_result.access_token};
					obj.submissions.push(submission_idx_entry);
					// update stored index
					jsfs_server.store_object(obj, "", true, false, function(idx_store_result){
						// return submission storage result
						res.send(submission_store_result);
						return next;
					});
				} else {
					res.send(500, "error updating submission index");
					return next;
				}
			});
		} else {
			res.send(500, "error storing submission");
			return next;
		}
	});
	*/
}

function update_submission(req, res, next){
	log.message(log.INFO, "got update_submission");
	
	// todo: store updated submission in JSFS
	
	return next;
}

function remove_submission(req, res, next){
	log.message(log.INFO, "got remove_submission");
	
	// todo: delete specified submission from JSFS
	
	// todo: update submission index
	
	return next;
}

// jurors endpoint handlers
function jurors_list(req, res, next){
	log.message(log.INFO, "got jurors_list");
	
	// todo: return juror index
	
	return next;
}

function create_juror(req, res, next){
	log.message(log.INFO, "got create_juror");
	
	// todo: store juror in JSFS
	
	// todo: update juror index
	
	// todo: return juror access_token
	
	return next;
}

function update_juror(req, res, next){
	log.message(log.INFO, "got update_juror");
	
	// todo: store updated juror in JSFS
	
	return next;
}

function remove_juror(req, res, next){
	log.message(log.INFO, "got remove_juror");
	
	// todo: delete specified juror from JSFS
	
	// todo: update juror index
	
	return next;
}

// review endpoint handlers
function reviews_list(req, res, next){
	log.message(log.INFO, "got review_list");
	
	// todo: return review index
	
	return next;
}

function create_review(req, res, next){
	log.message(log.INFO, "got create_review");
	
	// todo: store review in JSFS
	
	// todo: update review index
	
	// todo: return review access_token
	
	return next;
}

function update_review(req, res, next){
	log.message(log.INFO, "got update_review");
	
	// todo: store updated review in JSFS
	
	return next;
}

function remove_review(req, res, next){
	log.message(log.INFO, "got remove_review");
	
	// todo: delete specified review from JSFS
	
	// todo: update review index
	
	return next;
}

function send_notification(req, res, next){
	log.message(log.INFO, "got send_notification");

	var notification = req.body.notification;

  var recipient = notification.recipient;
  var subject = notification.subject;
  var message = notification.message;

	send_email(recipient, subject, message);

	res.send(200);
	return next;

};

function send_test_notification(req, res, next){
  log.message(log.INFO, "got send_notification");

  var notification = req.body.notification;

  var recipient = notification.recipient;
  var subject = "Capital City Records submission confirmed!"; 
  var message = "<p><p>Hello,<p>Thanks for your submission to Capital City Records. Your tracks and information have been uploaded for jury review.<p>We will follow up with you a few weeks after the submission period closes. For more information about Capital City Records see our FAQ at <a href=http://www.capitalcityrecords.ca/about>http://www.capitalcityrecords.ca/about</a><p>Thanks much,<br>Capital City Records<br><br>--&nbsp;<br>http://capitalcityrecords.ca/<br>localmusic@epl.ca";

  send_email(recipient, subject, message);

  res.send(200);
  return next;

};

// todo: temp email config, externalize soon
var NOTIFICATION_SOURCE_EMAIL = "Capital City Records <localmusic@epl.ca>";
var MAIL_USER = "";
var MAIL_PASSWORD = "";
var MAIL_SERVICE = "Gmail";

function send_email(recipient, subject, message){

	// create mail transport
	var smtpTransport = nodemailer.createTransport("SMTP",{
		//service: MAIL_SERVICE,
		//from: NOTIFICATION_SOURCE_EMAIL,
		//replyTo: NOTIFICATION_SOURCE_EMAIL,
		host: "smtp-relay.gmail.com",
		secureConnection: true,
		port: 465,
		auth: {
			user: MAIL_USER,
			pass: MAIL_PASSWORD
		}
	});

	// create mail message
	var mailOptions = {
		from: NOTIFICATION_SOURCE_EMAIL,
		to: recipient,
		envelope:{
			from: "Capital City Records <localmusic@epl.ca>",
			to: recipient + ", <" + recipient + ">"
		},
		subject: subject,
		html: message
	};

	// send message & tear-down transport
	smtpTransport.sendMail(mailOptions, function(error, response){
		if(error){
			log.message(log.ERROR,error);
		}else{
			log.message(log.INFO,"notification sent: " + message);
		}

		smtpTransport.close();
	});
}

// REST interface endpoints
server.get({path:"/submissions",version:"1.0.0"}, submissions_list);
server.post({path:"/submissions", version: "1.0.0"}, create_submission);
server.put({path:"/submissions", version: "1.0.0"}, update_submission);
server.get({path:"/submissions/:slug", version: "1.0.0"}, get_submission);
//server.delete({path:"/submissions", version: "1.0.0"}, remove_submission);

server.get({path:"/jurors",version:"1.0.0"}, jurors_list);
server.post({path:"/jurors", version: "1.0.0"}, create_juror);
server.put({path:"/jurors", version: "1.0.0"}, update_juror);
//server.delete({path:"/jurors", version: "1.0.0"}, remove_juror);

server.get({path:"/reviews",version:"1.0.0"}, reviews_list);
server.post({path:"/reviews", version: "1.0.0"}, create_review);
server.put({path:"/reviews", version: "1.0.0"}, update_review);
//server.delete({path:"/reviews", version: "1.0.0"}, remove_review);

server.post({path:"/testnotification",version:"1.0.0"}, send_test_notification);
//server.post({path:"/notifications",version:"1.0.0"}, send_notification);

server.get({path:"/genres",version:"1.0.0"}, genres_list);

// static content
server.get(/\/debug\/?.*/, restify.serveStatic({
    directory:'./debug_ui'
}));

// start the REST server
var port = 5000;
server.listen(port, function(){
    console.log('%s listening at ', server.name, server.url);
});
