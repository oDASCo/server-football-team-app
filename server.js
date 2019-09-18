const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '.jpg') //Appending .jpg
    }
});

const upload = multer({ storage: storage });

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


const players = [
    {
        id: 1,
        name: 'New Dasha'
    }
];

app.get('/', (req, res) => {
    res.send('hello api');
});

app.get('/players', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'origin, content-type, accept');
    res.send(players);
});

app.get('/players/:id', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'origin, content-type, accept');
    const player = players.find((player) => {
        return player.id === Number(req.params.id);
    });
    res.send(player);
});

app.post('/players', upload.single('file'), function (req, res, next) {
    const player = {
        id: Date.now(),
        name: req.body.name
    };
    players.push(player);
    res.sendStatus(200);
});

app.listen(3012, () => {
    console.log(123);
});
