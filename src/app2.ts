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
/**
 * The main class for the App app
 */

export default class App {

  private readonly node: HTMLElement;


  private manager: ColumnManager;
  private supportView: SupportView;
  private idtypes: IDType[];
  private rowRange: Range1D;
  private colRange: Range1D;
  private newSupportView: SupportView;
  private dataSize;

  constructor(parent: HTMLElement) {
    this.node = parent;
  }

  async build() {
    await this.buildStartSelection(select('#startSelection'));

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
    this.supportView.destroy();
    this.manager.destroy();
    this.removePreviewData();
    this.showSelection();
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
    this.supportView.primarySortColumn(sortColdata);

  }

  private setPrimaryIDType(idtype: IDType) {
    this.hideSelection();
    // create a column manager
    this.manager = new ColumnManager(idtype, EOrientation.Horizontal, <HTMLElement>this.node.querySelector('main'));
    this.manager.on(AVectorColumn.EVENT_PRIMARY_SORT_COLUMN, this.primarySortCol.bind(this));


    const newdiv = document.createElement('div');
    newdiv.classList.add(`support-view-${idtype.id}`);
    const idName = document.createElement('div');
    idName.classList.add('idType');
    idName.innerHTML = (idtype.id.toUpperCase());
    newdiv.appendChild(idName);
    const previewDataNode = document.createElement('div');
    previewDataNode.classList.add(`dataPreview-${idtype.id}`);
    newdiv.appendChild(previewDataNode);


    this.node.querySelector('section.rightPanel').appendChild(newdiv);

    d3.select(previewDataNode).style('display', 'flex').append('div').classed('totalData', true);
    d3.select(previewDataNode).append('div').classed('filteredData', true);


    this.supportView = new SupportView(idtype, <HTMLElement>this.node.querySelector(`.support-view-${idtype.id}`));

    this.supportView.on(FilterManager.EVENT_SORT_DRAGGING, (evt: any, data: AnyColumn[]) => {
      this.manager.updateSortHierarchy(data);
    });
    // add to the columns if we add a dataset
    this.supportView.on(SupportView.EVENT_DATASET_ADDED, (evt: any, data: IMotherTableType) => {
      if (this.dataSize === undefined) {
        this.dataSize = {total: (<any>data).indices.size(), filtered: (<any>data).indices.size()};
        this.previewData(this.dataSize, idtype.id);
      }

      this.manager.push(data);
      const checkMatrixType = data.desc.type;
      if (checkMatrixType === 'matrix' && this.newSupportView === undefined || this.newSupportView === null) {
        const otherIdtype: IDType = this.findType(data, idtype.id);
        this.triggerMatrix();
        this.newSupportManger(otherIdtype);
      }

    });


    this.supportView.on(SupportView.EVENT_FILTER_CHANGED, (evt: any, filter: Range1D) => {
      this.manager.filterData(filter);
      // this.manager.update(filter);

      this.rowRange = filter;
      this.triggerMatrix();
      this.dataSize.filtered = filter.size();
      this.previewData(this.dataSize, idtype.id);

    });

    this.manager.on(ColumnManager.EVENT_DATA_REMOVED, (evt: any, data: IMotherTableType) => {
      const cols = this.manager.columns;
      const countSame = cols.filter((d, i) => d.data.desc.id === data.desc.id).length;
      if (countSame < 1) {
        this.supportView.remove(data);
      }

      if (this.manager.length === 0) {
        this.reset();
      }
    });
  }


  private newSupportManger(otherIdtype: IDType) {

    // this.newManager = new ColumnManager(otherIdtype, EOrientation.Horizontal, <HTMLElement>this.node.querySelector('main'));

    const newdiv = document.createElement('div');
    newdiv.classList.add(`support-view-${otherIdtype.id}`);
    const idName = document.createElement('div');
    idName.classList.add('idType');
    idName.innerHTML = (otherIdtype.id.toUpperCase());
    newdiv.appendChild(idName);
    const previewDataNode = document.createElement('div');
    previewDataNode.classList.add(`dataPreview-${otherIdtype.id}`);
    newdiv.appendChild(previewDataNode);
    this.node.querySelector('section.rightPanel').appendChild(newdiv);

    d3.select(previewDataNode).style('display', 'flex').append('div').classed('totalData', true);
    d3.select(previewDataNode).append('div').classed('filteredData', true);

    this.newSupportView = new SupportView(otherIdtype, <HTMLElement>document.querySelector(`.support-view-${otherIdtype.id}`));
    const m = this.supportView.matrixData;
    const node = d3.select(`.${otherIdtype.id}.filter-manager`).append('div').classed('filter', true);
    new MatrixFilter(m.t, <HTMLElement>node.node());

    this.previewData(this.dataSize, otherIdtype.id);
    this.newSupportView.on(SupportView.EVENT_FILTER_CHANGED, (evt: any, filter: Range1D) => {
      this.colRange = filter;
      this.triggerMatrix();

      this.dataSize.filtered = filter.size();
      this.previewData(this.dataSize, otherIdtype.id);
    });


  }

  private triggerMatrix() {
    const matrixCol = this.manager.columns.filter((d) => d instanceof MatrixColumn);
    if (matrixCol.length === 0) {
      return;
    }
    const indices = (<any>matrixCol[0]).data.indices;
    if (this.rowRange === undefined) {

      this.rowRange = (indices.dim(0));

    }

    if (this.colRange === undefined) {
      this.colRange = (indices.dim(1));

    }
    // console.log(this.colRange)

    matrixCol.forEach((col: MatrixColumn) => {
      col.updateRows(this.rowRange);
      col.updateCols(this.colRange);
      col.updateMatrix(this.rowRange, this.colRange);
    });

  }

  private previewData(dataSize, idtype) {
    const availableWidth = parseFloat(d3.select(`.dataPreview-${idtype}`).style('width'));
    const total = (dataSize.total)[0];
    const filtered = (dataSize.filtered)[0] || 0;
    const totalWidth = availableWidth / total * filtered;
    const d = d3.select(`.dataPreview-${idtype}`);
    d.style('height', '10px');
    d3.select(`.dataPreview-${idtype}`).select('.totalData').style('width', `${totalWidth}px`);
    d3.select(`.dataPreview-${idtype}`).select('.filteredData').style('width', `${availableWidth - totalWidth}px`);


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
