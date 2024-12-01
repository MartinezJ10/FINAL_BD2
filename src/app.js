import express from 'express'
import dotenv from 'dotenv'
import path from 'path'
import session from 'express-session';

import getIndex from './routes/routes.js'

dotenv.config();

const app = express();
// CONFIG PARA SESSIONS
app.use(session({
  secret: "admin",
  resave: false, 
  saveUninitialized: true,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000  } // 7 dias
}));

app.use((req, res, next) => {
res.locals.session = req.session;
next();
});

// Middleware
app.set('view engine', 'ejs'); 
app.use(express.urlencoded({extended:false}))

app.use("/", getIndex) 


app.use((err,req,res,next) => {
    console.log(err.stack);
    res.status(500).send('its brokeeeeen, send help')
})

// Start Server
app.listen(process.env.PORT, () => {
  console.log(`Server is running on http://localhost:${process.env.PORT}`);
});