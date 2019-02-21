const {formatTime} = require('../../lib/utils');
Page({
  data: {
    fineTuningType: 0,
    loading: true,
    suggestionsRemoveCardsList: [],
    suggestionsAddCardList: [],
    similarDeckList: [],
    deckWeakenCardList: [],
    newVersionCardList: []
  },
  onLoad: function (option) {
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
  }
});
