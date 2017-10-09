/*
 * 资源下载器，在需要下载的任务中，解析出来下载列表。
 * 根据下载列表批量下载。
 * 采用异步方法，采集到下载列表后，加入下载器任务列表中。
 * 下载器只要有任务，就启动下载。下载列表为空则停止下载。
 *  需要有任务记录。
 */ 

const fs = require('fs');
const request = require('request');
const utils = require('./utils');


var downloader = function()
{
    var self = this;
    self.init();
};

// downloader.prototype.status = 'waiting';
// downloader.prototype.task_list = [];
// downloader.prototype.done_list = [];
// downloader.prototype.count_success = 0;
// downloader.prototype.count_failure = 0;
// downloader.prototype.filepath = '';


downloader.prototype.init = function()
{
    var self = this;
    // self.filepath = filepath + '/resources/';
    // self.task_list = [];
    // self.done_list = [];
    // self.count_failure = 0;
    // self.count_success = 0;
    // self.status = 'waiting';
};

// downloader.prototype.count_task_remain = function()
// {
//     var self = this;
//     return self.task_list.length;
// };

// downloader.prototype.count_task_done = function()
// {
//     var self = this;
//     return self.done_list.length;
// };

// downloader.prototype.addTask = function(rsc_list)
// {
//     var self = this;
//     while(rsc_list.length > 0)
//     {
//         var task = rsc_list.shift();
//         if(self.task_list.indexOf(task) == -1 && self.done_list.indexOf(task) == -1)
//         {
//             self.task_list.push(task);
//         }
//     }
// };

downloader.prototype.download = function(resource, filepath, cb)
{
    var self = this;
    var filename = filepath + resource.split('/').pop();
    var fws =fs.createWriteStream(filename);
    request.get(resource).pipe(fws);
    fws.on('finish', () =>
    {
        utils.showLog('DOWNLOADER','MSG','存储文件成功');
    });
};






module.exports = downloader;