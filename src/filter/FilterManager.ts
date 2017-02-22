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
import {IStringVector} from './AVectorFilter';
import AFilter from './AFilter';
import CategoricalFilter from './CategoricalFilter';
import StringFilter from './StringFilter';
import NumberFilter from './NumberFilter';
import {EventHandler} from 'phovea_core/src/event';
import {Range1D} from 'phovea_core/src/range';
import MatrixFilter from './MatrixFilter';
import * as $ from 'jquery';
import 'jquery-ui/ui/widgets/sortable';
import any = jasmine.any;

declare type AnyColumn = AFilter<any, IDataType>;
export declare type IFilterAbleType = IStringVector|ICategoricalVector|INumericalVector|INumericalMatrix;

export default class FilterManager extends EventHandler {

  static readonly EVENT_FILTER_CHANGED = 'filterChanged';
  static readonly EVENT_SORT_CHANGED = 'sortChanged';
  readonly filters: AnyColumn[] = [];
  private onFilterChanged = () => this.refilter();
  private activeFilters;
  private rangeNow: Range1D = Range1D.all();

  constructor(public readonly idType: IDType, readonly node: HTMLElement) {
    super();
    this.node.classList.add('filter-manager');
    const ol = document.createElement('ol');
    ol.classList.add('filterlist');
    node.appendChild(ol);
    this.drag();

  }


  push(data: IFilterAbleType) {
    if (data.idtypes[0] !== this.idType) {
      throw new Error('invalid idtype');
    }

    const col = FilterManager.createFilter(data, this.node);
    //console.log(col.data.desc.id)
    col.on(AFilter.EVENT_FILTER_CHANGED, this.onFilterChanged);
    this.filters.push(col);


  }

  contains(data: IFilterAbleType) {
    return this.filters.some((d) => d.data === data);
  }

  removeData(data: IFilterAbleType) {
    const f = this.filters.find((d) => d.data === data);
    const checkStatus = f.activeFilter;
    return checkStatus ? null : this.remove(f);
  }

  remove(col: AnyColumn) {
    col.node.remove();
    this.filters.splice(this.filters.indexOf(col), 1);
  }

  /**
   * move a column at the given index
   * @param col
   * @param index
   */
  move(col: AnyColumn, index: number) {
    const old = this.filters.indexOf(col);
    if (old === index) {
      return;
    }
    //move the dom element, too
    this.node.insertBefore(col.node, this.node.childNodes[index]);

    this.filters.splice(old, 1);
    if (old < index) {
      index -= 1; //shifted because of deletion
    }
    this.filters.splice(index, 0, col);
  }

  /**
   *
   * Filter Dragging  Event Listener
   */

  drag() {
    const that = this;
    let posBefore;
    let posAfter;
    $('ol.filterlist').sortable({handle: '.filterlabel'});
    // {axis: 'y'});
    $('ol.filterlist').on('sortstart', function (event, ui) {
      //console.log('start: ' + ui.item.index())
      posBefore = ui.item.index();

    });

    $('ol.filterlist').on('sortupdate', function (event, ui) {
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
  updateFilterOrder(posBefore: number, posAfter: number) {
    const temp = this.filters[posAfter];
    this.filters[posAfter] = this.filters[posBefore];
    this.filters[posBefore] = temp;
    this.fire(FilterManager.EVENT_SORT_CHANGED, this.filters);

  }

  /**
   * returns the current filter
   * @return {Promise<Range1D>}
   */
  async currentFilter() {
    let filtered = Range1D.all();
    for (const f of this.filters) {
      filtered = await f.filter(filtered);

    }
    console.log((<any>filtered).dim(0).asList());
    return filtered;
  }

  private async refilter() {
    // compute the new filter

    const filter = await this.currentFilter();
    console.log((<any>filter).dim(0).asList());
    // console.log(this.filters)
    this.fire(FilterManager.EVENT_FILTER_CHANGED, filter);


  }

  private static createFilter(data: IFilterAbleType, parent: HTMLElement): AnyColumn {

    switch (data.desc.type) {
      case 'vector':
        const v = <IStringVector|ICategoricalVector|INumericalVector>data;
        switch (v.desc.value.type) {
          case VALUE_TYPE_STRING:
            return new StringFilter(<IStringVector>v, parent);
          case VALUE_TYPE_CATEGORICAL:
            return new CategoricalFilter(<ICategoricalVector>v, parent);
          case VALUE_TYPE_INT:
          case VALUE_TYPE_REAL:
            return new NumberFilter(<INumericalVector>v, parent);
        }
        throw new Error('invalid vector type');
      case 'matrix':
        const m = data;
        return new MatrixFilter(<INumericalMatrix>m, parent);
      default:
        throw new Error('invalid data type');


    }
  }
}
