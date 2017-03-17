/**
 * Created by Caleydo Team on 31.08.2016.
 */

import {listAll, IDType} from 'phovea_core/src/idtype';
import {select} from 'd3';
import ColumnManager, {IMotherTableType, AnyColumn} from './column/ColumnManager';
import SupportView from './SupportView';
import {Range1D} from 'phovea_core/src/range';
import {EOrientation, default as AColumn} from './column/AColumn';
import MatrixFilter from './filter/MatrixFilter';
import * as d3 from 'd3';
import MatrixColumn from './column/MatrixColumn';
import FilterManager from './filter/FilterManager';
import {AVectorColumn} from './column/AVectorColumn';
import {IAnyVector} from 'phovea_core/src/vector';
import {randomId} from 'phovea_core/src/index';
import Range from 'phovea_core/src/range/Range';
import {hash} from 'phovea_core/src/index';
import {IDataType} from 'phovea_core/src/datatype';

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
    this.attachListener();
    await this.loadIdtypes();

    if(hash.has('idtype')) {
      const idtype = this.idtypes.filter((d) => d.id === hash.getProp('idtype'));
      if(idtype.length > 0) {
        this.setPrimaryIDType(idtype[0]);
        return; // exit function -> do not build start selection
      }
    }

    this.buildStartSelection(select('#startSelection'));
  }

  private async loadIdtypes() {
    // get all idtypes, filter to the valid ones and SORT by name
    this.idtypes = (await listAll())
      .filter((d) => d instanceof IDType)
      .map((d) => <IDType>d)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private buildStartSelection(elem: d3.Selection<any>) {
    // d3 binding to the dialog
    const elems = elem.select('div.btn-group[role="group"]').selectAll('div.btn-group').data(this.idtypes);
    elems.enter().append('div')
      .classed('btn-group', true)
      .attr('role', 'group')
      .html(`<button type="button" class="btn btn-default btn-lg">Artists</button>`);
    elems.select('button')
      .text((d) => d.names)
      .on('click', (idtype) => {
        hash.setProp('idtype', idtype.id);
        this.setPrimaryIDType(idtype);
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
    const supportView = new SupportView(idtype, <HTMLElement>node, this.supportView.length);

    this.supportView.push(supportView);

    this.supportView[0].on(FilterManager.EVENT_SORT_DRAGGING, (evt: any, data: AnyColumn[]) => {
      this.manager.mapFiltersAndSort(data);
    });

    // add columns if we add one or multiple datasets
    this.supportView[0].on(SupportView.EVENT_DATASETS_ADDED, (evt: any, datasets: IMotherTableType[]) => {
      // first push all the new columns ...
      const addedColumnsPromise = datasets.map((data) => {
        if (this.dataSize === undefined) {
          this.dataSize = {total: data.length, filtered: data.length};
          this.previewData(this.dataSize, idtype.id, node);
        }

        const promise = this.manager.push(data);

        if (data.desc.type === AColumn.DATATYPE.matrix) {
          const otherIdtype: IDType = this.findType(data, idtype.id);
          this.triggerMatrix();
          this.newSupportManger(data, otherIdtype);
        }

        return promise;
      });
      // ... when all columns are pushed -> sort and render them
      Promise.all(addedColumnsPromise)
        .then(() => {
          this.manager.updateSort();
        });
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


  private newSupportManger(data: IDataType, otherIdtype: IDType) {
    const node = <HTMLElement>this.buildSupportView(otherIdtype);
    const matrixSupportView = new SupportView(otherIdtype, node, this.supportView.length);
    this.supportView.push(matrixSupportView);

    const m = this.supportView[0].getMatrixData(data.desc.id);
    const matrixnode = <HTMLElement>node.querySelector(`.${otherIdtype.id}.filter-manager`);
    // d3.select(node).select(`.${otherIdtype.id}.filter-manager` );
    new MatrixFilter(m.t, matrixnode);

    this.previewData(this.dataSize, otherIdtype.id, node);

    matrixSupportView.on(SupportView.EVENT_FILTER_CHANGED, (evt: any, filter: Range1D) => {
      this.triggerMatrix(filter, matrixSupportView.id);

      this.dataSize.filtered = filter.size()[0];
      this.previewData(this.dataSize, otherIdtype.id, node);
    });
  }

  private triggerMatrix(colRange?, id?: number) {
    const matrixCol:MatrixColumn[] = <MatrixColumn[]>this.manager.columns.filter((d) => d instanceof MatrixColumn);
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

    matrixCol[uniqueMatrix - 1].updateMultiForms(null, colRange);
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
