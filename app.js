import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import session from 'express-session';
import getIndex from './routes/routes.js';

dotenv.config();

const app = express();

app.use(
  session({
    secret: 'key',
    resave: false,
    saveUninitialized: true,
  })
);
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