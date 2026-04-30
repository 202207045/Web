var express = require('express');
var router = express.Router();
var { getConnection } = require('./connect');
var oracledb = require('oracledb');

router.get('/pro', function(req, res, next) {
  res.render('index', { title: '교수관리', pageName:'haksa/professors' });
});
router.get('/pro/list.json', async function(req, res, next) { 
    try {
        const con = await getConnection(); 

        const sql = "SELECT * FROM professors";
        const result = await con.execute(sql, {}, { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        res.json(result.rows);
    } catch (err) {
        console.error(err);
    } finally {
      if(con){
        await con.close();
      }
    }
}); 
/* 학사관리 페이지 */
router.get('/stu', function(req, res, next) {
  res.render('index', { title: '학사관리', pageName:'haksa/students' });
});

/* 강좌관리 페이지 */
router.get('/cou', function(req, res, next) {
  res.render('index', { title: '강좌관리', pageName:'haksa/courses' });
});

module.exports = router;