const axios = require('axios');
const cheerio = require('cheerio');
const PlaylistModel = require('./models/playlist_model');

const PAGE_URL = 'https://www.rails365.net';
const RESULT_ARR = [];

async function getPageData(options) {
  const { method = 'get', url, params = {} } = options;
  const { data } = await axios({
    method,
    url,
    data: params,
  });
  const randomSec = (3 + Math.random() * 6) * 1000;
  await sleep(randomSec);
  return data;
}

async function sleep(ms) {
  return await new Promise(rev => {
    setTimeout(rev, ms);
  });
}

async function getPlaylists() {
  const objArr = [];
  const playlistPage = await getPageData({
    url: `${PAGE_URL}/playlists`,
  });
  const $ = cheerio.load(playlistPage);
  $('.video-box').each((i, e) => {
    const obj = {};
    obj.listUrl = PAGE_URL + $(e).find('.real-ray').attr('href');
    obj.title = $(e).find('.real-ray').text();
    obj.isFinished = !!$(e).find('.label-primary').text();
    obj.coverImg = $(e).find('img').attr('src');
    obj.videoCount = $(e).find('p.time').children().length < 6 ?
      parseInt($(e).find('p.time').children().eq(2).text(), 10) :
      parseInt($(e).find('p.time').children().eq(4).text(), 10);
    objArr.push(obj);
  });
  return objArr;
}

async function getDetail(url) {
  const result = {
    desc: '',
    playlist: [],
  };
  const detailPage = await getPageData({ url });
  const $ = cheerio.load(detailPage);
  result.desc = $('.page-header .text-center.text-muted').text();
  $('.video-box').each((i, e) => {
    const obj = {};
    obj.detailUrl = PAGE_URL + $(e).find('.real-ray').attr('href');
    obj.title = $(e).find('.real-ray').text();
    obj.coverImg = $(e).find('img').attr('src');
    obj.isFree = $(e).find('p.time').eq(0).text() === '免费';
    obj.viewsCount = parseInt($(e).find('p.time').children().eq(2).text(), 10);
    obj.updateTime = $(e).find('p.time time').attr('datetime');
    result.playlist.push(obj);
  });
  return result;
}

async function getVideo(url) {
  const result = {
    videoUrl: '',
    article: '',
  };
  const videoPage = await getPageData({ url });
  const $ = cheerio.load(videoPage);
  const reg = /https:\/\/screen-videos\.oss-cn-shenzhen\.aliyuncs\.com\/upload.+\.mp4/;
  const urlMatch = videoPage.match(reg);
  result.videoUrl = urlMatch && urlMatch[0] || '';
  result.article = $('.panel-body').find('hr').next().text() || '';
  return result;
}

async function dealWithPlaylist(listUrl) {
  const result = {};
  const detailObj = await getDetail(listUrl);
  for (let i = 0, iLen = detailObj.playlist.length; i < iLen; i++) {
    const item = detailObj.playlist[i];
    const videoOjb = await getVideo(item.detailUrl);
    if (!videoOjb.videoUrl) {
      const replaceStr = item.title.match(/(#)(.+)/)[2];
      const originalUrl = decodeURI(detailObj.playlist[0].videoUrl);
      videoOjb.videoUrl = originalUrl.replace(/(.+)( .+)(1080p\.mp4)/, (match, p1, p2, p3) => encodeURI(p1 + replaceStr + p3));
    }
    Object.assign(item, videoOjb);
  }
  return Object.assign(result, detailObj);
}

async function spider() {
  const playlists = await getPlaylists()
    .catch(() => {
      console.log('ERROR: getPlaylists error');
      process.exit(1);
    });
  RESULT_ARR.concat(playlists);
  for (let i = 0, iLen = playlists.length; i < iLen; i++) {
    const item = playlists[i];
    const isExist = await PlaylistModel.findOneByUrl(item.listUrl)
      .catch(() => {
        console.log(`isExist error, url: ${item.listUrl}`);
        process.exit(1);
      });
    if (isExist) {
      // if (item.videoCount === isExist.videoCount) continue; // 存在且内容数量相等 ==> 没有更新，进入下一次循环
    } else {
      const playlist = await dealWithPlaylist(item.listUrl);
      const result = Object.assign(item, playlist);
      console.log(result);
      await PlaylistModel.insert(result)
        .catch((e) => {
          console.log(`PlaylistModel insert error, url: ${item.listUrl}`);
          console.log(e);
          process.exit(1);
        });
    }
  }
}

spider()
  .then((r) => {
    console.log(r);
    console.log('all done');
  })
  .catch((e) => {
    console.log(e);
  });
