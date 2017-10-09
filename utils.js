/*
 * Utility functions.
 * Created by ZHR. 20170831
 */ 

const configs = require('./configs');

module.exports = 
{
    // Extract Domain Name
    // Domain name is embedded in url.
    // First extract the 3rd element from the url
    // splitted by '/'.
    // Then get the last 2 or 3 element from the '/' element splitted
    // by '.'. 
    getDomainInfo : function(url)//, domain_length)
    {
        var err = true;
        var protocol = '';
        var domain_name= '';
        var result = {err:err, protocol:protocol, domain_name : domain_name};
        var splitted_slash = url.split('/');
        if(splitted_slash.length < 3) return result;
        protocol = splitted_slash[0].replace(':','');
        domain_name = splitted_slash[2];
        // var web_names = splitted_slash[2].split('.');
        // if(web_names.length < domain_length) return result;
        // var last_index = web_names.length - 1;
        // while(domain_length > 0)
        // {
        //     domain_name = web_names[last_index] + domain_name;
        //     domain_length -= 1;
        //     last_index -= 1;
        //     if(domain_length > 0) domain_name = '.' + domain_name;
        // }
        result = {err:false, protocol:protocol, domain_name : domain_name};
        return result;
    },

    getCharSet: function(content_type)
    {
        if(!content_type) return 'invalid';
        var charset = content_type.split('=')[1];
        return charset;
    },

    getRandomStr : function(length)
    {
        if(isNaN(length) || length < 6)
        {
            length = 6;
        } 

        var result = '';
        while(length > 0)
        {
            result += configs.str_list[Math.floor(Math.random() * configs.str_list.length)];
            length -= 1;
        }
        return result;
    },

    // Check if the link is in the feature group
    checkIfLinkFitsFeature:function(link, feature_arr)
    {
        // 如果指定了针对某些特殊链接抓取
        var link_ok = false;
        if(feature_arr !== undefined && feature_arr.length > 0)
        {
            for(var i = 0; i < feature_arr.length; i++)
            {
                if(link.substring(0, feature_arr[i].length) == feature_arr[i])
                {                    
                    link_ok = true;
                    break;
                }
            }
        }
        else link_ok = true;

        return link_ok;
    },

    // Get a specific string with the char and length.
    // Usually use it as a splitter.
    getSplitterStr: function(char, length)
    {
        var result = '';
        if(isNaN(length) || length < 0) return result;

        while(length > 0)
        {
            result += char;
            length -= 1;
        }
        return result;
    },

    // Show Log
    showLog : function(entity, status, info)
    {
        console.log('[' + entity + ' | ' + status + ']\t' + info);
    },

    // Check if it is a http request url
    checkHTTPStr : function(input)
    {
        var re = /^(http:\/\/)|(https:\/\/)/;
        return re.test(input);
    },

    // Check if it is an array 
    checkArrayStr : function(input)
    {
        var re = /^\[.+\]$/;
        return re.test(input);
    },

    // Check if it is an html page
    checkHTMLPageHeader:function(input)
    {
        var re = /text\/html/;
        return re.test(input);
    }

};