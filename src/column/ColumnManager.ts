/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

import {INumericalMatrix} from 'phovea_core/src/matrix';
import {ICategoricalVector, INumericalVector} from 'phovea_core/src/vector';
import {
  VALUE_TYPE_STRING, VALUE_TYPE_CATEGORICAL, VALUE_TYPE_INT, VALUE_TYPE_REAL,
  IDataType
} from 'phovea_core/src/datatype';
import Range from 'phovea_core/src/range/Range';
import {IStringVector, AVectorColumn} from './AVectorColumn';
import AColumn, {EOrientation} from './AColumn';
import CategoricalColumn from './CategoricalColumn';
import StringColumn from './StringColumn';
import NumberColumn from './NumberColumn';
import MatrixColumn from './MatrixColumn';
import {IEvent, EventHandler} from 'phovea_core/src/event';
import {resolveIn} from 'phovea_core/src';
import IDType from 'phovea_core/src/idtype/IDType';
import SortEventHandler from '../SortEventHandler/SortEventHandler';
import AVectorFilter from '../filter/AVectorFilter';
import {on} from 'phovea_core/src/event';
import AFilter from '../filter/AFilter';
import * as $ from 'jquery';
import 'jquery-ui/ui/widgets/sortable';
import {IAnyMatrix} from 'phovea_core/src/matrix/IMatrix';
import * as d3 from 'd3';
import min = d3.min;
import {scaleTo} from './utils';
import {IAnyVector} from 'phovea_core/src/vector/IVector';
import VisManager from './VisManager';

export declare type AnyColumn = AColumn<any, IDataType>;
export declare type IMotherTableType = IStringVector|ICategoricalVector|INumericalVector|INumericalMatrix;

export default class ColumnManager extends EventHandler {
  static readonly EVENT_COLUMN_REMOVED = 'removed';
  static readonly EVENT_DATA_REMOVED = 'removedData';

  readonly columns: AnyColumn[] = [];
  private filtersHierarchy: AnyColumn[] = [];
  private firstColumnRange: Range;
  private rangeList = [];
  private visManager: VisManager;
  private colsWithRange = new Map();

  private onColumnRemoved = (event: IEvent) => this.remove(<AnyColumn>event.currentTarget);
  private onSortByColumnHeader = (event: IEvent, sortData) => this.fire(AVectorColumn.EVENT_SORTBY_COLUMN_HEADER, sortData);
  private onLockChange = (event: IEvent) => this.relayout();

  constructor(public readonly idType: IDType, public readonly orientation: EOrientation, public readonly node: HTMLElement) {
    super();
    this.build();
    this.attachListener();
  }

  private build() {
    this.visManager = new VisManager();
    d3.select(this.node)
      .classed('column-manager', true)
      .append('ol')
      .classed('columnList', true);

    $('.columnList', this.node) // jquery
      .sortable({handle: '.columnHeader', axis: 'x'});
    
    on(AVectorFilter.EVENT_SORTBY_FILTER_ICON, this.sortByFilterIcon.bind(this));
  }

  private attachListener() {
    on(AVectorFilter.EVENT_SORTBY_FILTER_ICON, (evt: any, sortData: {sortMethod: string, col: AFilter<string,IMotherTableType>}) => {
      const col = this.filtersHierarchy.filter((d) => d.data.desc.id === sortData.col.data.desc.id);
      col[0].sortCriteria = sortData.sortMethod;
      this.updateSort();
    });
  }

  get length() {
    return this.columns.length;
  }

  destroy() {
    // delete all columns, can't remove myself, since I'm using the parent
    const items = <HTMLElement[]>Array.from(this.node.querySelectorAll('.column'));
    items.forEach((d) => d.remove());
  }

  /**
   * Adding a new column from given data
   * Called when adding a new filter from dropdown or from hash
   *
   * @param data
   * @returns {Promise<AnyColumn>}
   */
  async push(data: IMotherTableType) {
    // if (data.idtypes[0] !== this.idType) {
    //   throw new Error('invalid idtype');
    // }
    const col = createColumn(data, this.orientation, this.node);

    if (this.firstColumnRange === undefined) {
      this.firstColumnRange = await data.ids();
    }

    col.on(AColumn.EVENT_REMOVE_ME, this.onColumnRemoved);
    col.on(AVectorColumn.EVENT_SORTBY_COLUMN_HEADER, this.onSortByColumnHeader);
    col.on(AColumn.EVENT_COLUMN_LOCK_CHANGED, this.onLockChange);

    this.columns.push(col);

    // add column to hierarchy if it isn't a matrix and already added
    const id = this.filtersHierarchy.filter((c) => c.data.desc.id === col.data.desc.id);
    if (col.data.desc.type !== AColumn.DATATYPE.matrix && id.length === 0) {
      this.filtersHierarchy.push(col);
    }

    return col;
  }

  remove(col: AnyColumn) {
    this.columns.splice(this.columns.indexOf(col), 1);
    col.$node.remove();
    col.off(AColumn.EVENT_REMOVE_ME, this.onColumnRemoved);
    col.off(AVectorColumn.EVENT_SORTBY_COLUMN_HEADER, this.onSortByColumnHeader);
    col.off(AColumn.EVENT_COLUMN_LOCK_CHANGED, this.onLockChange);
    this.fire(ColumnManager.EVENT_COLUMN_REMOVED, col);
    this.fire(ColumnManager.EVENT_DATA_REMOVED, col.data);
    this.relayout();
  }

  /**
   * move a column at the given index
   * @param col
   * @param index
   */
  move(col: AnyColumn, index: number) {
    const old = this.columns.indexOf(col);
    if (old === index) {
      return;
    }
    //move the dom element, too
    this.node.insertBefore(col.$node.node(), this.node.childNodes[index]);

    this.columns.splice(old, 1);
    if (old < index) {
      index -= 1; //shifted because of deletion
    }
    this.columns.splice(index, 0, col);
    this.relayout();
  }

  /**
   * Apply a filtered range to all columns
   * @param idRange
   * @returns {Promise<void>}
   */
  async filterData(idRange: Range) {
    for (const col of this.columns) {
      col.rangeView = idRange;
      col.dataView = await col.data.idView(idRange);
    }

    this.updateSort();
  }

  /**
   * Find corresponding columns for given list of filters and update the sorted hierarchy
   * @param filterList
   */
  mapFiltersAndSort(filterList: AnyColumn[]) {
    this.filtersHierarchy = filterList.map((d) => this.columns.filter((c) => c.data === d.data)[0]);
    this.updateSort();
  }


  /**
   * Sorting the ranges based on the filter hierarchy
   */
  async updateSort() {
    const cols = this.filtersHierarchy;

    // special handling if matrix is added as first column
    if (cols.length === 0) {
      this.rangeList = [[this.firstColumnRange]];
      this.updateColumns(this.rangeList);
      return;
    }

    // The sort object is created on the fly and destroyed after it exits this method
    const s = new SortEventHandler();
    this.rangeList = await s.sortColumns(cols);

    cols.forEach((col, index) => {
      this.colsWithRange.set(col.data.desc.id, this.rangeList[index]);
    });

    this.updateColumns(this.rangeList);
  }

  /**
   *
   * @param idRange
   * @returns {Promise<void>}
   */
  private async updateColumns(idRange: Range[][]) {
    const vectorCols = this.columns.filter((col) => col.data.desc.type === AColumn.DATATYPE.vector);
    vectorCols.forEach((col) => {
      const r = this.colsWithRange.get(col.data.desc.id);
      col.updateMultiForms(r);
    });

    // update matrix column with last sorted range
    const matrixCols = this.columns.filter((col) => col.data.desc.type === AColumn.DATATYPE.matrix);
    matrixCols.map((col) => col.updateMultiForms(idRange[idRange.length - 1]));

    this.relayout();
  }

  async relayout() {
    await resolveIn(10);
    const height = Math.min(...this.columns.map((c) => c.$node.property('clientHeight') - c.$node.select('header').property('clientHeight')));
    const rowHeight = await this.calColHeight(height);
    const colWidths = distributeColWidths(this.columns, this.node.clientWidth);
    // compute margin for the column stratifications (from @mijar)
    const verticalMargin = this.columns.reduce((prev, c) => {
      const act = c.getVerticalMargin();
      return {top: Math.max(prev.top, act.top), bottom: Math.max(prev.bottom, act.bottom)};
    }, {top: 0, bottom: 0});

    this.columns.forEach((col, i) => {
      const margin = col.getVerticalMargin();
      col.$node
        .style('margin-top', (verticalMargin.top - margin.top) + 'px')
        .style('margin-bottom', (verticalMargin.bottom - margin.bottom) + 'px')
        .style('width', colWidths[i] + 'px');

      col.multiformList.forEach((multiform, index) => {
        this.visManager.assignVis(multiform, colWidths[i], rowHeight[i][index]);
        scaleTo(multiform, colWidths[i], rowHeight[i][index], col.orientation);
      });
    });
  }

  private async calColHeight(height) {
    let minHeights = [];
    let maxHeights = [];
    let index = 0;
    let totalMin = 0;
    let totalMax = 0;

    for (const col of this.columns) {
      const type = col.data.desc.type;
      let range = this.colsWithRange.get(col.data.desc.id);
      const temp = [];

      if (range === undefined) {
        range = this.rangeList[this.rangeList.length - 1];
      }

      let minSizes = this.visManager.computeMinHeight(col);
      for (const r of range) {
        const view = await col.data.idView(r);
        (type === AColumn.DATATYPE.matrix) ? temp.push(await (<IAnyMatrix>view).nrow) : temp.push(await (<IAnyVector>view).length);
      }
      
      const minRange = Math.min(...temp);
      const minSize = Math.min(...minSizes);
      const scale = minSize / minRange;

      // console.log(temp)
      const min = temp.map((d) => scale * d);
      const max = temp.map((d) => col.maxHeight * d);//TODO this is not true if we have e.g. just 1 - 5 items in multiform

      minHeights.push(min);
      maxHeights.push(max);

      totalMax = d3.max([totalMax, d3.sum(max)]);
      totalMin = d3.max([totalMin, d3.sum(min)]);

      index = index + 1;
    }


    minHeights = minHeights.map((d, i) => {
      const minScale = d3.scale.linear().domain([0, d3.sum(d)]).range([0, totalMin]);
      return d.map((e) => minScale(e));
    });

    maxHeights = maxHeights.map((d, i) => {
      const maxScale = d3.scale.linear().domain([0, d3.sum(d)]).range([0, totalMax]);
      return d.map((e) => maxScale(e));
    });

    const nodeHeightScale = d3.scale.linear().domain([0, totalMin]).range([0, height]);
    const flexHeights = minHeights.map((d, i) => {
      return d.map((e) => nodeHeightScale(e));
    });

    const checkStringCol = this.columns.filter((d) => (<any>d).data.desc.value.type === VALUE_TYPE_STRING);
    if (checkStringCol.length > 0 && totalMax > height) {
      return minHeights;
    } else if (checkStringCol.length > 0 && totalMax < totalMin) {
      return minHeights;
    } else if (totalMax < height) {
      return maxHeights;
    } else {
      return flexHeights;
    }

  }
}


/**
 * Distributes a list of columns for the containerWidth.
 * Note about the implementation:
 * - Columns that have `lockedWidth > -1` do not scale
 * - Columns cannot be smaller than the given `minWidth`
 * - Columns cannot be larger than the given `maxWidth`
 * - Columns get wider unequally (until reaching their `maxWidth`), based on the defined `minWidth`
 *
 * @param columns
 * @param containerWidth
 * @returns {number[]}
 */
export function distributeColWidths(columns: {lockedWidth: number, minWidth: number, maxWidth: number}[], containerWidth: number): number[] {
  // set minimum width or locked width for all columns
  const cols = columns.map((d) => {
    const newWidth = (d.lockedWidth > 0) ? d.lockedWidth : d.minWidth;
    return {
      col: d,
      newWidth,
      isLocked: (d.lockedWidth > 0),
      hasMaxWidth: (newWidth >= d.maxWidth),
    };
  });

  let spaceLeft = containerWidth - cols.map((d) => d.newWidth).reduce((acc, val) => acc + val, 0);
  let openResizes = 0;

  // if there is still space left try to expand columns until every column reaches their maximum width
  while (spaceLeft > 0) {
    // candidates that could be resized
    const resizeCandidates = cols.filter((d) => d.isLocked === false && d.hasMaxWidth === false);

    resizeCandidates.map((d, i, arr) => {
      // new width is the equally divided space left
      const newWidth = d.newWidth + (spaceLeft / arr.length);
      // do not exceed the maximum width
      d.newWidth = Math.min(d.col.maxWidth, newWidth);
      d.hasMaxWidth = (newWidth >= d.col.maxWidth);
    });

    // refresh space left
    spaceLeft = containerWidth - cols.map((d) => d.newWidth).reduce((acc, val) => acc + val, 0);

    // cancel loop if there is any column available for resizing
    if (resizeCandidates.length === openResizes) {
      break;
    }
    openResizes = resizeCandidates.length;
  }
  return cols.map((d) => d.newWidth);
}


export function createColumn(data: IMotherTableType, orientation: EOrientation, parent: HTMLElement): AnyColumn {
  switch (data.desc.type) {
    case 'vector':
      const v = <IStringVector|ICategoricalVector|INumericalVector>data;
      switch (v.desc.value.type) {
        case VALUE_TYPE_STRING:
          return new StringColumn(<IStringVector>v, orientation, parent);
        case VALUE_TYPE_CATEGORICAL:
          return new CategoricalColumn(<ICategoricalVector>v, orientation, parent);
        case VALUE_TYPE_INT:
        case VALUE_TYPE_REAL:
          return new NumberColumn(<INumericalVector>v, orientation, parent);
      }
      throw new Error('invalid vector type');
    case 'matrix':
      const m = <INumericalMatrix>data;
      switch (m.desc.value.type) {
        case VALUE_TYPE_INT:
        case VALUE_TYPE_REAL:
          return new MatrixColumn(<INumericalMatrix>m, orientation, parent);
      }
      throw new Error('invalid matrix type');
    default:
      throw new Error('invalid data type');
  }
}
