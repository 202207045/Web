var express = require('express');
var router = express.Router();
var { getConnection } = require('./connect');
var oracledb = require('oracledb');

router.get('/pro', function(req, res, next) {
  res.render('index', { title: '교수관리', pageName:'haksa/professors' });
});

/* 교수데이터 생성 */ 
router.get('/pro/list.json', async function(req, res, next) {
    let con; 
    try {
        con = await getConnection(); 
        const sql = "select p.*, to_char(hiredate, 'YYYY-MM-DD') tdate, to_char(salary, '999,999,999') tsalary from professors p order by pcode desc";
        
        const result = await con.execute(sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        res.json(result.rows);

    } catch (err) {
        console.error(err);
    } finally {
        if(con) {
            await con.close();
        }
    }
});

/* 교수등록 페이지 (새 교수번호 가져오기) */
router.get('/pro/insert', async function(req, res) { 
    let con;
    let code;
    try {
        con = await getConnection();
        const sql = "select max(pcode)+1 from professors";
        const result = await con.execute(sql);
        code = result.rows[0][0]; 
    } catch(err) {
        console.error(err);
    } finally {
        if(con) await con.close();
    }
    res.render('index', { title: '교수등록', pageName:'haksa/professor_insert', code: code });
});

/* 학사관리 페이지 */
router.get('/stu', function(req, res, next) {
  res.render('index', { title: '학사관리', pageName:'haksa/students' });
});

/* 강좌관리 페이지 */
router.get('/cou', function(req, res, next) {
  res.render('index', { title: '강좌관리', pageName:'haksa/courses' });
});

/* 교수 등록 */
/* 교수 등록 */
router.post('/pro/insert', async function(req, res) {
    let con;
    try {
        con = await getConnection();
        // 1. 프론트에서 보낸 모든 데이터 꺼내기 (title 포함)
        const { pcode, pname, dept, hiredate, salary, title } = req.body;

        // 2. SQL문 수정 (중복되거나 더해지는 부분 없이 깔끔하게 한 줄로!)
        const sql = "insert into professors(pcode, pname, dept, title, hiredate, salary) " +
                    "values(:pcode, :pname, :dept, :title, :hiredate, :salary)";

        // 3. 실행할 때 변수들 모두 전달
        await con.execute(sql, 
            { pcode, pname, dept, title, hiredate, salary }, 
            { autoCommit: true } 
        );

        res.send('success');
    } catch(err) {
        console.error("등록 에러:", err);
        res.send('fail');
    } finally {
        if(con) await con.close();
    }
});
// 교수 삭제
router.post('/pro/delete', async function(req, res){
    let con;
    const pcode=req.body.pcode;
    try{
        con = await getConnection();
        const sql=`delete from professors where pcode=${pcode}`;
        console.log(sql);
        await con.execute(sql, {}, {autoCommit:true});
        res.sendStatus(200);
    }catch(err){
        res.sendStatus(500);
        console.log(err);
    }finally{
        if(con) await con.close();
    }
});
module.exports = router;