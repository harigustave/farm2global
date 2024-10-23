const { Client } = require('pg')

//DB configurations
const client = new Client({
  user: 'doadmin',
  password: 'AVNS_XAvmQBo_eoZwP9cL5qb',
  host: 'db-postgresql-fra1-81238-do-user-18067024-0.e.db.ondigitalocean.com',
  port: '25060',
  database: 'defaultdb',
  ssl: {
    rejectUnauthorized: false  // Disable certificate verification (or configure properly in production)
  }
})

client.connect()

const express = require('express')
const session = require('express-session')
const app = express()
const dotenv = require('dotenv');
dotenv.config();
const bcrypt = require('bcrypt')
const multer = require('multer');
const fs = require('fs');
const { Console } = require('console')

// Set up session middleware
app.use(
  session({
    secret: 'rwanda123',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
  })
)

app.use(express.static('views'))
app.set('view engine', 'ejs')

app.use(express.urlencoded({ extended: false }))

// Use memory storage for storing the image in memory
const upload = multer({ storage: multer.memoryStorage() }); 

// Signup endpoint
app.post('/signup', async (req, res) => {
  try {
    const hashedpassword = await bcrypt.hash(req.body.password, 10)
    firstname = req.body.firstname.toUpperCase()
    lastname = req.body.lastname.toUpperCase()
    phonenumber = req.body.phonenumber
    district = req.body.district.toUpperCase()
    nid = req.body.nid
    MOSIPUIN='4259643861'
    const query =
      'INSERT INTO farmers(firstname, lastname, phone, passwd, country, nationalid, digitalid) VALUES ($1, $2, $3, $4, $5, $6, $7)'
    const values = [
      firstname,
      lastname,
      phonenumber,
      hashedpassword,
      district,
      nid,
      MOSIPUIN
    ]
    client.query(query, values, (err, res) => {
      if (err) {
        console.error(err.detail)
        return
      }
      console.log('Data insert successful.')
    })
    res.redirect('/login')
  } catch (e) {
    console.log(e)
    res.redirect('/signup')
  }
})

// Local User Login endpoint
app.post('/login', async (req, rest) => {
  try {
    phonenumber = req.body.phonenumber
    password = req.body.password
    const query = 'SELECT * FROM farmers WHERE phone = $1'
    client.query(query, [phonenumber], (err, res) => {
      if (err) {
        console.error('Error executing query', err.stack)
      } else {
        if (res.rowCount > 0) {
          const hashedPassword = res.rows[0].passwd
          bcrypt.compare(password, hashedPassword, (err, result) => {
            if (err) {
              console.error('Error comparing passwords', err.stack)
              rest.redirect('/login')
            } else if (result > 0) {
              console.log('Passwords match! User authenticated.')
              req.session.loggedInUser = res.rows[0]
              rest.redirect('/localfarmerdashboard')
            } else {
              console.log('Invalid Password')
              rest.redirect('/login')
              // Deny access
            }
          })
        } else {
          req.session.message = 'Invalid Phone Number'
          console.log('Invalid Phone Number')
          rest.redirect('/login')
        }
      }
    })
  } catch (e) {
    console.log(e)
    rest.redirect('/login')
  }
})

// Mosip Login endpoint
app.post('/mosiplogin', async (req, rest) => {
  try {
    phonenumber = req.body.phonenumber
    const query = 'SELECT * FROM farmers WHERE phone = $1'
    client.query(query, [phonenumber], (err, res) => {
      if (err) {
        console.error('Error executing query', err.stack)
      } else {
        if (res.rowCount > 0) {
          req.session.loggedInUser = res.rows[0]
          rest.redirect('/localfarmerdashboard')
            } else {
              rest.redirect('/login')
              // Deny access
        }
      }
    })
  } catch (e) {
    console.log(e)
    rest.redirect('/login')
  }
})

//Edit Profile endpoint
app.post('/editprofile', upload.single('image'), async(req, res) => {
  if (!req.file) {
    console.log('No file uploaded.');
    res.redirect('/editprofile')
  }else{
      const image = req.file.buffer; // Get the image buffer
      const mimeType = req.file.mimetype; //Get MIME TYPE of the image
      phonenumber = req.session.loggedInUser.phone
      
      const values = [image,mimeType,phonenumber]
      
      //Update Farmers table
      const query='UPDATE farmers SET image_data = $1, mime_type = $2 WHERE phone = $3 RETURNING *'
      const result=client.query(query, values, (err, rest) => {
        if (err) {
          console.error(err.detail)
          return
        }
        console.log('>>>> Farmers Table: Farmer Picture updated successfully!!!')
      })
      res.redirect('/editprofile')
  }
})

// Add Crop endpoint
app.post('/addcrop', (req, res) => {
  try {
    contact = req.session.loggedInUser.phone
    firstname = req.session.loggedInUser.firstname
    lastname = req.session.loggedInUser.lastname
    fullname = firstname + ' ' + lastname

    district = req.session.loggedInUser.country
    seasons = req.body.season
    croname = req.body.cpname.toUpperCase()
    seasonqty = req.body.qty

    const query2 = 'SELECT * FROM crops WHERE cropname = $1 AND ownercontact = $2'
    client.query(query2, [croname,contact], (err, rest) => {
      if (err) {
        console.error('Error executing query', err.stack)
      } else {
        if (rest.rowCount > 0) {
          console.log("Crop already exists")
          res.redirect('/addcrop')
        }else{
          const query3 ='SELECT image_data,mime_type FROM farmers WHERE phone = $1' 
          client.query(query3, [contact], (err, reslt) => {
            if (err) {
              console.error(err.detail)
              return
            }
            image=reslt.rows[0].image_data
            mimetype=reslt.rows[0].mime_type

            const query = 'INSERT INTO crops(ownercontact, ownername, country, cropname, harvestseasons, qtyperseason, image_data, mime_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)'
            const values = [contact, fullname, district, croname, seasons, seasonqty, image, mimetype]
  
            client.query(query, values, (err, res) => {
              if (err) {
                console.error(err.detail)
                return
              }
              console.log('Crop data insert successful!!!')
            })
            res.redirect('/addcrop')
          })
        }  
      }
    })

  } catch (e) {
    console.log(e)
    res.redirect('/addcrop')
  }
})

//Delete Crop endpoint
app.post('/deletecrop/:cropname', (req, res) => {
  try {
    contact = req.session.loggedInUser.phone
    const { cropname } = req.params
    croname = cropname.toUpperCase()

    query = 'SELECT * FROM crops WHERE ownercontact = $1 AND cropname = $2'
    client.query(query, [contact, croname], (err, res) => {
      if (err) {
        console.error('Error executing query', err.stack)
      } else {
        if (res.rowCount > 0) {
          try {
            const query =
              'DELETE FROM crops WHERE ownercontact = $1 AND cropname = $2 RETURNING *'
            client.query(query, [contact, croname], (err, rest) => {
              if (err) {
                console.error(err.detail)
                return
              }
              if (rest.rowCount > 0) {
                console.log('Crop data deleted successful!!!')
              }
            })
          } catch (e) {
            console.log(e)
            res.redirect('/viewcrops')
          }
        } else {
          console.log(`You do not have ${croname} in our Database`)
        }
      }
    })
    res.redirect('/viewcrops')
  } catch (e) {
    console.log(e)
    res.redirect('/viewcrops')
  }
})

// Home endpoint
app.get('/', (req, res) => {
  res.render('index.ejs')
})

// Home endpoint
app.get('/index', (req, res) => {
  res.render('index.ejs')
})

// About Us endpoint
app.get('/about', (req, res) => {
  res.render('about.ejs')
})

// Contact Us endpoint
app.get('/contact', (req, res) => {
  res.render('contact.ejs')
})

// Services endpoint
app.get('/service', (req, res) => {
  res.render('service.ejs')
})

// Features endpoint
app.get('/feature', (req, res) => {
  res.render('feature.ejs')
})

// Display all Coffee Farmers endpoint
app.get('/coffee', (req, rest) => {
  crops = undefined
  try {
    cropname = 'COFFEE'
    const page = parseInt(req.query.page) || 1; // Get the page from query params, default to 1
    const limit = 15; // Items per page
    const offset = (page - 1) * limit; // Calculate the offset
    const query = 'SELECT * FROM crops WHERE cropname = $1 LIMIT $2 OFFSET $3';
    client.query(query, [cropname, limit, offset], (err, res) => {
      if (err) {
        console.error('Error executing query', err.stack)
      } else {
        if (res.rowCount > 0) {
          for(let i=0;i<(res.rows).length;i++){
            res.rows[i].image_data=res.rows[i].image_data.toString('base64')
          }
          req.session.crops = res.rows
          crops = req.session.crops
          const totalCropsQuery = 'SELECT COUNT(*) FROM crops WHERE cropname = $1';
          client.query(totalCropsQuery, [cropname], (err, countResult) => {
            const totalCrops = parseInt(countResult.rows[0].count);
            const totalPages = Math.ceil(totalCrops / limit);
            rest.render('coffee.ejs', { crops, page, totalPages });
          });
        } else {
          req.session.crops = res.rows
          crops = req.session.crops
          user = req.session.loggedInUser
          const totalPages=1;
          console.log('You do not have crops in our Database')
          rest.render('coffee.ejs', { crops, page, totalPages})
        }
      }
    })
  } catch (e) {
    console.log(e)
    rest.redirect('/index')
  }
})

// Search Coffee Farmers endpoint
app.post('/coffee', (req, rest) => {
  crops = undefined
  try {
    cropname="COFFEE"
    const page = parseInt(req.query.page) || 1; // Get the page from query params, default to 1
    const limit = 15; // Items per page
    const offset = (page - 1) * limit; // Calculate the offset
    country = req.body.search_district
    country = country.toUpperCase()
    query = 'SELECT * FROM crops WHERE cropname = $1 AND country = $2 LIMIT $3 OFFSET $4'
    client.query(query, [cropname,country,limit, offset], (err, res) => {
      if (err) {
        console.error('Error executing query', err.stack)
      } else {
        if (res.rowCount > 0) {
          for(let i=0;i<(res.rows).length;i++){
            res.rows[i].image_data=res.rows[i].image_data.toString('base64')
          }
          req.session.crops = res.rows
          crops = req.session.crops
          const totalCropsQuery = 'SELECT COUNT(*) FROM crops WHERE cropname = $1 AND country = $2';
          client.query(totalCropsQuery, [cropname,country], (err, countResult) => {
            const totalCrops = parseInt(countResult.rows[0].count);
            const totalPages = Math.ceil(totalCrops / limit);
            rest.render('coffee.ejs', { crops, page, totalPages });
          });
        } else {
          req.session.crops = res.rows
          crops = req.session.crops
          user = req.session.loggedInUser
          const totalPages=1;
          console.log('We do not have ',cropname,' farmers in ',country)
          rest.render('coffee.ejs', { crops, page, totalPages })
        }
      }
    })
  } catch (e) {
    console.log(e)
    rest.redirect('/index')
  }
})

// Display all Cotton Farmers endpoint
app.get('/cotton', (req, rest) => {
  crops = undefined
  try {
    cropname = 'COTTON'
    const page = parseInt(req.query.page) || 1; // Get the page from query params, default to 1
    const limit = 15; // Items per page
    const offset = (page - 1) * limit; // Calculate the offset
    const query = 'SELECT * FROM crops WHERE cropname = $1 LIMIT $2 OFFSET $3';
    client.query(query, [cropname, limit, offset], (err, res) => {
      if (err) {
        console.error('Error executing query', err.stack)
      } else {
        if (res.rowCount > 0) {
          for(let i=0;i<(res.rows).length;i++){
            res.rows[i].image_data=res.rows[i].image_data.toString('base64')
          }
          req.session.crops = res.rows
          crops = req.session.crops
          const totalCropsQuery = 'SELECT COUNT(*) FROM crops WHERE cropname = $1';
          client.query(totalCropsQuery, [cropname], (err, countResult) => {
            const totalCrops = parseInt(countResult.rows[0].count);
            const totalPages = Math.ceil(totalCrops / limit);
            rest.render('cotton.ejs', { crops, page, totalPages });
          });
        } else {
          req.session.crops = res.rows
          crops = req.session.crops
          user = req.session.loggedInUser
          const totalPages=1;
          console.log('You do not have crops in our Database')
          rest.render('cotton.ejs', { crops, page, totalPages})
        }
      }
    })
  } catch (e) {
    console.log(e)
    rest.redirect('/index')
  }
})

// Search Cotton Farmers endpoint
app.post('/cotton', (req, rest) => {
  crops = undefined
  try {
    cropname="COTTON"
    const page = parseInt(req.query.page) || 1; // Get the page from query params, default to 1
    const limit = 15; // Items per page
    const offset = (page - 1) * limit; // Calculate the offset
    country = req.body.search_district
    country = country.toUpperCase()
    query = 'SELECT * FROM crops WHERE cropname = $1 AND country = $2 LIMIT $3 OFFSET $4'
    client.query(query, [cropname,country,limit, offset], (err, res) => {
      if (err) {
        console.error('Error executing query', err.stack)
      } else {
        if (res.rowCount > 0) {
          for(let i=0;i<(res.rows).length;i++){
            res.rows[i].image_data=res.rows[i].image_data.toString('base64')
          }
          req.session.crops = res.rows
          crops = req.session.crops
          const totalCropsQuery = 'SELECT COUNT(*) FROM crops WHERE cropname = $1 AND country = $2';
          client.query(totalCropsQuery, [cropname,country], (err, countResult) => {
            const totalCrops = parseInt(countResult.rows[0].count);
            const totalPages = Math.ceil(totalCrops / limit);
            rest.render('cotton.ejs', { crops, page, totalPages });
          });
        } else {
          req.session.crops = res.rows
          crops = req.session.crops
          user = req.session.loggedInUser
          const totalPages=1;
          console.log('We do not have ',cropname,' farmers in ',country)
          rest.render('cotton.ejs', { crops, page, totalPages })
        }
      }
    })
  } catch (e) {
    console.log(e)
    rest.redirect('/index')
  }
})

// Display all Maize Farmers endpoint
app.get('/maize', (req, rest) => {
  crops = undefined
  try {
    cropname = 'MAIZE'
    const page = parseInt(req.query.page) || 1; // Get the page from query params, default to 1
    const limit = 15; // Items per page
    const offset = (page - 1) * limit; // Calculate the offset
    const query = 'SELECT * FROM crops WHERE cropname = $1 LIMIT $2 OFFSET $3';
    client.query(query, [cropname, limit, offset], (err, res) => {
      if (err) {
        console.error('Error executing query', err.stack)
      } else {
        if (res.rowCount > 0) {
          for(let i=0;i<(res.rows).length;i++){
            res.rows[i].image_data=res.rows[i].image_data.toString('base64')
          }
          req.session.crops = res.rows
          crops = req.session.crops
          const totalCropsQuery = 'SELECT COUNT(*) FROM crops WHERE cropname = $1';
          client.query(totalCropsQuery, [cropname], (err, countResult) => {
            const totalCrops = parseInt(countResult.rows[0].count);
            const totalPages = Math.ceil(totalCrops / limit);
            rest.render('maize.ejs', { crops, page, totalPages });
          });
        } else {
          req.session.crops = res.rows
          crops = req.session.crops
          user = req.session.loggedInUser
          const totalPages=1;
          console.log('You do not have crops in our Database')
          rest.render('maize.ejs', { crops, page, totalPages })
        }
      }
    })
  } catch (e) {
    console.log(e)
    rest.redirect('/index')
  }
})

// Search Maize Farmers endpoint
app.post('/maize', (req, rest) => {
  crops = undefined
  try {
    cropname="MAIZE"
    const page = parseInt(req.query.page) || 1; // Get the page from query params, default to 1
    const limit = 15; // Items per page
    const offset = (page - 1) * limit; // Calculate the offset
    country = req.body.search_district
    country = country.toUpperCase()
    query = 'SELECT * FROM crops WHERE cropname = $1 AND country = $2 LIMIT $3 OFFSET $4'
    client.query(query, [cropname,country,limit, offset], (err, res) => {
      if (err) {
        console.error('Error executing query', err.stack)
      } else {
        if (res.rowCount > 0) {
          for(let i=0;i<(res.rows).length;i++){
            res.rows[i].image_data=res.rows[i].image_data.toString('base64')
          }
          req.session.crops = res.rows
          crops = req.session.crops
          const totalCropsQuery = 'SELECT COUNT(*) FROM crops WHERE cropname = $1 AND country = $2';
          client.query(totalCropsQuery, [cropname,country], (err, countResult) => {
            const totalCrops = parseInt(countResult.rows[0].count);
            const totalPages = Math.ceil(totalCrops / limit);
            rest.render('maize.ejs', { crops, page, totalPages });
          });
        } else {
          req.session.crops = res.rows
          crops = req.session.crops
          user = req.session.loggedInUser
          const totalPages=1;
          console.log('We do not have ',cropname,' farmers in ',country)
          rest.render('maize.ejs', { crops, page, totalPages })
        }
      }
    })
  } catch (e) {
    console.log(e)
    rest.redirect('/index')
  }
})

// Display all Sunflower Farmers endpoint
app.get('/sunflower', (req, rest) => {
  crops = undefined
  try {
    cropname = 'SUNFLOWER'
    const page = parseInt(req.query.page) || 1; // Get the page from query params, default to 1
    const limit = 15; // Items per page
    const offset = (page - 1) * limit; // Calculate the offset
    const query = 'SELECT * FROM crops WHERE cropname = $1 LIMIT $2 OFFSET $3';
    client.query(query, [cropname, limit, offset], (err, res) => {
      if (err) {
        console.error('Error executing query', err.stack)
      } else {
        if (res.rowCount > 0) {
          for(let i=0;i<(res.rows).length;i++){
            res.rows[i].image_data=res.rows[i].image_data.toString('base64')
          }
          req.session.crops = res.rows
          crops = req.session.crops
          const totalCropsQuery = 'SELECT COUNT(*) FROM crops WHERE cropname = $1';
          client.query(totalCropsQuery, [cropname], (err, countResult) => {
            const totalCrops = parseInt(countResult.rows[0].count);
            const totalPages = Math.ceil(totalCrops / limit);
            rest.render('sunflower.ejs', { crops, page, totalPages });
          });
        } else {
          req.session.crops = res.rows
          crops = req.session.crops
          user = req.session.loggedInUser
          const totalPages = 1;
          console.log('You do not have crops in our Database')
          rest.render('sunflower.ejs', { crops, page, totalPages })
        }
      }
    })
  } catch (e) {
    console.log(e)
    rest.redirect('/index')
  }
})

// Search Sunflower Farmers endpoint
app.post('/sunflower', (req, rest) => {
  crops = undefined
  try {
    cropname="SUNFLOWER"
    const page = parseInt(req.query.page) || 1; // Get the page from query params, default to 1
    const limit = 15; // Items per page
    const offset = (page - 1) * limit; // Calculate the offset
    country = req.body.search_district
    country = country.toUpperCase()
    query = 'SELECT * FROM crops WHERE cropname = $1 AND country = $2 LIMIT $3 OFFSET $4'
    client.query(query, [cropname,country,limit, offset], (err, res) => {
      if (err) {
        console.error('Error executing query', err.stack)
      } else {
        if (res.rowCount > 0) {
          for(let i=0;i<(res.rows).length;i++){
            res.rows[i].image_data=res.rows[i].image_data.toString('base64')
          }
          req.session.crops = res.rows
          crops = req.session.crops
          const totalCropsQuery = 'SELECT COUNT(*) FROM crops WHERE cropname = $1 AND country = $2';
          client.query(totalCropsQuery, [cropname,country], (err, countResult) => {
            const totalCrops = parseInt(countResult.rows[0].count);
            const totalPages = Math.ceil(totalCrops / limit);
            rest.render('sunflower.ejs', { crops, page, totalPages });
          });
        } else {
          req.session.crops = res.rows;
          crops = req.session.crops;
          user = req.session.loggedInUser;
          const totalPages=1;
          console.log('We do not have ',cropname,' farmers in ',country);
          rest.render('sunflower.ejs', { crops, page, totalPages });
        }
      }
    })
  } catch (e) {
    console.log(e)
    rest.redirect('/index')
  }
})

// Display all Groundnuts Farmers endpoint
app.get('/groundnuts', (req, rest) => {
  crops = undefined
  try {
    cropname = 'GROUNDNUTS'
    const page = parseInt(req.query.page) || 1; // Get the page from query params, default to 1
    const limit = 15; // Items per page
    const offset = (page - 1) * limit; // Calculate the offset
    const query = 'SELECT * FROM crops WHERE cropname = $1 LIMIT $2 OFFSET $3';
    client.query(query, [cropname, limit, offset], (err, res) => {
      if (err) {
        console.error('Error executing query', err.stack)
      } else {
        if (res.rowCount > 0) {
          for(let i=0;i<(res.rows).length;i++){
            res.rows[i].image_data=res.rows[i].image_data.toString('base64')
          }
          req.session.crops = res.rows
          crops = req.session.crops
          const totalCropsQuery = 'SELECT COUNT(*) FROM crops WHERE cropname = $1';
          client.query(totalCropsQuery, [cropname], (err, countResult) => {
            const totalCrops = parseInt(countResult.rows[0].count);
            const totalPages = Math.ceil(totalCrops / limit);
            rest.render('groundnuts.ejs', { crops, page, totalPages });
          });
        } else {
          req.session.crops = res.rows
          crops = req.session.crops
          user = req.session.loggedInUser
          const totalPages=1;
          console.log('You do not have crops in our Database')
          rest.render('groundnuts.ejs', { crops, page, totalPages })
        }
      }
    })
  } catch (e) {
    console.log(e)
    rest.redirect('/index')
  }
})

// Search Groundnuts Farmers endpoint
app.post('/groundnuts', (req, rest) => {
  crops = undefined
  try {
    cropname="GROUNDNUTS"
    const page = parseInt(req.query.page) || 1; // Get the page from query params, default to 1
    const limit = 15; // Items per page
    const offset = (page - 1) * limit; // Calculate the offset
    country = req.body.search_district
    country = country.toUpperCase()
    query = 'SELECT * FROM crops WHERE cropname = $1 AND country = $2 LIMIT $3 OFFSET $4'
    client.query(query, [cropname,country,limit, offset], (err, res) => {
      if (err) {
        console.error('Error executing query', err.stack)
      } else {
        if (res.rowCount > 0) {
          for(let i=0;i<(res.rows).length;i++){
            res.rows[i].image_data=res.rows[i].image_data.toString('base64')
          }
          req.session.crops = res.rows
          crops = req.session.crops
          const totalCropsQuery = 'SELECT COUNT(*) FROM crops WHERE cropname = $1 AND country = $2';
          client.query(totalCropsQuery, [cropname,country], (err, countResult) => {
            const totalCrops = parseInt(countResult.rows[0].count);
            const totalPages = Math.ceil(totalCrops / limit);
            rest.render('groundnuts.ejs', { crops, page, totalPages });
          });
        } else {
          req.session.crops = res.rows
          crops = req.session.crops
          user = req.session.loggedInUser
          const totalPages=1;
          console.log('We do not have ',cropname,' farmers in ',country)
          rest.render('groundnuts.ejs', { crops, page, totalPages })
        }
      }
    })
  } catch (e) {
    console.log(e)
    rest.redirect('/index')
  }
})


// Display all Soybean Farmers endpoint
app.get('/soybean', (req, rest) => {
  crops = undefined
  try {
    cropname = 'SOYBEAN'
    const page = parseInt(req.query.page) || 1; // Get the page from query params, default to 1
    const limit = 15; // Items per page
    const offset = (page - 1) * limit; // Calculate the offset
    const query = 'SELECT * FROM crops WHERE cropname = $1 LIMIT $2 OFFSET $3';
    client.query(query, [cropname, limit, offset], (err, res) => {
      if (err) {
        console.error('Error executing query', err.stack)
      } else {
        if (res.rowCount > 0) {
          for(let i=0;i<(res.rows).length;i++){
            res.rows[i].image_data=res.rows[i].image_data.toString('base64')
          }
          req.session.crops = res.rows
          crops = req.session.crops
          const totalCropsQuery = 'SELECT COUNT(*) FROM crops WHERE cropname = $1';
          client.query(totalCropsQuery, [cropname], (err, countResult) => {
            const totalCrops = parseInt(countResult.rows[0].count);
            const totalPages = Math.ceil(totalCrops / limit);
            rest.render('soybean.ejs', { crops, page, totalPages });
          });
        } else {
          req.session.crops = res.rows
          crops = req.session.crops
          user = req.session.loggedInUser
          const totalPages=1;
          console.log('You do not have crops in our Database')
          rest.render('soybean.ejs', { crops, page, totalPages })
        }
      }
    })
  } catch (e) {
    console.log(e)
    rest.redirect('/index')
  }
})

// Search Soybean Farmers endpoint
app.post('/soybean', (req, rest) => {
  crops = undefined
  try {
    cropname="SOYBEAN"
    const page = parseInt(req.query.page) || 1; // Get the page from query params, default to 1
    const limit = 15; // Items per page
    const offset = (page - 1) * limit; // Calculate the offset
    country = req.body.search_district
    country = country.toUpperCase()
    query = 'SELECT * FROM crops WHERE cropname = $1 AND country = $2 LIMIT $3 OFFSET $4'
    client.query(query, [cropname,country,limit, offset], (err, res) => {
      if (err) {
        console.error('Error executing query', err.stack)
      } else {
        if (res.rowCount > 0) {
          for(let i=0;i<(res.rows).length;i++){
            res.rows[i].image_data=res.rows[i].image_data.toString('base64')
          }
          req.session.crops = res.rows
          crops = req.session.crops
          const totalCropsQuery = 'SELECT COUNT(*) FROM crops WHERE cropname = $1 AND country = $2';
          client.query(totalCropsQuery, [cropname,country], (err, countResult) => {
            const totalCrops = parseInt(countResult.rows[0].count);
            const totalPages = Math.ceil(totalCrops / limit);
            rest.render('soybean.ejs', { crops, page, totalPages });
          });
        } else {
          req.session.crops = res.rows
          crops = req.session.crops
          user = req.session.loggedInUser
          const totalPages=1;
          console.log('We do not have ',cropname,' farmers in ',country)
          rest.render('soybean.ejs', { crops, page, totalPages })
        }
      }
    })
  } catch (e) {
    console.log(e)
    rest.redirect('/index')
  }
})

// Display all Rice Farmers endpoint
app.get('/rice', (req, rest) => {
  crops = undefined
  try {
    cropname = 'RICE'
    const page = parseInt(req.query.page) || 1; // Get the page from query params, default to 1
    const limit = 15; // Items per page
    const offset = (page - 1) * limit; // Calculate the offset
    const query = 'SELECT * FROM crops WHERE cropname = $1 LIMIT $2 OFFSET $3';
    client.query(query, [cropname, limit, offset], (err, res) => {
      if (err) {
        console.error('Error executing query', err.stack)
      } else {
        if (res.rowCount > 0) {
          for(let i=0;i<(res.rows).length;i++){
            res.rows[i].image_data=res.rows[i].image_data.toString('base64')
          }
          req.session.crops = res.rows
          crops = req.session.crops
          const totalCropsQuery = 'SELECT COUNT(*) FROM crops WHERE cropname = $1';
          client.query(totalCropsQuery, [cropname], (err, countResult) => {
            const totalCrops = parseInt(countResult.rows[0].count);
            const totalPages = Math.ceil(totalCrops / limit);
            rest.render('rice.ejs', { crops, page, totalPages });
          });
        } else {
          req.session.crops = res.rows
          crops = req.session.crops
          user = req.session.loggedInUser
          const totalPages=1;
          console.log('You do not have crops in our Database')
          rest.render('rice.ejs', { crops, page, totalPages })
        }
      }
    })
  } catch (e) {
    console.log(e)
    rest.redirect('/index')
  }
})

// Search Rice Farmers endpoint
app.post('/rice', (req, rest) => {
  crops = undefined
  try {
    cropname="RICE"
    const page = parseInt(req.query.page) || 1; // Get the page from query params, default to 1
    const limit = 15; // Items per page
    const offset = (page - 1) * limit; // Calculate the offset
    country = req.body.search_district
    country = country.toUpperCase()
    query = 'SELECT * FROM crops WHERE cropname = $1 AND country = $2 LIMIT $3 OFFSET $4'
    client.query(query, [cropname,country,limit, offset], (err, res) => {
      if (err) {
        console.error('Error executing query', err.stack)
      } else {
        if (res.rowCount > 0) {
          for(let i=0;i<(res.rows).length;i++){
            res.rows[i].image_data=res.rows[i].image_data.toString('base64')
          }
          req.session.crops = res.rows
          crops = req.session.crops
          const totalCropsQuery = 'SELECT COUNT(*) FROM crops WHERE cropname = $1 AND country = $2';
          client.query(totalCropsQuery, [cropname,country], (err, countResult) => {
            const totalCrops = parseInt(countResult.rows[0].count);
            const totalPages = Math.ceil(totalCrops / limit);
            rest.render('rice.ejs', { crops, page, totalPages });
          });
        } else {
          req.session.crops = res.rows
          crops = req.session.crops
          user = req.session.loggedInUser
          const totalPages=1;
          console.log('We do not have ',cropname,' farmers in ',country)
          rest.render('rice.ejs', { crops, page, totalPages })
        }
      }
    })
  } catch (e) {
    console.log(e)
    rest.redirect('/index')
  }
})

// Display all Wheat Farmers endpoint
app.get('/wheat', (req, rest) => {
  crops = undefined
  try {
    cropname = 'WHEAT'
    const page = parseInt(req.query.page) || 1; // Get the page from query params, default to 1
    const limit = 15; // Items per page
    const offset = (page - 1) * limit; // Calculate the offset
    const query = 'SELECT * FROM crops WHERE cropname = $1 LIMIT $2 OFFSET $3';
    client.query(query, [cropname, limit, offset], (err, res) => {
      if (err) {
        console.error('Error executing query', err.stack)
      } else {
        if (res.rowCount > 0) {
          for(let i=0;i<(res.rows).length;i++){
            res.rows[i].image_data=res.rows[i].image_data.toString('base64')
          }
          req.session.crops = res.rows
          crops = req.session.crops
          const totalCropsQuery = 'SELECT COUNT(*) FROM crops WHERE cropname = $1';
          client.query(totalCropsQuery, [cropname], (err, countResult) => {
            const totalCrops = parseInt(countResult.rows[0].count);
            const totalPages = Math.ceil(totalCrops / limit);
            rest.render('wheat.ejs', { crops, page, totalPages });
          });
        } else {
          req.session.crops = res.rows
          crops = req.session.crops
          user = req.session.loggedInUser
          const totalPages=1;
          console.log('You do not have crops in our Database')
          rest.render('wheat.ejs', { crops, page, totalPages })
        }
      }
    })
  } catch (e) {
    console.log(e)
    rest.redirect('/index')
  }
})

// Search Wheat Farmers endpoint
app.post('/wheat', (req, rest) => {
  crops = undefined
  try {
    cropname="WHEAT"
    const page = parseInt(req.query.page) || 1; // Get the page from query params, default to 1
    const limit = 15; // Items per page
    const offset = (page - 1) * limit; // Calculate the offset
    country = req.body.search_district
    country = country.toUpperCase()
    query = 'SELECT * FROM crops WHERE cropname = $1 AND country = $2 LIMIT $3 OFFSET $4'
    client.query(query, [cropname,country,limit, offset], (err, res) => {
      if (err) {
        console.error('Error executing query', err.stack)
      } else {
        if (res.rowCount > 0) {
          for(let i=0;i<(res.rows).length;i++){
            res.rows[i].image_data=res.rows[i].image_data.toString('base64')
          }
          req.session.crops = res.rows
          crops = req.session.crops
          const totalCropsQuery = 'SELECT COUNT(*) FROM crops WHERE cropname = $1 AND country = $2';
          client.query(totalCropsQuery, [cropname,country], (err, countResult) => {
            const totalCrops = parseInt(countResult.rows[0].count);
            const totalPages = Math.ceil(totalCrops / limit);
            rest.render('wheat.ejs', { crops, page, totalPages });
          });
        } else {
          req.session.crops = res.rows
          crops = req.session.crops
          user = req.session.loggedInUser
          const totalPages=1;
          console.log('We do not have ',cropname,' farmers in ',country)
          rest.render('wheat.ejs', { crops, page, totalPages })
        }
      }
    })
  } catch (e) {
    console.log(e)
    rest.redirect('/index')
  }
})

// Display all Tea Farmers endpoint
app.get('/tea', (req, rest) => {
  crops = undefined
  try {
    cropname = 'TEA'
    const page = parseInt(req.query.page) || 1; // Get the page from query params, default to 1
    const limit = 15; // Items per page
    const offset = (page - 1) * limit; // Calculate the offset
    const query = 'SELECT * FROM crops WHERE cropname = $1 LIMIT $2 OFFSET $3';
    client.query(query, [cropname, limit, offset], (err, res) => {
      if (err) {
        console.error('Error executing query', err.stack)
      } else {
        if (res.rowCount > 0) {
          for(let i=0;i<(res.rows).length;i++){
            res.rows[i].image_data=res.rows[i].image_data.toString('base64')
          }
          req.session.crops = res.rows
          crops = req.session.crops
          const totalCropsQuery = 'SELECT COUNT(*) FROM crops WHERE cropname = $1';
          client.query(totalCropsQuery, [cropname], (err, countResult) => {
            const totalCrops = parseInt(countResult.rows[0].count);
            const totalPages = Math.ceil(totalCrops / limit);
            rest.render('tea.ejs', { crops, page, totalPages });
          });
        } else {
          req.session.crops = res.rows
          crops = req.session.crops
          user = req.session.loggedInUser
          const totalPages=1;
          console.log('You do not have crops in our Database')
          rest.render('tea.ejs', { crops, page, totalPages })
        }
      }
    })
  } catch (e) {
    console.log(e)
    rest.redirect('/index')
  }
})

// Search Tea Farmers endpoint
app.post('/tea', (req, rest) => {
  crops = undefined
  try {
    cropname="TEA"
    const page = parseInt(req.query.page) || 1; // Get the page from query params, default to 1
    const limit = 15; // Items per page
    const offset = (page - 1) * limit; // Calculate the offset
    country = req.body.search_district
    country = country.toUpperCase()
    query = 'SELECT * FROM crops WHERE cropname = $1 AND country = $2 LIMIT $3 OFFSET $4'
    client.query(query, [cropname,country,limit, offset], (err, res) => {
      if (err) {
        console.error('Error executing query', err.stack)
      } else {
        if (res.rowCount > 0) {
          for(let i=0;i<(res.rows).length;i++){
            res.rows[i].image_data=res.rows[i].image_data.toString('base64')
          }
          req.session.crops = res.rows
          crops = req.session.crops
          const totalCropsQuery = 'SELECT COUNT(*) FROM crops WHERE cropname = $1 AND country = $2';
          client.query(totalCropsQuery, [cropname,country], (err, countResult) => {
            const totalCrops = parseInt(countResult.rows[0].count);
            const totalPages = Math.ceil(totalCrops / limit);
            rest.render('tea.ejs', { crops, page, totalPages });
          });
        } else {
          req.session.crops = res.rows
          crops = req.session.crops
          user = req.session.loggedInUser
          const totalPages=1;
          console.log('We do not have ',cropname,' farmers in ',country)
          rest.render('tea.ejs', { crops, page, totalPages })
        }
      }
    })
  } catch (e) {
    console.log(e)
    rest.redirect('/index')
  }
})

// Display all Fruits Farmers endpoint
app.get('/fruits', (req, rest) => {
  crops = undefined
  try {
    cropname = 'FRUITS'
    const page = parseInt(req.query.page) || 1; // Get the page from query params, default to 1
    const limit = 15; // Items per page
    const offset = (page - 1) * limit; // Calculate the offset
    const query = 'SELECT * FROM crops WHERE cropname = $1 LIMIT $2 OFFSET $3';
    client.query(query, [cropname, limit, offset], (err, res) => {
      if (err) {
        console.error('Error executing query', err.stack)
      } else {
        if (res.rowCount > 0) {
          for(let i=0;i<(res.rows).length;i++){
            res.rows[i].image_data=res.rows[i].image_data.toString('base64')
          }
          req.session.crops = res.rows
          crops = req.session.crops
          const totalCropsQuery = 'SELECT COUNT(*) FROM crops WHERE cropname = $1';
          client.query(totalCropsQuery, [cropname], (err, countResult) => {
            const totalCrops = parseInt(countResult.rows[0].count);
            const totalPages = Math.ceil(totalCrops / limit);
            rest.render('fruits.ejs', { crops, page, totalPages });
          });
        } else {
          req.session.crops = res.rows
          crops = req.session.crops
          user = req.session.loggedInUser
          const totalPages=1;
          console.log('You do not have crops in our Database')
          rest.render('fruits.ejs', { crops, page, totalPages })
        }
      }
    })
  } catch (e) {
    console.log(e)
    rest.redirect('/index')
  }
})

// Search Fruits Farmers endpoint
app.post('/fruits', (req, rest) => {
  crops = undefined
  try {
    cropname="FRUITS"
    const page = parseInt(req.query.page) || 1; // Get the page from query params, default to 1
    const limit = 15; // Items per page
    const offset = (page - 1) * limit; // Calculate the offset
    country = req.body.search_district
    country = country.toUpperCase()
    query = 'SELECT * FROM crops WHERE cropname = $1 AND country = $2 LIMIT $3 OFFSET $4'
    client.query(query, [cropname,country,limit, offset], (err, res) => {
      if (err) {
        console.error('Error executing query', err.stack)
      } else {
        if (res.rowCount > 0) {
          for(let i=0;i<(res.rows).length;i++){
            res.rows[i].image_data=res.rows[i].image_data.toString('base64')
          }
          req.session.crops = res.rows
          crops = req.session.crops
          const totalCropsQuery = 'SELECT COUNT(*) FROM crops WHERE cropname = $1 AND country = $2';
          client.query(totalCropsQuery, [cropname,country], (err, countResult) => {
            const totalCrops = parseInt(countResult.rows[0].count);
            const totalPages = Math.ceil(totalCrops / limit);
            rest.render('fruits.ejs', { crops, page, totalPages });
          });
        } else {
          req.session.crops = res.rows
          crops = req.session.crops
          const totalPages=1;
          user = req.session.loggedInUser
          console.log('We do not have ',cropname,' farmers in ',country)
          rest.render('fruits.ejs', { crops, page, totalPages })
        }
      }
    })
  } catch (e) {
    console.log(e)
    rest.redirect('/index')
  }
})

// Partners endpoint
app.get('/partners', (req, res) => {
  res.render('partners.ejs')
})

// Signup get endpoint
app.get('/signup', (req, res) => {
  res.render('signup.ejs')
})

// Login get endpoint
app.get('/login', (req, res) => {
  res.render('login.ejs')
})

// Login get endpoint
app.get('/farmerdashboard', (req, res) => {
  res.render('farmerdashboard.ejs')
})

// Reset Password get endpoint
app.get('/resetpass', (req, res) => {
  res.render('resetpass.ejs')
})

// Farmer Dashboard get endpoint
app.get('/localfarmerdashboard', (req, res) => {
  if (req.session.loggedInUser) {
  } else {
    console.log('No user logged in.')
  }
  res.render('localfarmerdashboard.ejs', { user: req.session.loggedInUser })
})

// Edit Profile get endpoint
app.get('/editprofile', (req, res) => {
  if (req.session.loggedInUser) {
  } else {
    console.log('No user logged in.')
  }
  res.render('editprofile.ejs', { user: req.session.loggedInUser })
})

// View Crops endpoint
app.get('/viewcrops', (req, rest) => {
  crops = undefined
  if (req.session.loggedInUser) {
    try {
      contact = req.session.loggedInUser.phone

      query = 'SELECT * FROM crops WHERE ownercontact = $1'
      client.query(query, [contact], (err, res) => {
        if (err) {
          console.error('Error executing query', err.stack)
        } else {
          if (res.rowCount > 0) {
            req.session.crops = res.rows
            crops = req.session.crops
            user = req.session.loggedInUser
            rest.render('viewcrops.ejs', { user, crops })
          } else {
            req.session.crops = res.rows
            crops = req.session.crops
            user = req.session.loggedInUser
            console.log('You do not have crops in our Database')
            rest.render('viewcrops.ejs', { user, crops })
          }
        }
      })
    } catch (e) {
      console.log(e)
      rest.redirect('/farmerdashboard')
    }
  } else {
    console.log('No user logged in.')
    rest.redirect('/farmerdashboard')
  }
})

// Add Crop get endpoint
app.get('/addcrop', (req, res) => {
  if (req.session.loggedInUser) {
  } else {
    console.log('No user logged in.')
  }
  res.render('addcrop.ejs', { user: req.session.loggedInUser })
})

// Delete Crop get endpoint
app.get('/deletecrop', (req, res) => {
  if (req.session.loggedInUser) {
  } else {
    console.log('No user logged in.')
  }
  res.render('deletecrop.ejs', { user: req.session.loggedInUser })
})

// Logout endpoint
app.get('/logout', (req, res) => {
  // Destroy the session
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Error in destroying session')
    }
    console.log('Successfully log out and session destroyed')
    res.redirect('/login')
  })
})

// Start the server
app.listen(process.env.PORT, () => {
  console.log(`Server is running on http://localhost:${process.env.PORT}`)
})