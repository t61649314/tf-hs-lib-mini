//app.js
App({
  onLaunch: function () {
    wx.cloud.init({
      traceUser: true,
    });
    this.globalData = {}
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        this.globalData.openid = res.result.openid
      }, fail: err => {
        console.error('[云函数] [login] 调用失败', err)
      }
    });
  }
});
