/**
 * Created by Caleydo Team on 31.08.2016.
 */

import * as d3 from 'd3';
import {IDataType} from 'phovea_core/src/datatype';
import {list as listData, convertTableToVectors} from 'phovea_core/src/data';
import {choose} from 'phovea_ui/src/dialogs';
import {create as createMultiForm, addIconVisChooser} from 'phovea_core/src/multiform';
import {randomId} from 'phovea_core/src/index';
import BlockManager from './BlockManager';
import VisManager from './VisManager';
import FilterManager from "./FilterManager";


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
    const blockList = new Map();
    this.$node.select('main').append('div').classed('visManager', true);
    this.$node.select('main').append('div').classed('filterManager', true);

    return listData().then((datasets) => {
      datasets = convertTableToVectors(datasets);
      console.log(datasets)
      console.log(blockList)
      this.$node.select('h3').remove();
      this.$node.select('button.adder').on('click', () => {
        choose(datasets.map((d) => d.desc.name), 'Choose dataset').then((selection) => {
          this.addDataset(datasets.find((d) => d.desc.name === selection), blockList);
        });
      });
      this.setBusy(false);
    });
  }


  private addDataset(data: IDataType, blockList) {
    // const parent = this.$node.select('main').append('div').classed('block', true).html(`<header class="toolbar"></header><main></main>`);
    // const vis = createMultiForm(data, <HTMLElement>parent.select('main').node(), {});
    // vis.addIconVisChooser(<HTMLElement>parent.select('header').node());


    const block = new BlockManager(data, randomId());

    blockList.set(block.uid, block.data);

    const visNode = d3.select('.visManager');
    console.log(visNode)

    const vis = new VisManager(block.data, block.uid, visNode);
    vis.createVis();

    const filterNode = d3.select('.filterManager');

    const filter = new FilterManager(block.data, block.uid, filterNode)
    filter.createFilter();


    console.log(vis)

    // blocks.forEach(function (value, key) {
    //   console.log(key);
    //   console.log((<any>value).data())
    // });


    console.log(blockList);


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


    registerData(block);


    function registerData(data) {
      blockList.push(data);

      filterVisFactory(blockList);


    }


    // function filterVisFactory(dataArray) {
    //
    //   d3.selectAll('.visBlock').remove();
    //   d3.selectAll('.filterdialog').remove();
    //
    //   const visDiv = visNode.selectAll('.visBlock')
    //     .data([dataArray])
    //     .enter()
    //     .append('div')
    //     .attr('class', 'visBlock');
    //
    //   if (d3.selectAll('.filterdialog').size() < 1) {
    //
    //     d3.select('main').append('div').classed('filterdialog', true);
    //   }
    //   dataArray.forEach((d, i) => {
    //
    //     const uid = randomId();
    //     filterDialog(d, uid);
    //     //  makeVis(d, uid, visDiv);
    //   })
    // }


    // function makeVis(visdata, uid, parentNode) {
    //   const parent = parentNode
    //     .append('div')
    //     .attr('data-uid', uid)
    //     // .call(drag)
    //     .html(`<header class="toolbar"></header><main class="vis"></main>`);
    //
    //   const vis = createMultiForm(visdata, <HTMLElement>parent.select('main').node());
    //   addIconVisChooser(<HTMLElement>parent.select('header').node(), vis);
    //   const sort = ['min', 'max', 'median', 'q1', 'q3'];
    //   d3.selectAll('.fa-sort').remove();
    //   d3.selectAll('div.visualization').append('i').attr('class', 'fa fa-sort').attr('title', 'Sort By').on('click', function (d, i) {
    //     choose(sort.map((d) => d), 'Choose dataset').then((selection) => {
    //       return selection;
    //     });
    //   });
    //
    // }


    // function filterDialog(data, uid) {
    //   console.log(data)
    //   const vectorOrMatrix = (<any>data.desc).type;
    //   const name = (<any>data).desc.name;
    //   const range = (<any>data).desc.value.range;
    //
    //   const divInfo = {filterDialogWidth: 200, filterRowHeight: 30, 'uid': name};
    //
    //   if (vectorOrMatrix === 'vector') {
    //     const dataType = (<any>data.desc).value.type;
    //     if (dataType === 'categorical') {
    //       (<any>data).data().then(function (dataVal) {
    //         const uniqCat = dataVal.filter((x, i, a) => a.indexOf(x) === i);
    //         const dataInfo = {'name': name, value: uniqCat, type: dataType};
    //         makeCategories(divInfo, dataInfo, uid);
    //       });
    //     } else if (dataType === 'int' || dataType === 'real') {
    //
    //       (<any>data).data().then(function (dataVal) {
    //         const dataInfo = {'name': name, value: dataVal, type: dataType};
    //         makeNumerical(divInfo, dataInfo);
    //       });
    //     } else {
    //       (<any>data).data().then(function (dataVal) {
    //         const dataInfo = {'name': name, value: dataVal, type: dataType};
    //         makeStringRect(divInfo, dataInfo);
    //
    //       });
    //     }
    //
    //   } else if (vectorOrMatrix === 'matrix') {
    //     (<any>data).data().then(function (dataVal) {
    //       const dataInfo = {'name': name, value: dataVal[0], type: vectorOrMatrix, 'range': range};
    //       makeMatrix(divInfo, dataInfo);
    //     });
    //   }
    //
    // }




    //console.log((<any>data).data(createRange(2, 8, 2)))


    // (<any>data).filter(greaterThan)
    //   .then((vectorView) => {
    //     //console.log(vectorView.data());
    //
    //     // d3.selectAll(`[data-uid="${uid}"]`).remove();
    //     // const parent = this.$node.select('main')
    //     //   .append('div')
    //     //   .attr('data-uid', uid)
    //     //   .call(drag)
    //     //   .html(`<header class="toolbar"></header><main class="visBlock"></main>`);
    //
    //     const vis = createMultiForm(vectorView, <Element>parent.select('main').node());
    //     addIconVisChooser(<Element>parent.select('header').node(), vis);
    //
    //   })


    // filterdialog.text('Filter Dialog');


    // d3.selectAll('.filterdialog').on('mouseover', function () {
    //   d3.select(this).classed('block-select-selected', true);
    // });
    //
    // d3.selectAll('.filterdialog').on('mouseout', function () {
    //   d3.select(this).classed('block-select-selected', false);
    // });


    function findCatName(catName, value, index,) {

      if (value === catName) {
        return value;
      } else {
        return;
      }
    }


    function setRange(range) {

      filteredData(range, blockList)

    }


    function filteredData(range, dataArray) {
      console.log(range, dataArray)
      let newVisDataArray = [];
      let rangeIntersected = range;
      dataArray.forEach((d, i) => {

        (<any>d).ids().then((r) => {
          console.log(r, i, (<any>d).desc.name);
          rangeIntersected = rangeIntersected.intersect(r);
        })
      })


      dataArray.forEach((d, i) => {

        newVisDataArray.push(d.idView(rangeIntersected));

        // d.idView(rangeIntersected).then((e) => {
        //
        //   newVisDataArray.push(e);
        // })
      })


      Promise.all(newVisDataArray).then((val) => {
        filterVisFactory(val);
        console.log(val);
      })


    }


    function onClickCat(catName, uid) {
      (<any>block).filter(findCatName.bind(this, catName))
        .then((vectorView) => {
          console.log(vectorView.data());
          setRange(vectorView.range);

          console.log(vectorView.range)
          d3.selectAll(`[data-uid="${uid}"]`).remove();
          const parent = d3.select('main')
            .append('div')
            .attr('data-uid', uid)
            .html(`<header class="toolbar"></header><main class="visBlock"></main>`);
          const vis = createMultiForm(vectorView, <HTMLElement>parent.select('main').node());
          addIconVisChooser(<HTMLElement>parent.select('header').node(), vis);
        });

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
