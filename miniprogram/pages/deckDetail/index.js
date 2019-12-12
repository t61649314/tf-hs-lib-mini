const app = getApp();
Page({
  data: {
    isIpx: false,
    hideSugBtn: false,
    hideToPageBtn: false,
    id: "",
    page: "",
    time: "",
    weakenArr: [],
    preConstruction: false,
    isInit: false,
    loading: true,
    collectionId: "",
    deck: {},
    fromUrl: "",
    scrollHeight: 0,
  },
  onLoad: function (options) {
    wx.showShareMenu();
    wx.setNavigationBarTitle({
      title: "卡组详情"
    });
    this.setData({
      'hideSugBtn': options.hideSugBtn || false,
      'hideToPageBtn': options.hideToPageBtn || false,
      'id': options.id,
      'time': options.time
    });
    const db = wx.cloud.database();
    db.collection('config-list')
      .doc('const')
      .get()
      .then(({data}) => {
        if (data) {
          let weakenArr = data.timeNode.filter(item => {
            return new Date(item.time).getTime() > this.data.time && item.weakenCardArr;
          });
          weakenArr.forEach(item => {
            this.data.weakenArr = this.data.weakenArr.concat(item.weakenCardArr)
          });
          this.setData({
            'weakenArr': this.data.weakenArr
          });
          wx.getSystemInfo({
            success: (res) => {
              const model = res.model;
              const isIpx = model.search('iPhone X') > -1;
              this.setData({
                'isIpx': isIpx
              });
              let windowHeight = res.windowHeight;
              if (isIpx) {
                windowHeight -= 20;
              }
              this.setData({
                'scrollHeight': windowHeight - 50
              });
              this.getDeck();
            }
          });
        }
      }).catch(console.error);
  },
  getSuggestionsAndSimilarities: function () {
    wx.navigateTo({
      url: `../fineTuning/index?deckId=${this.data.id}&hideToPageBtn=${this.data.hideToPageBtn}`
    })
  },
  getDeck: function () {
    const db = wx.cloud.database();
    db.collection('deck-list')
      .doc(this.data.id)
      .get().then(({data}) => {
      if (data) {
        data.cards.forEach(item => {
          item.isWeaken = this.isWeaken(item.dbfId);
        });
        data.cards.sort((a, b) => {
          return a.cost - b.cost;
        });
        this.data.deck = data;
        db.collection('report-list')
          .where({
            name: this.data.deck.page
          })
          .get().then(({data}) => {
          if (data && data.length) {
            this.setData({
              'preConstruction': data[0].preConstruction
            });
          }
        }).catch(console.error)
      }
      db.collection('collection-list')
        .where({
          userId: app.globalData.openid,
          deckId: this.data.deck._id,
        })
        .get().then(({data}) => {
        if (data && data.length) {
          this.data.collectionId = data[0]._id;
        }
        this.setData({
          'collectionId': this.data.collectionId,
          'isInit': true,
          'loading': false,
          'deck': this.data.deck
        });
      }).catch(console.error)
    }).catch(console.error)
  },
  isWeaken: function (dbfId) {
    return this.data.weakenArr.includes(dbfId);
  },
  collection: function (event) {
    const db = wx.cloud.database();
    this.setData({
      'loading': true
    });

    if (this.data.collectionId) {
      db.collection('collection-list').doc(this.data.collectionId).remove({
        success: (res) => {
          wx.showToast({
            title: '取消收藏成功',
            icon: 'success',
            duration: 2000
          });
          this.setData({
            'loading': false,
            'collectionId': ""
          });
        }
      });
    } else {
      db.collection('collection-list').add({
        data: {
          userId: app.globalData.openid,
          deckId: this.data.deck._id,
          deckName: this.data.deck.name,
          deckOccupation: this.data.deck.occupation,
          deckType: this.data.deck.type,
          deckFrom: this.data.deck.from,
          deckTime: this.data.deck.time,
          deckPage: this.data.deck.page,
          createTime: new Date().getTime()
        },
        success: (res) => {
          wx.showToast({
            title: '收藏成功',
            icon: 'success',
            duration: 2000
          });
          console.log(res)
          this.setData({
            'loading': false,
            'collectionId': res._id
          });
        }
      })
    }
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
