/**
 * Created by Caleydo Team on 31.08.2016.
 */

import * as d3 from 'd3';
import {IDataType} from 'phovea_core/src/datatype';
import {list as listData, convertTableToVectors} from 'phovea_core/src/data';
import {choose} from 'phovea_ui/src/dialogs';
import {create as createMultiForm, addIconVisChooser} from 'phovea_core/src/multiform';

/**
 * The main class for the App app
 */
export class App {

  private readonly $node;

  constructor(parent: Element) {
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

        choose(datasets.map((d) => d.desc.name), 'Choose dataset').then((selection) => {

          this.addDataset(datasets.find((d) => {
            return d.desc.name === selection;
          }));
        });
      });
      this.setBusy(false);
    });
  }

  private addDataset(data: IDataType) {

    const drag = d3.behavior.drag()
      .on('dragstart', function () {
        d3.select(this).classed('block-select-selected', true);
      })
      .on('drag', function () {
        d3.select(this).style('position', 'absolute')
          .style('top', d3.mouse(this)[1] + 'px')
          .style('left', d3.mouse(this)[0] + 'px');
      })
      .on('dragend', function () {
        d3.select(this)
          .style('position', 'absolute')
          .style('top', d3.mouse(this)[1] + 'px')
          .style('left', d3.mouse(this)[0] + 'px')
          .classed('block-select-selected', false);

      });

    const parent = this.$node.select('main').append('div').classed('block', true).call(drag).html(`<header class="toolbar"></header><main></main>`);

    const vis = createMultiForm(data, <Element>parent.select('main').node());
    addIconVisChooser(<Element>parent.select('header').node(), vis);
    const sort = ['min', 'max', 'median', 'q1', 'q3'];
    d3.selectAll('.fa-sort').remove();
    d3.selectAll('div.visualization').append('i').attr('class', 'fa fa-sort').attr('title', 'Sort By').on('click', function (d, i) {
      choose(sort.map((d) => d), 'Choose dataset').then((selection) => {
        return selection;
      });
    });

    d3.selectAll('.block').on('mouseover', function () {
      d3.select(this).classed('block-select-selected', true);
    });

    d3.selectAll('.block').on('mouseout', function () {
      d3.select(this).classed('block-select-selected', false);
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
export function create(parent: Element) {
  return new App(parent);
}
