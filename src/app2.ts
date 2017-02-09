/**
 * Created by Caleydo Team on 31.08.2016.
 */

import {listAll, IDType} from 'phovea_core/src/idtype';
import {select} from 'd3';
import ColumnManager, {IMotherTableType} from './column/ColumnManager';
import SupportView from './SupportView';
import {Range1D} from 'phovea_core/src/range';
import {EOrientation} from './column/AColumn';
import MatrixFilter from './filter/MatrixFilter';
import * as d3 from 'd3';

/**
 * The main class for the App app
 */

export default class App {

  private readonly node: HTMLElement;


  private manager: ColumnManager;
  private supportView: SupportView;
  private idtypes: IDType[];
  private rangeNow: Range1D;
  private newManager: ColumnManager;
  private newSupportView: SupportView;

  constructor(parent: HTMLElement) {
    this.node = parent;
  }

  async build() {
    await this.buildStartSelection(select('#startSelection'));

  }

  private async buildStartSelection(elem: d3.Selection<any>) {
    // get all idtypes, filter to the valid ones and sort by name
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

  private setPrimaryIDType(idtype: IDType) {
    this.hideSelection();
    // create a column manager
    this.manager = new ColumnManager(idtype, EOrientation.Horizontal, <HTMLElement>this.node.querySelector('main'));

    const newdiv = document.createElement('div')
    newdiv.classList.add(`support-view-${idtype.id}`)
    const idName = document.createElement('div')
    idName.classList.add('idType')
    idName.innerHTML = (idtype.id.toUpperCase());
    newdiv.appendChild(idName);
    this.node.querySelector('section.rightPanel').appendChild(newdiv);

    this.supportView = new SupportView(idtype, <HTMLElement>this.node.querySelector(`.support-view-${idtype.id}`));
    // add to the columns if we add a dataset
    this.supportView.on(SupportView.EVENT_DATASET_ADDED, (evt: any, data: IMotherTableType) => {
      this.manager.push(data);
      const checkMatrixType = data.desc.type;
      console.log(this.newSupportView)

      if (checkMatrixType === 'matrix' && this.newSupportView === undefined || this.newSupportView === null) {
        const otherIdtype: IDType = this.findType(data, idtype.id);
        this.newSupportManger(otherIdtype);


      }

    });


    this.supportView.on(SupportView.EVENT_FILTER_CHANGED, (evt: any, filter: Range1D) => {

      //console.log((<any>filter).dim(0).asList())

      this.rangeNow = filter;

      this.triggerFilter(filter);
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

    this.newManager = new ColumnManager(otherIdtype, EOrientation.Horizontal, <HTMLElement>this.node.querySelector('main'));

    const newdiv = document.createElement('div');
    newdiv.classList.add(`support-view-${otherIdtype.id}`);
    const idName = document.createElement('div');
    idName.classList.add('idType');
    idName.innerHTML = (otherIdtype.id.toUpperCase());
    newdiv.appendChild(idName);
    this.node.querySelector('section.rightPanel').appendChild(newdiv);
    this.newSupportView = new SupportView(otherIdtype, <HTMLElement>document.querySelector(`.support-view-${otherIdtype.id}`));

    const m = this.supportView.matrixData;
    const node = d3.select(`.${otherIdtype.id}.filter-manager`).append('div').classed('filter', true);
    new MatrixFilter(m.t, <HTMLElement>node.node());
    this.newSupportView.on(SupportView.EVENT_DATASET_ADDED, (evt: any, data: IMotherTableType) => {
      this.newManager.push(data);
    });


    this.newSupportView.on(SupportView.EVENT_FILTER_CHANGED, (evt: any, filter: Range1D) => {
      this.rangeNow = filter;
      this.triggerFilter(filter);
    });


    this.newManager.on(ColumnManager.EVENT_DATA_REMOVED, (evt: any, data: IMotherTableType) => {
      const cols = this.newManager.columns;
      const countSame = cols.filter((d, i) => d.data.desc.id === data.desc.id).length;
      if (countSame < 1) {
        this.newSupportView.remove(data);
      }

      if (this.newManager.length === 0) {
        this.reset();
      }
    });


  }


  private triggerFilter(filter) {
    this.manager.update(filter);
    this.newManager.update(filter);


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
