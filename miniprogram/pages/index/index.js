Page({
  data: {
    current: "homepage",
    notice: "",
    componentHeight: ""
  },

  onLoad() {
    const db = wx.cloud.database();
    db.collection('config-list')
      .doc('notice')
      .get()
      .then(({data}) => {
        if (data) {
          this.setData({
            notice: data.value,
          });
          if(data.loop){
            this.selectComponent("#my-notice").initAnimation();
          }
        }
      }).catch(console.error)
  },
  onReady() {
    wx.getSystemInfo({
      success: (res) => {
        const windowHeight = res.windowHeight;
        const query = wx.createSelectorQuery();
        query.select('#my-notice').boundingClientRect((res) => {
          const noticeHeight = (res && res.height) || 0;
          this.setData({
            'componentHeight': windowHeight - noticeHeight - 50
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
