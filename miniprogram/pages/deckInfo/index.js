const {occupationInfo} = require('../../lib/const');
const {formatTime} = require('../../lib/utils');
const db = wx.cloud.database();
Component({
  properties: {
    preConstruction :Boolean,
    deck: Object,
    hideToPageBtn: Boolean
  },
  data: {
    typeMap: {"wild": "狂野", "standard": "标准"},
    timeStr: "",
    occupationInfo: occupationInfo,
    costList: [0, 0, 0, 0, 0, 0, 0, 0]
  },
  lifetimes: {
    attached() {
      wx.showShareMenu();
      let timeStr = formatTime(new Date(this.properties.deck.time));
      this.properties.deck.cards.forEach(item => {
        let cost = item.cost >= 7 ? 7 : item.cost;
        this.data.costList[cost] += item.quantity;
        this.setData({
          'timeStr': timeStr,
          'costList': this.data.costList
        });
      });
    }
  },
  methods: {
    toPage() {
      let deck = this.properties.deck;
      db.collection('report-list')
        .where({
          name: deck.page
        })
        .get().then(({data}) => {
        if (data && data.length) {
          wx.navigateTo({
            url: `../deckList/index?page=${deck.page}&time=${deck.time}&type=${deck.type}&fromUrl=${encodeURIComponent(data[0].fromUrl)}`
          })
        }
      }).catch(console.error)

    }
  }
})
