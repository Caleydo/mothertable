/**
 * Created by Samuel Gratzl on 19.01.2017.
 */
import {AVectorFilter} from './AVectorFilter';
import {INumericalVector} from 'phovea_core/src/vector';
import {Range1D} from 'phovea_core/src/range';
import * as d3 from 'd3';


export default class NumberFilter extends AVectorFilter<number, INumericalVector> {


  readonly node: HTMLElement;
  private _filterDim: {width: number, height: number};
  private _histData;
  private _toolTip;

  constructor(data: INumericalVector, parent: HTMLElement) {
    super(data);
    this.node = this.build(parent);

  }


  protected build(parent: HTMLElement) {
    const node = super.build(parent);

    this.generateLabel(node);
    this.generateTooltip(node);
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

  get toolTip() {
    return this._toolTip;
  }

  set toolTip(value) {
    this._toolTip = value;
  }


  private generateLabel(node) {

    const labelNode = d3.select(node).append('div').classed('filterlabel', true);
    labelNode.text(`Label: ${this.data.desc.name}`);
  }

  private generateTooltip(node) {
    const tooltipDiv = d3.select(node).append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);

    return tooltipDiv;
  }

  private async getHistData() {

    const histData = await (<any>this.data).hist();

    const bins = [];
    histData.forEach((d, i) => bins.push(d));


    return bins;

  }

  private async generateDensityPlot(node) {


    const cellWidth = this.filterDim.width;
    const cellHeight = this.filterDim.height;
    const range = this.data.desc.value.range;
    const histData = await this.getHistData();
    const svgHeight = cellHeight + 25;
    const arrowYPos = svgHeight - 15;
    const lineYPos = cellHeight + 5;
    let iconAPos = 5;
    let iconBPos = cellWidth - 5;
    const brushWindowX = 5;
    const brushWindowY = cellWidth - 5;
    const gapBetweenTriangle = 20;

    const svg = d3.select(node).append('svg')
      .attr('height', svgHeight + 'px')
      .attr('width', this.filterDim.width + 'px')
      .style('margin-left', '5px');


    const toolTip = (this.generateTooltip(node));

    const cellDimension = cellWidth / histData.length;
    const colorScale = d3.scale.linear<string,number>().domain([0, d3.max(histData)]).range(['white', 'darkgrey']);
    const binsRect = svg.append('g').classed('binsEntries', true)
      .selectAll('g.bins').data(histData).enter();


    binsRect.append('rect').classed('bins', true)
      .attr('x', (d, i) => i * cellDimension)
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


    const leftRectBrush = svg.append('rect')
      .attr('x', brushWindowX)
      .attr('width', brushWindowY)
      .attr('height', cellHeight)
      .attr('visibility', 'hidden')
      .attr('opacity', 1)
      .attr('fill', '#666');

    const rightRectBrush = svg.append('rect')
      .attr('x', brushWindowX)
      .attr('width', brushWindowY)
      .attr('height', cellHeight)
      .attr('visibility', 'hidden')
      .attr('opacity', 0.2)
      .attr('fill', '#666');

    const lineA = svg.append('path')
      .classed('brushline', true)
      .attr('d', `M${iconAPos} 0,L${iconAPos} ${lineYPos}`)
      .attr('stroke', 'black');

    const lineB = svg.append('path')
      .classed('brushline', true)
      .attr('d', `M${iconBPos} 0,L${iconBPos} ${lineYPos}`)
      .attr('stroke', 'black');


    const axisScale = d3.scale.linear().domain([brushWindowX, brushWindowY]).range(range);

    const textA = svg.append('text').classed('leftVal', true)
      .attr('x', 0)
      .attr('y', svgHeight)
      .attr('font-family', 'sans-serif')
      .attr('font-size', '12px')
      .attr('fill', 'black');
    const textB = svg.append('text').classed('rightVal', true)
      .attr('x', brushWindowY)
      .attr('y', svgHeight)
      .attr('font-family', 'sans-serif')
      .attr('font-size', '10px')
      .attr('fill', 'black');

    let brushVal = range;

    const dragA = d3.behavior.drag()
      .on('drag', function (d, i) {
        const x = (<any>d3).event.x;

        if (x >= brushWindowX && x <= brushWindowY && (iconBPos - iconAPos) > gapBetweenTriangle) {
          iconAPos = x;
          brushVal = [axisScale(iconAPos), axisScale(iconBPos)];
          textA.attr('x', iconAPos)
            .text(`${Math.floor(brushVal[0])}`);
          textB.attr('x', iconBPos).text(`${Math.floor(brushVal[1])}`);

          leftRectBrush.attr('width', iconAPos)
            .attr('visibility', 'visible')
            .attr('opacity', 0.8);

          //  console.log(iconBPos,brushWindowY - iconBPos,'Arect')
          rightRectBrush.attr('x', iconBPos)
            .attr('width', brushWindowY - iconBPos)
            .attr('visibility', 'visible')
            .attr('opacity', 0.8);

          lineA.attr('d', `M${iconAPos} 0,L${iconAPos} ${lineYPos}`);
          lineB.attr('d', `M${iconBPos} 0,L${iconBPos} ${lineYPos}`);
          // console.log(iconAPos, iconBPos,'dragA')
          d3.select(this).attr('transform', `translate(${iconAPos},${arrowYPos})`);

        }
      });

    const dragB = d3.behavior.drag()
      .on('drag', function (d, i) {
        const x = (<any>d3).event.x;

        if (x >= brushWindowX && x <= brushWindowY && (iconBPos - iconAPos) > gapBetweenTriangle) {
          iconBPos = x;
          brushVal = [axisScale(iconAPos), axisScale(iconBPos)];
          textA.attr('x', iconAPos)
            .text(`${Math.floor(brushVal[0])}`);
          textB.attr('x', iconBPos).text(`${Math.floor(brushVal[1])}`);


          leftRectBrush.attr('width', iconAPos)
            .attr('visibility', 'visible')
            .attr('opacity', 0.8);

          rightRectBrush.attr('x', iconBPos)
            .attr('width', brushWindowY - iconBPos)
            .attr('visibility', 'visible')
            .attr('opacity', 0.8);

          lineA.attr('d', `M${iconAPos} 0,L${iconAPos} ${lineYPos}`);
          lineB.attr('d', `M${iconBPos} 0,L${iconBPos} ${lineYPos}`);

          d3.select(this).attr('transform', `translate(${iconBPos},${arrowYPos})`);
        }
      });


    const triangleSymbol = d3.svg.symbol().type('triangle-up').size(100);
    const iconA = svg.append('path')
      .classed('draggable', true)
      .attr('d', triangleSymbol)
      .attr('transform', `translate(${brushWindowX},${arrowYPos})`)
      .call(dragA);

    const iconB = svg.append('path')
      .attr('d', triangleSymbol)
      .attr('transform', `translate(${brushWindowY},${arrowYPos})`)
      .call(dragB);

    textA.text(`${(<any>Math).floor(brushVal[0])}`);
    textB.text(`${(<any>Math).floor(brushVal[1])}`);


    //const cellDimension = this._filterDim.width / binSize.length;

  }


  async filter(current: Range1D) {
    // TODO
    return current;
  }
}
