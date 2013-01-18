#Africa Football - backend

##What's that

Minimalist backend, to serve data for a Joshfire Factory app   (http://factory.joshfire.com)
The application is featuring African Cup of Nations 2013 data  

* News : Using Joshfire Factory's Google News datasource
*	Twitter : Using Joshfire Factory's Twitter datasource
*	Fixtures : Using this app /fixtures JSON feed
*	Videos : Using Joshfire Factory's Youtube & dailymotion datasources
*	Squads : Using this app /squads JSON feed


##Dependencies

* bcrypt (password encryption)
* connect-mongo (session store)
* dateformat
* ejs (templating)
* express  
* mongoose
* request  
* underscore  

##Setup

	$ npm install

##Run
	$ node app.js

##API

###Public data

`GET /fixtures`  
`GET /squads`  
`GET /players` 


###Support
####Form
`GET /support.html`
or
`GET /support`

####Post
`POST /support`

###Register/login

####Forms (ejs templates)

`GET /register`  
`GET /login`  

####Request

`POST /users`  

Create a User document, if the name is available.  
Password is encrypted using `bcrypt`

`POST /login`  
Redirects to /admin if the 


###Admin
Access restricted to admin users

```
 app.get('/admin', checkAdmin, function(req, res){
      if (req.session && req.session.user){
        return res.render('admin.ejs', {user:req.session.user});
      }
      res.redirect('/login');
    });
    
 var checkAdmin = function(req, res, next){
      if (!req.session || !req.session.user || !req.session.user.admin){
        return res.redirect('/login');
      }
      next();
    };
```


`GET /admin`: HTML page with links to /admin/players & /admin/fixtures

###Fixtures

####Form
`GET /admin/fixtures`

####Create
`POST /fixtures`

####Update
`PUT /fixtures`

####Delete
`DELETE /fixtures`

###Players

####Form
`GET /admin/players`

####Create
`POST /players`

####Update
`PUT /players`

####Delete
`DELETE /players`
