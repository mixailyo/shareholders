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

    let options = {}

    if (document.documentElement.clientWidth > 1024) {
      options = {
        height: quote.scrollHeight + 10,
      };
    } else {
      options = {
        windowWidth: 1024,
      };
    }
    
    // pdf, png
    html2canvas(quote, options).then(canvas => {
      quoteDocumentsListBtnPng.href = canvas.toDataURL()
      quote.classList.remove('quote--printscreen')
      quoteDocumentsList.classList.toggle('quote__documents-list_active')

      quoteCanvasData.width = canvas.width
      quoteCanvasData.height = canvas.height
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

  const doc = new jsPDF('l', 'mm', [docWidth, docHeight]);
  
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

  let ws_data = [['Дата' , 'Цена', 'Объем']];

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
let quotePeriodItem = document.querySelectorAll('.quote__period-item');
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
        createGraphs()
        initNavigation()

        currentLabels = labels
        currentValues = values
        currentVolume = volume
      }
    }
    if (type === 'update') {
      if (!isRepeatedHistoryRequest) {
        currentLabels = [];
        currentValues = [];
        currentVolume = [];
      }
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
  })
}

function createGraph(type, labels, values, volume) {
  if (type === 'both') {
    const data = {
      labels: labels,
      datasets: [
        {
          label: 'Цена',
          borderColor: '#0077ff',
          backgroundColor: '#0077ff',
          data: values,
          pointBackgroundColor: 'transparent',
          pointBorderColor: 'transparent',
        },
        {
          label: 'Объем',
          backgroundColor: '#FF3583',
          borderColor: '#FF3583',
          data: volume,
          yAxisID: 'y2',
          type: 'bar',
        }
      ]
    };

    const config = {
      type: 'line',
      data: data,
      options: {
        elements: {
          point: {
            radius: 10,
          }, 
        },
        responsive: true,
        plugins: {
          title: {
            display: false,
          },
        },
        scales: {
          xAxis: {
            grid: {
              display: false,
            }
          },
          y: {
            type: 'linear',
            position: 'right',
            stack: 'both',
            stackWeight: 2,
            grid: {
              borderColor: "transparent",
              color: '#A8A8A8',
              borderDash: [2, 2],
            },
            ticks: {
              color: '#050B15',
              z: 1,
              font: {
                size: 20,
                family: "'VK Sans Display', 'sans-serif', 'Arial'",
              },
              padding: 0,
            },
          },
          y2: {
            type: 'linear',
            position: 'right',
            stack: 'both',
            stackWeight: 1,
            grid: {
              borderColor: "transparent",
              color: '#A8A8A8',
              borderDash: [2, 2],
            },
            ticks: {
              color: '#050B15',
              backdropColor: '#FFFFFF',
              showLabelBackdrop: true,
              z: 2,
              font: {
                size: 20,
                family: "'VK Sans Display', 'sans-serif', 'Arial'",
              },
              padding: 0,
            }
          }
        },
        plugins: {
          legend: {
            labels: {
              boxWidth: 12,
              boxHeight: 12,
              font: {
                size: 16,
                family: "'VK Sans Text', 'sans-serif', 'Arial'",
              },
              padding: 20,
            }
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

                labels.map((item, i) => {                
                  if (item == tooltipModel.title) {
                    tooltipModelValue = values[i]
                    tooltipModelVolume = volume[i]
                  }
                })

                // Set Text
                if (tooltipModel.body) {
                  tooltipEl.innerHTML = 
                  `
                  <div style="background: #FFFFFF; padding: 10px 15px; border: 1px solid #050B15; font-family: var(--font-family-primary); font-size: 16px;">
                    <div>${tooltipModel.title}</div>
                    <div style="margin: 15px 0 10px; white-space: nowrap;">
                      <span style="color: #0077FF; margin-right: 10px">Цена</span> <span style="font-weight: 500; font-size: 22px;">${tooltipModelValue}</span>
                    </div>
                    <div style="white-space: nowrap;">
                      <span style="color: #FF3583; margin-right: 10px">Объем</span> <span style="font-weight: 500; font-size: 22px;">${tooltipModelVolume}</span>
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

    bothChart = new Chart(
      document.getElementById('bothChart'),
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
        responsive: true,
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

function updateGraph(labels, values, volume) {
  bothChart.data.labels = labels;
  bothChart.data.datasets[0].data = values;
  bothChart.data.datasets[1].data = volume;
  bothChart.update();
}

function createGraphs() {
  createGraph("navigation", labels, values);
  createGraph("both", labels, values, volume);
}

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

    switch (item.dataset.period) {
      case "all":
        date = '';
        break;

      case "year":
        period = 365 * 24 * 60 * 60 * 1000;
        break;

      case "month":
        period = 30.5 * 24 * 60 * 60 * 1000;
        break;

      case "week":
        period = 7 * 24 * 60 * 60 * 1000;
        break;

      case "day":
        period = 1 * 24 * 60 * 60 * 1000;
        break;
    }

    if (period) {
      dateTimestamp = nowTimestamp - period;
      let fullDate = new Date(dateTimestamp);
      let formatedFullDate = fullDate.getFullYear() + '-' + ('0' + (fullDate.getMonth() + 1)).slice(-2) + '-' + ('0' + fullDate.getDate()).slice(-2);
      date = formatedFullDate;
    }

    await getHistoryData(urls.historyData, 'update', date)
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
  quoteGraphNavigationRangeLineMax.style.width = 0;

  let newStartIndex = labels.indexOf(currentLabels[0])

  if (newStartIndex >= 0) {
    quoteGraphNavigationRangeButtonMin.style.left = `${newStartIndex * 100 / labels.length}%`;
    quoteGraphNavigationRangeLineMin.style.width = quoteGraphNavigationRangeButtonMin.offsetLeft + 'px';
  }

  updateScrollSize()
  updateScrollPosition()
}