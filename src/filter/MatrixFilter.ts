/**
 * Created by bikramkawan on 04/02/2017.
 */

import {INumericalMatrix} from 'phovea_core/src/matrix';
import * as d3 from 'd3';
import AFilter from './AFilter';
import {NUMERICAL_COLOR_MAP} from '../column/utils';
import DensityPlot from './DensityPlot';

export default class MatrixFilter extends AFilter<number, INumericalMatrix> {

  readonly $node: d3.Selection<any>;
  private _filterDim: {width: number, height: number};

  constructor(data: INumericalMatrix, $parent: d3.Selection<any>) {
    super(data);

    this.$node = this.build($parent);
    this.activeFilter = false;
  }

  protected build($parent: d3.Selection<any>) {
    const $li = $parent.append('li')
      .classed('filter', true)
      .classed('nodrag', true);

    const $header = $li.append('header');
    $li.append('main');

    const $toolbar = $header.append('div').classed('toolbar', true);
    this.addTrashIcon($toolbar);
    this.generateLabel($li);
    new DensityPlot(this.data, $li.select('main'), null, this.generateTooltip($li));
    //this.generateMatrixHeatmap($li.select('main'));

    return $li;
  }


  get filterDim(): {
    width: number;
    height: number
  } {
    this._filterDim = {width: 205, height: 35};
    return this._filterDim;
  }

  set filterDim(value: {
    width: number;
    height: number
  }) {
    this._filterDim = value;
  }

  private generateRect($node: d3.Selection<any>) {

    $node.append('div').classed('matrix', true);

  }


  private async generateMatrixHeatmap($node: d3.Selection<any>) {
    const cellWidth = this.filterDim.width;
    const histData = await this.getHistData();
    const cellDimension = cellWidth / histData.length;
    const colorScale = d3.scale.linear<string,number>().domain([0, cellWidth]).range(NUMERICAL_COLOR_MAP);
    const binScale = d3.scale.linear()
      .domain([0, d3.max(histData)]).range([0, this._filterDim.height]);
    const $entries = $node.append('div').classed('matrixEntries', true);

    const $list = $entries
      .selectAll('div.matrixBins')
      .data(histData).enter();

    $list.append('div')
      .attr('class', 'matrixBins')
      .attr('title', (d, i) => `${i + 1}: ${d}`)
      .style('height', (d, i) => binScale(d) + 'px')
      .style('background-color', (d, i) => colorScale(cellDimension * i));
  }

  private async getHistData() {

    const histData = await (<any>this.data).hist();
    const bins = [];
    histData.forEach((d, i) => bins.push(d));
    return bins;

  }
}

