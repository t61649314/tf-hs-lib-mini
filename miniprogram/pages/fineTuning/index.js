const {formatTime} = require('../../lib/utils');
Page({
  data: {
    loading: true,
    suggestionsRemoveCardsList: [],
    suggestionsAddCardList: [],
    similarDeckList: [],
    weakenCardList: [],
    newVersionList: []
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
      this.setData({
        'loading': false
      });
      if(res.result.similarDeckList&&res.result.similarDeckList.length){
        this.setData({
          'suggestionsRemoveCardsList': res.result.suggestionsRemoveCardsList.map(item => {
            item.info.img = item.info.img.replace("'", "%27");
            return item
          }),
          'suggestionsAddCardList': res.result.suggestionsAddCardList.map(item => {
            item.info.img = item.info.img.replace("'", "%27");
            return item
          }),
          'similarDeckList': res.result.similarDeckList.map(item => {
            item.deck.timeStr = formatTime(new Date(item.deck.time));
            return item
          })
        });
      }
    }).catch(console.error)
  }
});
