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

export default class MatrixFilter extends AFilter<number, INumericalMatrix> {

  readonly node: HTMLElement;
  private _filterDim: {width: number, height: number};
  private supportView: SupportView;
  private manager: ColumnManager;

  constructor(data: INumericalMatrix, parent: HTMLElement) {
    super(data);
    this.node = this.build(parent);
  }

  protected build(parent: HTMLElement) {

    const rowid = this.data.rowtype.id;
    const colid = this.data.coltype.id;
    const rowSelect = d3.select(`.${rowid}`);
    const colSelect = d3.select(`.${colid}`);
    let rowNode;
    let colNode;
    if (rowSelect[0][0] !== null) {
      rowNode = d3.select(parent).append('div')
        .classed(`${rowid}`, true)
        .append('div')
        .classed('filter', true);
    } else {
      const p = parent.ownerDocument.createElement('div');
      parent.appendChild(p);
      p.classList.add(`${rowid}`);
      const idTypeNode = document.createElement('div');
      parent.insertBefore(idTypeNode, parent.childNodes[0]);
      idTypeNode.classList.add('idType');
      idTypeNode.innerHTML = `${rowid.toLocaleUpperCase()}`;
      rowNode = d3.select(parent).append('div')
        .classed('filter', true);
    }

    if (colSelect[0][0] !== null) {
      colNode = d3.select(parent).append('div')
        .classed(`${colid}`, true).append('div')
        .classed('filter', true);
    } else {
      const p = parent.ownerDocument.createElement('div');
      parent.appendChild(p);
      p.classList.add(`${colid}`);
      const idTypeNode = document.createElement('div');
      p.appendChild(idTypeNode);
      idTypeNode.classList.add('idType');
      idTypeNode.innerHTML = `${colid.toLocaleUpperCase()}`;

    }

    colNode = d3.select(`.${colid}`);
    const node = super.build(parent);

    const lableNode = d3.select(`.${rowid}`).append('div').classed('filter', true);
    const n = <HTMLElement>lableNode.node();

    this.generateLabel(n, this.data.desc.name);
    this.generateMatrixHeatmap(lableNode, rowid);
    this.loadData(colid, colNode);


    // node.innerHTML = `<button>${this.data.desc.name}</button>`;
    // (<HTMLElement>node.querySelector('button')).addEventListener('click', () => {
    //   console.log(this.data)
    //   this.triggerFilterChanged();
    // });

    return node;
  }


  private async loadData(colid, parent) {
    const data: IDType[] = (await listAll())
      .filter((d) => d.id === colid)
      .map((d) => <IDType>d);

    this.manager = new ColumnManager(data[0], EOrientation.Horizontal, <HTMLElement>document.querySelector(`.column-manager`));
    this.supportView = new SupportView(data[0], <HTMLElement>document.querySelector(`.${colid}`));
    const colNode = d3.select(`.${colid}`).append('div').classed('filter', true);
    const n = <HTMLElement>colNode.node();
    this.generateLabel(n, this.data.desc.name);
    this.generateMatrixHeatmap(colNode, colid);
    this.supportView.on(SupportView.EVENT_DATASET_ADDED, (evt: any, data: IMotherTableType) => {
      this.manager.push(data);
    });

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

  // private generateLabel(node, idtype) {
  //
  //   const labelNode = node.append('div').classed('filterlabel', true);
  //   let name = idtype;
  //   if (name.length > 6) {
  //     name = name.slice(0, 6) + '..';
  //   }
  //   labelNode.text(`${name.substring(0, 1).toUpperCase() + name.substring(1)}`);
  // }

  private async generateMatrixHeatmap(node, idtype) {

    const a = await this.data.data();

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

    const entries = node.append('div').classed('entries', true)
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

