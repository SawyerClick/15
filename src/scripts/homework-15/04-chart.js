import * as d3 from 'd3'

const margin = { top: 20, left: 25, right: 0, bottom: 70 }

const height = 600 - margin.top - margin.bottom
const width = 800 - margin.left - margin.right

const svg = d3
  .select('#chart-4')
  .append('svg')
  .attr('height', height + margin.top + margin.bottom)
  .attr('width', width + margin.left + margin.right)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

const parseTime = d3.timeParse('%Y-%m-%d')

const chartDimensions = { height: 300, width: 100 }

const yPositionScaleMicro = d3
  .scaleLinear()
  .domain([-200, 200])
  .range([0, chartDimensions.height])

const xPositionScaleMicro = d3
  .scaleLinear()
  .domain([parseTime('2004-01-01'), parseTime('2014-04-01')])
  .range([0, chartDimensions.width])

const yPositionScaleMacro = d3
  .scaleLinear()
  .domain([-60, 130])
  .range([height, 0])

const xPositionScaleMacro = d3
  .scaleLinear()
  .domain([20, 97])
  .range([chartDimensions.width / 2, width - chartDimensions.width / 2])

const colorScale = d3
  .scaleThreshold()
  .domain([-15, -5, 10, 25])
  .range(['#c94a38', '#e67950', '#b2d16d', '#7cb564', '#479050'])

const line = d3
  .line()
  .x(d => xPositionScaleMicro(d.date))
  .y(d => yPositionScaleMicro(d.pct_change))

const wagesStore = d3.map()

Promise.all([
  d3.csv(require('/data/ces.csv')),
  d3.csv(require('/data/wages.csv'))
])
  .then(ready)
  .catch(err => console.log('Failed on', err))

function ready([ces, wages]) {
  wages.forEach(d => {
    const wages = parseFloat(d['2006-03-01']) + parseFloat(d['2014-04-01'])
    wagesStore.set(d.seriesid, wages)
  })

  ces.forEach(function(d) {
    d.change_since_recession =
      ((d['2014-01-01'] - d['2007-07-01']) / d['2007-07-01']) * 100
    d.wages = +wagesStore.get(d.cescode)
  })

  svg
    .selectAll('.chart')
    .data(ces)
    .enter()
    .append('g')
    .attr('class', 'chart')
    .classed('highlight-group-1', d => {
      const wanted = [
        'Electronic shopping and electronic auctions',
        'Land subdivision',
        'Nail salons',
        'Book stores and news dealers',
        'Other information servies'
      ]
      return wanted.indexOf(d.industry) !== -1
    })
    .attr('transform', d => {
      const xTrans = xPositionScaleMacro(d.wages)
      let yTrans = yPositionScaleMacro(d.change_since_recession)
      yTrans = yPositionScaleMacro(0)
      return `translate(${xTrans},${yTrans})`
    })
    .each(function(d) {
      const group = d3.select(this)

      const dataColumns = Object.keys(d).filter(d => d[0] === '2')
      const datapoints = dataColumns.map(colName => {
        return {
          name: colName,
          date: parseTime(colName),
          jobs: +d[colName]
        }
      })
      // Find out the percent change from the last one
      const first = datapoints[0]
      datapoints.forEach(d => {
        d.pct_change = ((first.jobs - d.jobs) / first.jobs) * 100
      })

      const median = d3.median(datapoints, d => d.pct_change)
      const centerGroup = group.append('g').attr('transform', () => {
        const x = chartDimensions.width / 2
        const y = yPositionScaleMicro(median)
        return `translate(-${x},-${y})`
      })

      group
        .append('text')
        .text(d.industry)
        .attr('text-anchor', 'middle')
        .attr('baseline-alignment', 'middle')
        .attr('class', 'highlight-text')
        .attr('font-size', 12)
        .attr('visibility', 'hidden')
        .style(
          'text-shadow',
          '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff'
        )

      centerGroup
        .append('path')
        .datum(datapoints)
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke-width', 2)
        .attr('stroke', colorScale(d.change_since_recession))
    })
    .on('mouseout', function(d) {
      d3.select(this)
        .select('path')
        .attr('stroke', colorScale(d.change_since_recession))
    })
    .on('mouseover', function(d) {
      d3.select(this)
        .raise()
        .select('path')
        .attr('stroke', 'black')
      // You should probably also update the content of your hover!

      d3.select('#info')
        .style('display', 'block')
        .style('top', d3.event.pageY + 'px')
        .style('left', d3.event.pageX + 'px')
        .html(d.industry)
    })

  svg
    .append('line')
    .attr('class', 'middle-line')
    .attr('x1', 0)
    .attr('y1', yPositionScaleMacro(0))
    .attr('x2', width)
    .attr('y2', yPositionScaleMacro(0))
    .attr('stroke', 'lightgray')
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '5 3')
    .lower()

  svg
    .append('text')
    .text('Jobs since recession')
    .attr('class', 'left-text')
    .attr('transform', `translate(0,${yPositionScaleMacro(0)}) rotate(-90)`)
    .attr('text-anchor', 'middle')
    .attr('font-size', 13)
    .attr('font-weight', 'bold')
    .attr('dy', -15)

  svg
    .append('text')
    .text('⟵ Decreased')
    .attr('class', 'left-text')
    .attr('transform', `translate(0,${yPositionScaleMacro(0)}) rotate(-90)`)
    .attr('text-anchor', 'middle')
    .attr('font-size', 13)
    .attr('font-weight', 'bold')
    .attr('dy', -15)
    .attr('dx', -140)

  svg
    .append('text')
    .text('Increased ⟶')
    .attr('class', 'left-text')
    .attr('transform', `translate(0,${yPositionScaleMacro(0)}) rotate(-90)`)
    .attr('text-anchor', 'middle')
    .attr('font-size', 13)
    .attr('font-weight', 'bold')
    .attr('dy', -15)
    .attr('dx', 140)

  svg
    .append('text')
    .text('Wages since recession')
    .attr('class', 'bottom-text')
    .attr('transform', `translate(${width / 2},${height})`)
    .attr('text-anchor', 'middle')
    .attr('font-size', 13)
    .attr('font-weight', 'bold')
    .attr('dy', 40)

  svg
    .append('text')
    .text('⟵ Decreased')
    .attr('class', 'bottom-text')
    .attr('transform', `translate(${width / 2},${height})`)
    .attr('text-anchor', 'middle')
    .attr('font-size', 13)
    .attr('font-weight', 'bold')
    .attr('dy', 40)
    .attr('dx', -140)

  svg
    .append('text')
    .text('Increased ⟶')
    .attr('class', 'bottom-text')
    .attr('transform', `translate(${width / 2},${height})`)
    .attr('text-anchor', 'middle')
    .attr('font-size', 13)
    .attr('font-weight', 'bold')
    .attr('dy', 40)
    .attr('dx', 140)

  d3.select('#step-centered').on('stepin', () => {
    svg
      .selectAll('.chart')
      .transition()
      .attr('transform', d => {
        const xTrans = xPositionScaleMacro(d.wages)
        const yTrans = yPositionScaleMacro(0)
        return `translate(${xTrans},${yTrans})`
      })
  })

  d3.select('#step-jobs').on('stepin', () => {
    svg.selectAll('.chart .highlight-text').attr('visibility', 'hidden')
    svg.selectAll('.chart').attr('opacity', 1)

    svg
      .selectAll('.chart')
      .transition()
      .attr('transform', d => {
        const xTrans = xPositionScaleMacro(d.wages)
        const yTrans = yPositionScaleMacro(d.change_since_recession)
        return `translate(${xTrans},${yTrans})`
      })
  })

  d3.select('#step-highlight').on('stepin', () => {
    svg.selectAll('.chart').attr('opacity', 0.25)
    svg.selectAll('.chart.highlight-group-1 text').attr('visibility', 'visible')
    svg
      .selectAll('.chart.highlight-group-1')
      .attr('opacity', 1)
      .raise()
  })

  function render() {
    // Calculate height/width
    const screenWidth = svg.node().parentNode.parentNode.offsetWidth
    const screenHeight = window.innerHeight
    const newWidth = screenWidth - margin.left - margin.right
    const newHeight = screenHeight - margin.top - margin.bottom

    // Update your SVG
    const actualSvg = d3.select(svg.node().parentNode)
    actualSvg
      .attr('height', newHeight + margin.top + margin.bottom)
      .attr('width', newWidth + margin.left + margin.right)

    // Update scales (depends on your scales)
    yPositionScaleMicro.range([0, chartDimensions.height])
    xPositionScaleMicro.range([0, chartDimensions.width])
    yPositionScaleMacro.range([newHeight, 0])
    xPositionScaleMacro.range([
      chartDimensions.width / 2,
      newWidth - chartDimensions.width / 2
    ])

    // Reposition/redraw your elements
    svg
      .selectAll('.chart')
      .transition()
      .attr('transform', d => {
        const xTrans = xPositionScaleMacro(d.wages)
        let yTrans = yPositionScaleMacro(d.change_since_recession)
        yTrans = yPositionScaleMacro(0)
        return `translate(${xTrans},${yTrans})`
      })

    svg
      .selectAll('.bottom-text')
      .transition()
      .attr('transform', `translate(${newWidth / 2},${newHeight})`)

    svg
      .selectAll('.left-text')
      .transition()
      .attr('transform', `translate(0,${yPositionScaleMacro(0)}) rotate(-90)`)

    svg
      .selectAll('.middle-line')
      .transition()
      .attr('x1', 0)
      .attr('y1', yPositionScaleMacro(0))
      .attr('x2', width)
      .attr('y2', yPositionScaleMacro(0))

    // Update axes if necessary
  }

  window.addEventListener('resize', render)
  render()
}
