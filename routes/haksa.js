var express = require('express');
var router = express.Router();
const { getConnection } = require('../connect');
const oracledb = require('oracledb');

/* 교수페이지이동 */
router.get('/pro', function (req, res, next) {
    res.render('index', { title: '교수관리', pageName: 'haksa/professors.ejs' });
});

/*교수목록 데이터 */
router.get('/pro/list.json', async function (req, res) {
    let con;
    try {
        con = await getConnection();
        const sql="select p.*, to_char(hiredate, 'YYYY-MM-DD') fdate, to_char(salary, '99,999,999') fsalary from professors p";
        const result = await con.execute(sql, {}, {outFormat:oracledb.OUT_FORMAT_OBJECT});
        res.send(result.rows);
    } catch (err) {
        console.log(err);
    } finally {
        if(con) await con.close();
    }
});

// 교수등록 페이지 이동
router.get('/pro/insert', async function(req, res){
    let con;
    let newcode='';
    try {
        con = await getConnection();
        const sql="select max(pcode)+1 code from professors";
        const result=await con.execute(sql);
        newcode = result.rows[0][0];
    }catch(err){
        console.log(err);
    }finally{
        console.log('생성된 교수코드:', newcode);
        if(con) await con.close();
    }
    // [수정됨] res.render를 finally 밖으로 빼서 DB가 정상적으로 닫힌 후 화면을 띄우도록 변경했습니다.
    res.render('index', {title:'교수등록', pageName:'haksa/professors_insert.ejs', code:newcode});
});

// 교수등록 (DB 저장)
router.post('/pro/insert', async function(req, res){
    const pcode = req.body.pcode;
    const pname = req.body.pname;
    const dept = req.body.dept;
    const hiredate = req.body.hiredate;
    const title = req.body.title || '정교수'; // 화면에서 직급(title)을 안 보낼 경우 기본값 처리
    const salary = req.body.salary;
    
    console.log("전달받은 교수 데이터:", pcode, pname, dept, hiredate, title, salary);
    
    let con;
    try{
        con = await getConnection();
        // [수정됨] 직접 홑따옴표('${pcode}')를 쓰면 오류가 나기 쉬우므로, 학생 등록처럼 안전한 바인드 변수(:pcode) 방식으로 변경했습니다.
        let sql = `insert into professors(pcode, pname, dept, hiredate, title, salary) `;
        sql += `values(:pcode, :pname, :dept, TO_DATE(:hiredate,'YYYY-MM-DD'), :title, :salary)`;
        
        console.log(sql);
        await con.execute(sql, {pcode, pname, dept, hiredate, title, salary}, {autoCommit:true});
        res.sendStatus(200);
    }catch(err){
        console.log("교수 등록 에러:", err);
        res.sendStatus(500); // 에러 발생 시 프론트엔드에 에러 신호 전송
    }finally{
        if(con) await con.close();
    }
});

//교수 삭제
router.post('/pro/delete', async function(req, res){
    let con;
    const pcode=req.body.pcode;
    try{
        con = await getConnection();
        const sql=`delete from professors where pcode=:pcode`; // [수정됨] 바인드 변수 사용
        console.log(sql);
        await con.execute(sql, {pcode}, {autoCommit:true});
        res.sendStatus(200);
    }catch(err){
        res.sendStatus(500);
        console.log(err);
    }finally{
        if(con) await con.close();
    }
});

/* 학생페이지이동 */
router.get('/stu', function (req, res, next) {
    res.render('index', { title: '학생관리', pageName: 'haksa/students.ejs' });
});

/*학생목록 데이터 */
router.get('/stu/list.json', async function (req, res) {
    let con;
    try {
        con = await getConnection();
        const sql="select * from view_students";
        const result = await con.execute(sql, {}, {outFormat:oracledb.OUT_FORMAT_OBJECT});
        res.send(result.rows);
    } catch (err) {
        console.log(err);
    } finally {
        if(con) await con.close();
    }
});

//학생등록 페이지 이동
router.get('/stu/insert', async function(req, res){
    let con;
    let code;
    try{
        con = await getConnection(); // [수정됨] const con -> con 으로 변경 (스코프 오류 방지)
        const sql="select max(scode)+1 from students";
        const result = await con.execute(sql);
        code = result.rows[0][0];
        console.log(code);
    }catch(err){
        console.log(err);
    }finally{
        if(con) await con.close(); // [수정됨] await 추가
    }
    res.render('index', {title: '학생입력', pageName:'haksa/students_insert.ejs', code});
});

// 학생등록
router.post('/stu/insert', async function(req, res){
    const scode=req.body.scode;
    const sname=req.body.sname;
    const dept=req.body.dept;
    const birthday=req.body.birthday;
    const year=req.body.year;
    const pcode=req.body.pcode;
    
    console.log(scode, sname, dept, birthday, year, pcode);
    let con;
    try{
        con = await getConnection();
        let sql = "insert into students(scode, sname, dept, birthday, year, advisor)";
        sql +=" values(:scode, :sname, :dept, to_date(:birthday, 'YYYY-MM-DD'), :year, :pcode)";
        console.log(sql);
        await con.execute(sql, {scode, sname, dept, birthday, year, pcode}, {autoCommit:true});
        res.sendStatus(200);
    }catch(err){
        console.log(err);
    }finally{
        if(con) await 구con.close();
    }
});

//학생 삭제
router.post('/stu/delete', async function(req, res){
    let con;
    const scode=req.body.scode;
    try{
        con = await getConnection();
        const sql=`delete from students where scode=:scode`; // [수정됨] 바인드 변수 사용
        console.log(sql);
        await con.execute(sql, {scode}, {autoCommit:true});
        res.sendStatus(200);
    }catch(err){
        res.sendStatus(500);
        console.log(err);
    }finally{
        if(con) await con.close();
    }
});

/* 강좌페이지이동 */
router.get('/cou', function (req, res, next) {
    res.render('index', { title: '강좌관리', pageName: 'haksa/courses.ejs' });
});

module.exports = router;