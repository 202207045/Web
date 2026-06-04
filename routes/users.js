var express = require('express');
var router = express.Router();

// [수정] 경로를 '../connect'로 변경
const { getConnection } = require('../connect'); 
const OracleDB = require('oracledb');

/* 로그인페이지 이동 */
router.get('/login', function (req, res, next) {
    res.render('index', {title:'로그인', pageName:'login.ejs'});
});

// 로그인 체크
router.post('/login', async function(req, res){
    const scode = req.body.scode;
    const pass = req.body.pass;
    
    console.log("로그인 시도:", scode, pass);
    
    let con;
    try {
        con = await getConnection();
        
        let sql = "select * from students where scode=:scode";
        let result = await con.execute(sql, {scode}, {outFormat: OracleDB.OUT_FORMAT_OBJECT});
        
        // [디버깅] DB에서 가져온 데이터가 있는지 터미널에서 확인
        console.log("DB 조회 결과:", result.rows[0]);
        
        if (result.rows.length > 0) {
            res.send(result.rows[0]);
        } else {
            console.log("해당 학번을 찾을 수 없습니다.");
            res.status(404).send("학번 없음");
        }
        
    } catch(err){
        console.log("로그인 처리 에러:", err);
        res.sendStatus(500);
    } finally {
        if(con) await con.close();
    }
});

module.exports = router;