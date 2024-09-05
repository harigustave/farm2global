const { Client } = require('pg');

const client = new Client({
	user: 'postgres',
	password: 'rwanda',
	host: 'localhost',
	port: '5432',
	database: 'farm2global',
});
client.connect()

const express=require("express")
const session = require('express-session');
const app=express()
const bcrypt=require("bcrypt")

// Set up session middleware
app.use(session({
    secret: 'rwanda123', // Replace with your own secret key
    resave: false,             // Don't save session if unmodified
    saveUninitialized: false,  // Don't create session until something is stored
    cookie: { secure: false }  // Set to true if using HTTPS
}));

const port=2000

app.use(express.static('views'));
app.set('view engine', 'ejs');

app.use(express.urlencoded({extended:false}))

app.post("/signup", async (req,res)=>{
    try{
        const hashedpassword=await bcrypt.hash(req.body.password,10)
        firstname=req.body.firstname
        lastname=req.body.lastname
        phonenumber=req.body.phonenumber
        country=req.body.country
        nid=req.body.nid

        const query = 'INSERT INTO farmers(firstname, lastname, phone, passwd, country, nationalid, digitalid) VALUES ($1, $2, $3, $4, $5, $6, $7)';
        const values=[firstname,lastname,phonenumber,hashedpassword,country,nid,'']  
        client.query(query, values, (err, res) => {
            if (err) {
                console.error(err.detail);
                return;
            }
            console.log('Data insert successful.');
            // client.end();
        });
        res.redirect("/login")
    }catch(e){
        console.log(e)
        res.redirect("/signup")
    }
})

app.post("/login", async (req,rest)=>{
    try{
        phonenumber=req.body.phonenumber
        password=req.body.password
        const query = 'SELECT * FROM farmers WHERE phone = $1';
        client.query(query, [phonenumber], (err, res) => {
            if (err) {
              console.error('Error executing query', err.stack);
            } else {
              if (res.rowCount > 0) {
                const hashedPassword = res.rows[0].passwd; // Assuming the password column is named 'passwd'
          
                bcrypt.compare(password, hashedPassword, (err, result) => {
                  if (err) {
                    console.error('Error comparing passwords', err.stack);
                    rest.redirect("/login")
                  } else if (result > 0) {
                    console.log('Passwords match! User authenticated.');
                    req.session.loggedInUser = res.rows[0];
                    // console.log(req.session.loggedInUser)
                    rest.redirect("/farmerdashboard")
                  } else {
                    // req.session.message = "Invalid Password"
                    console.log('Invalid Password');
                    rest.redirect("/login")
                    // Deny access
                  }
                });
              } else {
                req.session.message = "Invalid Phone Number"
                console.log('Invalid Phone Number');
                rest.redirect("/login")
              }
            }
            // client.end();
          });
    }catch(e){
        console.log(e)
        rest.redirect("/login")
    }
})

app.post('/editprofile', (req,res)=>{
    try{
        phonenumber=req.body.phonenumber
        nationalid=req.body.nid

        if((phonenumber=="") && (nationalid=="")){
            console.log("Profile Not Updated. User Provided empty entries")
        }else if((phonenumber!="") && (nationalid=="")){
            try{
                nationalid=req.session.loggedInUser.nationalid
                console.log("National ID: ",nationalid)
                const query = 'UPDATE farmers SET phone = $1 WHERE nationalid = $2 RETURNING *';
                const values=[phonenumber,nationalid]  
                client.query(query, values, (err, res) => {
                    if (err) {
                        console.error(err.detail);
                        return;
                    }
                    console.log("Phone number updated successfully")
                    // client.end();
                });
                res.redirect("/editprofile")
            }catch(e){
                console.log(e)
                res.redirect("/editprofile")
            }
        }else if((phonenumber=="") && (nationalid!="")){
            try{
                phonenumber=req.session.loggedInUser.phone
                // console.log("National ID: ",phone)
                const query = 'UPDATE farmers SET nationalid = $1 WHERE phone = $2 RETURNING *';
                const values=[nationalid,phonenumber]  
                client.query(query, values, (err, res) => {
                    if (err) {
                        console.error(err.detail);
                        return;
                    }
                    console.log("National ID updated successfully!!!")
                    // client.end();
                });
                res.redirect("/editprofile")
            }catch(e){
                console.log(e)
                res.redirect("/editprofile")
            }
        }else{
            try{
                phonenum=req.session.loggedInUser.phone
                // console.log("National ID: ",phone)
                const query = 'UPDATE farmers SET nationalid = $1,phone = $2 WHERE phone = $3 RETURNING *';
                const values=[nationalid,phonenumber,phonenum]  
                client.query(query, values, (err, res) => {
                    if (err) {
                        console.error(err.detail);
                        return;
                    }
                    console.log("All entries are updates successfully!!!")
                    // client.end();
                });
                res.redirect("/editprofile")
            }catch(e){
                console.log(e)
                res.redirect("/editprofile")
            }
        }
    }catch(e){
        console.log(e)
        res.redirect("/editprofile")
    }
})

app.post('/addcrop', (req,res)=>{
    try{
        contact=req.session.loggedInUser.phone

        firstname=req.session.loggedInUser.firstname
        lastname=req.session.loggedInUser.lastname
        fullname=firstname+" "+lastname

        country=req.session.loggedInUser.country

        fall=req.body.fall
        summer=req.body.summer
        spring=req.body.spring
        if(fall==undefined){
            fall=""
        }
        if(summer==undefined){
            summer=""
        }
        if(spring==undefined){
            spring=""
        }
        seasons=fall+" "+summer+" "+spring
        seasons=seasons.trim()
        
        croname=req.body.cpname

        seasonqty=req.body.qty

        const query = 'INSERT INTO crops(ownercontact, ownername, country, cropname, harvestseasons, qtyperseason) VALUES ($1, $2, $3, $4, $5, $6)';
        const values=[contact,fullname,country,croname,seasons,seasonqty]

        client.query(query, values, (err, res) => {
            if (err) {
                console.error(err.detail);
                return;
            }
            console.log('Crop data insert successful!!!');
            // client.end();
        });
        res.redirect("/addcrop")
    }catch(e){
        console.log(e)
        res.redirect("/addcrop")
    }
})

app.post('/deletecrop', (req,res)=>{
    try{
        contact=req.session.loggedInUser.phone

        croname=req.body.cpname
        croname=croname.charAt(0).toUpperCase()+ croname.slice(1)

        query= 'SELECT * FROM crops WHERE ownercontact = $1 AND cropname = $2';

        // const values=[contact,croname]

        client.query(query, [contact,croname], (err, res) => {
            if (err) {
              console.error('Error executing query', err.stack);
            } else {
              if (res.rowCount > 0) {
                try{
                    const query = 'DELETE FROM crops WHERE ownercontact = $1 AND cropname = $2 RETURNING *';
                    client.query(query, [contact,croname], (err, rest) => {
                        if (err) {
                            console.error(err.detail);
                            return;
                        }
                        
                        if(rest.rowCount>0){
                            console.log('Crop data deleted successful!!!');
                        }
                        // client.end();
                    });
                }catch(e){
                    console.log(e)
                    res.redirect("/deletecrop")
                }
              } else {
                console.log(`You do not have ${croname} in our Database`)
              }
            }
            // client.end();
          });
          res.redirect("/deletecrop")
    }catch(e){
        console.log(e)
        res.redirect("/deletecrop")
    }
})

app.get('/', (req,res)=>{
    res.render("index.ejs")
})

app.get('/index', (req,res)=>{
    res.render("index.ejs")
})

app.get('/about', (req,res)=>{
    res.render("about.ejs")
})

app.get('/contact', (req,res)=>{
    res.render("contact.ejs")
})

app.get('/service', (req,res)=>{
    res.render("service.ejs")
})

app.get('/feature', (req,res)=>{
    res.render("feature.ejs")
})

app.get('/cotton', (req,res)=>{
    res.render("cotton.ejs")
})

app.get('/testimonial', (req,res)=>{
    res.render("testimonial.ejs")
})

app.get('/signup', (req,res)=>{
    res.render("signup.ejs")
})

app.get('/login', (req,res)=>{
    res.render("login.ejs")
})

app.get('/resetpass', (req,res)=>{
    res.render("resetpass.ejs")
})

app.get('/farmerdashboard', (req,res)=>{
    if (req.session.loggedInUser) {
        // console.log(`Info from session on dashboard is: ${req.session.loggedInUser.firstname}`);
      } else {
        console.log('No user logged in.');
    }
    res.render("farmerdashboard.ejs",{user:req.session.loggedInUser})
})

app.get('/editprofile', (req,res)=>{
    if (req.session.loggedInUser) {
        // console.log(`Info from session on edit profile is: ${req.session.loggedInUser.firstname}`);
      } else {
        console.log('No user logged in.');
    }
    res.render("editprofile.ejs",{user:req.session.loggedInUser})
})

app.get('/addcrop', (req,res)=>{
    if (req.session.loggedInUser) {
        // console.log(`Info from session on edit profile is: ${req.session.loggedInUser.firstname}`);
      } else {
        console.log('No user logged in.');
    }
    res.render("addcrop.ejs",{user:req.session.loggedInUser})
})

app.get('/deletecrop', (req,res)=>{
    if (req.session.loggedInUser) {
        // console.log(`Info from session on edit profile is: ${req.session.loggedInUser.firstname}`);
      } else {
        console.log('No user logged in.');
    }
    res.render("deletecrop.ejs",{user:req.session.loggedInUser})
})

app.get('/logout', (req, res) => {
    // Destroy the session
    req.session.destroy(err => {
      if (err) {
        return res.status(500).send('Error in destroying session');
      }
      console.log("Successfully log out and session destroyed")
      res.redirect('/login');
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
