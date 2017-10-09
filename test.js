/*
 * 用来测试模块的文件
 * 不要用来写任何具体的算法
 */ 

const fs = require('fs');
data = fs.readFileSync('d:/temp/ifeng/data.json');
data = JSON.parse(data);
console.log(data.data[0].topic)