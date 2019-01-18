Page({
  data: {
    current: "homepage"
  },

  onLoad: function () {
  },

  handleChange({detail}) {
    this.setData({
      current: detail.key
    });
  }
});
