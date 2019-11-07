import * as d3 from 'd3'

const margin = { top: 10, left: 10, right: 10, bottom: 10 }

const height = 480 - margin.top - margin.bottom

const width = 480 - margin.left - margin.right

const svg = d3
  .select('#chart-3')
  .append('svg')
  .attr('height', height + margin.top + margin.bottom)
  .attr('width', width + margin.left + margin.right)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

const radius = 200

const radiusScale = d3
  .scaleLinear()
  .domain([10, 100])
  .range([40, radius])

const angleScale = d3
  .scalePoint()
  .domain([
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sept',
    'Oct',
    'Nov',
    'Dec',
    'Blah'
  ])
  .range([0, Math.PI * 2])

const colorScale = d3
  .scaleLinear()
  .domain([60, 82])
  .range(['#5580B6', 'indianred'])

const line = d3
  .radialArea()
  .outerRadius(function(d) {
    return radiusScale(d.high_temp)
  })
  .innerRadius(function(d) {
    return radiusScale(d.low_temp)
  })
  .angle(function(d) {
    return angleScale(d.month_name)
  })

d3.csv(require('/data/all-temps.csv'))
  .then(ready)
  .catch(err => console.log('Failed on', err))

function ready(datapoints) {
  const container = svg
    .append('g')
    .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')')

  datapoints.forEach(d => {
    d.high_temp = +d.high_temp
    d.low_temp = +d.low_temp
  })

  const nested = d3
    .nest()
    .key(d => d.city)
    .entries(datapoints)

  const filtered = nested.filter(d => d.key !== 'Melbourne')

  const sorted = []
  sorted.push(filtered[0])
  sorted.push(filtered[3])
  sorted.push(filtered[4])
  sorted.push(filtered[1])
  sorted.push(filtered[2])

  container.append('path').attr('class', 'temp')

  const circleBands = [20, 30, 40, 50, 60, 70, 80, 90]
  const textBands = [30, 50, 70, 90]

  container
    .selectAll('.temp')
    .datum(sorted[0])
    .attr('d', line)
    .style('visibility', 'hidden')

  container
    .selectAll('bands')
    .data(circleBands)
    .enter()
    .append('circle')
    .attr('class', 'bands')
    .attr('fill', 'none')
    .attr('stroke', 'gray')
    .attr('cx', 0)
    .attr('cy', 0)
    .attr('r', function(d) {
      return radiusScale(d)
    })
    .lower()

  container
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('class', 'city-name')
    .attr('font-size', 30)
    .attr('font-weight', 700)
    .attr('alignment-baseline', 'middle')

  container
    .selectAll('temp-notes')
    .data(textBands)
    .enter()
    .append('text')
    .attr('class', 'temp-notes')
    .attr('x', 0)
    .attr('y', d => -radiusScale(d))
    .attr('dy', -2)
    .text(d => d + '°')
    .attr('text-anchor', 'middle')
    .attr('font-size', 8)

  function makeSVG(cityData) {
    const datapoints = cityData.values
    datapoints.push(datapoints[0])

    const meanHighTemp = d3.mean(datapoints.map(d => +d.high_temp))

    container
      .selectAll('.temp')
      .datum(datapoints)
      .transition()
      .duration(800)
      .attr('d', line)
      .attr('fill', colorScale(meanHighTemp))
      .attr('opacity', 0.75)
      .style('visibility', 'visible')

    container
      .selectAll('.city-name')
      .attr('text-anchor', 'middle')
      .text(datapoints[0].city)
  }

  for (let i = 0; i < 5; i++) {
    d3.select('#' + sorted[i].key).on('stepin', function() {
      makeSVG(sorted[i])
    })

    const datapoints = sorted[i].values
    const meanHighTemp = d3.mean(datapoints.map(d => +d.high_temp))

    d3.selectAll('.label-' + sorted[i].key)
      .style('color', 'white')
      .style('font-weight', 600)
      .style('background-color', colorScale(meanHighTemp))
  }

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

    const radius = newWidth / 3
    radiusScale.range([radius / 5, radius])

    // Update things you draw
    container.attr(
      'transform',
      'translate(' + newWidth / 2 + ',' + newHeight / 2 + ')'
    )

    container.selectAll('.city-name').attr('text-anchor', 'middle')

    container
      .selectAll('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', d => radiusScale(d))

    container.selectAll('.temp-notes').attr('y', d => -radiusScale(d))

    container
      .selectAll('path.temp')
      .transition()
      .attr('d', line)
  }

  // when resized, draw everything
  window.addEventListener('resize', render)

  // kick it all off
  render()
}
