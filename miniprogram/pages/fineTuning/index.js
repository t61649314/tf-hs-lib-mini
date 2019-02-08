const {formatTime} = require('../../lib/utils');
Page({
  data: {
    loading: true,
    suggestionsRemoveCardsList: [],
    suggestionsAddCardList: [],
    similarDeckList: []
  },
  onLoad: function (option) {
    wx.cloud.callFunction({
      // 云函数名称
      name: 'getSuggestionsAndSimilarities',
      // 传给云函数的参数
      data: {
        deckId: option.deckId
      },
    }).then(res => {
      this.setData({
        'loading': false,
        'suggestionsRemoveCardsList': res.result.suggestionsRemoveCardsList,
        'suggestionsAddCardList': res.result.suggestionsAddCardList,
        'similarDeckList': res.result.similarDeckList.map(item => {
          item.deck.timeStr = formatTime(new Date(item.deck.time));
          return item
        })
      });
    }).catch(console.error)
  }
});
