/**
 * Created by Caleydo Team on 31.08.2016.
 */

import * as d3 from 'd3';
import {IDataType} from 'phovea_core/src/datatype';
import {list as listData, convertTableToVectors} from 'phovea_core/src/data';
import {choose} from 'phovea_ui/src/dialogs';
import {randomId} from 'phovea_core/src/index';
import VisManager from './VisManager';
import FilterManager from './FilterManager';
import RangeManager from './RangeManager';
import Block from './Block';
import ConnectionLines from './ConnectionLines';

/**
 * The main class for the App app
 */
export default class App {

  private readonly $node;
  public static blockList = new Map();
  public static visNode;
  public static filterNode;

  private visManager: VisManager;
  private filterManager: FilterManager;
  private rangeManager: RangeManager;
  private connectionLines: ConnectionLines;

  constructor(parent: Element) {
    this.$node = d3.select(parent);
    this.$node.select('main').append('div').classed('visManager', true);
    App.visNode = d3.select('.visManager');
    App.filterNode = d3.select('#filterView');
    this.visManager = new VisManager();
    this.rangeManager = new RangeManager(this.visManager);
    this.filterManager = new FilterManager(this.rangeManager);


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
    this.visManager.filterManager = this.filterManager;


    return listData().then((datasets) => {
      datasets = convertTableToVectors(datasets);
      console.log(datasets);
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

    const id = randomId();

    const currentRange: any = Block.currentRange;

    <any>data.ids(currentRange).then((d) => {

      (<any>data).idView(d).then((e) => {

        this.visManager.createVis(data, e, id);
        this.filterManager.createFilter(App.blockList.get(id), this.filterManager);


      });

    });

    //this.visManager.createVis(data, data, id);  //first is new data and second is for filtered data purporse which is same as data at first

    const filterNode = d3.select('#filterView');
    // this.filterManager.createFilter(App.blockList.get(id), this.filterManager);
    console.log(App.blockList);
    //


    // // ((<any>sorta).data().then((d) => console.log(d)))


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