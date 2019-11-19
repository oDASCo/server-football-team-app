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
    connection.query(`INSERT INTO patient VALUES (${patient.id}, '${patient.name}', '${patient.photo}')`,
        (err, rows) => {
            if (err) throw err;
        });
    connection.query(`INSERT INTO generalinfo VALUES (${patient.id}, '${'2000-01-01'}',
     '${0}', '${0}', '${0}', '${0}', '${patient.id}')`,
        (err, rows) => {
            if (err) throw err;
        });
    res.send(patient);
});

app.put('/patient', upload.single('file'), function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'origin, content-type, accept');
    let photo = req.file ? req.file.filename : req.body.photoName;
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

    deleteIllness(req.params.id);

    let medExams = [];
    connection.query(`SELECT * FROM mydb.medicalexamination WHERE patientId = ${req.params.id}`,
        (err, rows) => {
            medExams = rows;
            medExams.forEach(item => {
                deleteMedExam(item.id);

                connection.query(`DELETE FROM mydb.fluorography WHERE GeneralInfo_id = ${req.params.id}`, (err) => {
                    if (err) throw err;
                });
                connection.query(`DELETE FROM mydb.surgicalintervention WHERE GeneralInfo_id = ${req.params.id}`, (err) => {
                    if (err) throw err;
                });
                connection.query(`DELETE FROM mydb.vaccinationstatus WHERE GeneralInfo_id = ${req.params.id}`, (err) => {
                    if (err) throw err;
                });
                connection.query(`DELETE FROM mydb.generalinfo WHERE patientId = ${req.params.id}`, (err) => {
                    if (err) throw err;
                });
                connection.query(`DELETE FROM mydb.patient WHERE id = ${req.params.id}`, (err) => {
                    if (err) throw err;
                });

            });
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
    }, 500);
});

app.put('/generalInfo', async function (req, res, next) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'origin, content-type, accept');
        try {
            await connection.query(`UPDATE mydb.generalinfo SET birthday="${req.body.date}", 
    weight="${req.body.weight}",
     height="${req.body.height}",
     arterialPressure="${req.body.arterialPressure}",
     bloodType="${req.body.bloodType}"
     WHERE id=${req.body.id}`, (err, rows) => {
                if (err) throw err;
            });
            app.get('/generalInfo/:patientId', async (req, res) => {
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Access-Control-Allow-Headers', 'origin, content-type, accept');
                try {
                    await connection.query(`SELECT * FROM mydb.generalInfo WHERE patientId = ${req.params.patientId}`,
                        (err, rows) => {
                            if (err) throw err;
                            generalInfo = rows[0];
                        });
                    res.send(generalInfo);
                } catch (err) {
                    // res.sendStatus(500);
                }
            });
            res.sendStatus(200).send('OK');
        } catch (err) {
            // res.sendStatus(500);
        }
    }
);

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

app.post('/fluorography', function (req, res, next) {
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

app.post('/surgicalintervention', function (req, res, next) {
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

app.post('/vaccinationstatus', function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'origin, content-type, accept');
    connection.query(`INSERT INTO mydb.vaccinationstatus VALUES (${req.body.id},
        '${req.body.procedureDate.split("T")[0]}',
        '${req.body.info}',
        '${req.body.GeneralInfo_id}',
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

let medicalExamination = [];

app.get('/medicalExamination/:patientId', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'origin, content-type, accept');
    connection.query(`SELECT * FROM mydb.medicalexamination WHERE patientId = ${req.params.patientId}`,
        (err, rows) => {
            if (err) throw err;
            medicalExamination = rows;
            medicalExamination.forEach(row => {
                getRows(row.id, 'bloodchemistryanalysis', function (data) {
                    row.bloodchemistryanalysis = data;
                });
                getRows(row.id, 'doctordiagnosis', function (data) {
                    row.doctordiagnosis = data;
                });
                getRows(row.id, 'electrocardiogram', function (data) {
                    row.electrocardiogram = data;
                });
                getRows(row.id, 'generalbloodanalysis', function (data) {
                    row.generalbloodanalysis = data;
                });
                getRows(row.id, 'generalurineanalysis', function (data) {
                    row.generalurineanalysis = data;
                });
                getRows(row.id, 'heartultrasound', function (data) {
                    row.heartultrasound = data;
                });
            });
        });

    function getRows(medId, rowName, callback) {
        if (rowName === 'generalurineanalysis') {
            connection.query(`SELECT * FROM mydb.${rowName} WHERE medicalExamnationId = ${medId}`,
                (err, rows) => {
                    if (err) throw err;
                    callback(rows);
                });
        } else {
            connection.query(`SELECT * FROM mydb.${rowName} WHERE medicalExaminationId = ${medId}`,
                (err, rows) => {
                    if (err) throw err;
                    callback(rows);
                });
        }

    }

    setTimeout(() => {
        res.send(medicalExamination);
    }, 1000);
});
let fields = [{name: 'bloodchemistryanalysis'},
    {name: 'electrocardiogram'},
    {name: 'generalbloodanalysis'},
    {name: 'generalurineanalysis'},
    {name: 'heartultrasound'}
];
app.post('/medicalExamination', upload.fields(fields), function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'origin, content-type, accept');
    const medicalExamination = {
        id: +Date.now().toString().split('').slice(6).join(''),
        patientId: req.body.patientId,
        date: req.body.date,
        allowance: req.body.allowance,
        doctordiagnosis: JSON.parse(req.body.doctordiagnosis)
    };
    connection.query(`INSERT INTO mydb.medicalexamination 
    (id, date, allowance, patientId) VALUES ('${medicalExamination.id}', '${medicalExamination.date}', 
    '${medicalExamination.allowance}', '${medicalExamination.patientId}');`, (err, rows) => {
        if (err) throw err;
    });
    medicalExamination.doctordiagnosis.forEach((item, index) => {
        connection.query(`INSERT INTO mydb.doctordiagnosis 
        (id, doctorName, diagnosis, medicalExaminationId) VALUES ('${item.id + index}', '${item.doctorName}', 
        '${item.diagnosis}', '${medicalExamination.id}');`, (err, rows) => {
            if (err) throw err;
        });
    });
    const files = {};
    if (req.files.bloodchemistryanalysis !== undefined) {
        files.bloodchemistryanalysis = {
            bloodchemistryanalysis: req.files.bloodchemistryanalysis[0].filename,
            id: +Date.now().toString().split('').slice(6).join('')
        };
        connection.query(`INSERT INTO mydb.bloodchemistryanalysis 
        (id, info, medicalExaminationId) VALUES ('${files.bloodchemistryanalysis.id}',
         '${files.bloodchemistryanalysis.bloodchemistryanalysis}',
         '${medicalExamination.id}');`, (err, rows) => {
            if (err) throw err;
        });
    }
    if (req.files.electrocardiogram !== undefined) {
        files.electrocardiogram = {
            electrocardiogram: req.files.electrocardiogram[0].filename,
            id: +Date.now().toString().split('').slice(6).join('')
        };
        connection.query(`INSERT INTO mydb.electrocardiogram 
        (id, info, medicalExaminationId) VALUES ('${files.electrocardiogram.id}', 
        '${files.electrocardiogram.electrocardiogram}',
         '${medicalExamination.id}');`, (err, rows) => {
            if (err) throw err;
        });
    }
    if (req.files.generalbloodanalysis !== undefined) {
        files.generalbloodanalysis = {
            generalbloodanalysis: req.files.generalbloodanalysis[0].filename,
            id: +Date.now().toString().split('').slice(6).join('')
        };
        connection.query(`INSERT INTO mydb.generalbloodanalysis 
        (id, info, medicalExaminationId) VALUES ('${files.generalbloodanalysis.id}', 
        '${files.generalbloodanalysis.generalbloodanalysis}',
         '${medicalExamination.id}');`, (err, rows) => {
            if (err) throw err;
        });
    }
    if (req.files.generalurineanalysis !== undefined) {
        files.generalurineanalysis = {
            generalurineanalysis: req.files.generalurineanalysis[0].filename,
            id: +Date.now().toString().split('').slice(6).join('')
        };
        connection.query(`INSERT INTO mydb.generalurineanalysis 
        (id, info, medicalExamnationId) VALUES ('${files.generalurineanalysis.id}', 
        '${files.generalurineanalysis.generalurineanalysis}',
         '${medicalExamination.id}');`, (err, rows) => {
            if (err) throw err;
        });
    }
    if (req.files.heartultrasound !== undefined) {
        files.heartultrasound = {
            heartultrasound: req.files.heartultrasound[0].filename,
            id: +Date.now().toString().split('').slice(6).join('')
        };
        connection.query(`INSERT INTO mydb.heartultrasound 
        (id, info, medicalExaminationId) VALUES ('${files.heartultrasound.id}', 
        '${files.heartultrasound.heartultrasound}',
         '${medicalExamination.id}');`, (err, rows) => {
            if (err) throw err;
        });
    }

    res.send(medicalExamination);
});

function deleteMedExam(id) {
    connection.query(`DELETE FROM mydb.heartultrasound WHERE medicalExaminationId = ${id}`, (err) => {
        if (err) throw err;
    });
    connection.query(`DELETE FROM mydb.generalurineanalysis WHERE medicalExamnationId = ${id}`, (err) => {
        if (err) throw err;
    });
    connection.query(`DELETE FROM mydb.generalbloodanalysis WHERE medicalExaminationId = ${id}`, (err) => {
        if (err) throw err;
    });
    connection.query(`DELETE FROM mydb.electrocardiogram WHERE medicalExaminationId = ${id}`, (err) => {
        if (err) throw err;
    });
    connection.query(`DELETE FROM mydb.doctordiagnosis WHERE medicalExaminationId = ${id}`, (err) => {
        if (err) throw err;
    });
    connection.query(`DELETE FROM mydb.bloodchemistryanalysis WHERE medicalExaminationId = ${id}`, (err) => {
        if (err) throw err;
    });

    connection.query(`DELETE FROM mydb.medicalexamination WHERE id = ${id}`, (err) => {
        if (err) throw err;
    });
}

app.delete('/medicalExamination/:id', function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'origin, content-type, accept');
    deleteMedExam(req.params.id);
    res.send(req.params.id);
});

let injuriesDiseases = [];

app.get('/injuriesDiseases/:patientId', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'origin, content-type, accept');
    connection.query(`SELECT * FROM mydb.injuriesdiseases WHERE patientId = ${req.params.patientId}`, (err, rows) => {
        if (err) throw err;
        injuriesDiseases = rows;
        injuriesDiseases.forEach(row => {
            getIlRows(row.id, 'mri', function (data) {
                row.mri = data;
            });
            getIlRows(row.id, 'radiographies', function (data) {
                row.radiographies = data;
            });
            getIlRows(row.id, 'commonultrasound', function (data) {
                row.commonultrasound = data;
            });
        });
    });

    function getIlRows(medId, rowName, callback) {
        connection.query(`SELECT * FROM mydb.${rowName} WHERE injurieDiseaseId = ${medId}`,
            (err, rows) => {
                if (err) throw err;
                callback(rows);
            });
    }

    setTimeout(() => {
        res.send(injuriesDiseases);
    }, 1000);
});

let fieldsIllness = [{name: 'mri'},
    {name: 'radiographies'},
    {name: 'commonultrasound'}
];

app.post('/injuriesDiseases', upload.fields(fieldsIllness), function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'origin, content-type, accept');
    const illness = {
        id: +Date.now().toString().split('').slice(6).join(''),
        illnessStartDate: req.body.illnessStartDate,
        illnessEndDate: req.body.illnessEndDate,
        diagnosis: req.body.diagnosis,
        drugTherapy: req.body.drugTherapy,
        physiotherapyTreatment: req.body.physiotherapyTreatment,
        other: req.body.other,
        patientId: req.body.patientId
    };
    console.log(illness);
    connection.query(`INSERT INTO mydb.injuriesdiseases
    (id, date, releasedInMainGroup, disabilityCountDays, diagnosis, 
    drugTherapy, physiopherapy, other, disabilityTypeId, patientId) 
    VALUES ('${illness.id}', '${illness.illnessStartDate}', '${5}', '${5}', 
    '${illness.diagnosis}', '${illness.drugTherapy}', '${illness.physiotherapyTreatment}', 
    '${illness.other}', '${1}', '${illness.patientId}');`, (err, rows) => {
        if (err) throw err;
    });

    const files = {};
    if (req.files.mri !== undefined) {
        files.mri = {
            mri: req.files.mri[0].filename,
            id: +Date.now().toString().split('').slice(6).join('')
        };
        connection.query(`INSERT INTO mydb.mri
        (id, info, injurieDiseaseId) VALUES ('${files.mri.id}', '${files.mri.mri}',
         '${illness.id}');`, (err, rows) => {
            if (err) throw err;
        });
    }
    if (req.files.radiographies !== undefined) {
        files.radiographies = {
            radiographies: req.files.radiographies[0].filename,
            id: +Date.now().toString().split('').slice(6).join('')
        };
        connection.query(`INSERT INTO mydb.radiographies
        (id, info, injurieDiseaseId) VALUES ('${files.radiographies.id}', '${files.radiographies.radiographies}',
         '${illness.id}');`, (err, rows) => {
            if (err) throw err;
        });
    }
    if (req.files.commonultrasound !== undefined) {
        files.commonultrasound = {
            commonultrasound: req.files.commonultrasound[0].filename,
            id: +Date.now().toString().split('').slice(6).join('')
        };
        connection.query(`INSERT INTO mydb.commonultrasound
        (id, info, injurieDiseaseId) VALUES ('${files.commonultrasound.id}', '${files.commonultrasound.commonultrasound}',
         '${illness.id}');`, (err, rows) => {
            if (err) throw err;
        });
    }
    res.send(illness);
});

function deleteIllness(patientId) {
    connection.query(`DELETE FROM mydb.commonultrasound WHERE injurieDiseaseId = ${patientId}`, (err) => {
        if (err) throw err;
    });
    connection.query(`DELETE FROM mydb.mri WHERE injurieDiseaseId = ${patientId}`, (err) => {
        if (err) throw err;
    });
    connection.query(`DELETE FROM mydb.radiographies WHERE injurieDiseaseId = ${patientId}`, (err) => {
        if (err) throw err;
    });
    connection.query(`DELETE FROM mydb.injuriesdiseases WHERE id = ${patientId}`, (err) => {
        if (err) throw err;
    });
}

app.delete('/injuriesDiseases/:id', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'origin, content-type, accept');
    deleteIllness(req.params.id);
    res.send(req.params.id);
});

app.listen(3012, () => {
    console.log("Server started");
});
