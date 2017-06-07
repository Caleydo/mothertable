import * as d3 from 'd3';
import {NUMERICAL_COLOR_MAP} from '../column/utils';
import {IVector} from 'phovea_core/src/vector';
import {AVectorFilter} from './AVectorFilter';
import {INumericalVector} from 'phovea_core/src/vector';
import {IDataType} from 'phovea_core/src/datatype';
import NumberFilter from './NumberFilter';

export default class DensityPlot<DATATYPE extends IDataType> {
  readonly $node: d3.Selection<any>;
  private _filterDim: { width: number, height: number };
  private _SVG: d3.Selection<SVGElement>;

  constructor(public readonly data: DATATYPE, $node: d3.Selection<any>, private readonly filter:NumberFilter, private toolTip: d3.Selection<SVGElement>) {
    this.generateDensityPlot($node);
    this.$node = $node;
  }

  get filterDim(): { width: number; height: number } {
    this._filterDim = {width: 205, height: 35};
    return this._filterDim;
  }

  set filterDim(value: { width: number; height: number }) {
    this._filterDim = value;
  }

  private async getHistData() {

    const histData = await (<any>this.data).hist();
    const bins = [];
    histData.forEach((d, i) => bins.push(d));
    return bins;

  }

  async generateDensityPlot($node: d3.Selection<any>) {
    const c = this.computeCoordinates();
    const triangleYPos = c.triangle.yPos;
    const lineYPos = c.line.yPos;
    const brushRectPosY = c.brushRect.right;
    const margin = 5;
    const svg = this.makeSVG($node);
    await this.makeBins(svg);
    if(this.filter) {
      this.makeBrush(svg, brushRectPosY - margin * 2, c.range);

      this.makeText(svg, 0, triangleYPos + margin * 2, 'leftText').text(`${Math.floor(c.range[0])}`);
      this.makeText(svg, brushRectPosY - margin * 2, triangleYPos + margin * 2, 'rightText').text(`${Math.floor(c.range[1])}`);

      this.makeTriangleIcon(svg, margin, triangleYPos - margin, 'leftTriangle');
      this.makeTriangleIcon(svg, brushRectPosY - 5, triangleYPos - margin, 'rightTriangle');

      this.makeBrushLine(svg, margin, lineYPos, 'leftLine');
      this.makeBrushLine(svg, brushRectPosY - margin, lineYPos, 'rightLine');
    }
    const bottomLine = this.makeBrushLine(svg, margin, lineYPos - margin, 'bottomLine');
    this.$node.select('.bottomLine')
      .attr('d', `M${margin} ${lineYPos - margin},L${brushRectPosY - margin} ${lineYPos - margin}`);
  }

  private makeSVG($node: d3.Selection<any>) {
    const cellWidth = this.filterDim.width + 10;
    const cellHeight = this.filterDim.height;
    const svgHeight = cellHeight + 25;
    const svg = $node.append('svg')
      .attr('height', svgHeight + 'px')
      .attr('width', cellWidth + 'px')
      .style('margin-left', '5px');
    this._SVG = svg;
    return svg;
  }

  private async makeBins($svg: d3.Selection<any>) {

    const cellWidth = this.filterDim.width - 10;
    const cellHeight = this.filterDim.height;
    const toolTip = (this.toolTip);
    const histData = await this.getHistData();
    const cellDimension = cellWidth / histData.length;
    const colorScale = d3.scale.linear<string, number>().domain([0, cellWidth]).range(NUMERICAL_COLOR_MAP);
    const binScale = d3.scale.linear()
      .domain([0, d3.max(histData)]).range([0, this._filterDim.height]);


    const pattern = $svg.append('defs')
      .append('pattern')
      .attr({id: 'hash', width: '6', height: '5', patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(60)'});
    pattern.append('rect').classed('hatchGrey', true);
    pattern.append('rect').classed('hatchWhite', true);


    const binsBackgroundRect = $svg.append('g')
      .classed('binsEntries', true)
      .attr('transform', 'translate(5,0)')
      .selectAll('g.bins').data(histData).enter();

    binsBackgroundRect.append('rect').classed('bins', true)
      .attr('x', (d, i) => (i * cellDimension))
      .attr('y', (d, i) => cellHeight - binScale(d))
      .attr('width', cellDimension)
      .attr('height', (d, i) => binScale(d))
      .attr('fill', (d, i) => colorScale(cellDimension * i));

    const hatchLeft = $svg.append('rect').classed('hatchLeft', true)
      .attr('transform', 'translate(5,0)')
      .attr('x', (d, i) => (i * cellDimension))
      .attr('y', (d, i) => 0)
      .attr('width', 0)
      .attr('height', this._filterDim.height)
      .attr('fill', 'url(#hash)');


    const hatchRight = $svg.append('rect').classed('hatchRight', true)
      .attr('transform', 'translate(5,0)')
      .attr('x', (d, i) => (i * cellDimension))
      .attr('y', (d, i) => 0)
      .attr('width', 0)
      .attr('height', this._filterDim.height)
      .attr('fill', 'url(#hash)');

    const binsForegroundRect = $svg.append('g')
      .classed('binsEntries', true)
      .attr('transform', 'translate(5,0)')
      .attr('clip-path', 'url(#brushClipping)')
      .selectAll('g.bins').data(histData).enter();

    binsForegroundRect.append('rect').classed('bins', true)
      .attr('x', (d, i) => (i * cellDimension))
      .attr('y', (d, i) => cellHeight - binScale(d))
      .attr('width', cellDimension)
      .attr('height', (d, i) => binScale(d))
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

  private makeBrush($svg: d3.Selection<any>, width: number, range: number[]) {
    const that = this;
    const c = this.computeCoordinates();
    const scale = d3.scale.linear()
      .domain(range)
      .range([0, width]);

    const clipPathRect = $svg
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
      .extent(<[number, number]>range)
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
        that.filter.numericalFilterRange = v;
        that.filter.fireFilterChanged();
      });

    const g = $svg.append('g');
    brush(g);
    g.attr('transform', 'translate(5,0)');
    g.selectAll('rect').attr('height', this.filterDim.height);
    copyBrush(g.select('.extent'));

    return $svg;

  }

  private makeText(svg: d3.Selection<any>, posX: number, posY: number, className: string) {

    const text = svg.append('text').classed(className, true)
      .attr('x', posX)
      .attr('y', posY);
    return text;

  }

  private  makeTriangleIcon(svg: d3.Selection<any>, posX: number, posY: number, classname: string) {
    const triangleSymbol = d3.svg.symbol().type('triangle-up').size(25);
    const triangle = svg.append('path')
      .classed(classname, true)
      .attr('d', triangleSymbol)
      .attr('transform', `translate(${posX},${posY})`);
    return triangle;

  }

  private makeBrushLine(svg: d3.Selection<any>, posX: number, lineYPos: number, classname: string) {
    const line = svg.append('path')
      .classed(classname, true)
      .attr('d', `M${posX} 0,L${posX} ${lineYPos}`);
    return line;


  }

  private updateDragValues(range: number[]) {
    const c = this.computeCoordinates();
    const brushScaledVal = [c.axisScale(range[0]), c.axisScale(range[1])];
    const windowScaledVal = [c.rangeScale(brushScaledVal[0]), c.rangeScale(brushScaledVal[1])];
    const margin = 5;
    const $node = this.$node;
    $node.select('.leftTriangle')
      .attr('transform', `translate(${brushScaledVal[0]},${c.triangle.yPos - 5})`);

    $node.select('.rightTriangle')
      .attr('transform', `translate(${brushScaledVal[1] - margin},${c.triangle.yPos - margin})`);
    $node.select('.leftLine')
      .attr('d', `M${brushScaledVal[0]} 0,L${brushScaledVal[0]} ${c.triangle.yPos - margin}`);

    $node.select('.rightLine')
      .attr('d', `M${brushScaledVal[1] - margin} 0,L${brushScaledVal[1] - margin} ${c.triangle.yPos - margin}`);
    $node.select('.bottomLine')
      .attr('d', `M${brushScaledVal[0]} ${c.triangle.yPos - margin * 2},L${brushScaledVal[1] - margin} ${c.triangle.yPos - margin * 2}`);

    $node.select('.leftText')
      .attr('x', brushScaledVal[0])
      .text(`${Math.floor(windowScaledVal[0])}`);

    $node.select('.rightText')
      .attr('x', brushScaledVal[1] - margin * 2)
      .text(`${Math.floor(windowScaledVal[1])}`);


    $node.select('.hatchLeft')
      .attr('width', brushScaledVal[0] - margin);

    $node.select('.hatchRight')
      .attr('x', brushScaledVal[1] - margin * 2)
      .attr('width', c.windowSize[1] - brushScaledVal[1]);


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
}
