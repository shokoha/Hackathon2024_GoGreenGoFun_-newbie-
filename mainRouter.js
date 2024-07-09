var express = require('express');
var app = express();
var path = require('path');
var router = express.Router();
var port = 4099;
var mysql = require('mysql');
var bodyParser = require('body-parser');

const dbConfig = {
  host: "localhost",
  post: 3306,
  user: 'st66099',
  password: '666.MySQL',
  database: 'st66099db'

};

const connection = mysql.createConnection(dbConfig);

// ใช้ body-parser สำหรับการแปลง JSON request body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

connection.connect(err => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the database');
});

var ejs = require('ejs');
//----------------------------------------------------------------------------------------//
// ให้บริการไฟล์สแตติกจากโฟลเดอร์ page


// Route สำหรับหน้าแรก : login
router.get('/', function (request, response) {
  app.use(express.static(path.join(__dirname + '/page/login/')))
  response.sendFile(path.join(__dirname, 'page/login/login.html'));
});
router.get('/login', function (request, response) {
  app.use(express.static(path.join(__dirname + '/page/login/')))
  response.sendFile(path.join(__dirname, 'page/login/login.html'));
});
router.get('/loginToHomepage', function (request, response) {
  const loginData = {
    EmailOrPhone: request.query.phoneOrEmail,
    password: request.query.password,
  };

  const sql = "SELECT * FROM accounts WHERE emailOrPhonenumber = ? AND password = ?";
  connection.query(sql, [loginData.EmailOrPhone, loginData.password], function (errorSQL, results) {
    if (errorSQL) {
      throw errorSQL;
    }

    if (results.length > 0) {
      // Found matching login credentials
      const userId = results[0].idAccount; // Assuming idAccount is the user ID column name
      // Set userId in localStorage
      response.send(`
        <script>
          localStorage.setItem('userId', '${userId}');
          alert("Login successful!");
          window.location="/homepage";
        </script>
      `);
    } else {
      // No matching credentials found
      response.send('Invalid email/phone or password.');
    }
  });
});
router.get('/forgetpage', function (request, response) {
  app.use(express.static(path.join(__dirname + '/page/new-password/')))
  response.sendFile(path.join(__dirname, 'page/new-password/newpassword.html'));
});


router.get('/forgotpassword', function (req, res) {
  const username = req.query.username;

  const sql = "SELECT password FROM accounts WHERE fullname = ?";
  connection.query(sql, [username], function (error, results, fields) {
    if (error) {
      throw error;
    }

    if (results.length > 0) {
      const password = results[0].password;
      res.send(`<script>alert("Your password is: ${password}"); window.location.href = "/";</script>`);
    } else {
      // No matching username found
      res.send('<script>alert("Invalid username."); window.location.href = "/";</script>');
    }
  });
});

  // Route สำหรับหน้า homepage
  app.get('/homepage', function (request, response) {
    app.use(express.static(path.join(__dirname + '/page/homepage/')))
    response.sendFile(path.join(__dirname, 'page/homepage/homepage.html'));
  });

  app.post('/homepage', function (req, res) {
    const details = req.body.details;

    // ทำการประมวลผลหรือบันทึกข้อมูลต่อไปที่ต้องการทำ
    console.log('Received details from client:', details);

    // ส่งข้อมูลตอบกลับไปยัง client-side
    res.status(200).json({ message: '<p >Hello</p>' });
});

 

  app.use(express.json());




  // Route สำหรับหน้า register
  app.get('/register', function (request, response) {
    app.use(express.static(path.join(__dirname + '/page/registers/')))
    response.sendFile(path.join(__dirname + '/page/registers/register.html'))
  })


  app.post('/SignUp', function (request, response) {
    const userData = request.body;

    const sql = "INSERT INTO accounts (emailOrPhonenumber, password, fullname, birthday, gender) VALUES (?, ?, ?, ?, ?)";
    const birthday = `${userData.month} ${userData.day} ${userData.year}`;

    connection.query(sql, [userData.phoneNumberOrEmail, userData.password, userData.fullname, birthday, userData.gender], function (errorSQL, results) {
        if (errorSQL) {
            return response.json({ success: false, message: 'Error occurred: ' + errorSQL.message });
        }
        response.json({ success: true, message: 'Your account has been created successfully!' });
        
    });
});


  //Route สำหรับหน้า userprofile 
  app.get('/userprofile', function (request, response) {
    app.use(express.static(path.join(__dirname + '/page/userprofile/')))
    response.sendFile(path.join(__dirname, 'page/userprofile/userprofile.html'));
  })

  //Route สำหรับหน้า shoppingcart
  app.get('/shoppingcart', function (request, response) {
    app.use(express.static(path.join(__dirname + '/page/shoppingcart/')))
    response.sendFile(path.join(__dirname, 'page/shoppingcart/shoppingcart.html'));
  })

  app.get('/get-cart-items', (req, res) => {
    const userId = req.query.userId; 
    
    sql="SELECT p.name, p.description, o.quantity ,p.price, (quantity*price) as 'total'" 
        +" From orders o join products p on o.idProduct = p.idProduct"
        +" join accounts a on o.idAccount = a.idAccount where o.idAccount = ? ";

    connection.query(sql, [userId] ,(error, results) => {
        if (error) {
            console.error('Error fetching data from MySQL:', error);
            res.status(500).json({ error: 'Error fetching data' });
            return;
        }
        res.json(results);
    });
});

  //Route สำหรับหน้า checkout
  app.get('/checkout', function (request, response) {
    app.use(express.static(path.join(__dirname + '/page/checkout/')))
    response.sendFile(path.join(__dirname, 'page/checkout/checkout.html'));
  })
  app.get('/confirmorder', function (req, res) {
    // ตรวจสอบว่า userId ถูกกำหนดค่าหรือไม่
    const userId = req.query.userId;
   
    // เขียน query SQL เพื่อลบข้อมูลจากฐานข้อมูล
    const sql = `DELETE FROM orders WHERE idAccount = ?`;

    // ใช้ connection.query ในการส่งคำสั่ง SQL ไปยังฐานข้อมูล
    connection.query(sql, [userId], (error, results) => {
        if (error) {
            console.error('Error deleting data from MySQL:', error);
            return res.status(500).json({ error: 'Error deleting data' });
        }

        // หลังจากลบข้อมูลเสร็จสิ้นในฐานข้อมูล
        // ส่งคำตอบกลับเพื่อแสดง alert บนหน้า shopping cart
        res.send('<script>alert("Order confirmed and deleted successfully."); window.location.href = "/shoppingcart";</script>');
    });
});

  // app.use('/img', express.static(path.join(__dirname + '/./page/productdetail/img')));// Route สำหรับหน้า productdetail ที่รับ productId เป็นพารามิเตอร์
  app.get('/productdetail', function (request,response) {
    app.use(express.static(path.join(__dirname +'/page/productdetail/')))
      response.sendFile(path.join(__dirname, 'page/productdetail/productdetail.html'));
  })

  // Route to handle adding items to the order table
app.post('/add-to-cart', (req, res) => {
  const { productId, quantity, userId } = req.body;

  // Example SQL query to insert into the order table
  
const sql = `INSERT INTO orders (idProduct, quantity, idAccount, status, orderDate) VALUES (?, ?, ?, 'incomplete', NOW())`;
connection.query(sql, [productId, quantity, userId], (err, result) => {
    if (err) {
        console.error('Error adding to cart:', err);
        res.status(500).json({ error: 'Error adding to cart' });
        return;
    }
    res.status(200).json({ message: 'Added to cart successfully' });
});
});

  




  app.use('/', router);

  var server = app.listen(port, '10.4.53.25', function () {
    console.log('Go Green Go Fun App is deployed !!');
  });

