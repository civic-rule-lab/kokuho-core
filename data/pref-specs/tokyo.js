/**
 * 東京都 国保データスペック（令和7年度 / 2025年度）
 *
 * 使用: node scripts/generate-pref-kokuho.js tokyo
 */

export const PREF_NAME = "東京都";

export const CAPS_NAT     = { medical: 660000, support: 260000, care: 170000 };
export const CAPS_650     = { medical: 650000, support: 240000, care: 170000 };
export const CAPS_640     = { medical: 640000, support: 230000, care: 170000 };
export const CAPS_660_240 = { medical: 660000, support: 240000, care: 170000 };

export const MUNICIPALITIES = [
  {
    "cityCode": "13101",
    "citySlug": "chiyoda",
    "cityName": "千代田区",
    "caps": {
      "medical": 660000,
      "support": 260000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.0771,
        "support": 0.0269,
        "care": 0.0172
      },
      "perCapita": {
        "medical": 47300,
        "support": 16800,
        "care": 16200
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13102",
    "citySlug": "chuo",
    "cityName": "中央区",
    "caps": {
      "medical": 660000,
      "support": 260000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.0771,
        "support": 0.0269,
        "care": 0.0225
      },
      "perCapita": {
        "medical": 47300,
        "support": 16800,
        "care": 16600
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13103",
    "citySlug": "minato",
    "cityName": "港区",
    "caps": {
      "medical": 660000,
      "support": 260000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.0771,
        "support": 0.0269,
        "care": 0.0225
      },
      "perCapita": {
        "medical": 47300,
        "support": 16800,
        "care": 16600
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13104",
    "citySlug": "shinjuku",
    "cityName": "新宿区",
    "caps": {
      "medical": 660000,
      "support": 260000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.0771,
        "support": 0.0269,
        "care": 0.0225
      },
      "perCapita": {
        "medical": 47300,
        "support": 16800,
        "care": 16600
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13105",
    "citySlug": "bunkyo",
    "cityName": "文京区",
    "caps": {
      "medical": 660000,
      "support": 260000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.0771,
        "support": 0.0269,
        "care": 0.0223
      },
      "perCapita": {
        "medical": 47300,
        "support": 16800,
        "care": 16600
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13106",
    "citySlug": "taito",
    "cityName": "台東区",
    "caps": {
      "medical": 660000,
      "support": 260000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.0771,
        "support": 0.0269,
        "care": 0.0225
      },
      "perCapita": {
        "medical": 47300,
        "support": 16800,
        "care": 16600
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13107",
    "citySlug": "sumida",
    "cityName": "墨田区",
    "caps": {
      "medical": 660000,
      "support": 260000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.0771,
        "support": 0.0269,
        "care": 0.0225
      },
      "perCapita": {
        "medical": 47300,
        "support": 16800,
        "care": 16600
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13108",
    "citySlug": "koto",
    "cityName": "江東区",
    "caps": {
      "medical": 660000,
      "support": 260000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.0771,
        "support": 0.0269,
        "care": 0.0225
      },
      "perCapita": {
        "medical": 47300,
        "support": 16800,
        "care": 16600
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13109",
    "citySlug": "shinagawa",
    "cityName": "品川区",
    "caps": {
      "medical": 660000,
      "support": 260000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.0771,
        "support": 0.0269,
        "care": 0.0225
      },
      "perCapita": {
        "medical": 47300,
        "support": 16800,
        "care": 16600
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13110",
    "citySlug": "meguro",
    "cityName": "目黒区",
    "caps": {
      "medical": 660000,
      "support": 260000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.0771,
        "support": 0.0269,
        "care": 0.0219
      },
      "perCapita": {
        "medical": 47300,
        "support": 16800,
        "care": 16600
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13111",
    "citySlug": "ota",
    "cityName": "大田区",
    "caps": {
      "medical": 660000,
      "support": 260000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.0771,
        "support": 0.0269,
        "care": 0.0225
      },
      "perCapita": {
        "medical": 47300,
        "support": 16800,
        "care": 16600
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13112",
    "citySlug": "setagaya",
    "cityName": "世田谷区",
    "caps": {
      "medical": 660000,
      "support": 260000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.0771,
        "support": 0.0269,
        "care": 0.0225
      },
      "perCapita": {
        "medical": 47300,
        "support": 16800,
        "care": 16600
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13113",
    "citySlug": "shibuya",
    "cityName": "渋谷区",
    "caps": {
      "medical": 660000,
      "support": 260000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.0771,
        "support": 0.0269,
        "care": 0.0225
      },
      "perCapita": {
        "medical": 47300,
        "support": 16800,
        "care": 16600
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13114",
    "citySlug": "nakano-ku",
    "cityName": "中野区",
    "caps": {
      "medical": 660000,
      "support": 260000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.0792,
        "support": 0.0287,
        "care": 0.022
      },
      "perCapita": {
        "medical": 45600,
        "support": 16200,
        "care": 17400
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13115",
    "citySlug": "suginami",
    "cityName": "杉並区",
    "caps": {
      "medical": 660000,
      "support": 260000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.0771,
        "support": 0.0269,
        "care": 0.0225
      },
      "perCapita": {
        "medical": 47300,
        "support": 16800,
        "care": 16600
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13116",
    "citySlug": "toshima",
    "cityName": "豊島区",
    "caps": {
      "medical": 660000,
      "support": 260000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.0771,
        "support": 0.0269,
        "care": 0.0225
      },
      "perCapita": {
        "medical": 47300,
        "support": 16800,
        "care": 16600
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13117",
    "citySlug": "kita",
    "cityName": "北区",
    "caps": {
      "medical": 660000,
      "support": 260000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.0771,
        "support": 0.0269,
        "care": 0.0225
      },
      "perCapita": {
        "medical": 47300,
        "support": 16800,
        "care": 16600
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13118",
    "citySlug": "arakawa",
    "cityName": "荒川区",
    "caps": {
      "medical": 660000,
      "support": 260000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.0771,
        "support": 0.0269,
        "care": 0.021
      },
      "perCapita": {
        "medical": 47300,
        "support": 16800,
        "care": 16600
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13119",
    "citySlug": "itabashi",
    "cityName": "板橋区",
    "caps": {
      "medical": 660000,
      "support": 260000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.0771,
        "support": 0.0269,
        "care": 0.0222
      },
      "perCapita": {
        "medical": 47300,
        "support": 16800,
        "care": 16600
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13120",
    "citySlug": "nerima",
    "cityName": "練馬区",
    "caps": {
      "medical": 660000,
      "support": 260000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.0771,
        "support": 0.0269,
        "care": 0.0225
      },
      "perCapita": {
        "medical": 47300,
        "support": 16800,
        "care": 16600
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13121",
    "citySlug": "adachi",
    "cityName": "足立区",
    "caps": {
      "medical": 660000,
      "support": 260000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.0771,
        "support": 0.0269,
        "care": 0.0225
      },
      "perCapita": {
        "medical": 47300,
        "support": 16800,
        "care": 16600
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13122",
    "citySlug": "katsushika",
    "cityName": "葛飾区",
    "caps": {
      "medical": 660000,
      "support": 260000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.0771,
        "support": 0.0269,
        "care": 0.0225
      },
      "perCapita": {
        "medical": 47300,
        "support": 16800,
        "care": 16600
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13123",
    "citySlug": "edogawa",
    "cityName": "江戸川区",
    "caps": {
      "medical": 660000,
      "support": 260000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.0859,
        "support": 0.0297,
        "care": 0.0245
      },
      "perCapita": {
        "medical": 50400,
        "support": 17400,
        "care": 17400
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13201",
    "citySlug": "hachioji",
    "cityName": "八王子市",
    "caps": {
      "medical": 660000,
      "support": 260000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.0773,
        "support": 0.0283,
        "care": 0.0242
      },
      "perCapita": {
        "medical": 44000,
        "support": 17400,
        "care": 18800
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13202",
    "citySlug": "tachikawa",
    "cityName": "立川市",
    "caps": {
      "medical": 640000,
      "support": 230000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.0668,
        "support": 0.0224,
        "care": 0.017
      },
      "perCapita": {
        "medical": 32500,
        "support": 11700,
        "care": 14500
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13203",
    "citySlug": "musashino",
    "cityName": "武蔵野市",
    "caps": {
      "medical": 650000,
      "support": 240000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.0562,
        "support": 0.0195,
        "care": 0.0165
      },
      "perCapita": {
        "medical": 31000,
        "support": 11300,
        "care": 13600
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13204",
    "citySlug": "mitaka",
    "cityName": "三鷹市",
    "caps": {
      "medical": 660000,
      "support": 260000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.061,
        "support": 0.023,
        "care": 0.016
      },
      "perCapita": {
        "medical": 29000,
        "support": 11800,
        "care": 13400
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13205",
    "citySlug": "ome",
    "cityName": "青梅市",
    "caps": {
      "medical": 660000,
      "support": 260000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.0637,
        "support": 0.0217,
        "care": 0.0203
      },
      "perCapita": {
        "medical": 34400,
        "support": 12700,
        "care": 13800
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13206",
    "citySlug": "fuchu",
    "cityName": "府中市",
    "caps": {
      "medical": 650000,
      "support": 240000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.0505,
        "support": 0.0164,
        "care": 0.0164
      },
      "perCapita": {
        "medical": 23720,
        "support": 7440,
        "care": 9840
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13207",
    "citySlug": "akishima",
    "cityName": "昭島市",
    "caps": {
      "medical": 660000,
      "support": 240000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.056,
        "support": 0.0225,
        "care": 0.017
      },
      "perCapita": {
        "medical": 27500,
        "support": 11500,
        "care": 14500
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13208",
    "citySlug": "chofu",
    "cityName": "調布市",
    "caps": {
      "medical": 650000,
      "support": 240000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.0552,
        "support": 0.0198,
        "care": 0.0175
      },
      "perCapita": {
        "medical": 29000,
        "support": 10300,
        "care": 12000
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13209",
    "citySlug": "machida",
    "cityName": "町田市",
    "caps": {
      "medical": 660000,
      "support": 260000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.0667,
        "support": 0.0225,
        "care": 0.0202
      },
      "perCapita": {
        "medical": 39300,
        "support": 13100,
        "care": 15100
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13210",
    "citySlug": "koganei",
    "cityName": "小金井市",
    "caps": {
      "medical": 650000,
      "support": 240000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.0654,
        "support": 0.0205,
        "care": 0.02
      },
      "perCapita": {
        "medical": 30000,
        "support": 13000,
        "care": 15000
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13211",
    "citySlug": "kodaira",
    "cityName": "小平市",
    "caps": {
      "medical": 660000,
      "support": 260000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.0601,
        "support": 0.0229,
        "care": 0.0185
      },
      "perCapita": {
        "medical": 27000,
        "support": 12900,
        "care": 15900
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13212",
    "citySlug": "hino",
    "cityName": "日野市",
    "caps": {
      "medical": 660000,
      "support": 260000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.058,
        "support": 0.021,
        "care": 0.021
      },
      "perCapita": {
        "medical": 34500,
        "support": 12300,
        "care": 14700
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13213",
    "citySlug": "higashimurayama",
    "cityName": "東村山市",
    "caps": {
      "medical": 660000,
      "support": 260000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.067,
        "support": 0.0225,
        "care": 0.0215
      },
      "perCapita": {
        "medical": 40800,
        "support": 13500,
        "care": 16000
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13214",
    "citySlug": "kokubunji",
    "cityName": "国分寺市",
    "caps": {
      "medical": 650000,
      "support": 240000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.064,
        "support": 0.0238,
        "care": 0.0224
      },
      "perCapita": {
        "medical": 30000,
        "support": 14000,
        "care": 16000
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13215",
    "citySlug": "kunitachi",
    "cityName": "国立市",
    "caps": {
      "medical": 660000,
      "support": 260000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.055,
        "support": 0.018,
        "care": 0.0185
      },
      "perCapita": {
        "medical": 20000,
        "support": 10000,
        "care": 11000
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13218",
    "citySlug": "fussa",
    "cityName": "福生市",
    "caps": {
      "medical": 660000,
      "support": 260000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.0539,
        "support": 0.0225,
        "care": 0.0179
      },
      "perCapita": {
        "medical": 29700,
        "support": 13200,
        "care": 14000
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13219",
    "citySlug": "komae",
    "cityName": "狛江市",
    "caps": {
      "medical": 660000,
      "support": 260000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.0565,
        "support": 0.0197,
        "care": 0.0184
      },
      "perCapita": {
        "medical": 27900,
        "support": 11300,
        "care": 13600
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13220",
    "citySlug": "higashiyamato",
    "cityName": "東大和市",
    "caps": {
      "medical": 660000,
      "support": 260000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.0742,
        "support": 0.025,
        "care": 0.0245
      },
      "perCapita": {
        "medical": 37200,
        "support": 12300,
        "care": 14100
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13221",
    "citySlug": "kiyose",
    "cityName": "清瀬市",
    "caps": {
      "medical": 660000,
      "support": 260000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.0592,
        "support": 0.0201,
        "care": 0.019
      },
      "perCapita": {
        "medical": 28000,
        "support": 10000,
        "care": 13000
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13222",
    "citySlug": "higashikurume",
    "cityName": "東久留米市",
    "caps": {
      "medical": 660000,
      "support": 260000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.0592,
        "support": 0.0223,
        "care": 0.0199
      },
      "perCapita": {
        "medical": 38300,
        "support": 13600,
        "care": 14700
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13223",
    "citySlug": "musashimurayama",
    "cityName": "武蔵村山市",
    "caps": {
      "medical": 660000,
      "support": 260000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.0694,
        "support": 0.0221,
        "care": 0.0176
      },
      "perCapita": {
        "medical": 35200,
        "support": 12500,
        "care": 13000
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13224",
    "citySlug": "tama",
    "cityName": "多摩市",
    "caps": {
      "medical": 660000,
      "support": 260000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.0616,
        "support": 0.02,
        "care": 0.0178
      },
      "perCapita": {
        "medical": 30200,
        "support": 12400,
        "care": 12600
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13225",
    "citySlug": "inagi",
    "cityName": "稲城市",
    "caps": {
      "medical": 660000,
      "support": 260000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.0573,
        "support": 0.0137,
        "care": 0.0219
      },
      "perCapita": {
        "medical": 37200,
        "support": 9400,
        "care": 13100
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13227",
    "citySlug": "hamura",
    "cityName": "羽村市",
    "caps": {
      "medical": 660000,
      "support": 260000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.0643,
        "support": 0.0233,
        "care": 0.0215
      },
      "perCapita": {
        "medical": 27300,
        "support": 11200,
        "care": 13100
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13228",
    "citySlug": "akiruno",
    "cityName": "あきる野市",
    "caps": {
      "medical": 660000,
      "support": 260000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.0628,
        "support": 0.0237,
        "care": 0.0223
      },
      "perCapita": {
        "medical": 33000,
        "support": 12300,
        "care": 14700
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13229",
    "citySlug": "nishitokyo",
    "cityName": "西東京市",
    "caps": {
      "medical": 660000,
      "support": 260000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.0541,
        "support": 0.0168,
        "care": 0.0164
      },
      "perCapita": {
        "medical": 31600,
        "support": 6500,
        "care": 14300
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13303",
    "citySlug": "mizuho",
    "cityName": "瑞穂町",
    "caps": {
      "medical": 660000,
      "support": 260000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.0603,
        "support": 0.0185,
        "care": 0.0155
      },
      "perCapita": {
        "medical": 28000,
        "support": 10500,
        "care": 15000
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13305",
    "citySlug": "hinode",
    "cityName": "日の出町",
    "caps": {
      "medical": 660000,
      "support": 260000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.06,
        "support": 0.0225,
        "care": 0.0199
      },
      "perCapita": {
        "medical": 31300,
        "support": 11700,
        "care": 13200
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13307",
    "citySlug": "hinohara",
    "cityName": "檜原村",
    "caps": {
      "medical": 660000,
      "support": 260000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.0535,
        "support": 0.0166,
        "care": 0.016
      },
      "perCapita": {
        "medical": 28100,
        "support": 9600,
        "care": 12200
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13308",
    "citySlug": "okutama",
    "cityName": "奥多摩町",
    "caps": {
      "medical": 660000,
      "support": 260000,
      "care": 170000
    },
    "rates": {
      "rate": {
        "medical": 0.062,
        "support": 0.021,
        "care": 0.0205
      },
      "perCapita": {
        "medical": 33100,
        "support": 12600,
        "care": 12600
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  },
  {
    "cityCode": "13421",
    "citySlug": "ogasawara",
    "cityName": "小笠原村",
    "caps": {
      "medical": 660000,
      "support": 260000,
      "care": 170000
    },
    "assetLevy": {
      "medical": 0.35,
      "support": 0.15,
      "care": 0.11
    },
    "rates": {
      "rate": {
        "medical": 0.045,
        "support": 0.015,
        "care": 0.014
      },
      "perCapita": {
        "medical": 22600,
        "support": 10000,
        "care": 10000
      },
      "household": {
        "medical": 0,
        "support": 0,
        "care": 0
      }
    }
  }
];
