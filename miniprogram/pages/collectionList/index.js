const {formatTime} = require('../../lib/utils');
const typeTitleMap = {"wild": "狂野", "standard": "标准"};
const app = getApp();
Page({
  data: {
    deckList: [],
    scrollHeight: 0,
    scrollLoading: false,
    noMore: false,
    pageNum: 1,
  },
  onShow() {
    this.setData({
      'deckList': [],
      'noMore': false,
      'pageNum': 1,
    });
    this.getDeckList();
  },
  onReady() {
    wx.getSystemInfo({
      success: (res) => {
        const windowHeight = res.windowHeight;
        this.setData({
          'scrollHeight': windowHeight
        });
      }
    })
  },
  lower(e) {
    if (!this.data.noMore) {
      this.setData({
        'pageNum': this.data.pageNum + 1
      });
      this.getDeckList();
    }
  },
  getDeckList() {
    this.setData({
      'scrollLoading': true
    });
    const skip = (this.data.pageNum - 1) * 20;
    const db = wx.cloud.database();
    let collection = db.collection('collection-list')
      .where({
        userId: app.globalData.openid
      })
      .limit(20)
      .orderBy('createTime', 'desc');
    let promise;
    if (skip && skip > 0) {
      promise = collection.skip(skip).get();
    } else {
      promise = collection.get();
    }
    promise.then(({data}) => {
      if (data && data.length) {
        if (data.length < 20) {
          this.setData({
            'noMore': true
          });
        }
        data.forEach(item => {
          item.createTimeStr = formatTime(new Date(item.createTime));
          item.deckTypeStr = typeTitleMap[item.deckType];
        });
        this.data.deckList = this.data.deckList.concat(data);
        this.setData({
          'deckList': this.data.deckList
        });
      }
      this.setData({
        'scrollLoading': false
      });
    }).catch(console.error)
  }
});