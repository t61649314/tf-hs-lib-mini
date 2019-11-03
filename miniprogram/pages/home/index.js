Component({
  properties: {
    componentHeight: Number
  },
  data: {
    current: "wild",
    wildHasNew: false,
    standardHasNew: false,
    wildFromList: [],
    standardFromList: [],
  },
  lifetimes: {
    attached() {
      const db = wx.cloud.database();
      const _ = db.command;
      db.collection('report-group')
        .get().then(({data}) => {
        let standardFromList = data.filter(item => item.type === 'standard').sort((a, b) => a.index - b.index);
        let wildFromList = data.filter(item => item.type === 'wild').sort((a, b) => a.index - b.index);
        let timeLimit = new Date().getTime() - 3 * 24 * 60 * 60 * 1000;
        db.collection('report-list')
          .where({
            time: _.gt(timeLimit)
          })
          .get().then(({data}) => {
          if (data && data.length) {
            data.forEach(reportItem => {
              if (reportItem.type === "standard") {
                let findItem = standardFromList.find(item => {
                  return item.name === reportItem.from
                });
                if (findItem) {
                  findItem.hasNew = true;
                  this.setData({
                    'standardHasNew': true,
                  });
                }
              }
              if (reportItem.type === "wild") {
                let findItem = wildFromList.find(item => {
                  return item.name === reportItem.from
                });
                if (findItem) {
                  findItem.hasNew = true;
                  this.setData({
                    'wildHasNew': true,
                  });
                }
              }
            })
          }
          this.setData({
            'standardFromList': standardFromList,
            'wildFromList': wildFromList
          });
        }).catch(console.error)
      });
    }
  },
  methods: {
    handleChange({detail}) {
      this.setData({
        current: detail.key
      });
    },
  }
})
