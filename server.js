const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const mysql = require('mysql');

const app = express();


app.use(express.static('public'));

let patients = [];
let generalInfo = [];
let fluorography = [];
let surgicalintervention = [];
let vaccinationstatus = [];

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '.jpg') //Appending .jpg
    }
});

const upload = multer({storage: storage});

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

connection.query('SELECT * FROM patient', (err, rows) => {
    if (err) throw err;
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
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'origin, content-type, accept');
    const patient = {
        id: +Date.now().toString().split('').slice(6).join(''),
        name: req.body.name,
        photo: req.file.filename
    };
    patients.push(patient);
    connection.query(`INSERT INTO patient VALUES (${patient.id}, '${patient.name}', '${patient.photo}')`, (err, rows) => {
        if (err) throw err;
    });
    res.send(patient);
});

app.put('/patient', upload.single('file'), function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'origin, content-type, accept');
    let photo = req.file?req.file.filename:req.body.photoName;
    const patient = {
        id: req.body.id,
        name: req.body.name,
        photo: photo
    };
    connection.query(`UPDATE mydb.patient SET name="${patient.name}", photo="${patient.photo}" WHERE id=${patient.id}`, (err, rows) => {
        if (err) throw err;
    });
    connection.query('SELECT * FROM patient', (err, rows) => {
        if (err) throw err;
        patients = rows;
    });
    res.send(patient);
});

app.delete('/patient/:id', function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'origin, content-type, accept');
    connection.query(`DELETE FROM mydb.patient WHERE id = ${req.params.id}`, (err) => {
        if (err) throw err;
    });
    connection.query('SELECT * FROM patient', (err, rows) => {
        if (err) throw err;
        patients = rows;
    });
});

app.get('/generalInfo/:patientId', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'origin, content-type, accept');
    connection.query(`SELECT * FROM mydb.generalInfo WHERE patientId = ${req.params.patientId}`, (err, rows) => {
        if (err) throw err;
        generalInfo = rows[0];
    });
    setTimeout(() => {
        res.send(generalInfo);
    }, 1000);
});


app.put('/generalInfo', function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'origin, content-type, accept');
    connection.query(`UPDATE mydb.generalinfo SET birthday="${"2000-09-09"}", 
    weight="${req.body.weight}",
     height="${req.body.height}",
     arterialPressure="${req.body.arterialPressure}",
     bloodType="${req.body.bloodType}"
     WHERE id=${req.body.id}`, (err, rows) => {
        if (err) throw err;
    });

    res.send('OK');
});


app.get('/fluorography/:generalInfoId', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'origin, content-type, accept');
    connection.query(`SELECT * FROM mydb.fluorography WHERE GeneralInfo_id = ${req.params.generalInfoId}`, (err, rows) => {
        if (err) throw err;
        fluorography = rows;
    });
    setTimeout(() => {
        res.send(fluorography);
    }, 1000);
});

app.post('/fluorography',  function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'origin, content-type, accept');
    connection.query(`INSERT INTO mydb.fluorography VALUES (${req.body.id},
        '${req.body.procedureDate.split("T")[0]}',
        '${req.body.info}',
        '${req.body.GeneralInfo_id}')`, (err, rows) => {
        if (err) throw err;
    });
    res.send("OK");
});
app.delete('/fluorography/:id', function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'origin, content-type, accept');
    connection.query(`DELETE FROM mydb.fluorography WHERE id = ${req.params.id}`, (err) => {
        if (err) throw err;
    });
    res.send("OK");
});


app.post('/surgicalintervention',  function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'origin, content-type, accept');
    connection.query(`INSERT INTO mydb.surgicalintervention VALUES (${req.body.id},
        '${req.body.procedureDate.split("T")[0]}',
        '${req.body.diagnosis}',
        '${req.body.interventionType}',
        '${req.body.GeneralInfo_id}',
        '${req.body.GeneralInfo_id}')`, (err, rows) => {
        if (err) throw err;
    });
    res.send("OK");
});
app.delete('/surgicalintervention/:id', function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'origin, content-type, accept');
    connection.query(`DELETE FROM mydb.surgicalintervention WHERE id = ${req.params.id}`, (err) => {
        if (err) throw err;
    });
    res.send("OK");
});
app.post('/vaccinationstatus',  function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'origin, content-type, accept');
    connection.query(`INSERT INTO mydb.vaccinationstatus VALUES (${req.body.id},
        '${req.body.procedureDate.split("T")[0]}',
        '${req.body.info}',
        '${req.body.GeneralInfo_id}')`, (err, rows) => {
        if (err) throw err;
    });
    res.send("OK");
});
app.delete('/vaccinationstatus/:id', function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'origin, content-type, accept');
    connection.query(`DELETE FROM mydb.vaccinationstatus WHERE id = ${req.params.id}`, (err) => {
        if (err) throw err;
    });
    res.send("OK");
});

app.get('/surgicalintervention/:generalInfoId', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'origin, content-type, accept');
    connection.query(`SELECT * FROM mydb.surgicalintervention WHERE GeneralInfo_id = ${req.params.generalInfoId}`, (err, rows) => {
        if (err) throw err;
        surgicalintervention = rows;
    });
    setTimeout(() => {
        res.send(surgicalintervention);
    }, 1000);
});

app.get('/vaccinationstatus/:generalInfoId', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'origin, content-type, accept');
    connection.query(`SELECT * FROM mydb.vaccinationstatus WHERE GeneralInfo_id = ${req.params.generalInfoId}`, (err, rows) => {
        if (err) throw err;
        vaccinationstatus = rows;
    });
    setTimeout(() => {
        res.send(vaccinationstatus);
    }, 1000);
});

app.listen(3012, () => {
    console.log(123);
});
