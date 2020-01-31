'use strict';
var request = require('request');
let cheerio = require('cheerio');
let fs = require('fs'); 
/*
 * JADA LIFT SITE API
 * By: Kris Redding
 */

class Lift {  
    constructor(jtools) {
        this.sports = {
            "espn.com/nfl/schedule":function(config, callback){
                try {
                    var results = [];
                    if(!jtools.checkConfig(["url", "day_week"], config)){}
                    else {                    
                        var scrapurl = (config.day_week > 0 ? 
                            jtools.stringFormat("{0}{1}/_/week/{2}/seasontype/2",[(config.url.startsWith('http')?"":"http://"), config.url, config.day_week]) :
                            jtools.stringFormat("{0}{1}",[(config.url.startsWith('http')?"":"http://"), config.url]) );
                        
                        request(scrapurl, function (error, res, body){                                                           
                            if(!error && res.statusCode === 200){                                
                                const html = body;
                                const $ = cheerio.load(html);
                               
                                /* Get Days */
                                $('#sched-container').find('.table-caption').each(function(i, elem) {
                                    results[i] = {"day": $(this).text(), "games":[] }
                                });
                                
                                /* Get Games */
                                $('#sched-container').find('.responsive-table-wrap > .schedule').each(function(i, elem) {
                                    if(results[i]){
                                        $(this).find('tbody > tr').each(function(j, child){
                                            var tmpGame = {
                                                "awayTeam": $(this).find('td:nth-child(1)').text(),
                                                "homeTeam": $(this).find('td:nth-child(2)').text(),
                                                "gameInfo": $(this).find('td:nth-child(3)').text(),
                                            };
                                            results[i].games.push(tmpGame);
                                        });
                                    }
                                });
                            }
                            callback(results);
                        });
                    }
                }
                catch(ex){
                    console.log(ex);
                    callback(null);
                }
            },
            "espn.com/nba/schedule":function(config, callback){
                try {
                    var results = [];
                    if(!jtools.checkConfig(["url", "day_week"], config)){}
                    else {                    
                        var scrapurl = (config.day_week > 0 ? 
                            jtools.stringFormat("{0}{1}/_/date/{2}",[(config.url.startsWith('http')?"":"http://"), config.url, config.day_week]) :
                            jtools.stringFormat("{0}{1}",[(config.url.startsWith('http')?"":"http://"), config.url]) );
                        
                        request(scrapurl, function (error, res, body){                                                           
                            if(!error && res.statusCode === 200){                                
                                const html = body;
                                const $ = cheerio.load(html);
                               
                                /* Get Days */
                                $('#sched-container').find('.table-caption').each(function(i, elem) {
                                    results[i] = {"day": $(this).text(), "games":[] }
                                });
                                
                                /* Get Games */
                                $('#sched-container').find('.responsive-table-wrap > .schedule').each(function(i, elem) {
                                    if(results[i]){
                                        $(this).find('tbody > tr').each(function(j, child){
                                            var tmpGame = {
                                                "awayTeam": $(this).find('td:nth-child(1)').text(),
                                                "homeTeam": $(this).find('td:nth-child(2)').text(),
                                                "gameInfo": $(this).find('td:nth-child(3)').text(),
                                            };
                                            results[i].games.push(tmpGame);
                                        });
                                    }
                                });
                            }
                            callback(results);
                        });
                    }
                }
                catch(ex){
                    console.log(ex);
                    callback(null);
                }
            }
        }        
    }
}

module.exports = Lift;

