import * as d3 from 'd3'

const margin = { top: 100, left: 50, right: 150, bottom: 30 }

const height = 700 - margin.top - margin.bottom

const width = 600 - margin.left - margin.right

const svg = d3
  .select('#chart-2')
  .append('svg')
  .attr('height', height + margin.top + margin.bottom)
  .attr('width', width + margin.left + margin.right)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

const parseTime = d3.timeParse('%B-%y')

const xPositionScale = d3.scaleLinear().range([0, width])
const yPositionScale = d3.scaleLinear().range([height, 0])

const colorScale = d3
  .scaleOrdinal()
  .range([
    '#8dd3c7',
    '#ffffb3',
    '#bebada',
    '#fb8072',
    '#80b1d3',
    '#fdb462',
    '#b3de69',
    '#fccde5',
    '#d9d9d9',
    '#bc80bd'
  ])

const hightlightRegions = [
  'Mountain',
  'Pacific',
  'West South Central',
  'South Atlantic'
]

const line = d3
  .line()
  .x(function(d) {
    return xPositionScale(d.datetime)
  })
  .y(function(d) {
    return yPositionScale(d.price)
  })

d3.csv(require('/data/housing-prices.csv'))
  .then(ready)
  .catch(err => {
    console.log(err)
  })

function ready(datapoints) {
  datapoints.forEach(d => {
    d.datetime = parseTime(d.month)
  })
  const dates = datapoints.map(d => d.datetime)
  const prices = datapoints.map(d => +d.price)

  xPositionScale.domain(d3.extent(dates))
  yPositionScale.domain(d3.extent(prices))

  const nested = d3
    .nest()
    .key(function(d) {
      return d.region
    })
    .entries(datapoints)

  // console.log(nested)
  nested.push(nested[0])

  svg
    .selectAll('path')
    .data(nested)
    .enter()
    .append('path')
    .attr('class', 'region-line')
    .classed('highlight-regions', function(d) {
      if (hightlightRegions.includes(d.key)) {
        // console.log(d.key)
        return true
      }
    })
    .attr('id', function(d) {
      return d.key.toLowerCase().replace(/[A-Z/.]/g, '')
    })
    .attr('d', function(d) {
      return line(d.values)
    })
    .attr('stroke', d => colorScale(d.key))
    .attr('stroke-width', 2)
    .attr('fill', 'none')
    .style('visibility', 'hidden')

  svg
    .selectAll('circle')
    .data(nested)
    .enter()
    .append('circle')
    .attr('class', 'region-dot')
    .classed('highlight-regions', function(d) {
      if (hightlightRegions.includes(d.key)) {
        return true
      }
    })
    .attr('id', function(d) {
      return d.key.toLowerCase().replace(/[A-Z/.]/g, '')
    })
    .attr('fill', d => colorScale(d.key))
    .attr('r', 4)
    .attr('cy', function(d) {
      return yPositionScale(d.values[0].price)
    })
    .attr('cx', function(d) {
      return xPositionScale(d.values[0].datetime)
    })
    .style('visibility', 'hidden')

  svg
    .selectAll('region-name')
    .data(nested)
    .enter()
    .append('text')
    .attr('class', 'region-name')
    .classed('highlight-regions', function(d) {
      if (hightlightRegions.includes(d.key)) {
        // console.log(d.key)
        return true
      }
    })
    .attr('id', function(d) {
      return d.key.toLowerCase().replace(/[A-Z/.]/g, '')
    })
    .attr('y', function(d) {
      return yPositionScale(d.values[0].price)
    })
    .attr('x', function(d) {
      return xPositionScale(d.values[0].datetime)
    })
    .text(function(d) {
      return null
    })
    .attr('dx', 6)
    .attr('dy', 4)
    .attr('font-size', '12')

  const rectWidth =
    xPositionScale(parseTime('February-17')) -
    xPositionScale(parseTime('November-16'))

  svg
    .append('rect')
    .attr('x', xPositionScale(parseTime('December-16')))
    .attr('y', 0)
    .attr('width', rectWidth)
    .attr('height', height)
    .attr('fill', '#C2DFFF')
    .attr('fill-opacity', 0)
    .lower()

  svg
    .append('text')
    .attr('font-size', '24')
    .attr('text-anchor', 'middle')
    .text('U.S. housing prices fall in winter')
    .attr('x', width / 2)
    .attr('y', -40)
    .attr('dx', 40)

  const xAxis = d3
    .axisBottom(xPositionScale)
    .tickFormat(d3.timeFormat('%b %y'))
    .ticks(9)
  svg
    .append('g')
    .attr('class', 'axis x-axis')
    .attr('transform', 'translate(0,' + height + ')')
    .call(xAxis)

  const yAxis = d3.axisLeft(yPositionScale)
  svg
    .append('g')
    .attr('class', 'axis y-axis')
    .call(yAxis)

  d3.select('#draw-all-lines').on('stepin', () => {
    svg
      .selectAll('.region-name')
      .text(d => d.key)
      .attr('fill', 'black')
    svg
      .selectAll('.region-dot')
      .style('visibility', 'visible')
      .attr('fill', d => colorScale(d.key))
    svg
      .selectAll('.region-line')
      .style('visibility', 'visible')
      .attr('stroke', d => colorScale(d.key))
  })
  d3.select('#us-highlight').on('stepin', function() {
    // gray it all out
    svg.selectAll('.region-line').attr('stroke', 'lightgray')
    svg.selectAll('.region-dot').attr('fill', 'lightgray')
    svg.selectAll('.region-name').attr('fill', 'lightgray')

    // // select the U.S.
    svg
      .selectAll('text#us')
      .attr('fill', 'red')
      .raise()
    svg
      .selectAll('path#us')
      .attr('stroke', 'red')
      .raise()
    svg
      .selectAll('circle#us')
      .attr('fill', 'red')
      .raise()
  })

  d3.select('#highlight-regions').on('stepin', function() {
    svg.selectAll('path.highlight-regions').attr('stroke', 'lightblue')
    svg.selectAll('text.highlight-regions').attr('fill', 'lightblue')
    svg.selectAll('circle.highlight-regions').attr('fill', 'lightblue')
  })

  d3.select('#highlight-december')
    .on('stepin', function() {
      svg
        .selectAll('rect')
        .transition()
        .duration(500)
        .ease(d3.easeQuadInOut)
        .attr('fill-opacity', 1)
    })
    .on('stepout', function() {
      svg
        .selectAll('rect')
        .transition()
        .duration(500)
        .ease(d3.easeQuadInOut)
        .attr('fill-opacity', 0)
    })

  function render() {
    const svgContainer = svg.node().closest('div')
    const svgWidth = svgContainer.offsetWidth
    // Do you want it to be full height? Pick one of the two below
    const svgHeight = height + margin.top + margin.bottom
    // const svgHeight = window.innerHeight

    const actualSvg = d3.select(svg.node().closest('svg'))
    actualSvg.attr('width', svgWidth).attr('height', svgHeight)

    const newWidth = svgWidth - margin.left - margin.right
    const newHeight = svgHeight - margin.top - margin.bottom

    // Update our scale
    xPositionScale.range([0, newWidth])
    yPositionScale.range([newHeight, 0])
    const line = d3
      .line()
      .x(d => xPositionScale(d.datetime))
      .y(d => yPositionScale(+d.price))
    const rectWidth =
      xPositionScale(parseTime('February-17')) -
      xPositionScale(parseTime('November-16'))

    // Update things you draw
    svg.selectAll('.region-line').attr('d', d => line(d.values))
    svg
      .selectAll('.region-dot')
      .attr('cy', d => yPositionScale(d.values[0].price))
      .attr('cx', d => xPositionScale(d.values[0].datetime))
    svg
      .select('rect')
      .attr('x', xPositionScale(parseTime('December-16')))
      .attr('width', rectWidth)
    svg
      .selectAll('.region-name')
      .attr('y', d => yPositionScale(d.values[0].price))
      .attr('x', d => xPositionScale(d.values[0].datetime))

    // Update axes
    svg.select('.x-axis').call(xAxis)
    svg.select('.y-axis').call(yAxis)
    d3.select('.y-axis .domain').remove()
  }

  // when resized, draw everything
  window.addEventListener('resize', render)

  // kick it all off
  render()
}
