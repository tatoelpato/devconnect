const { request } = require('express');
const express = require('express');
const router = express.Router();
const pool = require('./../../config/db');

//  @route  Post api/users
//  @desc   Register User
//  @access Public
router.post('/', (req, res) => {
    const user = req.body
    let insertQuery = `insert into users(name, email, password, avatar) 
                       values(${user.name}, '${user.email}', '${user.password}', '${user.avatar}')`

    client.query(insertQuery, (err, result)=>{
        if(!err){
            res.send('Insertion was successful')
        }
        else{ console.log(err.message) }
    })
    client.end;

    // const insertRow = 'insert into users (name, email, password, avatar) values(?, ?, ?, ?)'; //Insert query

    // const register = pool.query(insertRow, [row], (err, rows) => { //Insert row into database
    //     if (err) throw err;
    //     console.log('inserted: ' + row); //Print row inserted
    // });

    // console.log(row);
});

module.exports = router;
