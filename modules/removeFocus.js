/*
 --------------
 Remove a Focus
 --------------
 */

module.exports = function(req, res, _und, v, db) {

  var postData = _und.pick(req.body, 'focusID');

  function removeFocus(focusID) {
    db.users.update({
      auth: req.session.auth
    }, {
      $pull: {
        focuses: focusID
      }
    }, function(err, removed) {
      if (err || !removed) {
        res.send({status: false, stackTrace: 'removing focus', msg: 'Focus id was invalid'});
      } else {
        res.send({status: true, stackTrace: 'removing focus', msg: 'Focus was removed'});
      }
    });
  }

  removeFocus({id : postData.focusID});

};