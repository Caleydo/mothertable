/**
 * Created by Samuel Gratzl on 19.01.2017.
 */
import {AVectorFilter} from './AVectorFilter';
import {INumericalVector} from 'phovea_core/src/vector';
import {Range1D} from 'phovea_core/src/range';
import * as d3 from 'd3';


export const drag = {left: 'dragLeft', right: 'dragRight'};


interface IPosition {
  'left': number;
  'right': number;
}

interface ISVGObject {
  'left': d3.Selection<SVGElement>; right: d3.Selection<SVGElement>;
}


export default class NumberFilter extends AVectorFilter<number, INumericalVector> {


  readonly node: HTMLElement;
  private _filterDim: {width: number, height: number};
  private _numericalFilterRange: number[];
  private _toolTip: d3.Selection<SVGElement>;
  private _SVG: d3.Selection<SVGElement>;
  private _rect: ISVGObject;
  private _line: ISVGObject;
  private _textVal: ISVGObject;
  private _triangleIcon: ISVGObject;
  private _position: IPosition;

  constructor(data: INumericalVector, parent: HTMLElement) {
    super(data);
    this.node = this.build(parent);
    this._numericalFilterRange = this.data.desc.value.range;

  }


  protected build(parent: HTMLElement) {
    const node = super.build(parent);

    this.generateLabel(node, this.data.desc.name);
    this._toolTip = this.generateTooltip(node);
    this.generateDensityPlot(node);


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

    const range = this.data.desc.value.range;
    const that = this;
    const coordinates = this.computeCoordinates();
    const svgHeight = coordinates.svg.height;
    const triangleYPos = coordinates.triangle.yPos;

    const brushRectPosX = coordinates.brushRect.left;
    const brushRectPosY = coordinates.brushRect.right;
    const brushVal = range;
    const svg = this.makeSVG(node);
    const bins = await this.makeBins(svg);

    const rectLeft = this.makeBrushRect(svg, brushRectPosX - 5, brushRectPosY);
    const rectRight = this.makeBrushRect(svg, brushRectPosX, brushRectPosY);

    const lineLeft = this.makeBrushLine(svg, brushRectPosX);
    const lineRight = this.makeBrushLine(svg, brushRectPosY);

    const textleft = this.makeText(svg, 0, svgHeight);
    const textRight = this.makeText(svg, brushRectPosY, svgHeight);

    textleft.text(`${(<any>Math).floor(brushVal[0])}`);
    textRight.text(`${(<any>Math).floor(brushVal[1])}`);


    this._position = {left: brushRectPosX, right: brushRectPosY};

    const dragLeft = d3.behavior.drag()
      .on('drag', function (d, i) {
        that.updateDragging(this, drag.left);
      });

    const dragRight = d3.behavior.drag()
      .on('drag', function (d, i) {
        that.updateDragging(this, drag.right);

      });


    const triangleLeft = this.makeTriangleIcon(svg, brushRectPosX, triangleYPos, 'left');
    const triangleRight = this.makeTriangleIcon(svg, brushRectPosY, triangleYPos, 'right');
    triangleLeft.call(dragLeft);
    triangleRight.call(dragRight);

    this._rect = {'left': rectLeft, 'right': rectRight};
    this._line = {'left': lineLeft, 'right': lineRight};
    this._triangleIcon = {'left': triangleLeft, 'right': triangleRight};
    this._textVal = {'left': textleft, 'right': textRight};

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
    const colorScale = d3.scale.linear<string,number>().domain([0, d3.max(histData)]).range(['white', 'darkgrey']);

    const binsRect = svg.append('g').classed('binsEntries', true)
      .selectAll('g.bins').data(histData).enter();

    binsRect.append('rect').classed('bins', true)
      .attr('x', (d, i) => (i * cellDimension) + 5)
      .attr('width', cellDimension)
      .attr('height', cellHeight)
      .style('opacity', 1)
      .attr('fill', (d: any) => colorScale(d))
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

    return binsRect;

  }

  private makeBrushLine(svg, posX: number) {

    const coordinates = this.computeCoordinates();
    const lineYPos = coordinates.line.yPos;
    const line = svg.append('path')
      .classed('brushline', true)
      .attr('d', `M${posX} 0,L${posX} ${lineYPos}`)
      .attr('stroke', 'black');
    return line;


  }

  private makeBrushRect(svg, posX: number, width: number) {

    const cellHeight = this.filterDim.height;
    const rect = svg.append('rect')
      .attr('x', posX)
      .attr('width', width)
      .attr('height', cellHeight)
      .attr('visibility', 'hidden')
      .attr('opacity', 1)
      .attr('fill', '#666');

    return rect;

  }

  private makeText(svg, posX: number, posY: number) {

    const text = svg.append('text').classed('textVal', true)
      .attr('x', posX)
      .attr('y', posY)
      .attr('font-family', 'sans-serif')
      .attr('font-size', '12px')
      .attr('fill', 'black');

    return text;

  }

  private  makeTriangleIcon(svg, posX: number, posY: number, classname) {
    const triangleSymbol = d3.svg.symbol().type('triangle-up').size(100);
    const triangle = svg.append('path')
      .classed(classname, true)
      .attr('d', triangleSymbol)
      .attr('transform', `translate(${posX},${posY})`);
    return triangle;

  }

  private  updateDragging(dragMe, myName: string) {

    const rectLeft = this._rect.left;
    const rectRight = this._rect.right;
    const textLeft = this._textVal.left;
    const textRight = this._textVal.right;
    const lineLeft = this._line.left;
    const lineRight = this._line.right;
    const coordinates = this.computeCoordinates();
    let brushVal = this.data.desc.value.range;

    const triangleYPos = coordinates.triangle.yPos;
    const lineYPos = coordinates.line.yPos;
    const brushRectLeft = coordinates.brushRect.left;
    const brushRectRight = coordinates.brushRect.right;
    const gapBetweenTriangle = coordinates.gap;
    const axisScale = coordinates.axisScale;

    const x = (<any>d3).event.x;

    // let xpos =  Math.max(5, Math.min(this._position.right - radius, d3.event.x)))


    if (x >= brushRectLeft && x <= brushRectRight) {
      if ((this._position.right - this._position.left) < gapBetweenTriangle) {
        if (myName === drag.right && this._position.left >= brushRectLeft + 2) {
          this._position.left = this._position.left - 2;
          d3.select(dragMe.parentNode).select('.left').attr('transform', `translate(${this._position.left},${triangleYPos})`);
        } else if (myName === drag.left && this._position.right <= brushRectRight - 2) {
          this._position.right = this._position.right + 2;
          d3.select(dragMe.parentNode).select('.right').attr('transform', `translate(${this._position.right},${triangleYPos})`);
        }
      }

      if (myName === drag.left) {
        this._position.left = x;
      } else if (myName === drag.right) {

        this._position.right = x;
      }

      brushVal = [axisScale(this._position.left), axisScale(this._position.right)];
      textLeft.attr('x', this._position.left)
        .text(`${Math.floor(brushVal[0])}`);
      textRight.attr('x', this._position.right - 15).text(`${Math.floor(brushVal[1])}`);

      rectLeft.attr('x', brushRectLeft)
        .attr('width', this._position.left - brushRectLeft)
        .attr('visibility', 'visible')
        .attr('opacity', 0.8);

      rectRight.attr('x', this._position.right)
        .attr('width', brushRectRight - this._position.right)
        .attr('visibility', 'visible')
        .attr('opacity', 0.8);

      lineLeft.attr('d', `M${this._position.left} 0,L${this._position.left} ${lineYPos}`);
      lineRight.attr('d', `M${this._position.right} 0,L${this._position.right} ${lineYPos}`);
      this._numericalFilterRange = brushVal;
      console.log(this._numericalFilterRange)
      this.triggerFilterChanged();

      //  this._position.right = this._position.right + 5;
      d3.select(dragMe.parentNode).select('.left').attr('transform', `translate(${this._position.left},${triangleYPos})`);
      d3.select(dragMe.parentNode).select('.right').attr('transform', `translate(${this._position.right},${triangleYPos})`);
      return dragMe;
    }
  }


  private computeCoordinates() {

    const range = this.data.desc.value.range;
    const cellWidth = this.filterDim.width;
    const cellHeight = this.filterDim.height;

    const svg = {height: cellHeight + 25};
    const triangle = {yPos: svg.height - 15};
    const line = {yPos: cellHeight + 5};
    const brushRect = {'left': 5, 'right': cellWidth - 5};
    const gapBetweenTriangle = 20;
    const axisScale = d3.scale.linear().domain([brushRect.left, brushRect.right]).range(range);

    const coordinate = {
      'svg': svg,
      'line': line,
      'triangle': triangle,
      'brushRect': brushRect,
      'gap': gapBetweenTriangle,
      'axisScale': axisScale
    };
    return coordinate;

  }


  async filter(current: Range1D) {
    const vectorView = await(<any>this.data).filter(numericalFilter.bind(this, this._numericalFilterRange));
    const filteredRange = await vectorView.ids();
    const rangeIntersected = current.intersect(filteredRange);
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
