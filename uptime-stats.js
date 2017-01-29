const rp = require('request-promise');
const _ = require('underscore');

const btoa = (data) => new Buffer(data).toString('base64');

module.exports = (ctx, cb) => {
  const date = new Date();
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getTime() / 1000;
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getTime() / 1000;
  const pingdomApiVersion = 2;
  const pingdomApiUrl = `https://api.pingdom.com/api/${pingdomApiVersion}/`;
  const basicAuth = btoa(ctx.secrets.pingdom_credentials);
  const filters = ctx.body.text.split(' ');

  var findCheck = (checks) => {
    var promise = new Promise((resolve, reject) => {
      var filteredCheck = _.find(checks, (check) => {
        var isIt = filters.length > 0;
        
        _.each(filters, (tag) => {
          isIt = isIt && check[tag];
        });
        
        return isIt;
      });
      
      if (filteredCheck) { resolve(filteredCheck); }
      else { reject('Failed to find a check'); }
    });
    
    return promise;
  }

  var requestChecks = () => {
    const options = {
      method: 'GET',
      url: `${pingdomApiUrl}checks?include_tags=true`,
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'App-Key': ctx.secrets.pingdom_api_key
      }
    };
    
    return rp(options);
  };
  
  var requestSummaryPerformance = (check) => {
    const options = {
      url: `${pingdomApiUrl}summary.performance/${check.id}?includeuptime=true&resolution=day&from=${firstDay}&to=${lastDay}`,
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'App-Key': ctx.secrets.pingdom_api_key
      }
    }
    
    return rp(options);
  }
  
  var createCustomMap = (data) => {
    var promise = new Promise((resolve, reject) => {
      var checksData = JSON.parse(data).checks || [];
      var checks = [];
      for(var i = 0; i < checksData.length; i++) {
        var check = {
          id: checksData[i].id,
          currentStatus: checksData[i].status
        };
        
        checksData.tags = checksData.tags || [];
        for(var j = 0; j < checksData[i].tags.length; j++) {
          check[checksData[i].tags[j].name] = true;
        }
        
        checks.push(check);
        
      }
      resolve(checks);
    });
    
    return promise;
  }
  
  var buildUptimeReport = (summary) => {
    var promise = new Promise((resolve, reject) => {
      var summaryReport = JSON.parse(summary) || {summary: {days: []}};
      var weeks = summaryReport.summary.days;
      
      if (!weeks || weeks.length < 1) reject('Not enough data to generate report');
      
      var downtime = 0;
      var uptime = 0;
      
      _.each(weeks, (week) => {
        
        downtime += week.downtime;
        uptime += week.uptime;
      });
      
      var percentageUp = uptime / (uptime + downtime) * 100;
      resolve({downtime, uptime, percentageUp});
    });
    
    return promise;
  }

  requestChecks()
    .then(createCustomMap)
    .then(findCheck)
    .then(requestSummaryPerformance)
    .then(buildUptimeReport)
    .then(function (stats) {
      var message = { text: `This check has ${stats.percentageUp}% uptime from ${new Date(firstDay * 1000)} through ${new Date(lastDay*1000)}.`, response_type: 'in_channel'  };
      cb(null, message);
    })
    .catch(function (err) {
      cb(null, { text: 'Error: ' + JSON.stringify(err)});
    });
  }
