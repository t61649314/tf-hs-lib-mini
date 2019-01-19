Component({
  properties: {},
  data: {
    vsStandardHasNew: false,
    vsWildHasNew: false,
    tsStandardHasNew: false,
    tsWildHasNew: false,
    sekyHasNew: false,
  },
  lifetimes: {
    attached() {
      const db = wx.cloud.database();
      const _ = db.command;
      let timeLimit = new Date().getTime() - 3 * 24 * 60 * 60 * 1000;
      db.collection('report-list')
        .where({
          time: _.gt(timeLimit)
        })
        .get().then(({data}) => {
        if (data && data.length) {
          data.forEach(item => {
            if (item.type === "standard") {
              if (item.from === "vicious-syndicate") {
                this.setData({
                  'vsStandardHasNew': true
                });
              }
              if (item.from === "tempo-storm") {
                this.setData({
                  'tsStandardHasNew': true
                });
              }
            }
            if (item.type === "wild") {
              if (item.from === "vicious-syndicate") {
                this.setData({
                  'vsWildHasNew': true
                });
              }
              if (item.from === "tempo-storm") {
                this.setData({
                  'tsWildHasNew': true
                });
              }
              if (item.from === "shengerkuangye") {
                this.setData({
                  'sekyHasNew': true
                });
              }
            }
          })
        }
      }).catch(console.error)
    }
  },
  methods: {}
})