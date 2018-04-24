const AV = require('leancloud-storage');
const moment = require('moment');
const APP_ID = require('./config').LC_APP_ID;
const APP_KEY = require('./config').LC_APP_KEY;

AV.init({
  appId: APP_ID,
  appKey: APP_KEY,
});

async function connectTest() {
  const TestConnection = AV.Object.extend('TestConnection');
  const test = new TestConnection();
  test.set('ConnectTime', moment(Date.now()).format('YYYY-MM-DD hh:mm:ss'));
  return await test.save();
}

connectTest()
  .then(() => console.log('leancloud connected!'))
  .catch((err) => {
    console.log('leancloud connection error!', err.message);
    process.exit(1);
  });
