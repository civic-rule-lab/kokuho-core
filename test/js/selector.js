const registry = {
  kanagawa: {
    name: "神奈川県",
    municipalities: {
      chigasaki: {
        name: "茅ヶ崎市",
        systems: {
          kokuho: {
            name: "国民健康保険",
            pages: {
              simple: { name: "かんたん計算",   url: "./chigasaki-kokuho.html" },
              income: { name: "所得ベース計算", url: "./kokuho-income.html" }
            }
          }
        }
      },
      fujisawa: {
        name: "藤沢市",
        systems: {
          kokuho: {
            name: "国民健康保険",
            pages: {
              simple: { name: "かんたん計算",   url: "./fujisawa-kokuho.html" },
              income: { name: "所得ベース計算", url: "./fujisawa-kokuho-income.html" }
            }
          }
        }
      },
      hiratsuka: {
        name: "平塚市",
        systems: {
          kokuho: {
            name: "国民健康保険",
            pages: {
              simple: { name: "かんたん計算",   url: "./hiratsuka-kokuho.html" },
              income: { name: "所得ベース計算", url: "./hiratsuka-kokuho-income.html" }
            }
          }
        }
      }
    }
  }
};

function updateCurrent() {}
function updateSystems() {}
function updatePages() {}
function updateMunicipalities() {}

function goPage() {
  const prefecture  = document.getElementById("prefecture").value;
  const municipality = document.getElementById("municipality").value;
  const system      = document.getElementById("system").value;
  const pageType    = document.getElementById("pageType").value;

  const url =
    registry[prefecture]
      ?.municipalities[municipality]
      ?.systems[system]
      ?.pages[pageType]
      ?.url;

  if (url) {
    window.location.href = url;
  } else {
    alert("ページが見つかりませんでした。");
  }
}
