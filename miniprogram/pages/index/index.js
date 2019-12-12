Page({
  data: {
    isIpx: false,
    noticeShow: false,
    current: "homepage",
    notice: "",
    componentHeight: ""
  },

  onLoad() {
    wx.showShareMenu();
    const db = wx.cloud.database();
    db.collection('config-list')
      .doc('notice')
      .get()
      .then(({data}) => {
        if (data) {
          this.setData({
            notice: data.value,
            noticeShow: data.show,
          });
          if (data.loop) {
            this.selectComponent("#my-notice").initAnimation();
          }
        }
      }).catch(console.error)
  },
  onReady() {
    wx.getSystemInfo({
      success: (res) => {
        const model = res.model;
        const isIpx = model.search('iPhone X') > -1;
        this.setData({
          'isIpx': isIpx
        });
        const windowHeight = res.windowHeight;
        const query = wx.createSelectorQuery();
        query.select('#my-notice').boundingClientRect((res) => {
          const noticeHeight = (res && res.height) || 0;
          let componentHeight = windowHeight - noticeHeight - 50;
          if (isIpx) {
            componentHeight -= 20;
          }
          this.setData({
            'componentHeight': componentHeight
          });
        });
        query.exec()
      }
    });
  },

  handleChange({detail}) {
    this.setData({
      current: detail.key
    });
  }
});
