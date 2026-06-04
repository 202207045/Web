const oracledb = require('oracledb');

const dbConfig = {
    user: "user206",                   // 👈 오라클 DB 실제 계정 이름
    password: "PASS",                  // 👈 오라클 DB 비밀번호 (대소문자 주의)
    connectString: "localhost:1521/xe" // 👈 포트번호 1521과 SID(xe)
};

async function getConnection() {
    return await oracledb.getConnection(dbConfig);
}

module.exports = { getConnection };