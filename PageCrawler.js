/* 爬虫类
 * 实现定向页面爬取功能，只爬取HTML信息
 * 获取信息 -> 选定爬取模块 -> 分析页面 -> 提取信息 -> 返回
 * 20170908
*/ 

const cheerio = require('cheerio');
const request = require('request');
const spawn = require('child_process').spawn;
const iconv = require('iconv-lite');
const utils = require('./utils');

var crawler = function()
{
    var self = this;
    this.init();
    utils.showLog(self.name,'MSG',self.name + '已经生成');
};

crawler.prototype.name = '';
crawler.prototype.base_url = '';
crawler.prototype.protocol = '';
crawler.prototype.domain_name = '';
crawler.prototype.element_to_fetch = '';
crawler.prototype.element_fetched_title = '';
crawler.prototype.content_mode = '';
crawler.prototype.element_to_download = '';
crawler.prototype.crawl_link_features = [];

crawler.prototype.init = function()
{
    var self = this;
    self.name = 'CRAWLER_' + utils.getRandomStr(6);
};


crawler.prototype.crawlPage = function(url, mode, module_name, element_to_fetch, element_fetched_title, base_url, features, cb)
{
    var self = this;
    self.base_url = base_url;
    self.crawl_link_features = features;
    var domain_info = utils.getDomainInfo(base_url);
    self.domain_name = domain_info.domain_name;
    self.protocol = domain_info.protocol;
    self.element_to_fetch = element_to_fetch;
    self.element_fetched_title = element_fetched_title;
    module_name == 'request' ? this.crawlWithRequest(url, mode, cb) : this.crawlWithPhantomjs(url, mode, cb);
};

crawler.prototype.crawlWithRequest = function(url, mode, cb)
{
    var self = this;
    utils.showLog('CRAWLER','MSG','CRAWL WITH REQUEST');
    request(url,(err,resp,body)=>
    {
        if(err)
        {
            utils.showLog('CRAWLER','ERR',err);
            return cb(url, 'err', err);  
        } 
        else if(!utils.checkHTMLPageHeader(resp.headers['Content-Type']) &&
                !utils.checkHTMLPageHeader(resp.headers['content-type']))
        {
            utils.showLog('CRAWLER','MSG','Not HTML page. ' + resp.headers['Content-Type']);
            return cb(url, 'invalid_format');
        }
        else
        {            
            var charset = '';
            var html_head_charset = '';
            var html_head_content = '';
            var decoded_body = '';            
            var $ = cheerio.load(body);

            // Deal with the encodings
            $('meta','head').each(function(i,e)
            {
                html_head_charset = $(e).attr('charset');
                html_head_content = $(e).attr('content');
                if(typeof(html_head_charset) != 'undefined')
                {
                    charset = html_head_charset;
                }

                if(typeof(html_head_content) != 'undefined')
                {
                    if(html_head_content.match(/charset=/ig))
                    {                        
                        index = html_head_content.indexOf('=');
                        charset = html_head_content.substring(index+1);
                    }
                }
            });

            utils.showLog('CRAWLER','MSG','charset: ' + charset);            

            // cheerio cannot return buffer, so convert the whole html body.
            // If charset found, decode from the specific charset.
            if(charset)
            {
                if(iconv.encodingExists(charset.toLowerCase()))
                {
                    decoded_body = iconv.decode(Buffer.from(body), charset.toLowerCase());
                }
                else
                {
                    utils.showLog('CRAWLER','MSG','Unsupported encoding: ' + charset);
                    return event_emitter.emit('done_crawling');
                }                
            }
            // No charset found, decode from default utf-8.
            else
            {                
                decoded_body = iconv.decode(Buffer.from(body),'utf8');
            }
            self.getInfoFromResult(url, mode, decoded_body, cb);
        }  
    });
};

crawler.prototype.crawlWithPhantomjs = function(url, mode, cb)
{
    var self = this;
    utils.showLog('CRAWLER','MSG','CRAWL WITH PHANTOMJS');
    var ls = spawn('c:/apps/phantom/phantomjs',['phantom_capture.js',url]);
    
    var result = '';
    ls.stdout.on('data', (data) =>
    {
        var buf = new Buffer(data);
        result += buf.toString('utf8');
    });
        
    ls.stderr.on('data', (data) =>
    {
        utils.showLog('CRAWLER','ERR',err);
    });
    
    ls.on('close', (code)=>
    {
        if(code == 1) 
        {
            utils.showLog('CRAWLER','ERR','PHANTOMJS出错并退出');
            return cb(url, 'err','PHANTOMJS出错并退出');
        }
        else
        {
            // 查看返回值是否是html页面。
            // var is_html = false;
            // var $ = cheerio.load(result);
            // $('meta').each(function(i,e)
            // {
            //     var content = $(e).attr('content');
            //     console.log(content);
            //     if(typeof(content) != 'undefined' && content.match(/text\/html/ig))
            //     {                
            //         is_html = true;
            //         return false;
            //     }
            // });
            // if(is_html) self.getInfoFromResult(url, mode, result, cb);
            // else return cb(url,'invalid_format');

            self.getInfoFromResult(url, mode, result, cb);
        }            
    });
};

crawler.prototype.getInfoFromResult = function(url, mode, result, cb)
{
    var self = this;
    
    $ = cheerio.load(result);    
    var links_found = [];
   // Deal with links if in 'site' mode.
   if(mode == 'site')
   {
       $('a').each(function()
       {           
           var link = $(this).attr('href');
           var link_ok = false;
           if(link && link != 'javascript:void(0)' && 
               utils.getDomainInfo(link).domain_name == self.domain_name)
            {
                links_found.push(link);
            }
            if(link && link != 'javascript:void(0)' && link.charAt(0) == '/')
            {
                link = self.protocol + '://' + self.domain_name + link;                
                links_found.push(link);
            }
       });
   }

   var links_and_content = {links_found:links_found, content:{url:url}};  

   // Deal with the desired data
   // 如果采用特征链接抓取模式，要做一些处理。   
   if(self.element_to_fetch != '' && utils.checkIfLinkFitsFeature(url, self.crawl_link_features))
   {
       var element_feature_list = self.element_to_fetch.split(',');
       //console.log(element_feature_list.length.toString());
       var element_title_list = self.element_fetched_title.split(',');
       //console.log(element_title_list.length.toString());
       var has_info = false;
       for(var i = 0; i < element_feature_list.length; i++)
       {
           var feature = element_feature_list[i];
           var title = element_title_list[i];

           var content_needed = $(feature).text();
           if(content_needed)
           {
                has_info = true;
                var content_arr = content_needed.split(/\s{2,}|\t|\r|\n/);
                content_needed = '';
                for(var i =0 ; i < content_arr.length; i++)
                {
                    if(content_arr[i]) content_needed += content_arr[i] + '\n';
                }
                utils.showLog('CRAWLER','MSG','获得信息\n' + title + ' : ' + content_needed);
                links_and_content.content[title] = content_needed;
           }
           else
           {
                links_and_content.content[title] = '';
           }
       }
       if(has_info)
       {
           return cb(url,'success',links_and_content);
       }
       else
       {
           utils.showLog('CRAWLER','MSG','没有发现内容。\n' + utils.getSplitterStr('-',30) + '\n');
           return cb(url,'nothing_found', links_and_content);
       }    
   }
   else if(self.element_to_fetch != '')
   {
        utils.showLog('CRAWLER','MSG','URL特征不符。不抓取数据。\n' + utils.getSplitterStr('-',30) + '\n');
        return cb(url,'nothing_found', links_and_content);
   }
   else
   {
        utils.showLog('CRAWLER','MSG','没有指定特征，不抓取数据。\n' + utils.getSplitterStr('-',30) + '\n');
        return cb(url,'nothing_found', links_and_content);
   }
};

module.exports = crawler;