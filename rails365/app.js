require('./services/mongoose_service');
require('./spider');

process.on('uncaughtException', (err) => {
  console.log(err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, p) => {
  console.log(reason, p);
  process.exit(1);
});
