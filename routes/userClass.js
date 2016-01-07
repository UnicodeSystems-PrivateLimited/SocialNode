var User = function(userData) {
	/*
	------------------------------------------------------------------------------------
	Private Data
	------------------------------------------------------------------------------------
	*/
	var privateData = {
		
	};
	// end private data

	/*
	------------------------------------------------------------------------------------
	Public Data
	------------------------------------------------------------------------------------
	*/
	this.publicData = {
		name: "",
		profileImage: ""
	};
	// end public data

	/*
	------------------------------------------------------------------------------------
	Private Methods
	------------------------------------------------------------------------------------
	*/
	var verifySelf = function(encryptedString, secret) {
		// make sure that the person attempting to access the data really is the user
		// decrypt string with secret
	};
	// end private methods

	/*
	------------------------------------------------------------------------------------
	Public Methods
	------------------------------------------------------------------------------------
	*/

	/*
	--------------
	Account Module
	--------------
	*/
	this.account = function() {

		var methods = {
			create: function(encryptedString) {
				// make sure no one else has email
				// send email to address with special link to verify account
				// create database entry in unverifiedUsers collection
			},
			finalizeCreate: function(encryptedString) {
				// copy user from unverifiedUsers collection to verifiedUsers collection
			},
			login: function(encryptedString) {
				// verifySelf(), and set session
			},
			signOut: function(encryptedString) {
				// verifySelf(), and unset session
			},
			getHomeData: function(encryptedString) {
				// verifySelf(), and get all data for initial user home view
			}
		};

		return methods;
	};

	/*
	-----------
	Arch Module
	-----------
	*/
	this.arch = function(encryptedString) {

		var methods = {
			add: function(encryptedString) {
				// verifySelf(), and add a new arch
			},
			edit: function(encryptedString) {
				// verifySelf(), and edit an existing arch
			},
			remove: function(encryptedString) {
				// verifySelf(), and remove an existing arch
			}
		};

		return methods;
	};


	/*
	------------
	Focus Module
	------------
	*/
	this.focus = function(encryptedString) {

		var methods = {
			add: function(encryptedString) {
				// verifySelf(), and add a new focus
			},
			edit: function(encryptedString) {
				// verifySelf(), and edit an existing focus
			},
			remove: function(encryptedString) {
				// verifySelf(), and remove an existing focus
			}
		};

		return methods;
	};


	/*
	------------
	Steps Module
	------------
	*/
	this.step = function(encryptedString) {
		
		var methods = {
			add: function(encryptedString) {
				// verifySelf(), and add a new step
			},
			edit: function(encryptedString) {
				// verifySelf(), and edit an existing step
			},
			remove: function(encryptedString) {
				// verifySelf(), and remove an existing step
			}
		};

		return this;
	};


	/*
	-------------------
	Vision Board Module
	-------------------
	*/
	this.visionBoard = function() {

		var methods = {
			addPin: function(encryptedString) {
				// verifySelf(), and add a pin to the vision board on a focus
			},
			removePin: function(encryptedString) {
				// verifySelf(), and remove an existing pin from the vision board on a focus
			}
		};

		return methods;
	};

	/*
	---------------
	Calendar Module
	---------------
	*/
	this.calendar = function() {
		var methods = {
			addEvent: function(encryptedString) {
				// verifySelf(), and add a new event on the calendar of a focus
			},
			editEvent: function(encryptedString) {
				// verifySelf(), and edit an existing event on the calendar of a focus
			},
			removeEvent: function(encryptedString) {
				// verifySelf(), and remove an existing event on the calendar of a focus
			}
		};

		return methods;
	};


	/*
	---------------
	Question Module
	---------------
	*/
	this.question = function() {

		var methods = {
			ask: function(encryptedString) {
				// verifySelf(), and add new question to a focus
			};
			edit: function(encryptedString) {
				// verifySelf(), and add new question to a focus
			};
			remove: function(encryptedString) {
				// verifySelf(), and add new question to a focus
			};
		};

		return methods;
	};

	/*
	-------------
	Friend Module
	-------------
	*/
	this.friend = function() {
		var methods = {
			add: function() {
				
			},
			remove: function() {
				
			},
			block: function() {
				
			},
			report: function() {
				
			},
			message: function() {
				
			},
			help: function() {
				
			},
			viewProfile: function() {

			},
			comment: function() {
				
			},
			share: function() {
				
			},
			like: function() {
				
			},
			unlike: function() {
				
			}
		};

		
		return methods;
	};
  
	// end public methods
  
  return this;
};


//user().friend().add();