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
    // if (ol !== null) {
    //   parent.insertBefore(this.node, ol.nextSibling);
    // }

    this.activeFilter = false;
  }

  protected build(parent: HTMLElement) {
    const node = super.build(parent);
    const li = <HTMLElement>document.createElement('li');
    node.appendChild(li);
    li.classList.add('filter');

    const header = document.createElement('header');
    li.appendChild(header);
    const main = document.createElement('main');
    li.appendChild(main);

    const n = d3.select(main).selectAll('.matrix');
    console.log(this.data.desc.name, node, main)
    this.generateLabel(li, this.data.desc.name);
    // this.generateRect(main);
    //   }
    this.generateMatrixHeatmap(main, this.data.rowtype.id);

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
    const t = await this.data.t.data();
    const rowOrCol = idtype;
    let transpose = false;
    if (rowOrCol === this.data.rowtype.id) {
      transpose = false;
    } else if (rowOrCol === this.data.coltype.id) {
      transpose = true;
    }
    const toolTip = this.generateTooltip(node);
    const cellWidth = this.filterDim.width;
    const cellHeight = this.filterDim.height;
    const histData = await this.getHistData();
    const colorScale = d3.scale.linear<string,number>().domain([0, d3.max(histData)]).range(['white', 'darkgrey']);

    const entries = d3.select(node).append('div').classed('entries', true)
      .style('display', 'flex')
      .style('align-items', 'flex-end')
      .style('flex-grow', 1);

    const list = entries
      .selectAll('div.matlist')
      .data(histData).enter();

    list.append('div')
      .attr('class', 'list')
      .style('flex-grow', 1)
      .style('height', cellHeight + 'px')
      .style('width', '100%')
      .style('background-color', (d) => colorScale(d))
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


  }

  private async getHistData() {

    const histData = await (<any>this.data).hist();
    const bins = [];
    histData.forEach((d, i) => bins.push(d));
    return bins;

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

