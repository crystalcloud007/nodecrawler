# nodecrawler
a simple, event-driven, standalone, file-based web crawler.
采用命令行和读文件配置两种方式启动，推荐以读文件的方式启动。例子在params文件夹里。
可以使用request和phantomjs两个模块获取网页信息。一般的网站用request即可，实在需要渲染js的，再用phantomjs。
标注需要抓取的html tag，然后给每个tag指定title，爬虫就可以使用json的方式储存抓取结果了。
正在完成downloader模块，实现后，可以从目标网站下载指定资源。
