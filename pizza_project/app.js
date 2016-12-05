var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var session = require('express-session');
var fileUpload = require('express-fileupload');
var SECRETKEY = 'I want to pass COMPS381F';

var mongo = require('mongodb');

var assert = require('assert');
var mongourl = 'mongodb://pizzachan:123@ds119368.mlab.com:19368/pizzachan_db';

//var mongourl = 'mongodb://localhost:27017/local';
var MongoClient = mongo.MongoClient;
var ObjectId = mongo.ObjectID;

//mongoimport --db local --collection users --file user.json
//mongoimport --db local --collection restaurants --file restaurant.json
	var items = [
	{name: 'Apple iPad Pro'},
	{name: 'Apple iPhone 7'},
	{name: 'Apple Macbook'}
];
app.use(fileUpload());
app.use(bodyParser.json());
app.use(session({
	secret: SECRETKEY,
	resave: true,
	saveUninitialized: true
}));

app.set('view engine', 'ejs');

app.get('/',function(req,res) {
if(check_login(req,res)){
return;
};
	console.log(req.session);
	res.redirect('/read');
        
});
app.get('/login',function(req,res) {
	res.sendFile(__dirname + '/login.html');
});

app.post('/login',function(req,res) {
		req.session.username = null;
		 req.session.authenticated = false;
		MongoClient.connect(mongourl, function(err, db) {
		    assert.equal(err,null);
		    console.log('Checking user information\n');
		      db.collection('users').find({user: req.body.name}).toArray(function(err,results) {
			if (err) {
			  console.log(err);
			  res.redirect('/');
			  return;
	
			} else {
			  db.close();
			  //console.log(results);
			  if(results[0]==undefined){
			   res.send('<h1>Incorrect username or password </h1>'+
				    '<Button onclick="window.history.back();">Go Back</Button>');
			   return;

			 }
			  else if(req.body.password==results[0].password){
				  req.session.authenticated = true;
			  	  req.session.username = req.body.name;
				  res.redirect('/');
				  return;
			  }
			 else{
			   res.send('<h1>Incorrect username or password </h1>'+
				    '<Button onclick="window.history.back();">Go Back</Button>');
			   return;
			 }
			  
			}
		      });
			});
	
});
function check_login(req,res){
	if (!req.session.authenticated) {
			res.redirect('/login');
			return true;
		}
        return false;
		
}
app.get('/read',function(req,res) {
check_login(req,res);
var query = {};
if(req.query.name){query['Name'] =  req.query.name;}
else if(req.query.borough){query['Borough'] =  req.query.borough;}
else if(req.query.cuisine){query['Cuisine'] =  req.query.cuisine;}
		    MongoClient.connect(mongourl, function(err, db) {
		    assert.equal(err,null);
		    console.log('Reading restaurant list\n');
		      db.collection('restaurants').find(query).toArray(function(err,results) {
			if (err) {
			  console.log(err);
			} else {
			  res.render('read',{'restaurants':results});
			}
		      });
			});
	
});
app.get('/new',function(req,res) {
check_login(req,res);
	res.sendFile(__dirname + '/new.html');
});
app.post('/create',function(req,res) {
check_login(req,res);
	if(req.body!=null){
		   criteria=req.body;
		   if (req.files) {
                   bfile =req.files.sampleFile;
		   criteria.data=new Buffer(bfile.data).toString('base64');
		   criteria.mimetype=bfile.mimetype;
		   }
		   criteria.owner=req.session.username;
		   MongoClient.connect(mongourl, function(err, db) {
		    assert.equal(err,null);
		    console.log('insert restaurant from list'+criteria+'\n');
			      db.collection('restaurants').insert(criteria, function(err, results) {
	    		     if (err) {
				  console.log(err);
				} else {
			          console.log(JSON.stringify(results));
				  res.redirect('/');
				}
				 });
			});
	}
	else{
	res.redirect('/');
	}
});
app.post('/api/create',function(req,res) {
	var json_to_sd ={};
	if(req.body!=null && (req.body.name || req.body.Name)){
  		criteria={};

		 if(req.body.name){criteria['Name']=req.body.name;}
		 else if(req.body.Name){criteria['Name']=req.body.Name;}

		 if(req.body.borough){criteria['Borough']=req.body.borough;}
		 else if(req.body.Borough){criteria['Borough']=req.body.Borough;}

		 if(req.body.cuisine){criteria['Cuisine']=req.body.cuisine;}
		 else if(req.body.Cuisine){criteria['Cuisine']=req.body.Cuisine;}

		 if(req.body.street){criteria['Street']=req.body.street;}
		 else if(req.body.Street){criteria['Street']=req.body.Street;}

		 if(req.body.building){criteria['Building']=req.body.building;}
		 else if(req.body.Building){criteria['Building']=req.body.Building;}

		 if(req.body.zipcode){criteria['Zipcode']=req.body.zipcode;}
		 else if(req.body.Zipcode){criteria['Zipcode']=req.body.Zipcode;}

		 if(req.body.lon){criteria['lon']=req.body.lon;}
		 if(req.body.lat){criteria['lat']=req.body.lat;}
		 if(req.body.owner){criteria['owner']=req.body.owner;}
		 
		   if (req.files) {
                   bfile =req.files.sampleFile;
		   criteria.data=new Buffer(bfile.data).toString('base64');
		   criteria.mimetype=bfile.mimetype;
		   }
		   if(req.session.username){
		   criteria.owner=req.session.username;
		   }
		   console.log(JSON.stringify(criteria));
		   MongoClient.connect(mongourl, function(err, db) {
		    assert.equal(err,null);
		    console.log('insert restaurant from list'+criteria+'\n');
			      db.collection('restaurants').insert(criteria, function(err, results) {
	    		     if (err) {
				  json_to_sd['status']='failed';
				  res.send(json_to_sd);
				} else {
				  
				  json_to_sd['status']='ok';
				  json_to_sd['_id']=results.insertedIds[0];
				  console.log(JSON.stringify(results));
				  res.send(json_to_sd);
				}
				 });
			});
	}
	else{
	json_to_sd['status']='failed';
	res.send(json_to_sd);
	}
});
app.get('/display',function(req,res){
check_login(req,res);

	if(req.query.id!=""){
		    MongoClient.connect(mongourl, function(err, db) {
		    assert.equal(err,null);
		    try{var o_id= ObjectId(req.query.id);}
		    catch(err){res.redirect('/');return;}
		    console.log('Reading one restaurant'+ o_id +'\n');
			
		     db.collection('restaurants').findOne({_id:o_id}, function(err, results) {
    		     if (err) {
			  console.log(err);
			} else {
	                  //console.log(JSON.stringify(results));
			  if(results!=null){
		   	  res.render('display',{'restaurant':results});
			  }
		          else {res.redirect('/');}
			}
			 });		});
	
	}
	else{
	res.redirect('/');
	}
});
app.get('/rate',function(req,res){
check_login(req,res);
	
	if(req.query.id!="")
	{
		    MongoClient.connect(mongourl, function(err, db) {
			    assert.equal(err,null);
			    try{var o_id= ObjectId(req.query.id);}
		   	    catch(err){res.redirect('/');return;}
			    console.log('rating on restaurant'+ o_id +'\n');
			
			     db.collection('restaurants').findOne({_id:o_id}, function(err, results) {
		    		     if (err) {
					  console.log(err);
					} 
				    else {
					  	if(results!=null){
							var bol=false;
							 	 if(results.grades){
								  	  results.grades.forEach(function(g) { 
						 			       if(req.session.username==g.user){bol=true;}
									  }) 
							 	  }
							 if(bol){res.send('<h1>You have already rate on this restaurant </h1><Button onclick="window.history.back();">Go Back</Button>');}
							else{res.render('rate',{'restaurant':results});}

					 	}
					  	else {res.redirect('/');}
					}
				 });
 		   });
	
	}
	else{
	res.redirect('/');
	}
	
});
app.post('/rate',function(req,res){
check_login(req,res);
	if(req.body!=null){
		   var rate = req.body.rate;
		   var _id=req.body._id;
	           var o_id= ObjectId(_id);
		   var criteria = {grades: {user:req.session.username, score:rate} };
		   MongoClient.connect(mongourl, function(err, db) {
			    assert.equal(err,null);
			    
			    console.log('rate restaurant'+criteria+'\n');
			    db.collection('restaurants').update({"_id":o_id}, {$push:criteria},function(err, results) {
	    		     if (err) {
				  console.log(err);
				} else {
				  res.redirect('/display?id='+o_id);
				}
				 });	
		  });
	}
	else{
	res.redirect('/');
	}
});

app.get('/edit',function(req,res){
check_login(req,res);
if(req.query.id!="")
	{
		    MongoClient.connect(mongourl, function(err, db) {
		    assert.equal(err,null);
		   try{var o_id= ObjectId(req.query.id);}
		   catch(err){res.redirect('/');return;}
		    console.log('Editing one restaurant'+ o_id +'\n');
			
		     db.collection('restaurants').findOne({_id:o_id}, function(err, results) {
    		     if (err) {
			  console.log(err);
			} else {
	                 // console.log(JSON.stringify(results));
			  if(results!=null)
			  {
				 if(req.session.username!=results.owner){
				  res.send('<h1>You are not the owner of the restaurant </h1><Button onclick="window.history.back();">Go Back</Button>');
				 }
				else{
				 res.render('edit',{'restaurant':results});
				}
			  }
		          else {res.redirect('/');return;}
			}
			 });
 		   });
	
	}
	else{
	res.redirect('/');
	}
});	
app.post('/edit',function(req,res){
check_login(req,res);
	if(req.body!=null){
		   criteria=req.body;
	           if (req.files.sampleFile.name.length>0) {
                    console.log(req.files.sampleFile);
                   bfile =req.files.sampleFile;
		   criteria.data=new Buffer(bfile.data).toString('base64');
		   criteria.mimetype=bfile.mimetype;
		   }

		   var _id=req.body._id;
		    console.log(req.body._id+"   "+JSON.stringify(criteria));
	            delete criteria['_id'];
		   MongoClient.connect(mongourl, function(err, db) {
		    assert.equal(err,null);
		    var o_id= ObjectId(_id);
		    console.log('edit restaurant'+criteria+'\n');
			      db.collection('restaurants').update({"_id":o_id}, {$set:criteria},function(err, results) {
	    		     if (err) {
				  console.log(err);
				} else {
			           console.log(JSON.stringify(results));
				  res.redirect('/display?id='+o_id);
//display?id='+req.body._id
				}
				 });
			});
	}
	else{
	res.redirect('/');
	}
});
app.get('/delete',function(req,res){
check_login(req,res);
	if(req.query.id!=""){
	var bol=false;
		   MongoClient.connect(mongourl, function(err, db) {
		    assert.equal(err,null);
		    try{var o_id= ObjectId(req.query.id);}
		    catch(err){res.redirect('/');return;}
				db.collection('restaurants').findOne({_id:o_id}, function(err, results) {
		    		     if (err) {
					  console.log(err);
					} else {
					  if(results!=null)
					  {
						 if(req.session.username!=results.owner){
						  res.send('<h1>You are not the owner of the restaurant</h1>'+
							   '<Button onclick="window.history.back();">Go Back</Button>');
						  
						 }
						else{  console.log('Delete restaurant from list'+req.query.id+'\n');
							db.collection('restaurants').remove({_id:o_id}, function(err, results) {
				    		       if (err) {
							  console.log(err);
							} else {
							  console.log(JSON.stringify(results));
							  res.redirect('/');
							}
						 	});
						}
					  }
					  else {        
							res.redirect('/');
						}
					}
				 });
		   
			     
			});
	}
	else{
	res.redirect('/');
	}
});
app.get("/gmap", function(req,res) {
check_login(req,res);
	var lat  = req.query.lat;
	var lon  = req.query.lon;
	var zoom = req.query.zoom;

	res.render("gmap",{lat:lat,lon:lon,zoom:zoom});
});
app.get("/logout", function(req,res) {
	req.session.destroy();
	res.redirect('/');
});
app.get("/register", function(req,res) {

	res.sendFile(__dirname + '/register.html');
});
app.post('/register',function(req,res){

	var bol=true;
	if(req.body!=null){
	
		if(req.body.confirmpassword!=req.body.password){       
								res.end('<h1>password and confirm password must be the same</h1>'+
									 '<Button onclick="window.history.back();">Go Back</Button>');
		}
		else{
		   MongoClient.connect(mongourl, function(err, db) {
		    assert.equal(err,null);
				db.collection('users').findOne({user:req.body.user}, function(err, results) {
		    		     if (err) { console.log(err);bol=false;} 
				     else {
					  if(results==null){
								db.collection('users').insert(req.body, function(err, results) {
					    		      if (err) {
								  console.log(err);
								} else {
								  req.session.authenticated = true;
			  	  				  req.session.username = req.body.user;
								  res.send('<h1>'+req.body.user+'You have become our customer!</h1>'+
							   	'<Button onclick="location.href=\'/\';">Keep going</Button>');

								}
								 });
						}
					  else{res.send('<h1>This username has already been used</h1>'+
							   '<Button onclick="window.history.back();">Go Back</Button>');}
				     }
				 });
		  });
		}
	}
});
///api/read/name/Starbucks
String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}
app.get('/api/read/:field/:key',function(req,res){
		    MongoClient.connect(mongourl, function(err, db) {
		    assert.equal(err,null);
		    var query = {};
		    query[req.params.field.capitalize()] =  req.params.key;
		    console.log(query);
		     db.collection('restaurants').find(query).toArray(function(err,results) {
			 if (err) {
			  console.log(err);
			} else {
			  if(results!=null){
		   	  res.send(JSON.stringify(results));
			  }
		          else {res.send('{}');}
			}
			 });				
		});
	
	

});
app.listen(process.env.PORT || 8099);
