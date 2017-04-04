/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

import IDType from 'phovea_core/src/idtype/IDType';
import {ICategoricalVector, INumericalVector} from 'phovea_core/src/vector';
import {INumericalMatrix} from 'phovea_core/src/matrix';
import {
  VALUE_TYPE_STRING, VALUE_TYPE_CATEGORICAL, VALUE_TYPE_INT, VALUE_TYPE_REAL,
  IDataType
} from 'phovea_core/src/datatype';
import {IStringVector, AVectorFilter} from './AVectorFilter';
import AFilter from './AFilter';
import CategoricalFilter from './CategoricalFilter';
import StringFilter from './StringFilter';
import NumberFilter from './NumberFilter';
import {EventHandler} from 'phovea_core/src/event';
import {Range1D} from 'phovea_core/src/range';
import MatrixFilter from './MatrixFilter';
import {on, fire} from 'phovea_core/src/event';
import * as $ from 'jquery';
import * as d3 from 'd3';
import 'jquery-ui/ui/widgets/sortable';
import {findColumnTie} from '../column/utils';
import AColumn from '../column/AColumn';


declare type AnyColumn = AFilter<any, IDataType>;
export declare type IFilterAbleType = IStringVector | ICategoricalVector | INumericalVector | INumericalMatrix;

export default class FilterManager extends EventHandler {

  static readonly EVENT_FILTER_CHANGED = 'filterChanged';
  static readonly EVENT_SORT_DRAGGING = 'sortByDragging';

  readonly filters: AnyColumn[] = [];

  private onFilterChanged = () => this.refilter();
  //private onFilterRemove = (evt: any, col) => this.removeMe(col);

  constructor(public readonly idType: IDType, readonly $node: d3.Selection<any>) {
    super();
    this.build();
    this.drag();


  }

  private build() {
    this.$node
      .classed('filter-manager', true)
      .append('ol')
      .classed('filterlist', true);
  }

  push(data: IFilterAbleType) {
    const filter = FilterManager.createFilter(data, this.$node);
    filter.on(AFilter.EVENT_FILTER_CHANGED, this.onFilterChanged);
    filter.on(AFilter.EVENT_REMOVE_ME, this.remove.bind(this));
    this.filters.push(filter);
    this.updateStratifyIcon(findColumnTie(this.filters));
  }


  primarySortColumn(sortColdata) {
    const dataid = sortColdata.data.desc.id;
    const col = this.filters.filter((d) => d.data.desc.id === dataid);
    this.move(col[0], 0);
    this.updateStratifyIcon(findColumnTie(this.filters));
  }

  contains(data: IFilterAbleType) {
    return this.filters.some((d) => d.data === data);
  }


  updateFilterView(flattenedMatrix, col) {
    const matrixFilter = this.filters.find((f) => f.data === col.data);
    const index = (this.filters.indexOf(matrixFilter));
    matrixFilter.$node.remove();
    this.filters.splice(index, 1);
  }

  /**
   * Removes the column from the filters by the given data parameter,
   * if the column has no filter applied.
   *
   * @param data
   */
  remove(evt: any, data: IFilterAbleType) {
    const col = this.filters.find((d) => d.data === data);
    if (!col.activeFilter) {
      col.$node.remove();
      this.filters.splice(this.filters.indexOf(col), 1);
      fire(AFilter.EVENT_REMOVE_ME, data);
      this.fire(AFilter.EVENT_REMOVE_ME, data);
    }


    if (data.desc.type === AColumn.DATATYPE.matrix) {

      fire(AFilter.EVENT_MATRIX_REMOVE, col.data, col.idtype.id);

    }

  }

  /**
   * move a column node to the given index
   * @param col
   * @param index
   */
  move(col: AnyColumn, index: number) {
    const old = this.filters.indexOf(col);
    if (old === index) {
      this.triggerSort();
      return;
    }

    //move the dom element, too
    const filterListNode = this.$node.select('.filterlist');
    // this.node.insertBefore(col.node, this.node.childNodes[index + 1]);
    filterListNode.node().insertBefore(col.$node.node(), filterListNode.node().childNodes[index]);

    this.filters.splice(old, 1);
    if (old < index) {
      index -= 1; //shifted because of deletion
    }
    this.filters.splice(index, 0, col);
    this.triggerSort();
  }

  convertToVector(col) {

    // console.log(col.data.desc.id, this.filters)
    // const matrixFilters = this.filters.filter((c) => c.data.desc.id === col.data.desc.id)
    //  const flattenedData: any = (<INumericalMatrix> col.data).reduce((row: number[]) => d3.mean(row));
    // const flattenedMatrix = FilterManager.createFilter(flattenedData, this.$node);
    //matrixFilters[0].$node.remove()
    //const index = this.filters.indexOf(matrixFilters[0]);
    // this.push(flattenedData)
    //console.log(flattenedMatrix, matrixFilters[0].$node.remove(),index,this.filters)


    // flattenedMatrix.updateMultiForms(this._multiformRangeList, this._stratifiedRanges, this._brushedRanges);
    // const index = this.columns.indexOf(col);
    // this.columns.splice(index, 1, flattenedMatrix);
    // console.log(this.columns)

    //matrixFilters[0].$node.node().replaceWith(flattenedMatrix.$node.node());
  }

  /**
   * Filter Dragging  Event Listener
   */
  drag() {
    const that = this;
    let posBefore;
    let posAfter;
    //Same as using query selector)
    $('ol.filterlist', this.$node.node()).sortable({handle: 'header', axis: 'y', items: '> :not(.filter.nodrag)'});
    // {axis: 'y'});
    $('ol.filterlist', this.$node.node()).on('sortstart', function (event, ui) {
      //  console.log('start: ' + ui.item.index())
      posBefore = ui.item.index();
    });

    $('ol.filterlist', this.$node.node()).on('sortupdate', function (event, ui) {
      //  console.log('update: ' + ui.item.index())
      posAfter = ui.item.index();
      that.updateFilterOrder(posBefore, posAfter);
    });
  }

  /**
   * Update the order of filter Array also after dragging event finish
   * @param posBefore position of element before dragging
   * @param posAfter  position of element after dragging
   */
  private updateFilterOrder(posBefore: number, posAfter: number) {
    const temp = this.filters[posBefore];
    this.filters.splice(posBefore, 1);
    this.filters.splice(posAfter, 0, temp);
    this.updateStratifyIcon(findColumnTie(this.filters));
    this.triggerSort();
  }

  private updateStratifyIcon(columnIndexForTie: number) {
    //Categorical Columns after the numerical or string
    this.filters.filter((d, i) => i > columnIndexForTie)
      .filter((col) => col.data.desc.value.type === VALUE_TYPE_CATEGORICAL)
      .forEach((col) => (<CategoricalFilter>col).showStratIcon(false));

    //Categorical Columns before the numerical or string
    this.filters.filter((d, i) => i < columnIndexForTie)
      .filter((col) => col.data.desc.value.type === VALUE_TYPE_CATEGORICAL)
      .forEach((col) => (<CategoricalFilter>col).showStratIcon(true));
  }


  private triggerSort() {
    const vectorColsOnly = this.filters.filter((col) => col.data.desc.type === AColumn.DATATYPE.vector);
    this.fire(FilterManager.EVENT_SORT_DRAGGING, vectorColsOnly);
  }

  /**
   * returns the current filter
   * @return {Promise<Range1D>}
   */
  private async currentFilter() {
    let filtered = Range1D.all();
    for (const f of this.filters) {
      filtered = await f.filter(filtered);
    }
    return filtered;
  }

  private async refilter() {
    // compute the new filter
    const filter = await this.currentFilter();
    this.fire(FilterManager.EVENT_FILTER_CHANGED, filter);
  }

  private static createFilter(data: IFilterAbleType, $parent: d3.Selection<any>): AnyColumn {

    switch (data.desc.type) {
      case AColumn.DATATYPE.vector:
        const v = <IStringVector | ICategoricalVector | INumericalVector>data;
        switch (v.desc.value.type) {
          case VALUE_TYPE_STRING:
            return new StringFilter(<IStringVector>v, $parent);
          case VALUE_TYPE_CATEGORICAL:
            return new CategoricalFilter(<ICategoricalVector>v, $parent);
          case VALUE_TYPE_INT:
          case VALUE_TYPE_REAL:
            return new NumberFilter(<INumericalVector>v, $parent);
        }
        throw new Error('invalid vector type');
      case AColumn.DATATYPE.matrix:
        return new MatrixFilter(<INumericalMatrix>data, $parent);
      default:
        throw new Error('invalid data type');
    }
  }
}
