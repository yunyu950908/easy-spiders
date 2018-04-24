const axios = require('axios');
const cheerio = require('cheerio');

const dataSchema = {
  listUrl: String, // index unique required
  listTitle: String,
  listSubTitle: String,
  listStatus: Number, // 0 - 完结，1 - 更新中。
  listLength: Number, // 当前列表视频数量
  playList: [{
    title: String,
    imgUrl: String,
    updateTime: String, // 更新时间戳
    watchCount: Number,
    pageUrl: String, // unique required
    videoUrl: String, // 收费视频需要拼接转义
    article: String,
    isFree: Boolean,
  }],
};

const urls = {
  playList: 'https://www.rails365.net/playlists',
};

async function getPageData(options) {
  const { method, url, params = {} } = options;
  const { data } = await axios({
    method,
    url,
    data: params,
  });
  return data;
}

async function spider() {
  const playListPage = await getPageData({
    method: 'get',
    url: urls.playList,
  });
  const $ = cheerio.load(playListPage);
  const result = [];


}


