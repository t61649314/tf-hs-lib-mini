const {occupationInfo} = require('../../lib/const');
const {formatTime} = require('../../lib/utils');
const typeMap = {"wild": "狂野", "standard": "标准"};
Page({
  data: {
    occupationKeyList: Object.keys(occupationInfo),
    typeMap: typeMap,
    deckList: [],
    showDeckList: [],
    searchOccupation: "",
    type: "",
    fromUrl: "",
    page: "",
    timeStr: "",
    scrollHeight: 0,
    scrollLoading: false
  },
  onLoad(options) {
    wx.setNavigationBarTitle({
      title: options.page
    });
    this.setData({
      'type': options.type,
      'fromUrl': decodeURIComponent(options.fromUrl),
      'page': options.page,
      'timeStr': formatTime(new Date(parseInt(options.time))),
    });
  },
  onReady() {
    wx.getSystemInfo({
      success: (res) => {
        const windowHeight = res.windowHeight;
        const query = this.createSelectorQuery();
        query.select('.page-head').boundingClientRect((res) => {
          this.setData({
            'scrollHeight': windowHeight - res.height,
            'scrollLoading': true
          });
          this.getDeckList(0);
        });
        query.exec()
      }
    })
  },
  getDeckList(skip) {
    const db = wx.cloud.database();
    let collection = db.collection('deck-list')
      .where({
        page: this.data.page
      }).limit(20).field({
        time: true,
        name: true,
        occupation: true
      });
    let promise;
    if (skip > 0) {
      promise = collection.skip(skip).get();
    } else {
      promise = collection.get();
    }
    promise.then(({data}) => {
      if (data) {
        this.data.deckList = this.data.deckList.concat(data);
        if (data.length === 20) {
          this.getDeckList(skip + 20)
        } else {
          this.setData({
            'deckList': this.data.deckList,
            'showDeckList': this.data.deckList,
            'scrollLoading': false
          });
        }
      }
    }).catch(console.error)
  },
  occupationClick(event) {
    if(this.data.scrollLoading){
      return;
    }
    const key = event.currentTarget.dataset.key;
    if (this.data.searchOccupation !== key) {
      this.data.searchOccupation = key;
      this.setData({
        'showDeckList': this.data.deckList.filter(item => {
          return item.occupation === key;
        }),
      });
    } else {
      this.data.searchOccupation = "";
      this.setData({
        'showDeckList': this.data.deckList,
      });
    }
    this.setData({
      'searchOccupation': this.data.searchOccupation,
    });
  },
});