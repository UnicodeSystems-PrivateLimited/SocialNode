/*
 ----------------
 Complete a Focus
 ----------------
 */

module.exports = function(req, res, _und, v, db) {

  var postData = _und.pick(req.body, 'focusID', 'completeState');

  function findUserData() {
    db.users.findOne({
      auth: req.session.auth
    }, function(err, found) {
      if (err || !found) {
        res.send({status: false, stackTrace: 'authenticating user', msg: 'user data was not found'});
      } else {
        updateFocus(found);
      }
    });
  }

  function updateFocus(found) {
    var focusLength = found.focuses.length;

    if (focusLength <= 0) {
      res.send({status: false, stackTrace: 'finding focus', msg: 'Focus does not exist.'});
    } else {
      var completedFocus = {};
      found.focuses.forEach(function(e, i) {
        if (found.focuses[i].id === postData.focusID) {
          found.focuses[i].completed = postData.completeState;

          if (postData.completeState) {
            found.focuses[i].completedOn = Date.now();
          } else {
            found.focuses[i].completedOn = '';

            db.publicCompletedFocuses.remove({id : postData.focusID});
          }

          completedFocus = found.focuses[i];

          saveUserObject(found, completedFocus);
        } else if (i === (focusLength-1)) {
          saveUserObject(found, completedFocus);
        }
      });
    }
  }

  function saveUserObject(userObj, completedFocus) {
    console.log(completedFocus);

    db.users.save(userObj, function(err, saved) {
      if(err || !saved) {
        res.send({status: false, stackTrace: 'saving focus', msg: 'User data was not saved.'});
      } else {
        res.send({status: true, stackTrace: 'saving focus', msg: JSON.stringify(completedFocus)});
      }
    });

  }

  findUserData();

};