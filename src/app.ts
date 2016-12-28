/**
 * Created by Caleydo Team on 31.08.2016.
 */

import * as d3 from 'd3';
import {list as listData} from 'phovea_core/src/data';

/**
 * The main class for the App app
 */
export class App {

  private $node;

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
    return listData().then((datasets) => {
      const data = this.$node.append('div').selectAll('div').data(datasets);
      data.enter().append('div');
      data.text((d) => d.desc.name);
      data.exit().remove();
    });
  }

  /**
   * Show or hide the application loading indicator
   * @param isBusy
   */
  setBusy(isBusy) {
    this.$node.select('.busy').classed('hidden', !isBusy);
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
