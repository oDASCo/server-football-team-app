var mysql = require('mysql');

var con = mysql.createConnection({
    host: "localhost",
    port: 3000,
    user: "root",
    password: "root"
});

con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
});
