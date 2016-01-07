/*
 -----------
 Add a Focus
 -----------
 */

module.exports = function(req, res, crypto, db, BSON, _und, v) {

  var postData = req.body;

  var focus = {
    id: '',
    tags: postData.tags,
    title: postData.title,
    privacy: postData.privacy,
    timestamp: postData.timestamp,
    bucket: postData.bucket,
    completed: false,
    selected: false,
    primary: false,
    steps: [],
    visionBoard: [],
    calendar: [],
    comments: [],
    boosts: [],
    updates: [],
    created: Date.now(),
    lastModified: Date.now()
  };

  console.log(postData.bucket);

  crypto.randomBytes(48, function(ex, buf) {
    if (ex) {
      res.send({status: false, stackTrace: 'generate token', msg: 'failed to generate unique token'});
    } else {
      focus.id = buf.toString('hex');
      addFocusToUserObject();
    }
  });

  function addFocusToUserObject() {
    db.users.findAndModify({
      query: {
        auth: req.session.auth
      },
      update: {
        $addToSet: {
            focuses: focus
        },
        $pull : {
          tutorial: 0
        }
      }
    }, function(err, updated) {
      if (err || !updated) {
        res.send({status: false, stackTrace: 'creating focus', msg: 'Focus was not saved'});
      } else {
        var addTags = require('./../modules/addTagsToUser');
        addTags(updated._id.toString(), postData.tags, db, BSON, _und, v);
        res.send({status: true, stackTrace: 'creating focus', msg: JSON.stringify(focus)});
      }
    });
  }

};
