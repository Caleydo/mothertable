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
    const vectorOrMatrix = (<any>data.desc).type;
    const name = (<any>data).desc.name;
    const range = (<any>data).desc.value.range;
    console.log(vectorOrMatrix)
    const svgData = {
      filterDialogWidth: 200, filterRowHeight: 50, svg: svg, name: name
    };

    if (vectorOrMatrix === 'vector') {
      const dataType = (<any>data.desc).value.type;
      if (dataType === 'categorical') {
        (<any>data).data().then(function (dataVal) {
          const uniqCat = dataVal.filter((x, i, a) => a.indexOf(x) === i);
          const dataInfo = {name: name, value: uniqCat, type: dataType}
          makeCatRect(svgData, dataInfo);
        });

      } else if (dataType === 'int' || dataType === 'real') {

        (<any>data).data().then(function (dataVal) {
          const dataInfo = {name: name, value: dataVal, type: dataType}
          makeNumRect(svgData, dataInfo);

        });
      } else {
        (<any>data).data().then(function (dataVal) {
          const dataInfo = {name: name, value: dataVal, type: dataType}
          makeStringRect(svgData, dataInfo);

        });

      }

    } else if (vectorOrMatrix === 'matrix') {

      (<any>data).data().then(function (dataVal) {
        const dataInfo = {name: name, value: dataVal[0], type: vectorOrMatrix, range: range}
        makeMatrix(svgData, dataInfo);

      });
    }

    (<any>data).data().then(function (v) {
      console.log(v);

    });


    function makeRectangle(svgData, styleInfo, data) {
      const cellWidth = svgData.filterDialogWidth / data.value.length;
      const cellHeight = svgData.filterRowHeight;

      const cssClass = styleInfo.class;
      var rectFill;
      if (data.type === 'int' || data.type === 'real') {
        rectFill = 'none';
      } else if (data.type === 'categorical') {

        rectFill = d3.scale.category20();

      } else if (data.type === 'matrix') {

        rectFill = d3.scale.linear<string, number>().domain(data.range).range(['white', 'red'])
      } else {
        rectFill = 'grey';
      }

      const rect = svg.selectAll('.rect' + cssClass).data(data.value).enter();
      rect.append('rect')
        .attr('x', (d, i) => cellWidth * i)
        .attr('y', 0)
        .attr('width', cellWidth)
        .attr('height', cellHeight)
        .attr('class', cssClass)
        .attr('fill', rectFill);

    }


    function makeText(svgData, stylInfo, data) {

      const cellWidth = svgData.filterDialogWidth / data.value.length;
      let cellHeight = svgData.filterRowHeight;
      if (data.value.length > 1) {

        cellHeight = cellHeight / 2;
      } else {

        cellHeight = cellHeight - 10;
      }
      const text = svg.selectAll('.text').data(data.value).enter();
      text.append('text')
        .attr('x', (d, i) => (cellWidth * i) + cellWidth / 2)
        .attr('y', cellHeight)
        .style('alignment-baseline', 'middle')
        .style('text-anchor', 'middle')
        .text((d: any) => d);

    }


    function makeCatRect(svgData, dataInfo) {
      const cellDimension = svgData.filterDialogWidth / dataInfo.length;
      const height = svgData.filterRowHeight;
      const rectStyle = {class: 'catRect'};
      const rectData = {value: dataInfo.value, type: dataInfo.type};
      makeRectangle(svgData, rectStyle, rectData);
      const catNameStyle = {class: 'catName'};
      const catName = {value: [dataInfo.name]}
      makeText(svgData, catNameStyle, catName);

      const categories = {value: dataInfo.value};
      const categoriesStyle = {class: 'categories'};
      makeText(svgData, categoriesStyle, categories);


      // const catName = svg.selectAll('.text').data([dataInfo.name]).enter();
      // catName.append('text')
      //   .attr('x', svgData.filterDialogWidth / 2)
      //   .attr('y', height - 5)
      //   .style('alignment-baseline', 'middle')
      //   .style('text-anchor', 'middle')
      //   .style('font-size', '12px')
      //   .text((d: any) => d);

      // const text = svg.selectAll('.text').data(dataInfo.value).enter();
      // text.append('text')
      //   .attr('x', (d, i) => (cellDimension * i) + cellDimension / 2)
      //   .attr('y', height / 2)
      //   .style('alignment-baseline', 'middle')
      //   .style('text-anchor', 'middle')
      //   .text(function (d: any) {
      //     if (d.length > 3) {
      //       return d.substring(0, 3) + '..';
      //     } else {
      //       return d;
      //     }
      //   });

      // function mouseover(d) {
      //   div.style('display', 'inline')
      //     .style('position', 'absolute')
      //     .style('color', 'black')
      //     .style('left', ((<any>d3.event).pageX ) + 'px')
      //     .style('top', ((<any>d3.event).pageY ) + 'px')
      //     .text(d);
      // }

      // function mousemove(d) {
      //   div
      //     .text(d)
      //     .style("left", ((<any>d3.event).pageX ) + "px")
      //     .style("top", ((<any>d3.event).pageY ) + "px");
      // }

      // function mouseout() {
      //   div.style('display', 'none');
      // }
    }

    function makeNumRect(svgData, dataInfo) {
      const svg = svgData.svg;
      const svgDefs = svg.append('defs');
      const cellWidth = svgData.filterDialogWidth;
      const cellHeight = svgData.filterRowHeight;
      const rectData = {value: [dataInfo.value], type: dataInfo.type};
      const rectStyle = {class: 'numRect'};
      const mainGradient = svgDefs.append('linearGradient')
        .attr('id', 'numGradient');

      mainGradient.append('stop')
        .attr('class', 'stop-left')
        .attr('offset', '0');
      mainGradient.append('stop')
        .attr('class', 'stop-right')
        .attr('offset', '1');


      console.log(svgData)

      makeRectangle(svgData, rectStyle, rectData);
      const textStyle = {class: 'numText'};
      const textData = {value: [dataInfo.name]};
      makeText(svgData, textStyle, textData);
      //
      //
      // const text = svg.selectAll('.text').data([dataInfo.name]).enter();
      // text.append('text')
      //   .attr('x', (d, i) => (cellWidth * i) + cellWidth / 2)
      //   .attr('y', cellHeight / 2)
      //   .style('alignment-baseline', 'middle')
      //   .style('text-anchor', 'middle')
      //   .text((d: any) => d);

    }

    function makeMatrix(svgData, dataInfo) {

      const height = svgData.filterRowHeight;
      const name = svgData.name;
      const styleInfo = {class: 'matrixRect'};
      const data = {value: dataInfo.value, type: dataInfo.type, range: dataInfo.range};
      makeRectangle(svgData, styleInfo, data);

      const textStyle = {class: 'matText'};
      const textData = {value: [dataInfo.name]};
      makeText(svgData, textStyle, textData);

      // const catName = svg.selectAll('.text').data([name]).enter();
      // catName.append('text')
      //   .attr('x', svgData.filterDialogWidth / 2)
      //   .attr('y', height - 5)
      //   .style('alignment-baseline', 'middle')
      //   .style('text-anchor', 'middle')
      //   .style('font-size', '12px')
      //   .text((d: any) => d);

    }

    function makeStringRect(svgData, dataInfo) {
      // const svg = svgData.svg;
      // const cellWidth = svgData.filterDialogWidth;
      // const cellHeight = svgData.filterRowHeight;
      // const name = svgData.name;
      const rectStyle = {class: 'stringRect'};
      const rectData = {value: [dataInfo.name], type: dataInfo.type};
      //
      // const rect = svg.selectAll('.rect').data([data]).enter();
      // rect.append('rect')
      //   .attr('x', (d, i) => svgData.filterDialogWidth * i)
      //   .attr('y', 0)
      //   .attr('width', cellWidth)
      //   .attr('height', cellHeight)
      //   .attr('fill', 'grey');

      makeRectangle(svgData, rectStyle, rectData);

      const textStyle = {class: 'stringText'};
      const textData = {value: [dataInfo.name]};
      makeText(svgData, textStyle, textData);

      // const text = svg.selectAll('.text').data([name]).enter();
      // text.append('text')
      //   .attr('x', (d, i) => (cellWidth * i) + cellWidth / 2)
      //   .attr('y', cellHeight / 2)
      //   .style('alignment-baseline', 'middle')
      //   .style('text-anchor', 'middle')
      //   .text((d: any) => d);

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
