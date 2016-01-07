module.exports = function(req, res, _und, db, v, BSON) {

  var postData = _und.pick(req.body, 'query', 'browseChunk');
  var gStr = '';

  postData.browseChunk = parseInt(postData.browseChunk) || 0;

  function getPosition(str, m, i) {
    str = str || '';
    return str.split(m, i).join(m).length;
  }

  function toTitleCase(str) {
    str = str || '';
    return str.replace(/[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð]\S*/gm, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
  }

  function checkStr(str) {
    if (v.isAscii(str)) {
      if (v.isLength(str, 1, 255)) {
        str = str.replace(/(\r|\n){3}/g, '');
        str = '^'+v.trim(v.escape(v.toString(str)));
        gStr = str;
        var strArray = str.split(" ");
        var tagArray = strArray.concat();
        tagArray.forEach(function(e, i) {
          tagArray[i] = tagArray[i][0]+'#'+tagArray[i].substring(1,tagArray[i].length);
        });
        var strayReggie = new RegExp(strArray.join("|^"), "gi");
        var tagReggie = new RegExp(tagArray.join("|^"), "gi");

        if (/browse_users/i.test(str)) {
          findMe(strayReggie, tagReggie, true);
        } else {
          findMe(strayReggie, tagReggie, false);
        }
      } else {
        res.send({status: false, stackTrace: 'validating query', msg: 'query string was invalid'});
      }
    } else {
      res.send({status: false, stackTrace: 'validating query', msg: 'query string was invalid'});
    }
  }

  function findMe(strayReggie, tagReggie, browse) {
    browse = browse || false;

    db.users.findOne({
      auth: req.session.auth
    }, function(err, me) {
      if (err || !me) {
        res.send({status: false, stackTrace: 'authorizing', msg: 'authorization failed'});
      } else {
        findUsers(strayReggie, tagReggie, me, browse);
      }
    });
  }

  function findUsers(strayReggie, tagReggie, me, browse) {
    browse = browse || false;
    browseChunk = postData.browseChunk;

    if (browse) {
      db.users.find({}).sort({ "public.wings": -1 }).skip(browseChunk*20).limit(20, function(err, results) {
        var resLength = results.length;
        if (resLength <= 0) {
          res.send({status: false, stackTrace: 'fetching user data', msg: JSON.stringify([])});
        } else {
          buildUsers(results, me);
        }
      });
    } else {
      db.users.find({
        $or : [
          { "public.name": strayReggie },
          { "public.fname": strayReggie },
          { "public.lname": strayReggie },
          { "location": strayReggie },
          { "tags.title": strayReggie },
          { "tags.title": tagReggie }
        ]
      }, function(err, results) {
        var resLength = results.length;
        if (resLength <= 0) {
          res.send({status: false, stackTrace: 'fetching user data', msg: JSON.stringify([])});
        } else {
          buildUsers(results, me);
        }
      });
    }
  }

  function buildUsers(results, me) {
    var people = [];
    var resLength = results.length;

    for (var i=0; i<resLength; i++) {
      if (results[i]._id.toString() === me._id.toString()) {
        //console.log('that\'s me');
      } else {

        var friendLevel = 0;
        var modMe = {
          id: me._id.toString(),
          name: me.public.name
        };

        if (typeof _und.findWhere(results[i].friendRequests, modMe) !== 'undefined') {
          friendLevel = 2;
        } else if (typeof _und.findWhere(results[i].friends, modMe) !== 'undefined') {
          friendLevel = 1;
        } else {
          friendLevel = 0;
        }

        var loc = results[i].location || '';
        var zipIndex = getPosition(loc, '+', 2);
        if (zipIndex !== -1) {
          loc = toTitleCase(loc.substring(0, zipIndex).replace(/\+/, ', ').replace(/\+/g, ' '));
        }

        people.push({
          name: results[i].public.name,
          id: results[i]._id.toString(),
          profileImg: results[i].public.profileImgUrl,
          location: loc,
          wings: results[i].public.wings,
          tags: results[i].tags,
          friends: friendLevel
        });
      }

      if (i === (resLength - 1)) {
        people = people.sort(function (a, b) {
          if (a.name < b.name) return 1;
          if (b.name < a.name) return -1;
          return 0;
        });

        res.send({status: true, stackTrace: 'fetching user data', msg: JSON.stringify(people)});
      }
    }
  }

  checkStr(postData.query);

};