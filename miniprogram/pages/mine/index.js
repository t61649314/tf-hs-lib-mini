Component({
  data: {
    avatarUrl: '../../images/user-unlogin.png',
    userInfo: {},
    logged: false,
    takeSession: false,
    scrollHeight: 0,
    requestResult: '',
    appreciationCodeUrl: 'https://other-1257959255.cos.ap-chengdu.myqcloud.com/appreciation-code.jpg',
    current: "homepage"
  },
  lifetimes: {
    ready() {
      wx.getSystemInfo({
        success: (res) => {
          const windowHeight = res.windowHeight;
          const query = wx.createSelectorQuery();
          query.select('#my-notice').boundingClientRect((res) => {
            this.setData({
              'scrollHeight': windowHeight - res.height - 50
            });
          });
          query.exec()
        }
      });
    },
    created() {
      wx.getSetting({
        success: res => {
          if (res.authSetting['scope.userInfo']) {
            // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
            wx.getUserInfo({
              success: res => {
                this.setData({
                  avatarUrl: res.userInfo.avatarUrl,
                  userInfo: res.userInfo
                })
              }
            })
          }
        }
      });
    },
  },
  methods: {
    previewImg: function (e) {
      const src = e.currentTarget.dataset.src;
      wx.previewImage({
        current: src,     //当前图片地址
        urls: [src],               //所有要预览的图片的地址集合 数组形式
      })
    },
    onGetUserInfo: function (e) {
      if (!this.logged && e.detail.userInfo) {
        this.setData({
          logged: true,
          avatarUrl: e.detail.userInfo.avatarUrl,
          userInfo: e.detail.userInfo
        })
      }
    }
  }
})
