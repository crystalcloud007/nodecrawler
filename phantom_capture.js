// PHANTOMJS PAGE CRAWLER

"use strict";

var sys = require('system');
var page = require('webpage').create();
var fs = require('fs');
var url = sys.args[1];
//var filename = sys.args[2];

page.settings.userAgent = 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:50.0) Gecko/20100101 Firefox/50.0';

// page.onResourceRequested = function (req) 
// {
//     console.log('requested: ' + JSON.stringify(req, undefined, 4));
// }; 

// page.onResourceReceived = function (res) 
// {
//     console.log('received: ' + JSON.stringify(res, undefined, 4));
// }; 

page.open(url, function(status)
{
    //console.log('OPENED: ' + url + '\nSTATUS: ' + status);
    // var title = page.evaluate(function()
    // {
    //     return document.getElementsByTagName('p').textContent;
    // });
    // fs.write(filename, page.content, 'w');
    // console.log('RESULT SAVED TO ' + filename);

    // 用这个返回至NODEJS
    console.log(page.content);
    phantom.exit(0);
});