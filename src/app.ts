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
    const svg = d3.select('.filterdialog').append('svg').attr('width', 200).attr('height', 50).append('g');

    const dataType = (<any>data.desc).value.type;
    console.log(dataType)
    const filterDialogWidth = 200;
    if (dataType === 'categorical') {
      const listCat = (<any>data.desc).value.categories;
      makeCatRect(listCat, filterDialogWidth, svg);

    }

    (<any>data).data().then(function (v) {
      console.log(v);

    });


    function makeCatRect(listCat, cellWidth, svg) {
      const cellDimension = cellWidth / listCat.length;
      const height = 50;
      const c20 = d3.scale.category20();

      var div = d3.select('main').append('div')
        .style('display', 'none');

      const rect = svg.selectAll('.rect').data(listCat).enter();
      rect.append('rect')
        .attr('x', (d, i) => cellDimension * i)
        .attr('y', 0)
        .attr('width', cellDimension)
        .attr('height', height)
        .attr('class', 'catRect')
        .attr('fill', c20)
       .on('mouseover', (d) => mouseover(d))
        //.on("mousemove",(d)=> mousemove(d))
        .on('mouseout', mouseout);

      const text = svg.selectAll('.text').data(listCat).enter();
      text.append('text')
        .attr('x', (d, i) => (cellDimension * i) + cellDimension / 2)
        .attr('y', height / 2)
        .style('alignment-baseline', 'middle')
        .style('text-anchor', 'middle')
        .text(function (d: any) {
          if (d.length > 3) {
            return d.substring(0, 3) + '..';
          } else {
            return d;
          }
        })

      function mouseover(d) {
        div.style('display', 'inline')
          .style('position', 'absolute')
          .style('color', 'black')
          .style('left', ((<any>d3.event).pageX ) + 'px')
          .style('top', ((<any>d3.event).pageY ) + 'px')
          .text(d);
      }

      // function mousemove(d) {
      //   div
      //     .text(d)
      //     .style("left", ((<any>d3.event).pageX ) + "px")
      //     .style("top", ((<any>d3.event).pageY ) + "px");
      // }

      function mouseout() {
        div.style('display', 'none');
      }
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
