const Spider = require('../services/spider_service');

const URL_ARR = [];
const SPIDER_COUNT = 5;

async function addPlaylists() {
  await Spider.getPlaylists()
    .then((r) => {
      const RANDOM_ARR = Spider.randomArr(r);
      URL_ARR.push(...RANDOM_ARR);
    })
    .catch((e) => {
      console.log(e);
      process.exit(1);
    });
}

async function getPlaylistInfinite() {
  await addPlaylists();
  while (URL_ARR.length > 0) {
    const fuckList = URL_ARR.splice(0, SPIDER_COUNT);
    await Spider.spideringPlaylists(fuckList)
      .then(r => {
        console.log(r);
      })
      .catch(e => {
        console.log(e);
      });
    if (!URL_ARR.length) {
      await Spider.sleep(7 * 24 * 60 * 60 * 1000);
      await addPlaylists();
    }
  }
}

switch (process.argv[2]) {
  case 'get_single_playlist':
    Spider.getSinglePlaylist(process.argv[3])
      .then((r) => {
        console.log(`success - ${r.title}`);
        process.exit(0);
      })
      .catch((e) => {
        console.log(e);
        process.exit(1);
      });
    break;
  case 'start_getting_playlists':
    getPlaylistInfinite()
      .then(() => {
        console.log('done');
        process.exit(0);
      })
      .catch((e) => {
        console.log(e);
        process.exit(1);
      });
    break;
  default:
    console.log(
      `
      error: need params\n
      - get_single_playlist [String: playlist url]\n
      - start_getting_playlists\n
      `,
    );
    process.exit(0);
    break;
}
