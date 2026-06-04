var express = require('express');
var router = express.Router();
const { getConnection } = require('../connect');
const oracledb = require('oracledb');

// 게시글 목록 데이터 (전체 코드)
router.get('/list.json', async function(req, res){
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 5;
    
    let con;
    try {
        con = await getConnection();
        
        // 1. 전체 개수 조회
        let sqlCount = `SELECT count(*) AS TOTAL FROM VIEW_POSTS`;
        let resultCount = await con.execute(sqlCount, {}, {outFormat: oracledb.OUT_FORMAT_OBJECT});
        const total = resultCount.rows[0].TOTAL;

        // 2. 목록 조회 (필요한 컬럼만 명시하여 순환 참조 원천 차단)
        let sqlList = `SELECT * FROM (
                        SELECT ROWNUM AS RN, A.* FROM (
                            SELECT ID, TITLE, CONTENT, WRITER, SNAME, FMT_DATE FROM VIEW_POSTS ORDER BY ID DESC
                        ) A
                    ) WHERE RN BETWEEN :startRow AND :endRow`;
        
        let bind = { startRow: (page - 1) * size + 1, endRow: page * size };
        let resultList = await con.execute(sqlList, bind, {outFormat: oracledb.OUT_FORMAT_OBJECT});
        
        // [핵심] CLOB 데이터를 문자열로 변환하고 순수 데이터만 추출
        const list = await Promise.all(resultList.rows.map(async (row) => {
            let contentStr = row.CONTENT;
            if (row.CONTENT && typeof row.CONTENT.getData === 'function') {
                contentStr = await row.CONTENT.getData();
            }
            return {
                ID: row.ID,
                TITLE: row.TITLE,
                CONTENT: contentStr,
                WRITER: row.WRITER,
                SNAME: row.SNAME,
                FMT_DATE: row.FMT_DATE
            };
        }));
        
        res.send({ list, total }); 
        
    } catch(err) { 
        console.log("목록 조회 오류:", err); 
        res.status(500).send(err.message);
    } finally { 
        if(con) await con.close(); 
    }
});

// 페이지 이동 라우터
router.get('/', (req, res) => res.render('index', { title: '게시글', pageName: 'posts/list.ejs' }));
router.get('/insert', (req, res) => res.render('index', { title: '글쓰기', pageName: 'posts/insert.ejs' }));

// 게시글 등록
router.post('/insert', async function (req, res) {
    const { title, content, writer } = req.body;
    let con;
    try {
        con = await getConnection();
        const sql = `INSERT INTO POSTS(ID, TITLE, CONTENT, WRITER) VALUES(POST_SEQ.NEXTVAL, :title, :content, :writer)`;
        await con.execute(sql, {title, content, writer}, {autoCommit: true});
        res.sendStatus(200);
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    } finally {
        if(con) await con.close();
    }
});

// 게시글 삭제 (posts.js 에 추가)
router.post('/delete', async function(req, res){
    const id = req.body.id;
    let con;
    try {
        con = await getConnection();
        await con.execute("DELETE FROM POSTS WHERE ID = :id", {id}, {autoCommit: true});
        res.sendStatus(200);
    } catch(err) {
        console.log(err);
        res.sendStatus(500);
    } finally {
        if(con) await con.close();
    }
});
// 게시글 상세 페이지 라우터 (추가하세요!)
router.get('/:id', async function(req, res){
    const id = req.params.id;
    let con;
    try{
        con = await getConnection();
        // 상세 내용을 조회할 때도 CLOB 데이터를 문자열로 변환해야 합니다.
        const sql = `SELECT ID, TITLE, CONTENT, WRITER, SNAME, FMT_DATE FROM VIEW_POSTS WHERE ID = :id`;
        const result = await con.execute(sql, {id}, {outFormat: oracledb.OUT_FORMAT_OBJECT});
        
        let post = result.rows[0];
        
        // CLOB 변환 처리 (상세 페이지용)
        if (post && post.CONTENT && typeof post.CONTENT.getData === 'function') {
            post.CONTENT = await post.CONTENT.getData();
        }

        res.render('index', {title: '상세보기', pageName: 'posts/read.ejs', post: post});
    } catch(err){
        console.log("상세조회 에러:", err);
    } finally {
        if(con) await con.close();
    }
});

// 게시글 수정 페이지 이동
router.get('/update/:id', async function(req, res){
    const id = req.params.id;
    let con;
    try {
        con = await getConnection();
        const sql = `SELECT ID, TITLE, CONTENT, WRITER, SNAME, FMT_DATE FROM VIEW_POSTS WHERE ID = :id`;
        const result = await con.execute(sql, {id}, {outFormat: oracledb.OUT_FORMAT_OBJECT});
        
        let post = result.rows[0];
        if (post && post.CONTENT && typeof post.CONTENT.getData === 'function') {
            post.CONTENT = await post.CONTENT.getData();
        }
        res.render('index', {title: '글수정', pageName: 'posts/update.ejs', post: post});
    } catch(err) {
        console.log("수정페이지 조회 에러:", err);
        res.status(500).send(err.message);
    } finally {
        if(con) await con.close();
    }
});

// 게시글 수정 실행
router.post('/update', async function(req, res){
    const { id, title, content } = req.body;
    let con;
    try {
        con = await getConnection();
        const sql = `UPDATE POSTS SET TITLE=:title, CONTENT=:content WHERE ID=:id`;
        await con.execute(sql, {title, content, id}, {autoCommit: true});
        res.sendStatus(200);
    } catch(err) {
        console.log("게시글 수정 에러:", err);
        res.status(500).send(err.message);
    } finally {
        if(con) await con.close();
    }
});

module.exports = router;