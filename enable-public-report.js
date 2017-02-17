/**
 * This allows
 */

const rp = require('request-promise');
const _ = require('underscore');

const btoa = (data) => new Buffer(data).toString('base64');

module.exports = (ctx, cb) => {
  const pingdomApiVersion = 2;
  const pingdomApiUrl = `https://api.pingdom.com/api/${pingdomApiVersion}/`;
  const basicAuth = btoa(ctx.secrets.pingdom_credentials);
  const params = ctx.body.text.split(' ');
  
  /**
   * This fetches all of the checks with customer's name.  The customer's
   * name is queries by tag.  The returned checks are then filtered for a 
   * production tag.
   **/
   const fetchCustomerCheck = (customerName) => {
     const options = {
       url: `${pingdomApiUrl}checks?include_tags=true&tags=${customerName}`,
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'App-Key': ctx.secrets.pingdom_api_key
      },
      json: true
     };
     
     return rp.get(options)
       .then((results) => {
         // Filters the checks to only return the production checks
         const filteredCheck = _.filter(results.checks, (check) => {
           var shouldKeep = true;
           _.each(check.tags, (tag) => {
             var tagName = tag.name.toLowerCase()
             shouldKeep = shouldKeep && (tagName === 'production' || tagName === customerName);
           });
           return shouldKeep;
         }); 
         
         if (filteredCheck && filteredCheck.length > 0) return filteredCheck[0].id;
         else return -1;
       });
   };
  
  /**
   * Retrieves all of the reports that are visible to the public.  This is a list of reports
   * that we are currently sharing with a customer (e.g. the report can be accessible by a public
   * URL).
   */
  const fetchPublishedReports = () => {
    const options = {
      url: `${pingdomApiUrl}reports.public`,
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'App-Key': ctx.secrets.pingdom_api_key
      },
      json: true
    };
    
    return rp.get(options)
      .then((reports) => {
        const publishedReports = [];
        _.each(reports.public, (report) => {
          publishedReports.push({
             customer: report.checkname,
             url: report.reporturl
          });
        });
        
        return publishedReports;
      });
  };
  
  const enableReport = (checkId) => {
    const options = {
      url: `${pingdomApiUrl}reports.public/${checkId}`,
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'App-Key': ctx.secrets.pingdom_api_key
      },
      json: true
    };
    return rp.put(options);
  };
  
  const disableReport = (checkId) => {
    const options = {
      url: `${pingdomApiUrl}reports.public/${checkId}`,
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'App-Key': ctx.secrets.pingdom_api_key
      },
      json: true
    };
    return rp.delete(options);
  };
  
  // This all of the published reports
  if (params[0] === '-p' || params[0] === '-ls') {
    fetchPublishedReports()
      .then((publishedReports) => {
        var message = {
          "attachments": []
        };
        _.each(publishedReports, (report) => {
          const attachment = {
            "color": "#36a64f",
            "author_name": report.customer,
            "title": report.url,
            "title_link": report.url,
      			"text": `To disable run \`/wt appliance-stats-report -off ${report.customer}\``,
      			"mrkdwn_in": ["text"]
          };
          message.attachments.push(attachment);
        });
        
        cb(null, message);
      })
      .catch((err) => {
        cb(null, { text: 'There was an error trying to retrieve all of the published reports' });
      });
  }
  else if (params[0] === '-on' || params[0] === '-off') {
    fetchCustomerCheck(params[1])
      .then((checkId) => {
        if (checkId > 0) {
          const action = params[0] === '-on' ? enableReport : disableReport;
          return action(checkId).then(() => Promise.resolve(checkId));
        } 
        else {
          cb(null, { text: 'We were unable to find an uptime report that matched your request.' });
        }
      })
      .then((checkId) => {
        if (params[0] === '-off') {
          cb(null, { text: `You have successfully disabled the report.`});
        }
        else {
          cb(null, { text: `Here is the URL for the report http://stats.pingdom.com/qa7tjyzpmumy/${checkId}`});
        }
      })
      .catch((err) => {
        console.log(err);
         cb(null, { text: `There was a failure trying to enable the status page.`});
      });
    
  }
  else {
    cb(null, { text: `The command you entered was not recognized.\r\n\t-on company-name-tag : Enables the public uptime report.\r\n\t-off company-tag-name : disables the public uptime report.\r\n\t-p : Displays a list of all the uptime reports that are currently enabled.` });
  }
};
