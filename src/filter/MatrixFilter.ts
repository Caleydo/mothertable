/**
 * Created by bikramkawan on 04/02/2017.
 */

import {INumericalMatrix} from 'phovea_core/src/matrix';
import {Range1D} from 'phovea_core/src/range';
import * as d3 from 'd3';
import AFilter from './AFilter';
import {list as listData, convertTableToVectors} from 'phovea_core/src/data';
import SupportView from '../SupportView';
import {listAll, IDType} from 'phovea_core/src/idtype';
import ColumnManager, {IMotherTableType} from '../column/ColumnManager';
import {EOrientation} from '../column/AColumn';
import {__awaiter} from "tslib";

export default class MatrixFilter extends AFilter<number, INumericalMatrix> {

  readonly node: HTMLElement;
  private _filterDim: {width: number, height: number};

  constructor(data: INumericalMatrix, parent: HTMLElement) {
    super(data);
    this.node = this.build(parent);
    this.activeFilter = false;
  }

  protected build(parent: HTMLElement) {
    const node = super.build(parent);

    const n = d3.select(node.parentElement).selectAll('.matrix');
    if (n.node() === null) {

      this.generateLabel(node, this.data.desc.name);
      this.generateRect(node);
    }
    // this.generateMatrixHeatmap(node, this.data.rowtype.id)

    // this.generateMatrixHeatmap(node, this.data.rowtype.id);
    // node.innerHTML = `<button>${this.data.desc.name}</button>`;
    // (<HTMLElement>node.querySelector('button')).addEventListener('click', () => {
    //   console.log(this.data)
    //   this.triggerFilterChanged();
    // });

    return node;
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


  private generateRect(node) {

    d3.select(node).append('div').classed('matrix', true);

  }

  private async generateMatrixHeatmap(node, idtype) {

    const a = await this.data.data();

    console.log(a, 'no transpose')
    const t = await this.data.t.data();
    console.log(t, 'trsnpose')
    const rowOrCol = idtype;
    let transpose = false;
    if (rowOrCol === this.data.rowtype.id) {
      transpose = false;
    } else if (rowOrCol === this.data.coltype.id) {
      transpose = true;
    }

    const cellHeight = this.filterDim.height;
    const avgdata = await this.calculateAvg(transpose);
    const domain = d3.extent(avgdata);
    const colorRange = ['lightgrey', 'grey'];
    const colorScale = d3.scale.linear<string,number>();
    colorScale.domain(domain).range(colorRange);

    const entries = d3.select(node).append('div').classed('entries', true)
      .style('display', 'flex')
      .style('align-items', 'flex-end')
      .style('flex-grow', 1);

    const list = entries
      .selectAll('div.matlist')
      .data(avgdata).enter();

    list.append('div')
      .attr('class', 'list')
      .style('flex-grow', 1)
      .style('height', cellHeight + 'px')
      .style('width', '100%')
      .style('background-color', (d) => colorScale(d));

  }

  private async calculateAvg(transpose) {

    let v = await this.data.data();
    if (transpose === true) {
      const t = (<any>this.data).t;
      v = await t.data();
    }

    const avg = [];
    v.forEach((d: any, i) => avg.push(d3.mean(d)));
    return avg;

  }

  async filter(current: Range1D) {

    return current;

  }
}

