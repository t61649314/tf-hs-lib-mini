const {formatTime} = require('../../lib/utils');
Page({
  data: {
    scrollHeight: 0,
    deck: {},
    latestTimeSimilarDeckIndex: -1,
    fineTuningType: 0,
    hideToPageBtn: false,
    loading: true,
    suggestionsRemoveCardsList: [],
    suggestionsAddCardList: [],
    similarDeckList: [],
    deckWeakenCardList: [],
    newVersionCardList: []
  },
  onLoad: function (option) {
    wx.getSystemInfo({
      success: (res) => {
        const model = res.model;
        const isIpx = model.search('iPhone X') > -1;
        let scrollHeight=res.windowHeight;
        if(isIpx){
          scrollHeight -= 20;
        }
        this.setData({
          'scrollHeight': scrollHeight
        });
      }
    });
    wx.showShareMenu();
    wx.setNavigationBarTitle({
      title: "相似卡组&微调建议"
    });
    this.setData({
      'hideToPageBtn': option.hideToPageBtn === "true",
    });
    wx.cloud.callFunction({
      // 云函数名称
      name: 'getFineTuningInfo',
      // 传给云函数的参数
      data: {
        deckId: option.deckId
      },
    }).then(res => {
      console.log(res);
      this.setData({
        'loading': false,
        'deck': res.result.deck,
        'latestTimeSimilarDeckIndex': res.result.latestTimeSimilarDeckIndex,
        'fineTuningType': res.result.fineTuningType,
        'deckWeakenCardList': res.result.deckWeakenCardList,
        'newVersionCardList': res.result.newVersionCardList,
        'suggestionsRemoveCardsList': res.result.suggestionsRemoveCardsList,
        'suggestionsAddCardList': res.result.suggestionsAddCardList,
        'similarDeckList': res.result.similarDeckList.map(item => {
          item.deck.timeStr = formatTime(new Date(item.deck.time));
          return item
        })
      });
    }).catch(console.error)
  },
  versionItemClick: function (event) {
    let item = this.data.newVersionCardList[event.currentTarget.dataset.index];
    item.isOpen = !item.isOpen;
    this.setData({
      'newVersionCardList': this.data.newVersionCardList
    });
  },
  similarDeckItemClick: function (event) {
    let item = this.data.similarDeckList[event.currentTarget.dataset.index];
    item.isOpen = !item.isOpen;
    this.setData({
      'similarDeckList': this.data.similarDeckList
    });
  },
  copyDeck: function (event) {
    let item = this.data.similarDeckList[event.currentTarget.dataset.index];
    wx.setClipboardData({
      data: item.deck.code,
      success(res) {
        wx.hideToast();
        wx.showToast({
          title: '复制卡组成功',
          icon: 'success',
          duration: 2000
        })
      }
    })
  },
  goDeckDetails: function (event) {
    let item = this.data.similarDeckList[event.currentTarget.dataset.index];
    wx.navigateTo({
      url: `../deckDetail/index?id=${item.deck._id}&time=${item.deck.time}&hideSugBtn=true`
    })
  }
});
