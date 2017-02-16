module.exports = (ctx, cb) => {

  
  cb(null, { text: `Hello, @${ctx.body.user_name}!` });
}
