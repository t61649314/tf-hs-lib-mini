Page({
  data: {
  },

  onLoad: function () {
  },

  copy(event){
    wx.setClipboardData({
      data: event.currentTarget.dataset.content,
      success(res) {
        wx.hideToast();
        wx.showToast({
          title: '复制成功',
          icon: 'success',
          duration: 2000
        })
      }
    })
  }
});
