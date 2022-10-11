// Share documents
let quoteDocumentsBtn = document.querySelector('.quote__documents-btn');
let quoteDocumentsList = document.querySelector('.quote__documents-list');

if (quoteDocumentsBtn) {
  quoteDocumentsBtn.addEventListener('click', () => {
    quoteDocumentsList.classList.toggle('quote__documents-list_active')
  })
}

// MOEX API
let allData;
let labels = [];
let values = [];
let volume = [];
let lineChart;
let barChart;
let navigationChart;
let quotePeriodItem = document.querySelectorAll('.quote__period-item');
let quoteGraphBar = document.querySelector('.quote__graph-bar');

urls = {
  headerData: 'https://iss.moex.com/iss/engines/stock/markets/shares/boards/TQBR/securities/VKCO.json',
  historyData: 'https://iss.moex.com/iss/history/engines/stock/markets/shares/boards/TQBR/securities/VKCO.json?from=',
}

// Получаем, обновляем данные в шапке виджета 
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
              if (Number(dataItem.textContent) > 0) {
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

// Получаем, обновляем данные и строим на их основе графики
async function getHistoryData(url, date = '') {
  let fullUrl = url + date;
  await fetch(fullUrl)
  .then((response) => {
    return response.json();
  })
  .then((newData) => {
    allData = newData;
    labels = [];
    values = [];
    volume = [];
    newData.history.data.forEach(array => {
      labels.push(array[1])
      values.push(array[9])
      volume.push(array[4])
    })
  })
}

function createGraph(type, labels, values, values2) {
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

                allData.history.data.map((item) => {                
                  if (item[1] == tooltipModel.title) {
                    tooltipModelValue = item[9]
                    tooltipModelVolume = item[4]
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
        data: values,
      }]
    };
  
    const config = {
      type: type,
      data: data,
      options: {
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

                allData.history.data.map((item) => {                
                  if (item[1] == tooltipModel.title) {
                    tooltipModelValue = item[9]
                    tooltipModelVolume = item[4]
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
            grid: {
              display: false,
            }
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
  if (type === 'both') {
    const data = {
      labels: labels,
      datasets: [
        {
          borderColor: '#0077ff',
          data: values,
          pointBackgroundColor: 'transparent',
          pointBorderColor: 'transparent',
        },
        {
          backgroundColor: '#FF3583',
          borderColor: '#FF3583',
          data: values2,
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
            stack: 'demo',
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
            beginAtZero: false,
          },
          y2: {
            type: 'linear',
            position: 'right',
            stack: 'demo',
            stackWeight: 1,
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
            }
          }
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

                allData.history.data.map((item) => {                
                  if (item[1] == tooltipModel.title) {
                    tooltipModelValue = item[9]
                    tooltipModelVolume = item[4]
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
}

function updateGraph(labels, values, values2) {
  bothChart.data.labels = labels;
  bothChart.data.datasets[0].data = values;
  bothChart.data.datasets[1].data = values2;
  bothChart.update();
}

async function firstRender() {
  await getHistoryData(urls.historyData);
  await createGraph("navigation", labels, values);
  await createGraph("both", labels, values, volume);
  await initNavigation()
}

firstRender()

// Смена периода на графиках
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
        quoteGraphBar.className = 'quote__graph-bar'

        date = '';
        break;
      case "year":
        quoteGraphBar.className = 'quote__graph-bar'

        period = 365 * 24 * 60 * 60 * 1000;
        break;
      case "month":
        quoteGraphBar.className = 'quote__graph-bar quote__graph-bar--month'

        period = 30.5 * 24 * 60 * 60 * 1000;
        break;
      case "week":
        quoteGraphBar.className = 'quote__graph-bar quote__graph-bar--week'

        period = 7 * 24 * 60 * 60 * 1000;
        break;
      case "day":
        quoteGraphBar.className = 'quote__graph-bar quote__graph-bar--day'

        period = 1 * 24 * 60 * 60 * 1000;
        break;
    }

    if (period) {
      dateTimestamp = nowTimestamp - period;
      let fullDate = new Date(dateTimestamp);
      let formatedFullDate = fullDate.getFullYear() + '-' + ('0' + (fullDate.getMonth() + 1)).slice(-2) + '-' + ('0' + fullDate.getDate()).slice(-2);
      date = formatedFullDate;
    }

    await getHistoryData(urls.historyData, date);

    updateGraph(labels, values, volume);

  })
})

// Navigation range
function initNavigation() {
  let quoteGraphNavigationRangeButton = document.querySelectorAll('.quote__graph-navigation-range-button');
  let quoteGraphNavigationRangeButtonMax = document.querySelector('.quote__graph-navigation-range-button--max');
  let quoteGraphNavigationRangeButtonMin = document.querySelector('.quote__graph-navigation-range-button--min');
  let quoteGraphNavigationRange = document.querySelector('.quote__graph-navigation-range');
  let quoteGraphNavigationRangeLineMin = document.querySelector('.quote__graph-navigation-range-line--min');
  let quoteGraphNavigationRangeLineMax = document.querySelector('.quote__graph-navigation-range-line--max');
  let allDataHistoryLength = allData.history.data.length;
  let firstDataIndex = 0;
  let lastDataIndex = allDataHistoryLength - 1;
  let updatedLabels;
  let updatedValues;
  let updatedVolume;

  quoteGraphNavigationRangeButton.forEach(btn => {
    btn.addEventListener('mousedown', (event) => {
      let shiftX = quoteGraphNavigationRange.getBoundingClientRect().left;
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
        }
      }

      function updateIndex(value, type) {
        if (type === "min") {
          return Math.round(value * allDataHistoryLength / quoteGraphNavigationRange.clientWidth)
        } else {
          return Math.round(value * allDataHistoryLength / quoteGraphNavigationRange.clientWidth - 1)
        }
      }

      function onMouseMove(event) {
        moveAt(event.pageX);
      }

      function updateGraphs(firstDataIndex, lastDataIndex) {
        updatedLabels = labels.filter((item, i) => i >= firstDataIndex && i <= lastDataIndex)
        updatedVolume = volume.filter((item, i) => i >= firstDataIndex && i <= lastDataIndex)
        updatedValues = values.filter((item, i) => i >= firstDataIndex && i <= lastDataIndex)
        
        updateGraph("line", updatedLabels, updatedValues);
        updateGraph("bar", updatedLabels, updatedVolume);
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
}