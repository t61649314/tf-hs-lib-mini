const {$Toast} = require('../../lib/iview/dist/base/index');
const {timeNode} = require('../../lib/const');

Page({
  data: {
    page: "",
    occupation: "",
    time: "",
    weakenArr: [],
    isInit: false,
    deckList: [],
  },
  onLoad: function (options) {
    wx.setNavigationBarTitle({
      title: options.page
    });
    this.setData({
      'page': options.page,
      'occupation': options.occupation,
      'time': options.time,
    });
    let weakenArr = timeNode.filter(item => {
      return new Date(item.time).getTime() > this.data.time && item.weakenCardArr;
    });
    weakenArr.forEach(item => {
      this.data.weakenArr = this.data.weakenArr.concat(item.weakenCardArr)
    });
    this.setData({
      'weakenArr': this.data.weakenArr
    });
    console.log(this.data.weakenArr)
    this.getDeckList();
  },
  getDeckList: function () {
    const db = wx.cloud.database();
    db.collection('deck-list').where({
      page: this.data.page,
      occupation: this.data.occupation,
    }).get().then(({data}) => {
      this.data.isInit = true;
      if (data && data.length) {
        data.forEach(item => {
          item.cards.forEach(item => {
            item.isWeaken = this.isWeaken(item.dbfId);
          })
        });
        this.data.deckList = data;
      }
      this.setData({
        'isInit': this.data.isInit,
        'deckList': this.data.deckList
      });
    }).catch(console.error)
  },
  isWeaken: function (dbfId) {
    return this.data.weakenArr.includes(dbfId);
  },
  handleClick: function (event) {
    wx.setClipboardData({
      data: event.currentTarget.dataset.code
    })
  }
});