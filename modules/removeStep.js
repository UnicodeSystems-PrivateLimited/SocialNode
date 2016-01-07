/*
 -------------
 Remove a Step
 -------------
 */

module.exports = function(req, res, _und, v, db) {

  var postData = _und.pick(req.body, 'focusID', 'stepID');


  function authorizeUserAndUpdateStep(postData) {
    db.users.findOne({
      auth: req.session.auth
    }, function(err, found) {
      if (err || !found) {
        res.send({status: false, stackTrace: 'removing step', msg: 'input was invalid'});
      } else {
        var focusLength = found.focuses.length;
        var focusFlag = false;

        found.focuses.forEach(function(e, i) {

          if (found.focuses[i].id === postData.focusID) {
            focusFlag = true;
            var stepLength = found.focuses[i].steps.length;
            var stepFlag = false;

            found.focuses[i].steps.forEach(function(e, n) {
              if (found.focuses[i].steps[n].id === postData.stepID) {
                found.focuses[i].steps.splice(n, 1);
                removeStepBySavingOverUserObj(found);
              } else if (n === (stepLength-1)) {
                if (!stepFlag) {
                  res.send({status: false, stackTrace: 'finding step', msg: 'Step ID was invalid.'});
                }
              }
            });
          } else if (i === (focusLength-1)) {
            if (!focusFlag) {
              res.send({status: false, stackTrace: 'finding step', msg: 'Focus ID was invalid.'});
            }
          }
        });
      }
    });
  }

  function removeStepBySavingOverUserObj(userObj) {
    db.users.save(userObj, function(notSaved, saved) {
      if (notSaved || !saved) {
        res.send({status: false, stackTrace: 'removing step', msg: 'Step was not removed.'});
      } else {
        res.send({status: true, stackTrace: 'removing step', msg: 'Step was removed successfully.'});
      }
    });
  }

  authorizeUserAndUpdateStep(postData);

};