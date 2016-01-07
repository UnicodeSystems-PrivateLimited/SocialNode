/*
 ---------
 Add Steps
 ---------
 */

module.exports = function(req, res, _und, db, crypto) {

  var postData = _und.pick(req.body, 'focusID', 'desc', 'privacy', 'timestamp');

  db.users.findOne({
    auth : req.session.auth
  }, function(err, foundUser) {
    if (err || !foundUser) {
      console.log(err);
      res.send({status: false, stackTrace: 'authorization', msg: 'couldn\'t find user data'});
    } else {

      crypto.randomBytes(48, function(ex, buf) {
        if (ex) {
          res.send({status: false, stackTrace: 'generate token', msg: 'failed to generate unique token'});
        } else {
          var focusesLength = foundUser.focuses.length;
          var updatedFocus = _und.findWhere(foundUser.focuses, { id : postData.focusID });

          var step = {
            id : buf.toString('hex'),
            desc : postData.desc,
            privacy : postData.privacy,
            timestamp : postData.timestamp,
            completed : false
          };

          if (updatedFocus && updatedFocus.steps) {
            updatedFocus.steps.push(step);
            saveUpdatedFocus(focusesLength, updatedFocus, foundUser, step);
          } else {
            res.send({status: false, stackTrace: 'updating', msg: 'couldn\'t find focus'});
          }
        }
      });

    }
  });

  function saveUpdatedFocus(focusesLength, updatedFocus, foundUser, step) {
    if (focusesLength > 0) {
      for (var i=0; i < focusesLength; i++) {
        if (updatedFocus.id === foundUser.focuses[i].id) {
          foundUser.focuses[i] = updatedFocus;
        }

        if (i === (focusesLength - 1)) {
          db.users.save(foundUser, function(notSaved, saved) {
            if (notSaved || !saved) {
              console.log('error saving');
              res.send({status: false, stackTrace: 'updating user object', msg: 'could not save image'});
            } else {
              console.log('saved successfully!');
              res.send({status: true, stackTrace: 'updating user object', msg: JSON.stringify(step)});
            }
          });
        }
      }
    } else {
      res.send({status: false, stackTrace: 'updating focus with step', msg: 'no focuses were found'});
    }
  }

};