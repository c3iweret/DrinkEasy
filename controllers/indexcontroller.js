var User = require('../models/user');
var Menu = require('../models/menu');
var bcrypt = require('bcrypt');

//use for pages that require login
var requirelogin = function requirelogin(req, res, next){
    if(!req.user){
      res.render('index', {
        error: 'Please log in'
   });
    }
    else{
      next();
    }
};


module.exports = function(app){

//middleware function for sessions
app.use(function(req, res, next){
    if(req.session && req.session.user){
      User.findOne({email: req.session.user.email}, function(err, user){
        if(user){
          req.user = user;
          delete req.user.password;
          req.session.user = user;
          res.locals.user = user;
        }
        next();
      });
    }
    else{
      next();
    }
});


app.get('/', function(req, res) {

  res.render('index', {
    title: 'DrinkEasy'
        });
});

app.post('/signup', function(req, res){
    var hash = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10));
    var user = new User({
        nameOfBar: req.body.nameOfBar,
        email: req.body.email,
        password: hash,
        address: req.body.address
   });
    console.log("user for signup " + user);
    user.save(function(err, theuser){
      if(err){
        var error = 'Oops something bad happened! Try again';
        res.render('index', {error: error});
        console.log(err);
      }
        else{
            var success = 'Sign up successful! Please log in';
            res.render('index', {error: success});
            console.log(theuser);
        }
    });
});

app.post('/login', function(req, res){
    User.findOne({email: req.body.email}, function(err, user){
      if (!user){
         res.render('index', {error: 'Invalid username or password'});
         console.log("user for login is " + user);
      }
      else{
        if(bcrypt.compareSync(req.body.password, user.password)){
          req.session.user = user;
          Menu.findOne({email: req.session.user.email}, function(err, menu){
            if (!menu){
              res.render('uploadMenu',
              {email: user.email,
                 barname: user.nameOfBar,
                  password: req.body.password,
                   address:user.address,
                 alreadySetUp: false});
               }else{
                 res.render('menu',
                 {email: user.email,
                    barname: user.nameOfBar,
                     password: req.body.password,
                      address:user.address,
                    alreadySetUp: true,
                  menu: menu});
               }
             })
              console.log("user successfully logged in" + user.email);
        }else{
          res.render('index', {error: 'Invalid username or password'});
        }
      }
      });
});


app.get('/login', requirelogin, function(req, res){
  Menu.findOne({email: req.session.user.email}, function(err, menu){
    console.log(req.session.user.email);
    console.log(menu);
    if (!menu){
      res.render('uploadMenu',
      {email: req.user.email,
         barname: req.user.nameOfBar,
          password: req.user.password,
           address:req.user.address,
         alreadySetUp: false});
       }else{
         res.render('menu',
         {email: req.user.email,
            barname: req.user.nameOfBar,
             password: req.user.password,
              address:req.user.address,
            alreadySetUp: true});
       }
     });
})



app.get('/account', function(req, res){
    Menu.findOne({email: req.session.user.email}, function(err, menu){
      if (!menu){
         res.render('account', {alreadySetUp: false});
      }
      else{
        res.render('account', {alreadySetUp: true});
      }
    })


});

app.get('/menu', function(req, res){
  Menu.findOne({email: req.session.user.email}, function(err, menu){
      if (!menu){
         res.render('uploadMenu', {alreadySetUp: false, menu: menu});
      }

      else{
        res.render('menu', {alreadySetUp: true, menu: menu});
      }
    })

});


app.get('/uploadMenu', function(req, res){
  Menu.findOne({email: req.session.user.email}, function(err, menu){
      if (!menu){
         res.render('uploadMenu', {alreadySetUp: false});
      }

      else{
        res.render('uploadMenu', {alreadySetUp: true});
      }
    })

});

app.delete('/', requirelogin, (req, res, next) => {
  User.findOneAndRemove({email: req.user.email}, (err) => {
    if (err) {
      var error = "Oops! Something went wrong!";
      res.render('uploadMenu', {error: error});
    }

      var success = "Successfully deleted";
      req.logout();
      res.render('index', {error: success});
  });
});

app.post('/', requirelogin, function(req, res){
    User.remove({email: req.session.user.email}), function(err) {
    if (!err) {
        var success = "Successfully deleted"
        res.render('index', {error: success});
    }
    else {
        var error = "Oops! Something went wrong!";
        res.render('uploadMenu', {error: error});
    }
    };
});
var file = require('./fileController.js');
//app.post('/uploadMenuForm',file.uploadMenuForm);

app.post('/parseMenu',file.parseMenu,function(req, res){
  Menu.findOne({email: req.session.user.email}, function(err, menu){
      if (!menu){
         res.render('uploadMenu', {alreadySetUp: false, menu:menu});
      }

      else{
        res.render('uploadMenu', {alreadySetUp: true, menu:menu});
      }
    })

});

app.post('/editUser',function(req,res){
  console.log('editUser');
  console.log(req.body);
  // Find the user
        User.findOne({
            email: req.session.user.email
        }, function(err, foundUser) {
            if (err) throw err;
            console.log(foundUser);

            if (foundUser != undefined) {

                // Remove the user
                User.remove({
                    email: req.session.user.email
                }, function(err) {

                    var userData = req.body;
                    console.log(req.body);
                    userData['email'] = req.session.user.email;

                    if (req.body.password == null ||
                    req.body.password == '' ) {
                        userData['password'] = foundUser.password;
                    }

                    // Create a new user with the updated information
                    var newUser = new User(userData);

                    newUser.save(function(err) {
                        if (err) throw err;

                        res.send('Success');
                    });
                });

            } else {
                // Return error if user not found
                res.status(500).send('The user you are trying to edit does not exist');
            }
        });
});

app.get('/getOneUser',function(req,res){
  console.log('getOneUser');

    // Get the username from current session
    User.findOne({
        email: req.session.user.email
    }, function(err, foundUser) {
        if (err) throw err;

        // If user is found, send it back
        if (foundUser != undefined) {
        	console.log(foundUser);
            res.send(foundUser);

        } else {
            // Return error if user not found
            res.status(500).send('The user you are trying to edit does not exist');
        }
    });
});



app.get('/logout', function(req, res){
    req.session.reset();
    res.redirect('/');
  });

};
