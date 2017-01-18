/**
 * Created by Caleydo Team on 31.08.2016.
 */

import * as d3 from 'd3';
import {IDataType} from 'phovea_core/src/datatype';
import {list as listData, convertTableToVectors} from 'phovea_core/src/data';
import {choose} from 'phovea_ui/src/dialogs';
import {create as createMultiForm, addIconVisChooser} from 'phovea_core/src/multiform';
import {getAPIJSON, api2absURL} from "../../phovea_core/src/ajax";
import any = jasmine.any;
import {rect} from "../../phovea_core/src/geom";
import {type} from "os";
import {none} from "../../phovea_core/src/range";
import color = d3.color;
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
      console.log(datasets)
      this.$node.select('h3').remove();
      this.$node.select('button.adder').on('click', () => {
        choose(datasets.map((d) => d.desc.name), 'Choose dataset').then((selection) => {
          console.log(datasets, selection)
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
          .style('top', (<any>d3.event).y + 'px')
          .style('left', (<any>d3.event).x + 'px');
      })
      .on('dragend', function () {
        d3.select(this)
          .style('position', 'absolute')
          .style('top', (<any>d3.event).y + 'px')
          .style('left', (<any>d3.event).x + 'px')
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

    const filterdialog = d3.select('main').append('div').classed('filterdialog', true);
    // filterdialog.text('Filter Dialog');

    const vectorOrMatrix = (<any>data.desc).type;
    const name = (<any>data).desc.name;
    const range = (<any>data).desc.value.range;
    const divInfo = {
      filterDialogWidth: 200, filterRowHeight: 30
    };

    if (vectorOrMatrix === 'vector') {
      const dataType = (<any>data.desc).value.type;
      if (dataType === 'categorical') {
        (<any>data).data().then(function (dataVal) {
          const uniqCat = dataVal.filter((x, i, a) => a.indexOf(x) === i);
          const dataInfo = {name: name, value: uniqCat, type: dataType}
          makeCategories(divInfo, dataInfo);
        });

      } else if (dataType === 'int' || dataType === 'real') {

        (<any>data).data().then(function (dataVal) {
          const dataInfo = {name: name, value: dataVal, type: dataType}
          makeNumerical(divInfo, dataInfo);

        });
      } else {
        (<any>data).data().then(function (dataVal) {
          const dataInfo = {name: name, value: dataVal, type: dataType}
          makeStringRect(divInfo, dataInfo);

        });

      }

    } else if (vectorOrMatrix === 'matrix') {

      (<any>data).data().then(function (dataVal) {
        const dataInfo = {name: name, value: dataVal[0], type: vectorOrMatrix, range: range}
        makeMatrix(divInfo, dataInfo);

      });
    }

    (<any>data).data().then(function (v) {
      console.log(v);

    });


    function makeCategories(divInfo, dataInfo) {
      const cellHeight = divInfo.filterRowHeight;
      const c20 = d3.scale.category20();
      const divBlock = d3.select('.filterdialog').append('div')
        .classed(dataInfo.name, true)
        .style('display', 'flex')
        .style('margin', '1px')
        .style('height', cellHeight + 'px');
      const div = divBlock.selectAll('div.categories').data(dataInfo.value).enter();
      div.append('div')
        .attr('class', 'categories')
        .style('background-color', c20)
        .text((d: any) => d);
    }


    function makeNumerical(divInfo, dataInfo) {
      const cellHeight = divInfo.filterRowHeight;
      const divBlock = d3.select('.filterdialog').append('div')
        .classed(dataInfo.name, true)
        .style('display', 'flex')
        .style('height', cellHeight + 'px')
        .style('margin', '1px')
      const div = divBlock.selectAll('div.numerical').data([dataInfo.name]).enter();
      div.append('div')
        .attr('class', 'numerical')
        .text((d: any) => d);

    }

    function makeMatrix(divInfo, dataInfo) {
      const cellHeight = divInfo.filterRowHeight;
      const divBlock = d3.select('.filterdialog').append('div')
        .classed(dataInfo.name, true)
        .style('display', 'flex')
        .style('height', cellHeight + 'px')
        .style('margin', '1px')
      const div = divBlock.selectAll('div.matrix').data(dataInfo.value).enter();
      const colorScale = d3.scale.linear<string, number>().domain(dataInfo.range).range(['white', 'red'])
      div.append('div')
        .attr('class', 'matrix')
        .style('background-color', colorScale);

      const matrixName = divBlock.selectAll('div.matrixName').data([dataInfo.name]).enter();
      matrixName.append('div')
        .attr('class', 'matrixName')
        .text((d) => d);

    }

    function makeStringRect(divInfo, dataInfo) {
      const cellHeight = divInfo.filterRowHeight;
      d3.select('.filterdialog').selectAll('div.' + dataInfo.name).data([dataInfo.name]).enter()
        .append('div')
        .classed(dataInfo.name, true)
        .style('height', cellHeight + 'px')
        .style('margin', '1px')
        .style('border', '1px')
        .text((d) => d);

    }
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
