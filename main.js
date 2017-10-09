/*
 * 爬虫系统，非分布式，文件形式存储结果
 * 20170905
 */ 

var cheerio = require('cheerio');
var cmd = require('commander');
var fs = require('fs');
var spawn = require('child_process').spawn;
var EventEmitter = require('events');
var iconv = require('iconv-lite');
var request = require('request');
var utils = require('./utils');
const PageCrawler = require('./PageCrawler');
 

// 初始化变量
var links_to = [];                     // 需要爬的链接
var links_done=[];                     // 以爬过的连接
var mode = '';                         // 模式
var element_to_fetch = '';             // 需要提取的元素
var element_fetched_title = '';        // 提取元素的名称
var base_url = '';                     // 根url
var domain_name = '';                  // 
var protocol = '';                     // 协议名称，一般是http
var crawl_interval = 3000;             // 爬取间隔
var filepath = '';                     // 存档文件夹名，不要带最后的'/'
var total_link_count = 1000;           // 需要爬取多少个连接
var link_count = 0;                    // 爬了多少个连接
var links_scraped_count = 0;           // 连接链表中已经有了多少个连接
var crawl_module = 'request';          // 使用哪种爬取模块
var crawl_link_features = [];          // 从那些指定开头的链接爬取，仅在通过文件读取命令时生效。
var cmd_from_file = false;             // 是否通过文件读取命令
var links_found_count = 0;             // 发现多少个链接
var content_found_count = 0;           // 发现多少个有用内容d

var event_emitter = new EventEmitter();
var crawler = new PageCrawler();

// 命令行
cmd.version('0.1.1')
.option('-r, --from_file [FROM_FILE]','爬取命令的文件来源，如果不使用文件，不要用此参数。')
.option('-u, --url [URL]', '想要爬取的URL。')
.option('-m, --mode [MODE]','爬取模式，site表示全站爬取，page表示单页爬取。')
.option('-c, --count [COUNT]','爬取总量，默认1000个链接。')
.option('-e, --element_to_fetch [ELEMENT_TO_FETCH]','从哪些元素中抽取信息，用逗号隔开，只能提取text。')
.option('-t, --element_fetched_title [ELEMENT_FETCHED_TITLE]','这些信息的名称是什么，用逗号隔开。')
.option('-f, --filepath [FILEPATH]', '存档文件路径，不要以"/"结尾。')
//.option('-p','--process_option [PROCESS_OPTION]','download表示下载资源、info表示抓取信息、both表示抓取信息又下载资源。')
.option('-d, --crawl_module [MODULE]', '选择爬虫模组，phantomjs或request，默认request。')
.parse(process.argv);

// 如果来自文件
if(cmd.from_file)
{
    var cmd_source = fs.readFileSync(cmd.from_file);
    cmd_from_file = true;
    cmd_source = JSON.parse(cmd_source);

    base_url = cmd_source.url;
    mode = cmd_source.mode == 'site' ? 'site' :'page';
    filepath = cmd_source.filepath;
    crawl_module = cmd_source.crawl_module == 'request' ? 'request' : 'phantomjs';
    total_link_count = parseInt(cmd_source.count);
    crawl_link_features = cmd_source.crawl_link_features;
    element_to_fetch = cmd_source.element_to_fetch;    
    element_fetched_title = cmd_source.element_fetched_title;
}
else
{
    base_url = cmd.url;
    filepath = cmd.filepath;
    crawl_module = cmd.crawl_module == 'phantomjs' ? 'phantomjs' : 'request';
    total_link_count = isNaN(parseInt(cmd.count)) || parseInt(cmd.count) < 1 ? total_link_count : parseInt(cmd.count);
    mode = cmd.mode == 'page' ? 'page' : 'site';
    element_to_fetch = cmd.element_to_fetch ? cmd.element_to_fetch : '';
    element_fetched_title = cmd.element_fetched_title ? cmd.element_fetched_title : '';
    // if(cmd.crawl_link_features)
    // {
    //     crawl_link_features = JSON.parse(cmd.crawl_link_features);
    // }    
}


if(!utils.checkHTTPStr(base_url))
{
    utils.showLog('APP','ERR','必须指定URL，URL必须以\'http://\'或\'https:\'开头。');
    process.exit();
}
    
links_to.push(base_url);
link_count += 1;
            
if(!filepath)
{
    utils.showLog('APP','ERR','必须指定存档文件夹，不要以分隔符结尾。');
    process.exit();
}
    
total_link_count = isNaN(total_link_count) || total_link_count < 1 ? 1000 :total_link_count;  
        

// 不能在设置为爬取单页面模式的同时不指定元素
if(mode == 'page' && element_to_fetch == '')
{
    utils.showLog('APP','ERR','单页面爬取模式必须指定爬取元素。')
    process.exit();
}

// 爬取前的准备工作
var ana_result = utils.getDomainInfo(base_url);
if(ana_result.err)
{
    utils.showLog('APP','ERR','无效的URL。');
    process.exit();
}

domain_name = ana_result.domain_name;
protocol = ana_result.protocol;

// 根据爬取模块定义间隔时间
crawl_interval = crawl_module == 'request' ? 3000 : 2000;

var file_to = filepath + '/linkes_to.txt';
var file_done = filepath + '/links_done.txt';
var file_data = filepath + '/data.json';
var file_log = filepath + '/log.txt'

// 输出任务总体信息
var general_info = '\n' + utils.getSplitterStr('-',20) + '\n爬取URL：' + base_url + '\n';
general_info += '采用\'' + mode + '\'模式\n';
general_info += '总共抓取任务量：' + total_link_count.toString() + '\n';
general_info += '抓取元素为：\'' + element_to_fetch + '\' \n';
general_info += '抓取元素存储标题为：\'' + element_fetched_title + '\'\n';
general_info += '文件存储路径为：' + filepath + '\n';
general_info += '抓取路径特征为：' + crawl_link_features.length < 0 ? base_url : JSON.stringify(crawl_link_features) + '\n';
general_info += '采用抓取模块为：\'' + crawl_module + '\'\n' + utils.getSplitterStr('-',20) + '\n'; 
general_info += '任务列表保存在"links_to.txt"。\n';
general_info += '已完成列表保存在"links_done.txt"。\n';
general_info += '数据文件保存在"data.txt"，日志文件保存在"log.txt"。\n';
general_info += '任务开始于：' + new Date().toLocaleString() + '\n' + utils.getSplitterStr('-',20) + '\n';
utils.showLog('APP','MSG',general_info + '抓取任务在5秒后开始。\n');
fs.writeFileSync(file_log, general_info);
fs.writeFileSync(file_data, '{\"data\":\n[\n');

event_emitter.on('next', ()=>
{
    // 处理工作记录
    var url = links_to.shift();
    links_done.push(url);
    links_scraped_count = links_to.length + links_done.length;
    
    // 存文件
    fs.writeFileSync(file_to, links_to.join('\n'));
    fs.writeFileSync(file_done, links_done.join('\n'));

    utils.showLog('APP','MSG','开始爬取: ' + url);
    

    // var signal = crawl_module == 'request' ? 'crawl_with_request' : 'crawl_with_phantomjs';
    // event_emitter.emit(signal, url);    

    // 使用PageCrawler模块爬取
    crawler.crawlPage(url, mode, crawl_module, element_to_fetch, element_fetched_title, base_url, crawl_link_features, (url, status, result) =>
    {        
        if(status == 'err' || status == 'invalid_format')
        {
            utils.showLog('CRAWLER',status,'发生错误');
        }
        else
        {
            for(var i = 0; i < result.links_found.length; i++)
            {
                if(links_scraped_count > total_link_count) break;
                var link = result.links_found[i];
                if(links_to.indexOf(link) == -1 && links_done.indexOf(link) == -1)
                {
                    links_found_count += 1;
                    links_to.push(link);
                }
            }

            if(status == 'success')
            {
                //var content_needed = result.content;
                var content_needed = JSON.stringify(result.content) + ',\n';
                //content_needed = url + '\n\n' + content_needed + utils.getSplitterStr('-',60) + '\n';
                fs.appendFileSync(file_data, content_needed);
                fs.appendFileSync(file_log, 'DONE CRAWLING ' + url + '\nFound Data.\n' + new Date().toLocaleString() + '\n' + utils.getSplitterStr('-',30) + '\n');
                utils.showLog('APP','MSG','已保存文件\n' + utils.getSplitterStr('-',30) + '\n');
                content_found_count += 1;
            }
            else
            {
                //utils.showLog('APP','MSG','没有发现内容。\n' + utils.getSplitterStr('-',30) + '\n');
                fs.appendFileSync(file_log, 'DONE CRAWLING ' + url + '\nNO Data.\n' + new Date().toLocaleString() + '\n' + utils.getSplitterStr('-',30) + '\n');
            }
        }
        utils.showLog('APP','MSG','工作进度: ' + link_count.toString() + ' / ' + total_link_count.toString());
        utils.showLog('APP','MSG','共搜集链接：' + links_found_count.toString() + '个，搜集内容:：' + 
                        content_found_count.toString() + '个。\n' + utils.getSplitterStr('-',30) + '\n');
        event_emitter.emit('done_crawling');
    });    
});

event_emitter.on('done_crawling', () =>
{
    if(links_to.length > 0 && link_count < total_link_count)
    {
        // 3-3.5秒间隔爬取
        var interval = Math.floor(Math.random() * 5000);
        setTimeout(function() 
        {
            link_count += 1;
            event_emitter.emit('next');
        }, crawl_interval + interval);
        
    }
    else
    {
        fs.appendFileSync(file_data,'{\"none\":\"none\"}\n],\n' + '\"count\":' + content_found_count.toString() + '\n}');
        fs.appendFileSync(file_log,'DONE ALL WORK. ' + new Date().toLocaleString());
        utils.showLog('APP','MSG','DONE ALL WORK.');
    }
});

setTimeout(function() 
{
    event_emitter.emit('next');
}, 5000);