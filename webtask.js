/**
 * This /wt is used to return the the check information from pingdom for all the managed appliances.
 *
 * Basic Usage:
 * /wt pingdom-checks => returns all of the monitored appliances
 * /wt pingdom-checks tag1 tag2 .. tagN => returns any monitor with at least one of these tags.
 **/

const request = require('request');

module.exports = (ctx, cb) => {
  const pingdomApiVersion = 2;
  const pingdomApiUrl = `https://api.pingdom.com/api/${pingdomApiVersion}/`;
  const tags = ctx.body.text.split(' ').join(',');

  var btoa = (data) => new Buffer(data).toString('base64');
  
  var getChecks = () => {
    const basicAuth = btoa(ctx.secrets.pingdom_credentials);
    const options = {
      url: `${pingdomApiUrl}checks?tags=${tags}`,
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'App-Key': ctx.secrets.pingdom_api_key
      }
    };
    
    request(options, checkResults);
  };
  
  var checkResults = (err, res, body) => {
    if (err || body.error) {
      console.log(err);
      cb(null, { text: `Sorry  @${ctx.body.user_name}, this is embarrassing, but we failed you.`})
      return;  
    }
    
    const message = { attachments: [], response_type: 'in_channel' };
    const checks = JSON.parse(body).checks || [];
    
    if (checks.length === 0) {
      cb(null, { text: `Sorry we could not find any monitored appliances with the filtering criteria.`})
    }
    
    for(var i = 0; i < checks.length; i++) {
      var attachment = {
        color: checks[i].status === 'up' ? 'good' : 'danger',
        title: checks[i].name,
        text: checks[i].hostname
      };
      
      message.attachments.push(attachment);
    }
    
    cb(null, message);
  };



  getChecks(tags);
};
