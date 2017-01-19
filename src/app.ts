/**
 * Created by Caleydo Team on 31.08.2016.
 */

import * as d3 from 'd3';
import {IDataType} from 'phovea_core/src/datatype';
import {list as listData, convertTableToVectors} from 'phovea_core/src/data';
import {choose} from 'phovea_ui/src/dialogs';
import {create as createMultiForm} from 'phovea_core/src/multiform';
import {createNode} from 'phovea_core/src/multiform/internal';
import {IMultiForm} from 'phovea_core/src/multiform';



/**
 * The main class for the App app
 */
export class App {

  private readonly $node;

  constructor(parent:Element) {
    this.$node = d3.select(parent);
  }

  /**
   * Initialize the view and return a promise
   * that is resolved as soon the view is completely initialized.
   * @returns {Promise<App>}
   */
  init() {
    return this.build();
  }

  /**
   * Load and initialize all necessary views
   * @returns {Promise<App>}
   */
  private build() {
    this.setBusy(true);
    return listData().then((datasets) => {
      datasets = convertTableToVectors(datasets);
      this.$node.select('h3').remove();
      this.$node.select('button.adder').on('click', () => {
        choose(datasets.map((d)=>d.desc.name), 'Choose dataset').then((selection) => {
          this.addDataset(datasets.find((d) => d.desc.name === selection));
        });
      });
      this.setBusy(false);
    });
  }

  private addDataset(data: IDataType) {
    const parent = this.$node.select('main').append('div').classed('block', true).html(`<header class="toolbar"></header><main></main>`);
    const vis = createMultiForm(data, <HTMLElement>parent.select('main').node(), {});
   // vis.addIconVisChooser(<HTMLElement>parent.select('header').node());
    this.addIconVisChooser(<HTMLElement>parent.select('header').node(),vis);
    vis.transform([2,2]);
  }

  /**
   * Show or hide the application loading indicator
   * @param isBusy
   */
  setBusy(isBusy) {
    this.$node.select('.busy').classed('hidden', !isBusy);
  }

  private addIconVisChooser(toolbar: HTMLElement, ...forms: IMultiForm[]) {
  const s = toolbar.ownerDocument.createElement('div');
  toolbar.insertBefore(s, toolbar.firstChild);
  const visses = this.toAvailableVisses(forms);

  visses.forEach((v) => {
    let child = createNode(s, 'i');
    v.iconify(child);
    child.onclick = () => forms.forEach((f) => {
      f.switchTo(v);
      let sy:number = 600/f.size[0];
      let sx:number = 200/f.size[1];
     // f.size = [200,600];
      f.transform([sx,sy]);
    }) ;
  });
}

private toAvailableVisses(forms: IMultiForm[]) {
  if (forms.length === 0) {
    return [];
  }
  if (forms.length === 1) {
    return forms[0].visses;
  }
  //intersection of all
  return forms[0].visses.filter((vis) => forms.every((f) => f.visses.indexOf(vis) >= 0));
}

}



/**
 * Factory method to create a new app instance
 * @param parent
 * @returns {App}
 */
export function create(parent:Element) {
  return new App(parent);
}
