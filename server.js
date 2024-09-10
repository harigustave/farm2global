const { Client } = require('pg')

//DB configurations
const client = new Client({
  user: 'postgres',
  password: 'rwanda',
  host: 'localhost',
  port: '5432',
  database: 'farm2global'
})

client.connect()

const express = require('express')
const session = require('express-session')
const app = express()
const bcrypt = require('bcrypt')

// Set up session middleware
app.use(
  session({
    secret: 'rwanda123',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
  })
)

const port = 2000

app.use(express.static('views'))
app.set('view engine', 'ejs')

app.use(express.urlencoded({ extended: false }))

// Signup endpoint
app.post('/signup', async (req, res) => {
  try {
    const hashedpassword = await bcrypt.hash(req.body.password, 10)
    firstname = req.body.firstname.toUpperCase()
    lastname = req.body.lastname.toUpperCase()
    phonenumber = req.body.phonenumber
    country = req.body.country.toUpperCase()
    nid = req.body.nid

    const query =
      'INSERT INTO farmers(firstname, lastname, phone, passwd, country, nationalid, digitalid) VALUES ($1, $2, $3, $4, $5, $6, $7)'
    const values = [
      firstname,
      lastname,
      phonenumber,
      hashedpassword,
      country,
      nid,
      ''
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

// Login endpoint
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
              rest.redirect('/farmerdashboard')
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

// Login endpoint
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
              rest.redirect('/farmerdashboard')
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

//Edit Profile endpoint
app.post('/editprofile', (req, res) => {
  try {
    phonenumber = req.body.phonenumber
    nationalid = req.body.nid

    if (phonenumber == '' && nationalid == '') {
      console.log('Profile Not Updated. User Provided empty entries')
    } else if (phonenumber != '' && nationalid == '') {
      try {
        nationalid = req.session.loggedInUser.nationalid
        console.log('National ID: ', nationalid)
        const query =
          'UPDATE farmers SET phone = $1 WHERE nationalid = $2 RETURNING *'
        const values = [phonenumber, nationalid]
        client.query(query, values, (err, res) => {
          if (err) {
            console.error(err.detail)
            return
          }
          console.log('Phone number updated successfully')
        })
        res.redirect('/editprofile')
      } catch (e) {
        console.log(e)
        res.redirect('/editprofile')
      }
    } else if (phonenumber == '' && nationalid != '') {
      try {
        phonenumber = req.session.loggedInUser.phone
        const query =
          'UPDATE farmers SET nationalid = $1 WHERE phone = $2 RETURNING *'
        const values = [nationalid, phonenumber]
        client.query(query, values, (err, res) => {
          if (err) {
            console.error(err.detail)
            return
          }
          console.log('National ID updated successfully!!!')
        })
        res.redirect('/editprofile')
      } catch (e) {
        console.log(e)
        res.redirect('/editprofile')
      }
    } else {
      try {
        phonenum = req.session.loggedInUser.phone
        const query =
          'UPDATE farmers SET nationalid = $1,phone = $2 WHERE phone = $3 RETURNING *'
        const values = [nationalid, phonenumber, phonenum]
        client.query(query, values, (err, res) => {
          if (err) {
            console.error(err.detail)
            return
          }
          console.log('All entries are updates successfully!!!')
        })
        res.redirect('/editprofile')
      } catch (e) {
        console.log(e)
        res.redirect('/editprofile')
      }
    }
  } catch (e) {
    console.log(e)
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

    country = req.session.loggedInUser.country

    fall = req.body.fall
    summer = req.body.summer
    spring = req.body.spring
    if (fall == undefined) {
      fall = ''
    }
    if (summer == undefined) {
      summer = ''
    }
    if (spring == undefined) {
      spring = ''
    }
    seasons = fall + ' ' + summer + ' ' + spring
    seasons = seasons.trim()

    croname = req.body.cpname.toUpperCase()

    seasonqty = req.body.qty

    const query =
      'INSERT INTO crops(ownercontact, ownername, country, cropname, harvestseasons, qtyperseason) VALUES ($1, $2, $3, $4, $5, $6)'
    const values = [contact, fullname, country, croname, seasons, seasonqty]

    client.query(query, values, (err, res) => {
      if (err) {
        console.error(err.detail)
        return
      }
      console.log('Crop data insert successful!!!')
    })
    res.redirect('/addcrop')
  } catch (e) {
    console.log(e)
    res.redirect('/addcrop')
  }
})

//Delete Crop endpoint
app.post('/deletecrop', (req, res) => {
  try {
    contact = req.session.loggedInUser.phone

    croname = req.body.cpname
    croname = croname.toUpperCase()

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
            res.redirect('/deletecrop')
          }
        } else {
          console.log(`You do not have ${croname} in our Database`)
        }
      }
    })
    res.redirect('/deletecrop')
  } catch (e) {
    console.log(e)
    res.redirect('/deletecrop')
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

// Cotton Crops endpoint
app.get('/cotton', (req, rest) => {
  crops = undefined
  try {
    cropname = 'COTTON'

    query = 'SELECT * FROM crops WHERE cropname = $1'
    client.query(query, [cropname], (err, res) => {
      if (err) {
        console.error('Error executing query', err.stack)
      } else {
        if (res.rowCount > 0) {
          req.session.crops = res.rows
          crops = req.session.crops
          rest.render('cotton.ejs', { crops })
        } else {
          req.session.crops = res.rows
          crops = req.session.crops
          user = req.session.loggedInUser
          console.log('You do not have crops in our Database')
          rest.render('cotton.ejs', { crops })
        }
      }
    })
  } catch (e) {
    console.log(e)
    rest.redirect('/index')
  }
})

// Coffee Crops endpoint
app.get('/coffee', (req, rest) => {
  crops = undefined
  try {
    cropname = 'COFFEE'

    query = 'SELECT * FROM crops WHERE cropname = $1'
    client.query(query, [cropname], (err, res) => {
      if (err) {
        console.error('Error executing query', err.stack)
      } else {
        if (res.rowCount > 0) {
          req.session.crops = res.rows
          crops = req.session.crops
          rest.render('coffee.ejs', { crops })
        } else {
          req.session.crops = res.rows
          crops = req.session.crops
          user = req.session.loggedInUser
          console.log('You do not have crops in our Database')
          rest.render('coffee.ejs', { crops })
        }
      }
    })
  } catch (e) {
    console.log(e)
    rest.redirect('/index')
  }
})

// Testimonials endpoint
app.get('/testimonial', (req, res) => {
  res.render('testimonial.ejs')
})

// Signup get endpoint
app.get('/signup', (req, res) => {
  res.render('signup.ejs')
})

// Login get endpoint
app.get('/login', (req, res) => {
  res.render('login.ejs')
})

// Reset Password get endpoint
app.get('/resetpass', (req, res) => {
  res.render('resetpass.ejs')
})

// Farmer Dashboard get endpoint
app.get('/farmerdashboard', (req, res) => {
  if (req.session.loggedInUser) {
  } else {
    console.log('No user logged in.')
  }
  res.render('farmerdashboard.ejs', { user: req.session.loggedInUser })
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
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
})
