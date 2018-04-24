const mongoose = require('mongoose');
const moment = require('moment');

const { Schema } = mongoose;

const PlaylistSchema = new Schema({
  listUrl: { type: String, required: true, unique: true, index: 1 }, // playlist url
  coverImg: { type: String },
  title: { type: String, required: true }, // playlist title
  desc: { type: String },
  isFinished: { type: Boolean, required: true },
  videoCount: { type: Number, required: true, default: 0 }, // playlist length
  playlist: [
    {
      sortNum: { type: Number, required: true, unique: true },
      title: { type: String, required: true }, // video title
      coverImg: { type: String },
      detailUrl: { type: String, required: true, unique: true }, // video page url
      isFree: { type: Boolean, required: true },
      viewsCount: { type: Number, required: true },
      updateTime: { type: String, required: true },
      realVideo: { type: String, unique: true },
      guessVideo: { type: String, unique: true }, // video url 收费视频需要转义拼接猜出来 部分可用
      guessDecode: { type: String, unique: true },
      article: { type: String },
    },
  ],
  createdAt: { type: String, required: true, default: moment(Date.now()).format('YYYY-MM-DD hh:mm:ss') },
  updatedAt: { type: String, required: true, default: moment(Date.now()).format('YYYY-MM-DD hh:mm:ss') },
  timestamp: { type: Number, required: true, default: Date.now() },
});

const PlaylistModel = mongoose.model('rails365', PlaylistSchema);

module.exports = {
  model: PlaylistModel,
};
