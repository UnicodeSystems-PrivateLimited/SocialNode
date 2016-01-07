/*
 --------------
 DATABASE STUFF
 --------------
 */
var dburl = 'localhost/wevaya';
var collections = ['users', 'tempUsers', 'sessions', 'sockets', 'publicCompletedFocuses', 'betaUsers', 'betaOverflow'];
var db = require('mongojs').connect(dburl, collections);

var _und = require('underscore');
var v = require('validator');

var bcrypt = require('bcrypt');
var crypto = require('crypto');

var fs = require('fs');

var Qs = require('qs');

var mongo = require('mongodb');
var BSON = mongo.BSONPure;

var AWS = require('aws-sdk');
var awsCredentials = new AWS.SharedIniFileCredentials({profile: 'default'});
//AWS.config.credentials = awsCredentials;
//AWS.config.region = 'Northern California';

// var lwip = require('lwip');

var http = require('http');
var https = require('https');


exports.socketHandler = function (io, socket) {

    //function getAuthTokenFromSessionCookie(seshCookie) {
    //
    //	db.sessions.findOne({
    //		_id: seshCookie
    //	}, function(err, found) {
    //		if (err || !found) {
    //			console.log("fuck it all");
    //		} else {
    //			getUser(JSON.parse(found.session).auth);
    //		}
    //	});
    //}

    function getUser(authToken) {
        db.users.findOne({
            auth: authToken
        }, function (err, found) {
            if (err || !found) {
                socket.emit('authenticated', authToken);
            } else {
                socket.emit('authenticated', 'yes authenticated, dude...');
                socket.join(found._id.toString());
                var socketHandler = require('./../modules/socketHandler');
                socketHandler(io, socket, found, db, v, _und, BSON, crypto);
            }
        });
    }

    //getAuthTokenFromSessionCookie(socket.sessionID);

    socket.on('authenticate', function (data) {
        var authToken = String(data.auth);

        if (authToken.length > 24) { // && v.isBase64(authToken)
            getUser(authToken);
        } else {
            socket.emit('authenticated', authToken);
        }
    });

};

/*
 -----------------
 Beta Sign Up Page
 -----------------
 */
exports.betaGet = function (req, res) {
    res.render('betaSignUp');
};
exports.betaPost = function (req, res) {
    var something = require('../modules/betaSignUp');
    something(req, res, fs, db, collections, dburl);
};


/*
 ------------
 Index Module
 ------------
 */
exports.index = function (req, res) {

    var userID = req.params.userID;

    if (typeof userID !== 'undefined' && v.isHexadecimal(userID) && v.isLength(userID, 23, 25)) {

        var viewProfile = require('./../modules/viewProfile');
        viewProfile(req, res, db, _und, v, BSON, userID);

    } else {
        if (req.session.state === true) {

            db.users.findOne({auth: req.session.auth}, function (err, found) {
                if (err || !found) {
                    req.session.auth = '';
                    res.render('login_signup');
                } else {
                    var safeUser = found.public;
                    safeUser.email = found.email;
                    safeUser.location = found.location;
                    safeUser.viewPublicFocuses = found.viewPublicFocuses;
                    safeUser.emailNotifications = found.emailNotifications;
                    safeUser.connectedToFacebook = found.connectedToFacebook;
                    safeUser.id = found._id.toString();
                    safeUser.hasPass = found.hasPass || false;
                    safeUser.authToken = found.auth;
                    res.render('home', {'userData': JSON.stringify(safeUser)});

                    /*
                     Generates new authentication each time the page is refreshed
                     too much processing power for now
                     */

                    //bcrypt.genSalt(1, function(err, salt) {
                    //	bcrypt.hash(found.passHash, salt, function (ewwor, hash) {
                    //		if (found.authStay) {
                    //			found.auth = hash;
                    //			req.session.auth = hash;
                    //			req.session.state = true;
                    //			found.oldAuth = found.auth;
                    //		} else {
                    //			found.auth = '';
                    //			req.session.state = false;
                    //		}
                    //
                    //		found.newsFeedPos = {
                    //			callIndex: 0,
                    //			friendIndex: 0
                    //		};
                    //
                    //		db.users.save(found, function (errSaved, savedUser) {
                    //			if (errSaved || !savedUser) {
                    //				res.render('login_signup');
                    //			} else {
                    //				var safeUser = found.public;
                    //				db.users.update({auth: req.session.auth}, {
                    //					$set: {
                    //						newsFeedPos: {
                    //							callIndex: 0,
                    //							friendIndex: 0
                    //						}
                    //					}
                    //				}, function (erry, updated) {
                    //					safeUser.authToken = found.auth;
                    //					res.render('home', {'userData': JSON.stringify(safeUser)});
                    //				});
                    //			}
                    //		});
                    //	});
                    //});


                }
            });
        } else {
            res.render('login_signup');
        }
    }
};

exports.cancelPasswordReset = function (req, res) {
    var userToken = req.params.userToken;

    db.users.findOne({
        resetPasswordToken: userToken
    }, function (error, found) {
        if (err || !found) {
            res.send({status: false, stackTrace: 'authenticating', msg: 'Could not find user'});
        } else {
            found.resetPasswordToken = '';

            var thirtyMinutes = 1000 * 60 * 30;

            found.forgotPassRequestBy = _und.sortBy(found.forgotPassRequestBy, function (item) {
                return -1 * item.timestamp;
            });

            if (found.forgotPassRequestBy[0] && found.resetPasswordRequestTime[0].timestamp > (Date.now() - thirtyMinutes)) {
                if (!_und.isEmpty(found.prevPassHash) && found.prevPassHash !== found.passHash) {
                    found.passHash = found.prevPassHash;
                }
            }

            db.users.save(found, function (err, saved) {
                if (err || !saved) {
                    res.send({status: false, stackTrace: 'saving', msg: 'Could not save user'});
                } else {
                    //res.render(); // make success confirmation page
                    res.send({status: true, stackTrace: 'saving', msg: 'Password Reset Canceled'});
                }

            });
        }

    });
};

/*
 -------------
 Verify Module
 -------------
 */
exports.verify = function (req, res) {
    var userSuperHash = req.query.u;
    var cancel = req.query.cancel;

    if (typeof userSuperHash === 'undefined' || !userSuperHash) {
        res.render('login_signup');
    } else {
        if (cancel === 'true') {
            var cancel = require('./../modules/cancelUser');
            cancel(req, res, db, mongo, BSON);
        } else {
            var verify = require('./../modules/verifyUser');
            verify(req, res, db, mongo, BSON);
        }

    }
};

/*
 ---------------
 Do Stuff Module
 ---------------
 */
exports.addedApi = function (req, res)
{
    var handle = String(req.query.handle);
    switch (handle)
    {
        case 'addStep':
            var add = require('./../modules/addStep');
            add(req, res, db);
            break;
            
        case 'delStep':
            var del=require('./../modules/delStep');
            del(req,res,db);
            break;
            
        case 'completeStep':
            var com=require('./../modules/comStep');
            com(req,res,db);
            break;
        default:
            res.send('You just tried to make a post request to an invalid url');
            console.log('Someone just tried to make a post request to an invalid url');
            break;
    }
}

exports.getBall = function (req, res) {
    res.send(req.query.handle);
    //res.render('login_signup');
};


exports.postBall = function (req, res) {

    var handle = String(req.query.handle);

    switch (handle) {
        case 'login':
            var login = require('./../modules/login');
            login(req, res, db, _und, http, https, bcrypt, Qs, BSON);
            break;
        case 'home':
            var home = require('./../modules/home');
            var newsFeedIndex = String(req.query.i);
            home(req, res, _und, db, bcrypt, BSON, newsFeedIndex);
            break;
        case 'logout':
            var logout = require('./../modules/logout');
            logout(req, res, db);
            break;
        case 'createAccount':
            var createAccount = require('./../modules/createAccount');
            createAccount(req, res, db, fs);
            break;
        case 'visionBoard':
            var visionBoard = require('./../modules/visionBoard');
            visionBoard(req, res, _und, db, fs, AWS);
            break;
        case 'removeVisionBoardImage':
            var removeVisionBoardImage = require('./../modules/removeVisionBoardImage');
            removeVisionBoardImage(req, res, _und, db, fs, AWS);
            break;
        case 'addStep':
            var addStep = require('./../modules/step');
            addStep(req, res, _und, db, crypto);
            break;
        case 'postToFeed':
            var postToFeed = require('./../modules/postToFeed');
            postToFeed(req, res, db, fs, AWS, crypto, v);
            break;
        case 'requestAddFriend':
            var requestAddFriend = require('./../modules/requestAddFriend');
            requestAddFriend(req, res, db, _und, v, BSON);
            break;
        case 'handleFriendRequest':
            var handleFriendRequest = require('./../modules/handleFriendRequest');
            handleFriendRequest(req, res, db, _und, v, BSON);
            break;
        case 'addFocus':
            var addFocus = require('./../modules/addFocus');
            addFocus(req, res, crypto, db, BSON, _und, v);
            break;
        case 'removeFocus':
            var removeFocus = require('./../modules/removeFocus');
            removeFocus(req, res, _und, v, db);
            break;
        case 'completeFocus':
            var completeFocus = require('./../modules/completeFocus');
            completeFocus(req, res, _und, v, db);
            break;
        case 'setPrimaryFocus':
            var setPrimaryFocus = require('./../modules/setPrimaryFocus');
            setPrimaryFocus(req, res, _und, v, db);
            break;
        case 'removeStep':
            var removeStep = require('./../modules/removeStep');
            removeStep(req, res, _und, v, db);
            break;
        case 'completeStep':
            console.log('step step step step step step step step step step step step');
            var completeStep = require('./../modules/completeStep');
            completeStep(req, res, _und, v, db);
            break;
        case 'profileImg':
            var profileImg = require('./../modules/changeProfileImage');
            profileImg(req, res, db, fs, AWS);
            break;
        case 'addCommentToPost':
            var addCommentToPost = require('./../modules/addCommentToPost');
            addCommentToPost(req, res, _und, db, crypto, v, BSON);
            break;
        case 'boostPost':
            var boostPost = require('./../modules/boostPost');
            boostPost(req, res, _und, db, crypto, v, BSON);
            break;
        case 'avatar':
            var avatar = require('./../modules/avatar');
            avatar(req, res, _und, db, v, BSON);
            break;
        case 'search':
            var search = require('./../modules/searchPeople');
            search(req, res, _und, db, v, BSON);
            break;
        case 'forgotPassword':
            var forgotPassword = require('./../modules/forgotPassword');
            forgotPassword(req, res, _und, v, fs, crypto, bcrypt, db);
            break;
        case 'resetPassword':
            var resetPassword = require('./../modules/resetPassword');
            resetPassword(req, res, _und, v, crypto, bcrypt, db);
            break;
        case 'changeSettings':
            var changeSettings = require('./../modules/changeSettings');
            changeSettings(req, res, _und, v, crypto, bcrypt, db, BSON);
            break;
        default:
            res.send('You just tried to make a post request to an invalid url');
            console.log('Someone just tried to make a post request to an invalid url');
            break;
    }
};