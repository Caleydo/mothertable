/**
 * Created by Caleydo Team on 31.08.2016.
 */

import {listAll, IDType} from 'phovea_core/src/idtype';
import {select} from 'd3';
import ColumnManager,{IMotherTableType} from './column/ColumnManager';
import SupportView from './SupportView';
import {Range1D} from 'phovea_core/src/range';
import {EOrientation} from './column/AColumn';

/**
 * The main class for the App app
 */
export default class App {

  private readonly node: HTMLElement;

  private manager: ColumnManager;
  private supportView: SupportView;

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

  private setPrimaryIDType(idtype: IDType) {
    this.hideSelection();
    // create a column manager
    this.manager = new ColumnManager(idtype, EOrientation.Horizontal, <HTMLElement>this.node.querySelector('main'));
    this.supportView = new SupportView(idtype, <HTMLElement>this.node.querySelector('section.rightPanel'));
    // add to the columns if we add a dataset
    this.supportView.on(SupportView.EVENT_DATASET_ADDED,(evt: any, data: IMotherTableType) => {

      this.manager.push(data);
    });
    this.supportView.on(SupportView.EVENT_FILTER_CHANGED,(evt: any, filter: Range1D) => {
      this.manager.update(filter);
    });
    this.manager.on(ColumnManager.EVENT_DATA_REMOVED,(evt: any, data: IMotherTableType) => {
      this.supportView.remove(data);
      if (this.manager.length === 0) {
        this.reset();
      }
    });
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
