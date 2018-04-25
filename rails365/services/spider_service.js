const axios = require('axios');
const cheerio = require('cheerio');
const Playlist = require('../models/playlist_model');

const PAGE_URL = 'https://www.rails365.net';

// sleep
async function sleep(ms) {
  return await new Promise(rsv => {
    setTimeout(rsv, ms);
  });
}

// random arr
function randomArr(arr) {
  return arr.sort(() => 0.5 - Math.random());
}

// axios 获取 playlist 集合页数据
async function getPageData(options) {
  const { method = 'get', url, params = {} } = options;
  const { data } = await axios({
    method,
    url,
    data: params,
  })
    .catch((e) => {
      throw e;
    });
  const randomSec = (3 + Math.random() * 6) * 1000;
  await sleep(randomSec);
  return data;
}

// 获取所有 playlist url
async function getPlaylists() {
  const result = [];
  const playlistPage = await getPageData({
    url: `${PAGE_URL}/playlists`,
  });
  const $ = cheerio.load(playlistPage);
  $('.video-box').each((i, e) => {
    const listUrl = PAGE_URL + $(e).find('.real-ray').attr('href');
    result.push(listUrl);
  });
  return result;
}

// 获取 playlist 详情页信息
async function getDetail(url) {
  const result = {
    listUrl: url,
    desc: '',
    playlist: [],
  };
  const detailPage = await getPageData({ url });
  const $ = cheerio.load(detailPage);
  result.title = $('.page-header h4.title-header').text();
  result.videoCount = Number($('.page-header h4.title-header span.text-muted').text().match(/\d+/)[0]);
  result.desc = $('.page-header .text-center.text-muted').text();
  result.isFinished = $('.page-header p.text-center span.label').text().indexOf('完结') > -1;
  $('.video-box').each((i, e) => {
    const obj = {};
    obj.detailUrl = PAGE_URL + $(e).find('.real-ray').attr('href');
    obj.title = $(e).find('.real-ray').text();
    obj.coverImg = $(e).find('img').attr('src');
    obj.isFree = $(e).find('p.time').eq(0).text() === '免费';
    obj.viewsCount = parseInt($(e).find('p.time').children().eq(2).text(), 10);
    obj.updateTime = $(e).find('p.time time').attr('datetime');
    obj.sortNum = parseInt(obj.title.match(/#(\d+)/)[1], 10);
    result.playlist.push(obj);
  });
  return result;
}

// 获取 playlist video 页信息
async function getVideo(url) {
  const result = {
    article: '',
  };
  const videoPage = await getPageData({ url });
  const $ = cheerio.load(videoPage);
  const reg = /https:\/\/screen-videos.+\.mp4/;
  const urlMatch = videoPage.match(reg);
  result.realVideo = urlMatch && urlMatch[0] || '';
  result.realDecode = result.realVideo ? decodeURI(result.realVideo) : '',
    result.article = $('.panel-body').find('hr').next().text() || '';
  return result;
}

// 组合成要插入数据库的文档
async function dealWithPlaylist(listUrl) {
  const result = {};
  const detailObj = await getDetail(listUrl);
  for (let i = 0, iLen = detailObj.playlist.length; i < iLen; i++) {
    const item = detailObj.playlist[i];
    const videoOjb = await getVideo(item.detailUrl);
    if (!videoOjb.realVideo) {
      let replaceStr = item.title.match(/(#)(.+)/)[2];
      const caseBracket = replaceStr.indexOf('（');
      if (caseBracket > -1) replaceStr = replaceStr.slice(0, caseBracket);
      const originalUrl = decodeURI(detailObj.playlist[0].realVideo);
      videoOjb.guessVideo = originalUrl.replace(/(.+ )(\d+ .+)( .+\.mp4)/, (match, p1, p2, p3) => encodeURI(p1 + replaceStr + p3));
      videoOjb.guessDecode = decodeURI(videoOjb.guessVideo);
    }
    Object.assign(item, videoOjb);
  }
  return Object.assign(result, detailObj);
}

// 获取一个 playlist 所有内容
async function getSinglePlaylist(listUrl) {
  const playlistObj = await dealWithPlaylist(listUrl)
    .catch((e) => {
      throw e;
    });
  const result = await Playlist.model.findOneAndUpdate(
    { listUrl },
    playlistObj,
    { upsert: true, new: true },
  );
  return result;
}

// 获取多个 playlist 所有内容
async function spideringPlaylists(arr) {
  const result = {
    success: 0,
    failed: 0,
  };
  // const playlistUrlsArr = await getPlaylists();
  for (let i = 0; i < arr.length; i++) {
    const listUrl = arr[i];
    await getSinglePlaylist(listUrl)
      .then(() => {
        result.success++;
      })
      .catch((e) => {
        console.log(e);
        result.failed++;
      });
  }
  return result;
}

module.exports = {
  sleep,
  randomArr,
  getPlaylists,
  getSinglePlaylist,
  spideringPlaylists,
};