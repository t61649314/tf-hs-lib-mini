const {occupationInfo} = require('../../lib/const');
const {formatTime} = require('../../lib/utils');
const typeTitleMap = {"wild": "狂野", "standard": "标准"};
Component({
  properties: {
    componentHeight: Number
  },
  data: {
    occupationKeyList: Object.keys(occupationInfo),
    oftenWordList: [
      {
        name: "奇数", isSelected: false
      },
      {
        name: "偶数", isSelected: false
      },
      {
        name: "奥秘", isSelected: false
      },
      {
        name: "控制", isSelected: false
      },
      {
        name: "中速", isSelected: false
      },
      {
        name: "快攻", isSelected: false
      },
      {
        name: "宇宙", isSelected: false
      },
      {
        name: "青玉", isSelected: false
      },
      {
        name: "海盗", isSelected: false
      },
      {
        name: "蓝龙", isSelected: false
      }
    ],
    deckList: [],
    searchData: {
      name: "",
      occupation: "",
      from: "",
      type: ""
    },
    fromText: "全部",
    typeText: "全部",
    noMore: false,
    pageNum: 1,
    visible1: false,
    visible2: false,
    scrollLoading: false,
    actions1: [
      {
        name: '全部',
        value: '',
      },
      {
        name: 'ViciousSyndicate',
        value: 'vicious-syndicate',
      },
      {
        name: 'TempoStorm',
        value: 'tempo-storm'
      },
      {
        name: '其他',
        value: 'other'
      }
    ],
    actions2: [
      {
        name: '全部',
        value: ''
      },
      {
        name: '标准',
        value: 'standard'
      },
      {
        name: '狂野',
        value: 'wild'
      }
    ],
    scrollHeight: 0
  },
  lifetimes: {
    ready() {
      const query = this.createSelectorQuery();
      query.select('#search-bar').boundingClientRect((res) => {
        const searchBarHeight = res.height;
        this.setData({
          'scrollHeight': this.data.componentHeight - searchBarHeight
        });
        this.getDeckList();
      });
      query.exec();
    },
  },
  methods: {
    lower(e) {
      if (!this.data.noMore) {
        this.setData({
          'pageNum': this.data.pageNum + 1
        });
        this.getDeckList();
      }
    },
    searchNameBlur({detail}) {
      const name = detail.detail.value;
      if (name !== this.data.searchData.name) {
        this.data.searchData.name = detail.detail.value;
        this.setData({
          'deckList': [],
          'searchData': this.data.searchData,
          'noMore': false,
          'pageNum': 1
        });
        this.getDeckList();
      }
    },
    getDeckList() {
      this.setData({
        'scrollLoading': true
      });
      const db = wx.cloud.database();
      const searchData = this.data.searchData;
      let where = {};
      if (searchData.name) {
        where.name = db.RegExp({
          regexp: searchData.name
        })
      }
      if (searchData.occupation) {
        where.occupation = searchData.occupation
      }
      if (searchData.from) {
        if (searchData.from === "other") {
          const _ = db.command;
          where.from = _.in(["shengerkuangye","team-rankstar", "fengtian", "zaowuzhe", "suzhijicha", "nga-carry", "other"])
        } else {
          where.from = searchData.from
        }
      }
      if (searchData.type) {
        where.type = searchData.type
      }
      db.collection('deck-list')
        .where(where)
        .skip((this.data.pageNum - 1) * 20)
        .limit(20)
        .orderBy('type', 'asc')
        .orderBy('time', 'desc')
        .orderBy('from', 'desc')
        .orderBy('occupation', 'desc').field({
        type: true,
        page: true,
        time: true,
        name: true,
        occupation: true
      })
        .get()
        .then(({data}) => {
          if (data && data.length) {
            if (data.length < 20) {
              this.setData({
                'noMore': true
              });
            }
            data.forEach(item => {
              item.timeStr = formatTime(new Date(item.time));
              item.typeStr = typeTitleMap[item.type];
            });
            this.data.deckList = this.data.deckList.concat(data);
            this.setData({
              'deckList': this.data.deckList
            });
          }
          this.setData({
            'scrollLoading': false
          });
        }).catch(console.error)
    },
    occupationClick(event) {
      const key = event.currentTarget.dataset.key;
      if (this.data.searchData.occupation !== key) {
        this.data.searchData.occupation = key;
      } else {
        this.data.searchData.occupation = "";
      }
      this.setData({
        'deckList': [],
        'searchData': this.data.searchData,
        'noMore': false,
        'pageNum': 1
      });
      this.getDeckList();
    },
    handleOpen1() {
      this.setData({
        visible1: true
      });
    },

    handleCancel1() {
      this.setData({
        visible1: false
      });
    },

    handleOpen2() {
      this.setData({
        visible2: true
      });
    },

    handleCancel2() {
      this.setData({
        visible2: false
      });
    },
    handleClickItem1({detail}) {
      const index = detail.index;
      this.data.searchData.from = this.data.actions1[index].value;
      this.setData({
        deckList: [],
        searchData: this.data.searchData,
        visible1: false,
        fromText: this.data.actions1[index].name,
        noMore: false,
        pageNum: 1
      });
      this.getDeckList();
    },
    handleClickItem2({detail}) {
      const index = detail.index;
      this.data.searchData.type = this.data.actions2[index].value;
      this.setData({
        deckList: [],
        searchData: this.data.searchData,
        visible2: false,
        typeText: this.data.actions2[index].name,
        noMore: false,
        pageNum: 1
      });
      this.getDeckList();
    }
  }
});