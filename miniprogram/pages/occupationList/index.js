const {occupationInfo} = require("../../lib/const");
Page({
  data: {
    page: "",
    time: "",
    occupationCnNameList: Object.keys(occupationInfo).map(key => {
      return {
        cnName: occupationInfo[key].cnName,
        key: key
      };
    }),
  },
  onLoad: function (options) {
    wx.setNavigationBarTitle({
      title: options.page
    });
    this.setData({
      'page': options.page,
      'time': options.time,
    });
  }
});