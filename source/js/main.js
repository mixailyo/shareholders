let copyLinkBtns = document.querySelectorAll('[data-copy-link-btn]');

if (copyLinkBtns.length) {
  copyLinkBtns.forEach((btn) => {
    btn.dataset.status = 'Копировать ссылку'
    btn.addEventListener('click', () => {
      
      let tempInput = document.createElement('textarea');

      tempInput.style.fontSize = '12pt';
      tempInput.style.border = '0';
      tempInput.style.padding = '0';
      tempInput.style.margin = '0';
      tempInput.style.position = 'absolute';
      tempInput.style.left = '-9999px';
      tempInput.setAttribute('readonly', '');

      tempInput.value = window.location.href;

      btn.parentNode.appendChild(tempInput);

      tempInput.select();
      tempInput.setSelectionRange(0, 99999);

      document.execCommand('copy');
      btn.dataset.status = 'Скопировано'

      tempInput.parentNode.removeChild(tempInput);
    })
  })
}

// RU-EN
let dictionary;

if (widgetLanguage === 'ru') {
  dictionary = {
    bestOfferPrice: 'Предложение',
    bestBidPrice: 'Спрос',
    maxTradePrice: 'Максимум',
    minPrice: 'Минимум',
    numberOfTrades: 'Сделок сегодня',
    volumeOfTrades: 'Количество сегодня',
    stockCapitalization: 'Капитализация',
    day: 'День',
    week: 'Неделя',
    month: 'Месяц',
    year: 'Год',
    wholePeriod: 'Весь период',
    price: 'Цена',
    turnover: 'Объем',
  }
} else if (widgetLanguage === 'en') {
  dictionary = {
    bestOfferPrice: 'Best offer price',
    bestBidPrice: 'Best bid price',
    maxTradePrice: 'Max.trade price',
    minPrice: 'Min.price',
    numberOfTrades: 'Number of trades',
    volumeOfTrades: 'Volume of trades, securities',
    stockCapitalization: 'Stock capitalization',
    day: 'Day',
    week: 'Week',
    month: 'Month',
    year: 'Year',
    wholePeriod: 'Whole period',
    price: 'Price',
    turnover: 'Turnover',
  }
}

let wordsFromDictionary = document.querySelectorAll('[data-dictionary]');

wordsFromDictionary.forEach(word => {
  word.textContent = dictionary[word.dataset.dictionary]
})

// Share documents
let quote = document.querySelector(".quote");
let quoteDocumentsBtn = document.querySelector('.quote__documents-btn');
let quoteDocumentsList = document.querySelector('.quote__documents-list');
let quoteDocumentsListBtnPng = document.querySelector('.quote__documents-list-btn--png');
let quoteDocumentsListBtnPdf = document.querySelector('.quote__documents-list-btn--pdf');
let quoteDocumentsListBtnXlsx = document.querySelector('.quote__documents-list-btn--xlsx');
let quoteCanvasData = {};

quoteDocumentsBtn.addEventListener('click', () => {
  if (!quoteDocumentsList.classList.contains('quote__documents-list_active')){
    quote.classList.add('quote--printscreen')

    let options = {
      height: quote.scrollHeight + 10,
    }
    
    // pdf, png
    html2canvas(quote, options).then(canvas => {
      quoteDocumentsListBtnPng.download = "VKCO.png";
      quoteDocumentsListBtnPng.href = canvas.toDataURL()

      quote.classList.remove('quote--printscreen')
      quoteDocumentsList.classList.toggle('quote__documents-list_active')

      quoteCanvasData.width = canvas.width
      quoteCanvasData.height = canvas.height

      console.log(canvas.width, canvas.height)

    });

  } else {
    quoteDocumentsList.classList.toggle('quote__documents-list_active')
  }
})

quoteDocumentsListBtnPng.addEventListener('click', () => {
  quoteDocumentsList.classList.remove('quote__documents-list_active')
})

quoteDocumentsListBtnPdf.addEventListener('click', () => {
  quoteDocumentsList.classList.remove('quote__documents-list_active')

  window.jsPDF = window.jspdf.jsPDF;

  function ConvertPxToMM(pixels) {
    return Math.floor(pixels * 0.264583);
  }

  let docWidth = ConvertPxToMM(quoteCanvasData.width)
  let docHeight = ConvertPxToMM(quoteCanvasData.height) 

  let orientation = quoteCanvasData.width >= quoteCanvasData.height ? 'l' : 'p';

  const doc = new jsPDF(orientation, 'mm', [docWidth, docHeight]);
  
  doc.addImage(quoteDocumentsListBtnPng.href, 0, 0);
  doc.save("VKCO.pdf");
})

quoteDocumentsListBtnXlsx.addEventListener('click', () => {
  let wb = XLSX.utils.book_new();

  wb.Props = {
    Title: "VKCO",
    Subject: "VKCO",
    Author: "VK",
    CreatedDate: new Date(),
  };
  
  wb.SheetNames.push("VKCO");

  let ws_data = widgetLanguage === 'ru' ? [['Дата' , 'Цена', 'Объем']] : [['Date' , 'Price', 'Turnover']];

  currentLabels.forEach((item, i) => {
    let newRow = [];

    newRow.push(currentLabels[i])
    newRow.push(currentValues[i])
    newRow.push(currentVolume[i])

    ws_data.push(newRow)
  })

  let ws = XLSX.utils.aoa_to_sheet(ws_data);

  wb.Sheets["VKCO"] = ws;
  
  let wbout = XLSX.write(wb, {bookType:'xlsx',  type: 'binary'});

  function s2ab(s) {
    let buf = new ArrayBuffer(s.length);
    let view = new Uint8Array(buf);
    for (let i=0; i<s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
    return buf;
  }

  saveAs(new Blob([s2ab(wbout)],{type:"application/octet-stream"}), 'VKCO.xlsx');
}) 

document.addEventListener('click', () => {
  quoteDocumentsList.classList.remove('quote__documents-list_active')
})

// MOEX API
let quoteWrapper = document.querySelector('.quote__wrapper')
let quotePeriodItem = document.querySelectorAll('.quote__period-item');
let quoteGraph = document.querySelector('.quote__graph');
let quoteGraphBar = document.querySelector('.quote__graph-bar');
let quoteGraphNavigationRangeButton = document.querySelectorAll('.quote__graph-navigation-range-button');
let quoteGraphNavigationRangeButtonMax = document.querySelector('.quote__graph-navigation-range-button--max');
let quoteGraphNavigationRangeButtonMin = document.querySelector('.quote__graph-navigation-range-button--min');
let quoteGraphNavigationRange = document.querySelector('.quote__graph-navigation-range');
let quoteGraphNavigationRangeLineMin = document.querySelector('.quote__graph-navigation-range-line--min');
let quoteGraphNavigationRangeLineMax = document.querySelector('.quote__graph-navigation-range-line--max');
let quoteGraphNavigationLabels = document.querySelector('.quote__graph-navigation-labels');
let quoteGraphNavigationScroll = document.querySelector('.quote__graph-navigation-scroll');
let quoteGraphNavigationControlButton = document.querySelectorAll('[data-navigation-control]')
let quoteGraphNavigationScrollOverlay = document.querySelector('.quote__graph-navigation-scroll-overlay')
let quoteGraphNavigationScrollButtonLess = document.querySelector('.quote__graph-navigation-scroll-button--less');
let quoteGraphNavigationScrollButtonMore = document.querySelector('.quote__graph-navigation-scroll-button--more');
let quoteGraphCurrentLabels = document.querySelector('.quote__graph-current-labels');
let quoteGraphLineTicks = document.querySelector('.quote__graph-ticks--line');
let quoteGraphBarTicks = document.querySelector('.quote__graph-ticks--bar');
let quoteGraphTicks = document.querySelectorAll('.quote__graph-ticks');
let quoteGraphWrapper = document.querySelectorAll('.quote__graph-wrapper');

let labels = [];
let values = [];
let volume = [];
let currentLabels = [];
let currentValues = [];
let currentVolume = [];
let lineChart;
let barChart;
let navigationChart;
let isRepeatedHistoryRequest = false;

urls = {
  headerData: 'https://iss.moex.com/iss/engines/stock/markets/shares/boards/TQBR/securities/VKCO.json',
  historyData: 'https://iss.moex.com/iss/history/engines/stock/markets/shares/boards/TQBR/securities/VKCO.json?from=',
  dailyData: 'https://iss.moex.com/iss/engines/stock/markets/shares/boards/TQBR/securities/VKCO/candles.json?interval=60&from=',
}

// Get, update data for header
function getHeaderData(url) {
  let dataItems = document.querySelectorAll('[data-variable]');

  fetch(url)
  .then((response) => {
    return response.json();
  })
  .then((data) => {
    let marketData = data.marketdata;

    dataItems.forEach(dataItem => {
      let dataItemVariable = dataItem.dataset.variable;
      
      if (marketData.data[0]) {
        marketData.columns.forEach((marketVariable, i) => {
          if (dataItemVariable === marketVariable && marketData.data[0][i]) {
            dataItem.textContent = marketData.data[0][i].toLocaleString();
  
            if (dataItemVariable === "LASTTOPREVPRICE") {
              if (dataItem.textContent.indexOf('-') < 0) {
                dataItem.textContent = '+' + dataItem.textContent
                dataItem.closest('div').className = 'quote__current-price-change quote__current-price-change_positive'
              } else {
                dataItem.closest('div').className = 'quote__current-price-change quote__current-price-change_negative'
              }
            }
          }
        })
      }
    })
  });
}

getHeaderData(urls.headerData)
setInterval(() => {
  getHeaderData(urls.headerData)
}, 5000);

// Get, update data for charts
async function getHistoryData(url, type, date = '') {
  let fullUrl = url + date;
  await fetch(fullUrl)
  .then((response) => {
    return response.json();
  })
  .then((newData) => {
    if (type === 'get') {
      newData.history.data.forEach(array => {
        labels.push(array[1])
        values.push(array[9])
        volume.push(array[4])
      })

      if (newData.history.data.length === 100) {
        let lastDate = labels[labels.length - 1]
        getHistoryData(urls.historyData, 'get', lastDate);
      } else {
        currentLabels = labels
        currentValues = values
        currentVolume = volume

        createGraphs()
        initNavigation()

        updateCurrentLabelsList(labels)
        updateTicks()
        updateSizes()

        setTimeout(() => {
          lineChart.update();
          barChart.update();

          updateTicks()
          updateSizes()
        }, 100);
      }
    }
    if (type === 'update') {
      if (!isRepeatedHistoryRequest) {
        currentLabels = [];
        currentValues = [];
        currentVolume = [];
      }

      if (url === urls.historyData) {
        newData.history.data.forEach(array => {
          currentLabels.push(array[1])
          currentValues.push(array[9])
          currentVolume.push(array[4])
        })
  
        if (newData.history.data.length === 100) {
          let lastDate = currentLabels[currentLabels.length - 1]
          getHistoryData(urls.historyData, 'update', lastDate);
          isRepeatedHistoryRequest = true
        } else {
          updateGraph(currentLabels, currentValues, currentVolume);
          updateNavigation()
          isRepeatedHistoryRequest = false
        }
      }
      if (url === urls.dailyData) {

        newData.candles.data.forEach((array, i) => {
          if (currentLabels.length < 10) {
            currentLabels.push(newData.candles.data[newData.candles.data.length - 1 - 10 + i][6])
            currentValues.push(newData.candles.data[newData.candles.data.length - 1 - 10 + i][0])
            currentVolume.push(newData.candles.data[newData.candles.data.length - 1 - 10 + i][5])
          }
        })
  
        updateGraph(currentLabels, currentValues, currentVolume);
        updateNavigation()
        isRepeatedHistoryRequest = false
      }
    }
  })
}

function createGraph(type, labels, values, volume) {
  if (type === 'line') {
    const data = {
      labels: labels,
      datasets: [{
        borderColor: '#0077ff',
        data: values,
        pointBackgroundColor: 'transparent',
        pointBorderColor: 'transparent',
      }]
    };
  
    const config = {
      type: type,
      data: data,
      options: {
        responsive: document.documentElement.clientWidth < 768 ? false : true,
        elements: {
          point: {
            radius: 10,
          }, 
        },
        scales: {
          xAxis: {
            display: false,
          },
          yAxis: {
            position: 'right',
            grid: {
              borderColor: "transparent",
              color: '#A8A8A8',
              borderDash: [2, 2],
            },
            ticks: {
              display: false,
              color: '#050B15',
              z: 1,
              font: {
                size: 20,
                family: "'VK Sans Display', 'sans-serif', 'Arial'",
              },
              padding: 0,
            }
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            // Disable the on-canvas tooltip
            enabled: false,

            external: function(context) {
                // Tooltip Element
                let tooltipEl = document.getElementById('chartjs-tooltip');

                // Create element on first render
                if (!tooltipEl) {
                    tooltipEl = document.createElement('div');
                    tooltipEl.id = 'chartjs-tooltip';
                    tooltipEl.innerHTML = '<table></table>';
                    document.body.appendChild(tooltipEl);
                }

                // Hide if no tooltip
                const tooltipModel = context.tooltip;
                if (tooltipModel.opacity === 0) {
                    tooltipEl.style.opacity = 0;
                    return;
                }

                // Set caret Position
                tooltipEl.classList.remove('above', 'below', 'no-transform');
                if (tooltipModel.yAlign) {
                    tooltipEl.classList.add(tooltipModel.yAlign);
                } else {
                    tooltipEl.classList.add('no-transform');
                }

                function getBody(bodyItem) {
                    return bodyItem.lines;
                }

                let tooltipModelValue = '';
                let tooltipModelVolume = ''; 

                currentLabels.map((item, i) => {                
                  if (item == tooltipModel.title) {
                    tooltipModelValue = currentValues[i]
                    tooltipModelVolume = currentVolume[i]
                  }
                })

                // Set Text
                if (tooltipModel.body) {
                  tooltipEl.innerHTML = 
                  `
                  <div style="background: #FFFFFF; padding: 10px 15px; border: 1px solid #050B15; font-family: var(--font-family-primary); font-size: 16px;">
                    <div>${tooltipModel.title}</div>
                    <div style="margin: 15px 0 10px; white-space: nowrap;">
                      <span style="color: #0077FF; margin-right: 10px">${widgetLanguage === 'ru' ? 'Цена' : 'Price'}</span> <span style="font-weight: 500; font-size: 22px;">${tooltipModelValue}</span>
                    </div>
                    <div style="white-space: nowrap;">
                      <span style="color: #FF3583; margin-right: 10px">${widgetLanguage === 'ru' ? 'Объем' : 'Turnover'}</span> <span style="font-weight: 500; font-size: 22px;">${tooltipModelVolume}</span>
                    </div>
                  </div>
                  `
                }

                const position = context.chart.canvas.getBoundingClientRect();
                const bodyFont = Chart.helpers.toFont(tooltipModel.options.bodyFont);

                // Display, position, and set styles for font
                tooltipEl.style.opacity = 1;
                tooltipEl.style.position = 'absolute';
                if (tooltipModel.caretX > document.documentElement.clientWidth / 2) {
                  tooltipEl.style.left = position.left + window.pageXOffset + tooltipModel.caretX - tooltipEl.clientWidth + 'px';
                } else {
                  tooltipEl.style.left = position.left + window.pageXOffset + tooltipModel.caretX + 'px';
                }
                tooltipEl.style.top = position.top + window.pageYOffset + tooltipModel.caretY + 'px';
                tooltipEl.style.font = bodyFont.string;
                tooltipEl.style.padding = tooltipModel.padding + 'px ' + tooltipModel.padding + 'px';
                tooltipEl.style.pointerEvents = 'none';
            }
          },
        },
      },
    };
    
    lineChart = new Chart(
      document.getElementById('lineChart'),
      config
    );
  }
  if (type === 'bar') {
    const data = {
      labels: labels,
      datasets: [{
        backgroundColor: '#FF3583',
        borderColor: '#FF3583',
        data: volume,
      }]
    };
  
    const config = {
      type: type,
      data: data,
      options: {
        responsive: document.documentElement.clientWidth < 768 ? false : true,
        scales: {
          xAxis: {
            display: false,
          },
          yAxis: {
            position: 'right',
            grid: {
              borderColor: "transparent",
              color: '#A8A8A8',
              borderDash: [2, 2],
            },
            ticks: {
              display: false,
              color: '#050B15',
              z: 1,
              font: {
                size: 20,
                family: "'VK Sans Display', 'sans-serif', 'Arial'",
              },
              padding: 0,
            }
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            // Disable the on-canvas tooltip
            enabled: false,

            external: function(context) {
                // Tooltip Element
                let tooltipEl = document.getElementById('chartjs-tooltip');

                // Create element on first render
                if (!tooltipEl) {
                    tooltipEl = document.createElement('div');
                    tooltipEl.id = 'chartjs-tooltip';
                    tooltipEl.innerHTML = '<table></table>';
                    document.body.appendChild(tooltipEl);
                }

                // Hide if no tooltip
                const tooltipModel = context.tooltip;
                if (tooltipModel.opacity === 0) {
                    tooltipEl.style.opacity = 0;
                    return;
                }

                // Set caret Position
                tooltipEl.classList.remove('above', 'below', 'no-transform');
                if (tooltipModel.yAlign) {
                    tooltipEl.classList.add(tooltipModel.yAlign);
                } else {
                    tooltipEl.classList.add('no-transform');
                }

                function getBody(bodyItem) {
                    return bodyItem.lines;
                }

                let tooltipModelValue = '';
                let tooltipModelVolume = ''; 

                currentLabels.map((item, i) => {                
                  if (item == tooltipModel.title) {
                    tooltipModelValue = currentValues[i]
                    tooltipModelVolume = currentVolume[i]
                  }
                })

                // Set Text
                if (tooltipModel.body) {
                  tooltipEl.innerHTML = 
                  `
                  <div style="background: #FFFFFF; padding: 10px 15px; border: 1px solid #050B15; font-family: var(--font-family-primary); font-size: 16px;">
                    <div>${tooltipModel.title}</div>
                    <div style="margin: 15px 0 10px; white-space: nowrap;">
                      <span style="color: #0077FF; margin-right: 10px">${widgetLanguage === 'ru' ? 'Цена' : 'Price'}</span> <span style="font-weight: 500; font-size: 22px;">${tooltipModelValue}</span>
                    </div>
                    <div style="white-space: nowrap;">
                      <span style="color: #FF3583; margin-right: 10px">${widgetLanguage === 'ru' ? 'Объем' : 'Turnover'}</span> <span style="font-weight: 500; font-size: 22px;">${tooltipModelVolume}</span>
                    </div>
                  </div>
                  `
                }

                const position = context.chart.canvas.getBoundingClientRect();
                const bodyFont = Chart.helpers.toFont(tooltipModel.options.bodyFont);

                // Display, position, and set styles for font
                tooltipEl.style.opacity = 1;
                tooltipEl.style.position = 'absolute';
                tooltipEl.style.left = position.left + window.pageXOffset + tooltipModel.caretX + 'px';
                tooltipEl.style.top = position.top + window.pageYOffset + tooltipModel.caretY + 'px';
                tooltipEl.style.font = bodyFont.string;
                tooltipEl.style.padding = tooltipModel.padding + 'px ' + tooltipModel.padding + 'px';
                tooltipEl.style.pointerEvents = 'none';
            }
          },
        },
      },
    };
    
    barChart = new Chart(
      document.getElementById('barChart'),
      config
    );
  }
  if (type === 'navigation') {
    const data = {
      labels: labels,
      datasets: [{
        backgroundColor: '#0077FF',
        borderColor: '#0077FF',
        data: values,
      }]
    };
  
    const config = {
      type: 'line',
      data: data,
      options: {
        responsive: document.documentElement.clientWidth < 768 ? false : true,
        elements: {
          point: {
            radius: 0,
          }, 
          line: {
            fill: {
              target: 'origin',
              above: 'rgba(0, 119, 255, 0.2)',
            },
          },
        },
        scales: {
          xAxis: {
            display: false,
          },
          yAxis: {
            display: false,
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: false,
          },
        },
      },
    };
    
    navigationChart = new Chart(
      document.getElementById('navigationChart'),
      config
    );
  }
}

function createGraphs() {
  createGraph("navigation", labels, values);
  createGraph("line", labels, values, volume);
  createGraph("bar", labels, values, volume);
}

function updateGraph(labels, values, volume) {
  lineChart.data.labels = labels;
  lineChart.data.datasets[0].data = values;
  barChart.data.labels = labels;
  barChart.data.datasets[0].data = volume;
  lineChart.update();
  barChart.update();

  updateCurrentLabelsList(labels)
  updateTicks()
  updateSizes()

  setTimeout(() => {
    lineChart.update();
    barChart.update();

    updateTicks()
    updateSizes()
  }, 100);
}

function updateCurrentLabelsList(currentLabels) {
  quoteGraphCurrentLabels.textContent = '';
  let updatedIndexesList = [];

  currentLabels.forEach((item, i) => {
    if (i <= 10) {
      let newIndex = Math.round(((currentLabels.length - 1) * 10 * i) / 100);

      let checkRepeatedIndex = true;
      let currentIndex = newIndex;
      
      while (checkRepeatedIndex) {
        if (updatedIndexesList.indexOf(currentIndex) === -1) {
          updatedIndexesList.push(currentIndex)
          checkRepeatedIndex = false
        } else {
          currentIndex = currentIndex + 1 < currentLabels.length - 1 ? currentIndex + 1 : currentLabels.length - 1
        }
      }
      
      let newLabel = document.createElement('li')
      newLabel.textContent = currentLabels[currentIndex]
      newLabel.classList.add('quote__graph-current-label')
      quoteGraphCurrentLabels.append(newLabel)
    }
  })
}

function updateTicks() {
  quoteGraphLineTicks.textContent = '';
  quoteGraphBarTicks.textContent = '';

  let currentLineTicks = lineChart.scales.yAxis.ticks;
  let currentBarTicks = barChart.scales.yAxis.ticks;

  currentLineTicks.forEach((item) => {
    let newTick = document.createElement('li')
    newTick.textContent = item.value
    newTick.classList.add('quote__graph-tick')
    quoteGraphLineTicks.append(newTick)
  })

  currentBarTicks.forEach((item) => {
    let newTick = document.createElement('li')
    newTick.textContent = item.value
    newTick.classList.add('quote__graph-tick')
    quoteGraphBarTicks.append(newTick)
  })
}

function updateSizes() {
  let ticksWidth = quoteGraphLineTicks.clientWidth > quoteGraphBarTicks.clientWidth ? quoteGraphLineTicks.clientWidth : quoteGraphBarTicks.clientWidth;

  quoteGraphTicks.forEach(item => {
    item.style.minWidth = ticksWidth + 'px';
  })

  let graphsWidth = quoteWrapper.clientWidth - ticksWidth

  quoteGraphWrapper.forEach(wrapper => {
    if (wrapper.closest('.quote__graph-line')) {
      wrapper.style.width = graphsWidth + 11 + 'px';
    } else {
      wrapper.style.width = graphsWidth + 'px';
    }
    
  })
}

window.addEventListener('resize', () => {
  updateGraph(currentLabels, currentValues, currentVolume);
  updateNavigation()
})

async function firstRender() {
  await getHistoryData(urls.historyData, 'get');
}

firstRender()

// Changing the period on the charts
quotePeriodItem.forEach((item) => {
  item.addEventListener('click', async () => {
    item.classList.add('quote__period-item_active');

    quotePeriodItem.forEach(otherItem => {
      if (otherItem != item) {
        otherItem.classList.remove('quote__period-item_active');
      }
    })

    let now = new Date();
    let nowTimestamp = Date.parse(now);
    let date = '';
    let dateTimestamp;
    let period;
    let url;

    switch (item.dataset.period) {
      case "all":
        date = '';
        url = urls.historyData;
        break;

      case "year":
        period = 365 * 24 * 60 * 60 * 1000;
        url = urls.historyData;
        break;

      case "month":
        period = 30.5 * 24 * 60 * 60 * 1000;
        url = urls.historyData;
        break;

      case "week":
        period = 7 * 24 * 60 * 60 * 1000;
        url = urls.historyData;
        break;

      case "day":
        period = 4 * 24 * 60 * 60 * 1000;
        url = urls.dailyData;
        break;
    }

    if (period) {
      dateTimestamp = nowTimestamp - period;
      let fullDate = new Date(dateTimestamp);
      let formatedFullDate = fullDate.getFullYear() + '-' + ('0' + (fullDate.getMonth() + 1)).slice(-2) + '-' + ('0' + fullDate.getDate()).slice(-2);
      date = formatedFullDate;
    }

    await getHistoryData(url, 'update', date)
  })
})

// Navigation range
function initNavigation() {
  let historyLength = labels.length;
  let firstDataIndex = 0;
  let lastDataIndex = historyLength - 1;
  let updatedLabels;
  let updatedValues;
  let updatedVolume;

  let navigationLabels = [];
  
  labels.forEach((item, i) => {
    if (i <= 10) {
      let newIndex = Math.ceil(((labels.length - 1) * 10 * i) / 100);
      navigationLabels.push(labels[newIndex])
    }
  })

  navigationLabels.forEach((item) => {
    let newLabel = document.createElement('li')
    newLabel.textContent = item
    newLabel.classList.add('quote__graph-navigation-label')
    quoteGraphNavigationLabels.append(newLabel)
  })

  function updatePositionsRangeButtons() {
    quoteGraphNavigationRangeButtonMin.style.left = quoteGraphNavigationScroll.offsetLeft + 'px'
    quoteGraphNavigationRangeButtonMax.style.left = quoteGraphNavigationScroll.offsetLeft + quoteGraphNavigationScroll.clientWidth + 'px'
    quoteGraphNavigationRangeLineMin.style.width = quoteGraphNavigationRangeButtonMin.offsetLeft + 'px';
    quoteGraphNavigationRangeLineMax.style.width = quoteGraphNavigationRange.clientWidth - quoteGraphNavigationRangeButtonMax.offsetLeft + 'px';
    firstDataIndex = updateIndex(quoteGraphNavigationRangeButtonMin.offsetLeft, "min")
    lastDataIndex = updateIndex(quoteGraphNavigationRangeButtonMax.offsetLeft)
    updateGraphs(firstDataIndex, lastDataIndex)
  }

  function updateIndex(value, type) {
    if (type === "min") {
      return Math.round(value * historyLength / quoteGraphNavigationRange.clientWidth)
    } else {
      return Math.round(value * historyLength / quoteGraphNavigationRange.clientWidth - 1)
    }
  }

  function updateGraphs(firstDataIndex, lastDataIndex) {
    updatedLabels = labels.filter((item, i) => i >= firstDataIndex && i <= lastDataIndex)
    updatedVolume = volume.filter((item, i) => i >= firstDataIndex && i <= lastDataIndex)
    updatedValues = values.filter((item, i) => i >= firstDataIndex && i <= lastDataIndex)
    
    updateGraph(updatedLabels, updatedValues, updatedVolume);
  }

  quoteGraphNavigationControlButton.forEach(btn => {
    btn.addEventListener('mousedown', (event) => {
      let shiftX = quoteGraphNavigationRange.getBoundingClientRect().left;
      let clickPositon = event.pageX - shiftX - btn.offsetLeft;
      let positionButtonMin = quoteGraphNavigationRangeButtonMin.offsetLeft;
      let positionButtonMax = quoteGraphNavigationRangeButtonMax.offsetLeft;
      
      function moveAt(pageX) {
        if (btn === quoteGraphNavigationRangeButtonMax) {
          if (pageX - shiftX + btn.clientWidth <= quoteGraphNavigationRange.clientWidth && pageX - shiftX > 0 && pageX - shiftX > positionButtonMin) {
            btn.style.left = pageX - shiftX + btn.clientWidth + 'px';
          } else if (pageX - shiftX + btn.clientWidth > quoteGraphNavigationRange.clientWidth) {
            btn.style.left = quoteGraphNavigationRange.clientWidth + 'px';
          } else if (pageX - shiftX < positionButtonMin) {
            btn.style.left = positionButtonMin + btn.clientWidth * 2 + 'px';
          }

          quoteGraphNavigationRangeLineMax.style.width = quoteGraphNavigationRange.clientWidth - quoteGraphNavigationRangeButtonMax.offsetLeft + 'px';

          lastDataIndex = updateIndex(quoteGraphNavigationRangeButtonMax.offsetLeft)
          updateGraphs(firstDataIndex, lastDataIndex)
          updateScrollSize()
          updateScrollPosition()
        }

        if (btn === quoteGraphNavigationRangeButtonMin) {
          if (pageX - shiftX <= quoteGraphNavigationRange.clientWidth && pageX - shiftX - btn.clientWidth > 0 && pageX - shiftX < positionButtonMax) {
            btn.style.left = pageX - shiftX - btn.clientWidth + 'px';
          } else if (pageX - shiftX - btn.clientWidth < 0) {
            btn.style.left = '0px';
          } else if (pageX - shiftX > positionButtonMin) {
            btn.style.left = positionButtonMax - btn.clientWidth * 2 + 'px';
          }

          quoteGraphNavigationRangeLineMin.style.width = quoteGraphNavigationRangeButtonMin.offsetLeft + 'px';

          firstDataIndex = updateIndex(quoteGraphNavigationRangeButtonMin.offsetLeft, "min")
          updateGraphs(firstDataIndex, lastDataIndex)
          updateScrollSize()
          updateScrollPosition()
        }

        if (btn === quoteGraphNavigationScroll) {
          if (pageX - shiftX - clickPositon > 0 && pageX - shiftX - clickPositon + btn.clientWidth < quoteGraphNavigationScrollOverlay.clientWidth) {
            btn.style.left = pageX - shiftX - clickPositon + 'px';
          } else if (pageX - shiftX - clickPositon < 0) {
            btn.style.left = '0';
          } else if (pageX - shiftX - clickPositon + btn.clientWidth > quoteGraphNavigationScrollOverlay.clientWidth) {
            btn.style.left = quoteGraphNavigationScrollOverlay.clientWidth - btn.clientWidth + 'px';
          }

          updatePositionsRangeButtons()
        }
      }

      function onMouseMove(event) {
        moveAt(event.pageX);

        quotePeriodItem.forEach((item) => {
          item.className = 'quote__period-item'
        })
      }

      document.addEventListener('mousemove', onMouseMove);

      document.addEventListener('mouseup', (event) => {
        document.removeEventListener('mousemove', onMouseMove);
        btn.onmouseup = null;
      })

      btn.ondragstart = function() {
        return false;
      };
    })
  })

  quoteGraphNavigationScrollButtonLess.addEventListener('click', () => {
    quoteGraphNavigationScroll.style.left = quoteGraphNavigationScroll.offsetLeft - 30 > 0 ?  + quoteGraphNavigationScroll.offsetLeft - 30 + 'px' : '0'
    updatePositionsRangeButtons()
  })
  
  quoteGraphNavigationScrollButtonMore.addEventListener('click', () => {
    quoteGraphNavigationScroll.style.left = quoteGraphNavigationScroll.offsetLeft + quoteGraphNavigationScroll.clientWidth + 30 < quoteGraphNavigationScrollOverlay.clientWidth ?  quoteGraphNavigationScroll.offsetLeft + 30 + 'px' : quoteGraphNavigationScrollOverlay.clientWidth - quoteGraphNavigationScroll.clientWidth + 'px'
    updatePositionsRangeButtons()
  })
}

function updateScrollSize() {
  let scrollWidth = quoteGraphNavigationRangeButtonMax.offsetLeft - quoteGraphNavigationRangeButtonMin.offsetLeft
  quoteGraphNavigationScroll.style.width = scrollWidth + 'px'
}

function updateScrollPosition() {
  quoteGraphNavigationScroll.style.left = quoteGraphNavigationRangeButtonMin.offsetLeft + 'px'
}

function updateNavigation() {
  quoteGraphNavigationRangeButtonMax.style.left = '100%';
  quoteGraphNavigationRangeLineMax.style.width = 0;0

  let firstLabel = currentLabels[0].split(' ')[0]
  let newStartIndex = labels.indexOf(firstLabel)

  if (newStartIndex >= 0) {
    quoteGraphNavigationRangeButtonMin.style.left = `${newStartIndex * 100 / labels.length}%`;
    quoteGraphNavigationRangeLineMin.style.width = quoteGraphNavigationRangeButtonMin.offsetLeft + 'px';
  }

  updateScrollSize()
  updateScrollPosition()
}