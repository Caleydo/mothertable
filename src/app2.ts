/**
 * Created by Caleydo Team on 31.08.2016.
 */

import {listAll, IDType} from 'phovea_core/src/idtype';
import {select} from 'd3';
import ColumnManager from './column/ColumnManager';
import SupportView from './SupportView';

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

  private setPrimaryIDType(idtype: IDType) {
    //remove start selection
    this.node.querySelector('#startSelection').remove();
    // create a column manager
    this.manager = new ColumnManager(idtype, <HTMLElement>this.node.querySelector('main'));
    this.supportView = new SupportView(idtype, <HTMLElement>this.node.querySelector('section.rightPanel'));
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
