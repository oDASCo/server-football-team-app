const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const mysql = require('mysql');

const app = express();


app.use(express.static('public'));

let patients = [];

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '.jpg') //Appending .jpg
    }
});

const upload = multer({ storage: storage });

const connection = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'root',
    database: 'mydb'
});
connection.connect((err) => {
    if (err) throw err;
    console.log('Connected!');
});

connection.query('SELECT * FROM patient', (err,rows) => {
    if(err) throw err;
    patients = rows;
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


app.get('/', (req, res) => {
    res.send('hello api');
});

app.get('/patient', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'origin, content-type, accept');
    res.send(patients);
});

app.get('/patient/:id', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'origin, content-type, accept');
    const patient = patients.find((patient) => {
        return patient.id === Number(req.params.id);
    });
    res.send(patient);
});

app.post('/patient', upload.single('file'), function (req, res, next) {
    const patient = {
        id: +Date.now().toString().split('').slice(6).join(''),
        name: req.body.name,
        photo: req.file.filename
    };
    patients.push(patient);
    connection.query(`INSERT INTO patient VALUES (${patient.id}, '${patient.name}', '${patient.photo}')`, (err,rows) => {
        if(err) throw err;
    });
    res.send(patient);
    res.sendStatus(200);
});



app.listen(3012, () => {
    console.log(123);
});
