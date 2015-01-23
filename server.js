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
var XMLHttpRequest = require("xhr2");	// todo: this cheats to make the client-designed jsfs library work
var jsfs = require("./jsos_jsfs.js");

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
        console.log(req.method.toLowerCase);
        return res.send(new restify.MethodNotAllowedError());
    }
}
server.on('MethodNotAllowed', unknownMethodHandler);

// service endpoint handlers
function submissions_list(req, res, next){
	log.message(log.INFO, "got submissions_list");
	
	// todo: return submission index
	
	return next;
}

function create_submission(req, res, next){
	log.message(log.INFO, "got create_submission");
	
	// todo: store submission in JSFS
	
	// todo: update submission index
	
	// todo: return submission access_token
	
	return next;
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

// REST interface endpoints
server.get({path:"/submissions",version:"1.0.0"}, submissions_list);
server.post({path:"/submissions", version: "1.0.0"}, create_submission);
server.put({path:"/submissions", version: "1.0.0"}, update_submission);
//server.delete({path:"/submissions", version: "1.0.0"}, remove_submission);

server.get({path:"/jurors",version:"1.0.0"}, jurors_list);
server.post({path:"/jurors", version: "1.0.0"}, create_juror);
server.put({path:"/jurors", version: "1.0.0"}, update_juror);
//server.delete({path:"/jurors", version: "1.0.0"}, remove_juror);

server.get({path:"/reviews",version:"1.0.0"}, reviews_list);
server.post({path:"/reviews", version: "1.0.0"}, create_review);
server.put({path:"/reviews", version: "1.0.0"}, update_review);
//server.delete({path:"/reviews", version: "1.0.0"}, remove_review);

// static content
server.get(/\/debug\/?.*/, restify.serveStatic({
    directory:'./debug_ui'
}));

// start the REST server
var port = 5000;
server.listen(port, function(){
    console.log('%s listening at ', server.name, server.url);
});