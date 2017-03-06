/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

import {AVectorFilter} from './AVectorFilter';
import {INumericalVector} from 'phovea_core/src/vector';
import {Range1D} from 'phovea_core/src/range';
import * as d3 from 'd3';


export default class NumberFilter extends AVectorFilter<number, INumericalVector> {

  static readonly COLORS = ['#fff5f0', '#67000d'];

  readonly node: HTMLElement;
  private _filterDim: {width: number, height: number};
  private _numericalFilterRange: number[];
  private _toolTip: d3.Selection<SVGElement>;
  private _SVG: d3.Selection<SVGElement>;

  constructor(data: INumericalVector, parent: HTMLElement) {
    super(data);
    this.node = this.build(parent);
    this._numericalFilterRange = this.data.desc.value.range;

  }


  protected build(parent: HTMLElement) {
    const node = super.build(parent);

    this.generateLabel(node, this.data.desc.name);
    this._toolTip = this.generateTooltip(node);
    this.generateDensityPlot(<HTMLElement>node.querySelector('main'));


    // node.innerHTML = `<button>${this.data.desc.name}</button>`;
    // console.log('hi');
    // (<HTMLElement>node.querySelector('button')).addEventListener('click', () => {
    //
    //   this.triggerFilterChanged();
    // });

    return node;
  }

  get filterDim(): {width: number; height: number} {
    this._filterDim = {width: 205, height: 35};
    return this._filterDim;
  }

  set filterDim(value: {width: number; height: number}) {
    this._filterDim = value;
  }


  private async getHistData() {

    const histData = await (<any>this.data).hist();
    const bins = [];
    histData.forEach((d, i) => bins.push(d));
    return bins;

  }

  private async generateDensityPlot(node: HTMLElement) {
    const c = this.computeCoordinates();
    const svgHeight = c.svg.height;
    const triangleYPos = c.triangle.yPos;

    const brushRectPosX = c.brushRect.left;
    const brushRectPosY = c.brushRect.right;
    const svg = this.makeSVG(node);
    await this.makeBins(svg);
    this.makeBrush(svg, brushRectPosY - 10, c.range);

    this.makeText(svg, 0, triangleYPos, 'leftText').text(`${Math.floor(c.range[0])}`);
    this.makeText(svg, brushRectPosY - 10, triangleYPos, 'rightText').text(`${Math.floor(c.range[1])}`);

    //  this.makeTriangleIcon(svg, brushRectPosX, triangleYPos, 'left');
    // this.makeTriangleIcon(svg, brushRectPosY, triangleYPos, 'right');


  }

  private makeSVG(node: HTMLElement) {
    const cellWidth = this.filterDim.width + 10;
    const cellHeight = this.filterDim.height;
    const svgHeight = cellHeight + 25;
    const svg = d3.select(node).append('svg')
      .attr('height', svgHeight + 'px')
      .attr('width', cellWidth + 'px')
      .style('margin-left', '5px');
    this._SVG = svg;
    return svg;
  }

  private async makeBins(svg) {

    const cellWidth = this.filterDim.width - 10;
    const cellHeight = this.filterDim.height;
    const toolTip = (this._toolTip);
    const histData = await this.getHistData();
    const cellDimension = cellWidth / histData.length;
    const colorScale = d3.scale.linear<string,number>().domain([0, cellWidth]).range(NumberFilter.COLORS);
    const binScale = d3.scale.linear()
      .domain([0, d3.max(histData)]).range([0, this._filterDim.height]);


    const binsBackgroundRect = svg.append('g')
      .classed('binsEntries', true)
      .attr('transform', 'translate(5,0)')
      .selectAll('g.bins').data(histData).enter();

    binsBackgroundRect.append('rect').classed('bins', true)
      .attr('x', (d, i) => (i * cellDimension))
      .attr('y', (d, i) => cellHeight - binScale(d))
      .attr('width', cellDimension)
      .attr('height', (d, i) => binScale(d))
      .style('opacity', 1)
      .attr('stroke', 'grey')
      .attr('stroke-width', 0.5)
      .attr('fill', 'lightgrey');

    const binsForegroundRect = svg.append('g')
      .classed('binsEntries', true)
      .attr('transform', 'translate(5,0)')
      .attr('clip-path', 'url(#brushClipping)')
      .selectAll('g.bins').data(histData).enter();

    binsForegroundRect.append('rect').classed('bins', true)
      .attr('x', (d, i) => (i * cellDimension))
      .attr('y', (d, i) => cellHeight - binScale(d))
      .attr('width', cellDimension)
      .attr('height', (d, i) => binScale(d))
      .style('opacity', 1)
      .attr('stroke', 'grey')
      .attr('stroke-width', 0.5)
      .attr('fill', (d, i) => colorScale(cellDimension * i))
      .on('mouseover', function (d, i) {
        toolTip.transition()
          .duration(200)
          .style('opacity', 1);
        toolTip.html(`Bin:${i + 1}, Entries: ${d}`)
          .style('left', ((<any>d3).event.pageX) + 'px')
          .style('top', ((<any>d3).event.pageY - 10) + 'px');
      })
      .on('mouseout', function (d) {
        toolTip.transition()
          .duration(500)
          .style('opacity', 0);
      });

    return binsForegroundRect;

  }

  private makeBrush(svg, width, range) {
    const that = this;
    const c = this.computeCoordinates();
    const scale = d3.scale.linear()
      .domain(range)
      .range([0, width]);

    const clipPathRect = svg
      .append('clipPath')
      .attr('id', 'brushClipping')
      .append('rect');

    const copyBrush = function (extent) {
      clipPathRect.attr({
        x: extent.attr('x'),
        width: extent.attr('width'),
        height: extent.attr('height')
      });
    };

    const brush = d3.svg.brush()
      .x(scale)
      .extent(range)
      .on('brushstart', function () {
        copyBrush(d3.select(this).select('.extent'));
      })
      .on('brush', function () {
        const v: any = brush.extent();
        that.updateDragValues(v);
        copyBrush(d3.select(this).select('.extent'));
      })
      .on('brushend', function () {
        copyBrush(d3.select(this).select('.extent'));
        const v: any = brush.extent();
        that.updateDragValues(v);
        that._numericalFilterRange = v;
        that.triggerFilterChanged();
      });

    const g = svg.append('g');
    brush(g);
    g.attr('transform', 'translate(5,0)');
    g.selectAll('rect').attr('height', this.filterDim.height);
    copyBrush(g.select('.extent'));

    return svg;

  }

  private makeText(svg, posX: number, posY: number, className) {

    const text = svg.append('text').classed(`${className}`, true)
      .attr('x', posX)
      .attr('y', posY)
      .attr('font-family', 'sans-serif')
      .attr('font-size', '12px')
      .attr('fill', 'black');

    return text;

  }

  private  makeTriangleIcon(svg, posX: number, posY: number, classname) {
    const triangleSymbol = d3.svg.symbol().type('triangle-up').size(50);
    const triangle = svg.append('path')
      .classed(classname, true)
      .attr('d', triangleSymbol)
      .attr('transform', `translate(${posX},${posY})`);
    return triangle;

  }


  private updateDragValues(range: number[]) {
    const c = this.computeCoordinates();
    const brushScaledVal = [c.axisScale(range[0]), c.axisScale(range[1])];
    const windowScaledVal = [c.rangeScale(brushScaledVal[0]), c.rangeScale(brushScaledVal[1])];

    d3.select(this.node).select('.left')
      .attr('transform', `translate(${brushScaledVal[0]},${c.triangle.yPos})`);

    d3.select(this.node).select('.right')
      .attr('transform', `translate(${brushScaledVal[1]},${c.triangle.yPos})`);

    d3.select(this.node).select('.leftText')
      .attr('x', brushScaledVal[0])
      .text(`${Math.floor(windowScaledVal[0])}`);

    d3.select(this.node).select('.rightText')
      .attr('x', brushScaledVal[1] - 10)
      .text(`${Math.floor(windowScaledVal[1])}`);

  }

  private computeCoordinates() {
    const range = this.data.desc.value.range;
    const cellWidth = this.filterDim.width;
    const cellHeight = this.filterDim.height;
    const windowSize = [0, this.filterDim.width];
    const svg = {height: cellHeight + 25};
    const triangle = {yPos: svg.height - 15};
    const line = {yPos: cellHeight + 5};
    const brushRect = {'left': 5, 'right': cellWidth};
    const gapBetweenTriangle = 20;
    const axisScale = d3.scale.linear().domain(range).range([brushRect.left, brushRect.right]);
    const rangeScale = d3.scale.linear().domain([brushRect.left, brushRect.right]).range(range);

    const coordinate = {
      'svg': svg,
      'line': line,
      'triangle': triangle,
      'brushRect': brushRect,
      'gap': gapBetweenTriangle,
      'axisScale': axisScale,
      'range': range,
      'windowSize': windowSize,
      'rangeScale': rangeScale
    };
    return coordinate;

  }


  async filter(current: Range1D) {
    const dataRange = this.data.desc.value.range;
    let filteredRange = await <any>this.data.ids();
    if (Math.round(this._numericalFilterRange[0]) === dataRange[0] && Math.round(this._numericalFilterRange[1]) === dataRange[1]) {

      filteredRange = await this.data.ids();
    } else {
      const vectorView = await(<any>this.data).filter(numericalFilter.bind(this, this._numericalFilterRange));
      filteredRange = await vectorView.ids();
    }
    // const vectorView = await(<any>this.data).filter(numericalFilter.bind(this, this._numericalFilterRange));
    //filteredRange = await vectorView.ids();
    const rangeIntersected = current.intersect(filteredRange);
    const fullRange = (await this.data.ids()).size();
    const vectorRange = filteredRange.size();
    this.activeFilter = this.checkFilterApplied(fullRange[0], vectorRange[0]);
    // console.log('r=', (<any>rangeIntersected).dim(0).asList(), 'f=', (<any>filteredRange).dim(0).asList());
    return rangeIntersected;
  }
}

function numericalFilter(numRange, value, index) {
  if (value >= numRange[0] && value <= numRange[1]) {
    return value;
  } else {
    return;
  }

}

