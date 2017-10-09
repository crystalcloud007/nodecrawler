/* 针对天眼查的爬虫
 * 20170905
 * 
 */ 

var spawn = require('child_process').spawn;
var utils = require('./utils');
var iconv = require('iconv-lite');
var cheerio = require('cheerio');

// 伪造信息头
var headers = 
{
    'Host':'www.tianyancha.com',
    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:50.0) Gecko/20100101 Firefox/50.0',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3',
    'Accept-Encoding': 'gzip, deflate',
    'Tyc-From': 'normal',
    'CheckError': 'check',
    'Connection': 'keep-alive',
    'Referer': 'http://www.tianyancha.com/company/2310290454',
    'Cache-Control': 'max-age=0',
    'Cookie': '_pk_id.1.e431=5379bad64f3da16d.1486514958.5.1486693046.1486691373.; Hm_lvt_e92c8d65d92d534b0fc290df538b4758=1486514958,1486622933,1486624041,1486691373; _pk_ref.1.e431=%5B%22%22%2C%22%22%2C1486691373%2C%22https%3A%2F%2Fwww.baidu.com%2Flink%3Furl%3D95IaKh1pPrhNKUe5nDCqk7dJI9ANLBzo-1Vjgi6C0VTd9DxNkSEdsM5XaEC4KQPO%26wd%3D%26eqid%3Dfffe7d7e0002e01b00000004589c1177%22%5D; aliyungf_tc=AQAAAJ5EMGl/qA4AKfa/PDGqCmJwn9o7; TYCID=d6e00ec9b9ee485d84f4610c46d5890f; tnet=60.191.246.41; _pk_ses.1.e431=*; Hm_lpvt_e92c8d65d92d534b0fc290df538b4758=1486693045; token=d29804c0b88842c3bb10c4bc1d48bc80; _utm=55dbdbb204a74224b2b084bfe674a767; RTYCID=ce8562e4e131467d881053bab1a62c3a'
};

var option = 
{
    url:'http://www.tianyancha.com/company/2310290454',
    method:'GET',
    headers:headers
};

//cp.exec('phantomjs', ['phantom_capture.js','http://news.ifeng.com/']);
ls = spawn('c:/apps/phantom/phantomjs',['phantom_capture.js','http://news.ifeng.com']);
var result = '';
ls.stdout.on('data', (data) =>
{
    var buf = new Buffer(data);
    result += buf.toString('utf8');
    //console.log('GET DATA: ', buf.toString(data,'utf8'));
});

ls.stderr.on('data', (data) =>
{
    console.log('ERR:', data);
});

ls.on('close',(code) =>
{
    if(code == 1) console.log('CHILD PROCESS ERR. OUT.');
    else 
    {
        console.log('COMPLETED');
        console.log(result);
    }
});