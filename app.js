'use strict';

const low = require('lowdb')
const db = low('db.json')
var bodyParser = require('body-parser');
var multer = require('multer'); // v1.0.5
var express = require('express')
var app = express()
var shortid = require('shortid');

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.post('/reset/users', function (req, res) {
  db.set('users', []).write()
  res.send('Reset Users Done!')
})

app.post('/reset/surveys', function (req, res) {
  db.set('surveys', []).write()
  res.send('Reset Surveys Done!')
})


// Users
app.post('/user/create', function (req, res) {
  console.log('/user/create',req.body);
  db.get('users')
  .push({
    id: req.body.id,
    tags: req.body.tags,
    profile_image: req.body.profile_image,
    votes: [],
    surveys: [],
  })
  .write();

  res.send('Create User Done!');
})

app.get('/user', function (req, res) {
  console.log('/user',req.query);
  let data = db.get('users')
  .find({id: req.query.id})
  .value();

  res.json(data);
})

app.post('/user/update', function (req, res) {
  console.log('/user/update',req.body);
  db.get('users')
  .find({id: req.body.id})
  .assign({
    tags: req.body.tags,
    profile_image: req.body.profile_image,
  })
  .write()

  res.send('Update User Done!');
})


// Surveys
app.post('/survey/create', function (req, res) {
  console.log('/survey/create',req.body);
  db.get('surveys')
  .push({
    id: req.body.id,
    question: req.body.question,
    body: req.body.body,
    tags: req.body.tags,
    option_left: req.body.option_left,
    option_right: req.body.option_right,
    my_vote: req.body.my_vote,
    count_left: req.body.count_left,
    count_right: req.body.count_right,
    image: req.body.image,
    created: Date.now(),
    modified: null,
  })
  .write();

  res.send('Create Survey Done!');
})

app.get('/survey', function (req, res) {
  console.log('/survey',req.query);
  let data = db.get('surveys')
  .filter({id: req.query.id})
  .take(1)
  .value();

  res.json(data);
})

app.get('/surveys', function (req, res) {
  console.log('/surveys',req.query);
  let data = db.get('surveys')
  .sortBy('created')
  .take(30)
  .value();

  data.reverse();
  res.json(data);
})


app.post('/survey/vote', function (req, res) {
  console.log('/survey/vote',req.body);
  let survey = db.get('surveys')
  .find({id: req.body.survey_id})
  .value();

  let user = db.get('users')
  .find({id: req.body.user_id})
  .value();

  console.log('survey', survey);
  console.log('user', user);

  if (req.body.vote == 'left'){
    db.get('surveys')
      .find({id: req.body.survey_id})
      .assign({
        count_left: survey.count_left + 1,
        modified: Date.now(),
      })
      .write()

    user.votes.push({survey_id: req.body.survey_id, vote: req.body.vote})

    db.get('users')
      .find({id: req.body.user_id})
      .assign({
        votes: user.votes,
      })
      .write()

    res.send('Update Right Vote Done!');
  } else if (req.body.vote == 'right') {
    db.get('surveys')
      .find({id: req.body.survey_id})
      .assign({
        count_right: survey.count_right + 1,
        modified: Date.now(),
      })
      .write()

    db.get('users')
      .find({id: req.body.user_id})
      .assign({
        votes: user.votes.push({survey_id: req.body.survey_id, vote: req.body.vote}),
      })
      .write()

    res.send('Update Left Vote Done!');
  } else {
    res.send('Invalid Vote');
  }

})


// Images
app.get('/image/:image_id', function (req, res, next) {
  console.log('/image',req.params);
  var options = {
    root: __dirname + '/images/',
    dotfiles: 'deny',
    headers: {
        'x-timestamp': Date.now(),
        'x-sent': true
    }
  };

  var fileName = req.params.image_id;
  res.sendFile(fileName, options, function (err) {
    if (err) {
      next(err);
    } else {
      console.log('Sent:', fileName);
    }
  });
})


var profileImageStorage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, './images');
  },
  filename: function (req, file, callback) {
    //console.log('file', file);
    callback(null, file.fieldname + '_' + file.originalname);
  }
});

var surveyImageStorage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, './images');
  },
  filename: function (req, file, callback) {
    //console.log('file', file);
    callback(null, file.fieldname + '_' + shortid.generate() + '.' + file.originalname.split('.').slice(-1)[0]);
  }
});

var profileImageUpload = multer({ storage : profileImageStorage }).single('profile');
var surveyImageUpload = multer({ storage : surveyImageStorage }).single('survey');

app.post('/image/profile/upload',function(req, res){
  profileImageUpload(req, res, function(err) {
    if(err) {
      console.log(err);
      return res.end("Error uploading file.");
    }
    console.log('In API /image/profile/upload, req.file: ', req.file);
    res.end(req.file.filename);
  });
});


app.post('/image/survey/upload',function(req, res){
  surveyImageUpload(req, res, function(err) {
    if(err) {
      console.log(err);
      return res.end("Error uploading file.");
    }
    console.log('In API /image/survey/upload, req.file: ', req.file);
    res.end(req.file.filename);
  });
});



app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})