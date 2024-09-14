# Initial Setup:

0. **DBMS To Install:** PostgreSQL\

**DB Specifications:** (Change below values in **server.js** Line 5~9 accordingly)

1. **DB Name:** farm2global
2. **DB User:** <YOUR_DB_USER> 
3. **DB Password:** <YOUR_DB_PASSWORD>
4. **Host:** 'localhost'
5. **Port:** <YOUR_DB_PORT>

**Tables:**

**farmers:**  
   
**Table Fields:**

1. firstname **VARCHAR(255)**
2. lastname **VARCHAR(255)**
3. phone **VARCHAR(20)**
4. passwd **VARCHAR(255)**
5. country **VARCHAR(30)**
6. nationalid **VARCHAR(30)**
7. digitalid **VARCHAR(255)**
8. image_data **BYTEA**
9. mime_type **TEXT**

**crops**
   
**Table Fields:**

1. ownercontact **VARCHAR(30)**
2. ownername **VARCHAR(50)**
3. country **VARCHAR(30)**
4. cropname **VARCHAR(80)**
5. harvestseasons **VARCHAR(50)**
6. qtyperseason **DOUBLE**
7. image_data **BYTEA**
8. mime_type **TEXT**

# How to run the application
1. Install and install NodeJS (https://nodejs.org/en/download/package-manager)
2. Fork the repo
3. Download and install Git (https://git-scm.com/)
4. Clone the repo (Command: git clone https://github.com/harigustave/farm2global.git)
5. Using VS Code Terminal, navigate to the cloned repo name folder
6. Run: ***npm install***
7. Run: ***npm run devStart***
8. In the browser, enter ***localhost:2000/***
9. You can navigate all tabs for **Farm2Global**.But For **My Account** tab, you need to register/Login
10. To register as a farmer, click on **Account Register** and put all details required. 
  **N.B:** Note the phone number and password used while registering because they will be used to login
11. To login as a farmer, Click on **Account Login** and enter the correct **Phone number** and **Password**
12. Once on farmers dashboard, we recommend to update your profile picture as it will be used while showing   your farming information globally. 
   **N.B:** We recomend using jpg picture of size 360x450. If you dont have the picture(s) with mentioned specifications, use the picture in this current directory **farm2global/img/farmers images**. We have prepared pictures with required specifications for you to test.
13. After Updating the profile, you can navigate othe tabs such as View Crops, Add Crops.
14. Intitially, View Crops will show you empty crops as you did not create/add crop to the Database
15. To add one, from the menu Click **Add Crop** and for testing purpose put "coffee" as crop name and fill other remaining fields. Currently we have coffee as functional crop name, pages for others crops are still being developed. The reason why we request you to use coffee only for testing purpose.
16. After submiting the new crop, Open another new tab in the same browser and enter **localhost:2000/** and hit enter, and on the slideshow of **coffee crop** click on **Explore** button, you can see the crops that you have registered appearing. Thus your global visibility.
17. If you are no longer producing such crop, go to that page **(Step 13)** and **View Crops** and Click **Delete**. After, if you repeat **(Step 16)**, you will see that you are no longer appearing on the page.

# Step (11) To login using MOSIP eSignet:

1. Click "**Sign in using eSignet**"
2. Choose Login with **OTP**
3. Enter Test UNI  **4259643861** and click **Get OTP**
4. Enter **111111** six ones as test OTP and click **Verify**
5. To validate the farmer's Phone number, Enter the phone number that you have registered on **STEP 10** and click **Continue**
6. Proceed with normal activities from **STEP 12**


**THANK YOU**

* In case you face an issue, Contact us: **higustave@gmail.com**  **+250782256907**
