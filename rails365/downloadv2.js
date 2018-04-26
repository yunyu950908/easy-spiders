const fs = require('fs');
const axios = require('axios');
Promise = require('bluebird');

require('./services/mongoose_service');
const Playlist = require('./models/playlist_model');
const mkdir = Promise.promisify(fs.mkdir);

async function fetchVideo(url, folder, name) {
  try {
    const { data } = await axios({
      method: 'get',
      url,
      responseType: 'stream',
    });
    const path = `${folder}/${name}.mp4`;
    const writeStream = fs.createWriteStream(path);
    data.pipe(writeStream);
    await new Promise(rsv => {
      writeStream.on('close', rsv);
    }).then(async () => {
      await Playlist.model.findOneAndUpdate({ 'playlist.guessDecode': decodeURI(url) }, { 'playlist.$.guessVideo': url })
        .then(() => {
          console.log(`guessVideo update success ${name}`);
        })
        .catch((e) => {
          console.log((e));
        });
    });
  } catch (e) {
    await Playlist.model.findOneAndUpdate({ 'playlist.guessVideo': url }, { 'playlist.$.guessVideo': 'error url' })
      .then(() => {
        console.log(`guessVideo error ${name}`);
      })
      .catch((e) => {
        console.log((e));
      });
  }
}

async function downloadSingleList(listUrl, path) {
  const playlistData = await Playlist.model.findOne({ listUrl })
    .catch((e) => {
      throw e;
    });
  const { title, playlist } = playlistData;
  const folder = `${path[path.length - 1] === '/' ? (path + title) : (path + '/' + title)}`;
  await mkdir(folder)
    .catch((e) => {
      if (e.errno === -17 && e.code === 'EEXIST') return;
      throw e;
    });
  for (let i = 0; i < playlist.length; i++) {
    const e = playlist[i];
    const videoUrl = e.realVideo || encodeURI(e.guessDecode);
    await fetchVideo(videoUrl, folder, e.title.match(/(#)(.+)/)[2]);
  }
}


switch (process.argv[2]) {
  case 'single_list':
    const listUrl = process.argv[3];
    const localPath = process.argv[4];
    downloadSingleList(listUrl, localPath)
      .then(() => {
        console.log('done');
      }).catch((e) => {
      console.log(e);
    });
    break;
  default:
    console.log(
      `
      - single_list listUrl localPath , 下载该 listUrl playlist 中所有视频并存放在 localPath 目录
      `,
    );
    process.exit(0);
}



