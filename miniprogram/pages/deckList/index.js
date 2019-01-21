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
    scrollHeight: 0,
    fromUrl: "",
    fromMap: {"vicious-syndicate": "ViciousSyndicate", "tempo-storm": "TempoStorm", "shengerkuangye": "生而狂野战报"}
  },
  onLoad: function (options) {
    wx.setNavigationBarTitle({
      title: options.page
    });
    wx.getSystemInfo({
      success: (res) => {
        this.setData({
          'scrollHeight': res.windowHeight
        });
      }
    });
    if (options.id) {
      this.setData({
        'id': options.id,
      });
    } else {
      this.setData({
        'page': options.page,
        'occupation': options.occupation,
      });
    }
    this.setData({
      'time': options.time
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
      db.collection('report-list')
        .where({
          name: this.data.deckList[0].page
        })
        .get().then(({data}) => {
        this.setData({
          'fromUrl': data[0].fromUrl
        });
      }).catch(console.error)
    }).catch(console.error)
  },
  isWeaken: function (dbfId) {
    return this.data.weakenArr.includes(dbfId);
  },
  handleClick: function (event) {
    wx.setClipboardData({
      data: event.currentTarget.dataset.code,
      success(res) {
        wx.hideToast();
        wx.showToast({
          title: '复制卡组成功',
          icon: 'success',
          duration: 2000
        })
      }
    })
  }
});