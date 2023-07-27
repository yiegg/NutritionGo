require('dotenv').config();
const express = require('express');
const cors = require('cors');
const logger = require('./lib/logger');
const uploadsRouter = require('./routes/uploads');
const usersRouter = require('./routes/users');
const { tokenAuth, basicAuth } = require('./lib/auth');
const infoRouter = require('./routes/info');

const PORT = 3001;

let app = express();

app.use(logger);
app.use(cors());
app.use(tokenAuth);
app.use(basicAuth);
app.use('/uploads', uploadsRouter);
app.use('/users', usersRouter);
app.use('/info', infoRouter);

console.log(`listening to: ${PORT}`);
app.listen(PORT);