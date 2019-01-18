const {timeNode} = require('../../lib/const');

Page({
  data: {
    id: "",
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
    if (options.id) {
      this.setData({
        'id': options.id,
        'time': options.time,
      });
    } else {
      this.setData({
        'page': options.page,
        'occupation': options.occupation,
        'time': options.time,
      });
    }
    let weakenArr = timeNode.filter(item => {
      return new Date(item.time).getTime() > this.data.time && item.weakenCardArr;
    });
    weakenArr.forEach(item => {
      this.data.weakenArr = this.data.weakenArr.concat(item.weakenCardArr)
    });
    this.setData({
      'weakenArr': this.data.weakenArr
    });
    this.getDeckList();
  },
  getDeckList: function () {
    let where;
    if (this.data.id) {
      where = {_id: this.data.id};
    } else {
      where = {
        page: this.data.page,
        occupation: this.data.occupation,
      };
    }
    const db = wx.cloud.database();
    db.collection('deck-list')
      .where(where)
      .get().then(({data}) => {
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