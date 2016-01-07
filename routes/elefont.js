/*
----------------
ENCRYPTION STUFF
----------------
*/
var crypto = require("crypto");

var APP_SECRET = '8c0eb274-36e8-40a0-b669-73afcbd330e8';

function verifyInstance(instance, secret) {
	var pat = new RegExp("^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{4}|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)$");
	var res = pat.test(instance);

    // spilt the instance into signature and data
    var pair = instance.split('.');
    var signature = decode(pair[0], 'binary');
    var data = pair[1];
    // sign the data using hmac-sha1-256
    var hmac = crypto.createHmac('sha256', secret);
    var newSignature = hmac.update(data).digest('binary');

    return JSON.parse(decode(data));
    //return (signature === newSignature);
}
function decode(data, encoding) {
	encoding = encoding === undefined ? 'utf8' : encoding;
	var buf = new Buffer(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
	return encoding ? buf.toString(encoding) : buf;
}


/*
--------------
DATABASE STUFF
--------------
*/
var dburl = 'localhost/elefont';
var collections = ['instances', 'backupInstances'];
var db = require('mongojs').connect(dburl, collections);
//backup ALL user info every 24 hours
setInterval(function() {
	// get ALL entries from the instances collection
	var items = db.instances.find();

	// iterate through the entries and copy them to the backup
	items.forEach(function(err, item) {
		if (err || !item) {
			console.log(err);
		} else {
			console.log(item);
			db.backupInstances.save(item, function(err, sucSaved) {
				if (err || !sucSaved) {
					console.log(err);
				} else {
					console.log(sucSaved);
				}
			});
		}
	});
}, 24*60*60*1000); // hours * minutes * seconds * milliseconds


/*
------------
MODULE STUFF
------------
*/

/*
	let's create a 'user' object with some OWN properties
	we'll create an instance of user any time we want to
	search mongoDB or write to mongoDB
*/
function user(settings) {
	this.userID = settings.userID;
	this.instanceID = settings.instanceID;
	this.compID = settings.compID;
	this.signdate = settings.signdate;
}

/*
-------------
WIDGET MODULE
-------------
*/
exports.widget = function(req, res) {

	var instance = req.query['instance'] || req.query['amp;instance'],
			compId = req.query['compId'],
			instanceData = verifyInstance(instance, APP_SECRET);

	var jsonObj = {
		instanceID: instanceData.instanceId,
		compID: compId
	};
	db.instances.findOne(jsonObj, function(err, found) {

		if (err || !found) { // we didn't find anything, give 'em the default stuff

			var data = {
				userID: instanceData.uid,
				instanceID: instanceData.instanceId,
				signdate: instanceData.signDate
			};

			res.render('elefont_widget', data);
		} else { // we found it! give 'em the real deal

			var data = {
				userID: found.userID,
				instanceID: found.instanceID,
				signdate: found.signdate
			};

			Object.keys(found).forEach(function(key) {
				var val = found[key];
				data[key] = val;
			});

			res.render('elefont_widget', data);
		}
	});
}; // end widget module




/*
---------------
SETTINGS MODULE
---------------
*/
exports.settings = function(req, res) {

	/*
		The instance parameter from the query
		string is an encrypted string that we
		want to turn back into an object
	*/
	var instance = req.query['instance'],
			compId = req.query['origCompId'],
			instanceData = verifyInstance(instance, APP_SECRET);

	/*
		look for an entry that matches in the
		database, if not, just use default settings
	*/
	db.instances.findOne({userID: instanceData.uid, instanceID: instanceData.instanceId, compID: compId}, function(err, found) {

		if (err || !found) { // we didn't find anything, give 'em the default stuff

			var data = {
				userID: instanceData.uid,
				instanceID: instanceData.instanceId,
				signdate: instanceData.signDate
			};

			res.render('elefont_settings', data);
		} else {

			var data = {
				userID: found.userID,
				instanceID: found.instanceID,
				signdate: found.signdate
			};

			Object.keys(found).forEach(function(key) {
				var val = found[key];
				data[key] = val;
			});

			res.render('elefont_settings', data);
		}
	});
}; // end settings module




/*
-------------
UPDATE MODULE
-------------
*/
exports.update = function(req, res) {

	/*
		The instance parameter from the query
		string is an encrypted string that we
		want to turn back into an object
	*/
	var instance = req.query['instance'],
			compId = req.query['compId'],
			instanceData = verifyInstance(instance, APP_SECRET);

	// let's use some default settings to fill a new instance of the user object
	var options = {
		userID: instanceData.uid,
		instanceID: instanceData.instanceId,
		compID: compId,
		signdate: instanceData.signDate
	};

	/*
		this boolean is going to be sent at the end
		of the module. we'll update it's value
		depending on whether certain things do or 
		don't happen along the way
	*/
	var keepOnKeepingOn = true;

	/*
		we're going to loop through the query string's
		parameters and write all the values from the
		query string to the options object.
	*/
	Object.keys(req.query).forEach(function(key) {
		var val = req.query[key];
		if (val != instance) {
			options[key] = val;

			/*
			if (key in options) {
			    options[key] = val;
			} else {
				console.log("you tried to create an object key and value pair that is not permitted");
			}

				This check would prevent parameters from being created on the fly.
				We check to see if the options object contains the key from the
				query parameter. If it does, we write the value from the parameter
				to the key of the options object. If not, we just log to the console.

				We decided against using this check for now. In order for someone to
				maliciously add or overwrite parameters, they would first need the
				users userID + the apps instanceID + our app secret. then they'd need
				to encrypt those together in the correct order with an hmac-sha1 256
				bit encryption and base64 encoding. Since that is damn near impossible
				and there isn't really any information worth all that trouble, it seems
				that we benefit more in development by being able to create object keys
				and values on the fly.
			*/
		}
	});

	// create the user object instance from options object
	var user1 = new user(options);

	/*
		If there were duplicate entries in the
		database, it wouldn't affect the user
		because the findOne() method only returns
		one entry anyway, and that's what we use
		in the settings and widget modules.

		But just to save space, and therefore money...
		let's make sure there are no duplicate entries.
	*/
	db.instances.ensureIndex({ instanceId: "text" }, { unique: true }, function(err, suc) {
		if (err || !suc) {
			console.log(err);
		} else {
			console.log(suc);
		}
	});


	/*
		Let's look for the entry that matches the userID and instanceID.
		If it's not found then we'll create it. Otherwise, just update it.
		Set 'keepOnKeepingOn' to true if everything worked and false if it didn't.
		Send the user back a response with the 'keepOnKeepingOn' boolean.
	*/
	db.instances.findAndModify({
	    query: {
	    	userID: instanceData.uid,
			  instanceID: instanceData.instanceId,
			  compID: compId
	    },
	    update: options,
	    new: true,
	    upsert: true
	}, function(err, foundMod) {
		if (!foundMod && !err) {
			db.instances.save(user1, function(err, savedUser) {
				if (err || !savedUser) {
					console.log(err);
					keepOnKeepingOn = false;
				} else {
					console.log(savedUser);
					keepOnKeepingOn = true;
				}
			});
		} else if (err) {
			keepOnKeepingOn = false;
		} else {
			keepOnKeepingOn = true;
		}

		res.send(keepOnKeepingOn);
	});
}; // end update module








/*
-------------
REMOVE MODULE
-------------
*/
exports.remove = function(req, res) {

	/*
		The instance parameter from the query
		string is an encrypted string that we
		want to turn back into an object
	*/
	var instance = req.query['instance'];

	var compId = req.query['compId'];

	var userId = req.query['userId'];

	/*
		we're calling the decryption functions from
		earlier to get the userID and the instanceID
	*/
	var instanceData = verifyInstance(instance, APP_SECRET);

	// let's use some default settings to fill a new instance of the user object
	var options = {
		userID: userId,
		instanceID: instanceData.instanceId,
		compID: compId
	};

	db.instances.remove(options, function(err, removed) {
		if (err) {
			res.send(err);
		} else {
			res.send(true);
		}
	});
}; // end remove module










