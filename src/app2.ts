/**
 * Created by Caleydo Team on 31.08.2016.
 */

import {IDataType} from 'phovea_core/src/datatype';
import {list as listData, convertTableToVectors} from 'phovea_core/src/data';

/**
 * The main class for the App app
 */
export default class App {

  private readonly node: HTMLElement;

  constructor(parent: HTMLElement) {
    this.node = parent;
  }

  async build() {
    const datasets = convertTableToVectors(await listData());
    console.log(datasets);
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
