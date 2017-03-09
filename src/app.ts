/**
 * Created by Caleydo Team on 31.08.2016.
 */

import {listAll, IDType} from 'phovea_core/src/idtype';
import {select} from 'd3';
import ColumnManager, {IMotherTableType, AnyColumn} from './column/ColumnManager';
import SupportView from './SupportView';
import {Range1D} from 'phovea_core/src/range';
import {EOrientation} from './column/AColumn';
import MatrixFilter from './filter/MatrixFilter';
import * as d3 from 'd3';
import MatrixColumn from './column/MatrixColumn';
import FilterManager from './filter/FilterManager';
import {AVectorColumn} from './column/AVectorColumn';
import {IAnyVector} from 'phovea_core/src/vector';
import {randomId} from 'phovea_core/src/index';
import Range from 'phovea_core/src/range/Range';

/**
 * The main class for the App app
 */

interface IdataSize {
  total: number;
  filtered: number;
}

export default class App {

  private readonly node: HTMLElement;


  private manager: ColumnManager;
  private supportView: SupportView[] = [];
  private idtypes: IDType[];
  private rowRange: Range;
  private dataSize: IdataSize;

  constructor(parent: HTMLElement) {
    this.node = parent;
  }

  async build() {
    await this.buildStartSelection(select('#startSelection'));
    this.attachListener();
  }

  private async buildStartSelection(elem: d3.Selection<any>) {
    // get all idtypes, filter to the valid ones and SORT by name
    const data: IDType[] = (await listAll())
      .filter((d) => d instanceof IDType)
      .map((d) => <IDType>d)
      .sort((a, b) => a.name.localeCompare(b.name));

    this.idtypes = data;
    // d3 binding to the dialog
    const elems = elem.select('div.btn-group[role="group"]').selectAll('div.btn-group').data(data);
    elems.enter().append('div')
      .classed('btn-group', true)
      .attr('role', 'group')
      .html(`<button type="button" class="btn btn-default btn-lg">Artists</button>`);
    elems.select('button')
      .text((d) => d.names)
      .on('click', (d) => {
        this.setPrimaryIDType(d);
      });
    elems.exit().remove();
  }

  private hideSelection() {//remove start selection
    const elem = <HTMLElement>this.node.querySelector('#startSelection');
    elem.style.display = 'none';
  }

  private showSelection() {
    const elem = <HTMLElement>this.node.querySelector('#startSelection');
    elem.style.display = null;
  }

  private reset() {
    this.supportView[0].destroy();
    this.manager.destroy();
    this.removePreviewData();
    this.showSelection();
  }

  private attachListener() {
    const debounce = (fn, delay) => {
      let delayed;

      return function (e) {
        clearTimeout(delayed);
        delayed = setTimeout(function () {
          fn(e);
        }, delay);
      };
    };

    window.addEventListener('resize', debounce(() => {
      if (this.manager) {
        this.manager.relayout();
      }
    }, 300));
  }

  private findType(data: IMotherTableType, currentIDType: string) {
    const coltype = data.desc.coltype;
    const rowtype = data.desc.rowtype;
    if (rowtype === currentIDType) {

      const idType = this.idtypes.filter((d) => d.id === coltype);
      return idType[0];

    } else if (coltype === currentIDType) {
      const idType = this.idtypes.filter((d) => d.id === rowtype);
      return idType[0];
    }
  }

  private primarySortCol(evt: any, sortColdata: IAnyVector) {
    this.supportView[0].primarySortColumn(sortColdata);

  }

  private setPrimaryIDType(idtype: IDType) {
    this.hideSelection();
    // create a column manager
    this.manager = new ColumnManager(idtype, EOrientation.Horizontal, <HTMLElement>this.node.querySelector('main'));
    this.manager.on(AVectorColumn.EVENT_SORTBY_COLUMN_HEADER, this.primarySortCol.bind(this));

    const node = <HTMLElement>this.buildSupportView(idtype);
    //  this.node.querySelector('section.rightPanel').appendChild(node);
    const id = randomId();
    const supportView = new SupportView(idtype, <HTMLElement>node, id);

    this.supportView.push(supportView);

    this.supportView[0].on(FilterManager.EVENT_SORT_DRAGGING, (evt: any, data: AnyColumn[]) => {
      this.manager.updateSortHierarchy(data);
    });
    // add to the columns if we add a dataset
    this.supportView[0].on(SupportView.EVENT_DATASET_ADDED, (evt: any, data: IMotherTableType) => {
      if (this.dataSize === undefined) {
        this.dataSize = {total: data.length, filtered: data.length};
        this.previewData(this.dataSize, idtype.id, node);
        this.dataSize = {total: data.length, filtered: data.length};
      }

      this.manager.push(data);
      const checkMatrixType = data.desc.type;
      if (checkMatrixType === 'matrix') {
        const otherIdtype: IDType = this.findType(data, idtype.id);
        this.triggerMatrix();
        this.newSupportManger(otherIdtype);
      }

    });


    this.supportView[0].on(SupportView.EVENT_FILTER_CHANGED, (evt: any, filter: Range) => {

      this.manager.filterData(filter);
      // this.manager.update(filter);
      this.rowRange = filter;
      this.triggerMatrix();
      this.dataSize.filtered = filter.size()[0];
      this.previewData(this.dataSize, idtype.id, node);


    });

    this.manager.on(ColumnManager.EVENT_DATA_REMOVED, (evt: any, data: IMotherTableType) => {
      const cols = this.manager.columns;
      const countSame = cols.filter((d, i) => d.data.desc.id === data.desc.id).length;
      if (countSame < 1) {
        this.supportView[0].remove(data);
      }

      if (this.manager.length === 0) {
        this.reset();
      }
    });


  }


  private buildSupportView(idtype: IDType) {

    const newdiv = document.createElement('div');
    newdiv.classList.add(`support-view-${idtype.id}`);
    newdiv.classList.add(`support-view`);
    const idName = document.createElement('h1');
    idName.classList.add('idType');
    idName.innerHTML = (idtype.id.toUpperCase());
    newdiv.appendChild(idName);
    const previewDataNode = document.createElement('div');
    previewDataNode.classList.add(`dataPreview-${idtype.id}`);
    previewDataNode.classList.add(`fuelBar`);
    newdiv.appendChild(previewDataNode);
    d3.select(previewDataNode).append('div').classed('totalData', true);
    d3.select(previewDataNode).append('div').classed('filteredData', true);
    const parent = this.node.querySelector('.rightPanel').appendChild(newdiv);
    return parent;
  }


  private newSupportManger(otherIdtype: IDType) {

    // this.newManager = new ColumnManager(otherIdtype, EOrientation.Horizontal, <HTMLElement>this.node.querySelector('main'));

    const node = <HTMLElement>this.buildSupportView(otherIdtype);
    const id: string = randomId();
    const matrixSupportView = new SupportView(otherIdtype, node, id);
    this.supportView.push(matrixSupportView);

    const m = this.supportView[0].matrixData;
    const matrixnode = <HTMLElement>node.querySelector(`.${otherIdtype.id}.filter-manager`);
    // d3.select(node).select(`.${otherIdtype.id}.filter-manager`);
    new MatrixFilter(m.t, matrixnode);

    this.previewData(this.dataSize, otherIdtype.id, node);
    matrixSupportView.on(SupportView.EVENT_FILTER_CHANGED, (evt: any, filter: Range1D) => {
      // this.manager.filterData(this.rowRange);
      this.triggerMatrix(filter, matrixSupportView.id);

      this.dataSize.filtered = filter.size()[0];
      this.previewData(this.dataSize, otherIdtype.id, node);
    });


  }

  private triggerMatrix(colRange?, id?: string) {
    const matrixCol = this.manager.columns.filter((d) => d instanceof MatrixColumn);
    const uniqueMatrix = this.supportView.findIndex((d) => d.id === id);
    if (uniqueMatrix === -1) {
      return;
    }
    if (matrixCol.length === 0) {
      return;
    }
    const indices = (<any>matrixCol[0]).data.indices;
    if (this.rowRange === undefined) {

      this.rowRange = (indices.dim(0));

    }

    if (colRange === undefined) {
      colRange = (indices.dim(1));

    }

    matrixCol[uniqueMatrix - 1].updateMatrixCol(colRange);


  }

  private previewData(dataSize: IdataSize, idtype: string, node: HTMLElement) {
    const availableWidth = parseFloat(d3.select(node).select(`.dataPreview-${idtype}`).style('width'));
    const total = (dataSize.total);
    const filtered = (dataSize.filtered) || 0;
    const totalWidth = availableWidth / total * filtered;
    const d = d3.select(node).select(`.dataPreview-${idtype}`);
    d3.select(node).select(`.dataPreview-${idtype}`).select('.totalData').style('width', `${totalWidth}px`);
    d3.select(node).select(`.dataPreview-${idtype}`).select('.filteredData').style('width', `${availableWidth - totalWidth}px`);

  }

  private  removePreviewData() {
    d3.selectAll('.rightPanel').remove();

  }

}


/**
 * Factory method to create a new app instance
 * @param parent
 * @returns {App}
 */
export function create(parent: HTMLElement) {
  return new App(parent);
}
