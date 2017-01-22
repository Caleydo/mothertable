/**
 * Created by Caleydo Team on 31.08.2016.
 */

import * as d3 from 'd3';
import {IDataType} from 'phovea_core/src/datatype';
import {list as listData, convertTableToVectors} from 'phovea_core/src/data';
import {choose} from 'phovea_ui/src/dialogs';
import {create as createMultiForm} from 'phovea_core/src/multiform';
import {IMultiForm} from 'phovea_core/src/multiform';
import {randomId} from 'phovea_core/src/index';
import BlockManager from './BlockManager';
import VisManager from './VisManager';
import FilterManager from './FilterManager';


/**
 * The main class for the App app
 */
export default class App {

  private readonly $node;
  public static blockList = new Map();
  public static visNode;
  public static filterNode;

  constructor(parent: Element) {
    this.$node = d3.select(parent);
    this.$node.select('main').append('div').classed('visManager', true);
    //this.$node.select('main').append('div').classed('filterManager', true);
    App.visNode = d3.select('.visManager');
    App.filterNode = d3.select('#filterView');
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
    const blockList = new Map();
    this.$node.select('main').append('div').classed('visManager', true);


    return listData().then((datasets) => {
      datasets = convertTableToVectors(datasets);
      console.log(datasets)
      this.$node.select('h3').remove();
      this.$node.select('button.adder').on('click', () => {
        choose(datasets.map((d) => d.desc.name), 'Choose dataset').then((selection) => {
          this.addDataset(datasets.find((d) => d.desc.name === selection));
        });
      });
      this.setBusy(false);
    });
  }


  private addDataset(data: IDataType) {

    const block = new BlockManager(data, randomId());

    App.blockList.set(block.uid, block.data);

    const vis = new VisManager(block.data, block.uid);
    vis.createVis();

    const filterNode = d3.select('#filterView');

    const filter = new FilterManager(block.data, block.uid)
    filter.createFilter();

    console.log(App.blockList);


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
export function create(parent: Element) {
  return new App(parent);
}
