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
import SortHandler from '../SortHandler/SortHandler';
import AVectorFilter from '../filter/AVectorFilter';
import {on} from 'phovea_core/src/event';
import AFilter from '../filter/AFilter';
import * as $ from 'jquery';
import 'jquery-ui/ui/widgets/sortable';
import {IAnyMatrix} from 'phovea_core/src/matrix/IMatrix';
import * as d3 from 'd3';
import min = d3.min;
import {scaleTo, makeRangeFromList, makeListFromRange, findColumnTie} from './utils';
import {IAnyVector} from 'phovea_core/src/vector/IVector';
import VisManager from './VisManager';
import {prepareRangeFromList} from '../SortHandler/SortHandler';
import {AnyFilter} from '../filter/AFilter';
import AggSwitcherColumn from './AggSwitcherColumn';
import {EAggregationType} from './VisManager';


export declare type AnyColumn = AColumn<any, IDataType>;
export declare type IMotherTableType = IStringVector|ICategoricalVector|INumericalVector|INumericalMatrix;

export default class ColumnManager extends EventHandler {
  static readonly EVENT_COLUMN_REMOVED = 'removed';
  static readonly EVENT_DATA_REMOVED = 'removedData';

  private $node: d3.Selection<any>;

  private aggSwitcherCol: AggSwitcherColumn;
  readonly columns: AnyColumn[] = [];
  private filtersHierarchy: AnyColumn[] = [];
  private firstColumnRange: Range;
  private stratifiedRanges: Range[]; // This is the rangelist used for stratification
  private nonStratifiedRange: Range; //This is the flatten Range which is obtained from Sort
  private visManager: VisManager;
  private colsWithRange = new Map();
  private dataPerStratificaiton; //The number of data elements per stratification
  private stratifyColid: string; // This is column Name used for stratification
  private rowCounter = 0;


  private onColumnRemoved = (event: IEvent) => this.remove(<AnyColumn>event.currentTarget);
  private onSortByColumnHeader = (event: IEvent, sortData) => this.fire(AVectorColumn.EVENT_SORTBY_COLUMN_HEADER, sortData);
  private onLockChange = (event: IEvent) => this.relayout();
  private onVisChange = (event: IEvent) => this.relayout();
  private stratifyMe = (event: IEvent, colid) => {
    this.stratifyColid = colid.data.desc.id;
    this.stratifyAndRelayout();
  };


  constructor(public readonly idType: IDType, public readonly orientation: EOrientation, public readonly $parent: d3.Selection<any>) {
    super();
    this.build();
    this.attachListener();
  }

  private build() {
    this.visManager = new VisManager();

    this.$node = this.$parent
      .classed('column-manager', true)
      .append('ol')
      .classed('columnList', true);

    $('.columnList', this.$parent.node()) // jquery
      .sortable({
        handle: '.labelName',
        axis: 'x',
        items: '> :not(.nodrag)'
      });

    this.aggSwitcherCol = new AggSwitcherColumn(null, EOrientation.Horizontal, this.$node);
  }

  private attachListener() {
    on(AVectorFilter.EVENT_SORTBY_FILTER_ICON, (evt: any, sortData: {sortMethod: string, col: AFilter<string,IMotherTableType>}) => {
      const col = this.filtersHierarchy.filter((d) => d.data.desc.id === sortData.col.data.desc.id);
      col[0].sortCriteria = sortData.sortMethod;
      this.updateColumns();
    });

    on(CategoricalColumn.EVENT_STRATIFYME, (evt: any, colid) => {

      const col = this.filtersHierarchy.filter((d) => d.data.desc.id === colid.data.desc.id);
      this.stratifyColid = col[0].data.desc.id;
      this.stratifyAndRelayout();
    });

    this.aggSwitcherCol.on(AggSwitcherColumn.EVENT_GROUP_AGG_CHANGED, (evt:any, index:number, value:EAggregationType, allGroups:EAggregationType[]) => {
      console.log(index, value, allGroups);
    });
  }

  get length() {
    return this.columns.length;
  }

  destroy() {
    // delete all columns, can't remove myself, since I'm using the parent
    this.$parent.selectAll('.column').remove();
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
    const col = createColumn(data, this.orientation, this.$node);

    if (this.firstColumnRange === undefined) {
      this.firstColumnRange = await data.ids();
    }

    col.on(AColumn.EVENT_REMOVE_ME, this.onColumnRemoved);
    col.on(AVectorColumn.EVENT_SORTBY_COLUMN_HEADER, this.onSortByColumnHeader);
    col.on(AColumn.EVENT_COLUMN_LOCK_CHANGED, this.onLockChange);
    col.on(CategoricalColumn.EVENT_STRATIFYME, this.stratifyMe);
    col.on(AColumn.VISUALIZATION_SWITCHED, this.onVisChange);

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
    col.off(AColumn.VISUALIZATION_SWITCHED, this.onVisChange);
    this.fire(ColumnManager.EVENT_COLUMN_REMOVED, col);
    this.fire(ColumnManager.EVENT_DATA_REMOVED, col.data);
    this.updateColumns();
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
    this.$parent.node().insertBefore(col.$node.node(), this.$parent.node().childNodes[index]);

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
    if (((!isNaN(idRange.ndim) && isFinite(idRange.ndim)) !== true) || idRange.size()[0] === 0) {
      this.columns.forEach((col) => col.updateMultiForms([idRange]));
      return;
    }

    for (const col of this.columns) {
      col.rangeView = idRange;
      col.dataView = await col.data.idView(idRange);
    }

    this.updateColumns();
  }

  /**
   * Find corresponding columns for given list of filters and update the sorted  hierarchy
   * @param filterList
   */
  mapFiltersAndSort(filterList: AnyFilter[]) {
    this.filtersHierarchy = filterList.map((d) => this.columns.filter((c) => c.data === d.data)[0]);
    this.updateColumns();
  }

  /**
   * Sort, stratify and render all columns
   */
  async updateColumns() {
    await this.sortColumns();
    await this.stratifyAndRelayout();
  }

  async stratifyAndRelayout() {
    this.updateStratifyID(this.stratifyColid);
    await this.stratifyColumns();
    this.relayout();
  }

  /**
   * Sorting the ranges based on the filter hierarchy
   */
  private async sortColumns() {
    const cols = this.filtersHierarchy;

    //special handling if matrix is added as first column
    if (cols.length === 0) {
      this.nonStratifiedRange = this.firstColumnRange;
      this.stratifiedRanges = [this.firstColumnRange];
      return;
    }

    // The sort object is created on the fly and destroyed after it exits this method
    const s = new SortHandler();
    const r = await s.sortColumns(cols);
    this.nonStratifiedRange = r.combined;
    this.stratifiedRanges = [r.combined];
    this.dataPerStratificaiton = r.stratified;
    cols.forEach((col) => {
      this.colsWithRange.set(col.data.desc.id, [this.nonStratifiedRange]);
    });

    const categoricalCol = cols.filter((c) => c.data.desc.value.type === VALUE_TYPE_CATEGORICAL);
    if (categoricalCol.length > 0 && this.stratifyColid === undefined) {
      this.stratifyColid = categoricalCol[0].data.desc.id;
    }
  }

  private async updateStratifyID(colid) {
    if (colid === undefined) {
      return;
    }
    this.stratifyColid = colid;
    const cols = this.filtersHierarchy;
    const datas = this.dataPerStratificaiton.get(colid);
    const prepareRange = prepareRangeFromList(makeListFromRange(this.nonStratifiedRange), [datas]);
    this.stratifiedRanges = prepareRange[0].map((d) => makeRangeFromList(d));
    cols.forEach((col) => {
      this.colsWithRange.set(col.data.desc.id, this.stratifiedRanges);
    });
  }

  /**
   *
   * @param idRange
   * @returns {Promise<void>}
   */
  private async stratifyColumns() {
    const vectorCols = this.columns.filter((col) => col.data.desc.type === AColumn.DATATYPE.vector);
    vectorCols.forEach((col) => {
      const r = this.colsWithRange.get(col.data.desc.id);
      col.updateMultiForms(r);
    });

    // update matrix column with last sorted range
    const matrixCols = this.columns.filter((col) => col.data.desc.type === AColumn.DATATYPE.matrix);
    matrixCols.map((col) => col.updateMultiForms(this.stratifiedRanges));


    // update aggregation switcher column
    this.aggSwitcherCol.updateMultiForms(this.stratifiedRanges);

    //update the stratifyIcon
    this.updateStratifyIcon(findColumnTie(this.filtersHierarchy));
  }

  private updateStratifyIcon(columnIndexForTie: number) {

    //Categorical Columns after the numerical or string
    const catFiltersAfterTie = this.filtersHierarchy.filter((d, i) => i > columnIndexForTie)
      .filter((col) => col.data.desc.value.type === VALUE_TYPE_CATEGORICAL);
    catFiltersAfterTie.forEach((col) => {
      const s = col.$node.select('.toolbar').select('.fa.fa-bars.fa-fw');
      s.classed('fa fa-bars fa-fw', false);
    });


    //Categorical Columns before the numerical or string
    const catFilterBeforeTie = this.filtersHierarchy.filter((d, i) => i < columnIndexForTie)
      .filter((col) => col.data.desc.value.type === VALUE_TYPE_CATEGORICAL);
    catFilterBeforeTie.forEach((col) => {
      const s = col.$node.select('.toolbar').select('i');
      s.classed('fa fa-bars fa-fw', true);
    });
  }


  async relayout() {
    await resolveIn(10);
    this.relayoutColStrats();
    const header = 47;//TODO solve programatically
    const height = Math.min(...this.columns.map((c) => c.$node.property('clientHeight') - header));
    const rowHeight = await this.calColHeight(height);
    const colWidths = distributeColWidths(this.columns, this.$parent.property('clientWidth'));

    if (this.columns.length > 0) {
      this.aggSwitcherCol.updateSwitcherBlocks(this.columns[0].multiformList.map((d, i) => rowHeight[0][i]));
    }

    this.columns.forEach((col, i) => {
      col.$node.style('width', colWidths[i] + 'px');

      col.multiformList.forEach((multiform, index) => {
        this.visManager.assignVis(multiform, colWidths[i], rowHeight[i][index]);
        scaleTo(multiform, colWidths[i], rowHeight[i][index], col.orientation);
      });
    });
  }

  /**
   * Calculate the maximum height of all column stratification areas and set it for every column
   */
  private relayoutColStrats() {
    const $strats = this.$node.selectAll('aside')
      .style('height', null); // remove height first, to calculate a new one
    const maxHeight = Math.max(...$strats[0].map((d: HTMLElement) => d.clientHeight));
    $strats.style('height', maxHeight + 'px');
  }

  private async calColHeight(height) {
    let ranges = [];
    let minHeights = [];
    let maxHeights = [];
    let index = 0;
    let totalMin = 0;
    let totalMax = 0;


    //switch all visses that can be switched to unaggregated and test if they can be shown as unaggregated
    /****************************************************************************************/
    for(let i =0; i< this.columns[0].multiformList.length; i++){
        this.updateAggregationLevelForRow(i, EAggregationType.UNAGGREGATED);
    }

    //first run - check if the unagregatted columns fit and if not, switch all non-user-unaggregated rows to aggregated
    let aggregationNeeded = false;
    for (const col of this.columns) {
      const minSizes = this.visManager.computeMinHeight(col);
      if (d3.sum(minSizes) > height) {
        aggregationNeeded = true;
      }
      minHeights.push(minSizes);
    }

    if(!aggregationNeeded) {
      //choose minimal block height for each row of multiforms/stratification group
      for (let i = 0; i < this.columns[0].multiformList.length; i++) {
        let minSize = [];
        minHeights.forEach((m) => {
          minSize.push(m[i]);
        });
        let min = Math.max(...minSize);
        minHeights.forEach((m) => {
          m[i] = min;
        });
        totalMin = totalMin + min;
      }
      if(totalMin > height){
        aggregationNeeded = true;
      }
    }

    /*************************************************************************/

    totalMin = 0;
    minHeights = [];


    for(let i =0; i< this.columns[0].multiformList.length; i++){
      let aggMode = aggregationNeeded ? EAggregationType.AGGREGATED : EAggregationType.UNAGGREGATED;
      this.updateAggregationLevelForRow(i, aggMode);
    }


    //copute height requiremmts per column
    for (const col of this.columns) {
      const type = col.data.desc.type;
      let range = this.colsWithRange.get(col.data.desc.id);
      const temp = [];

      if (range === undefined) {
        range = this.stratifiedRanges;
      }
      const minSizes = this.visManager.computeMinHeight(col);

      for (const r of range) {
        const view = await
          col.data.idView(r);
        (type === AColumn.DATATYPE.matrix) ? temp.push(await(<IAnyMatrix>view).nrow) : temp.push(await(<IAnyVector>view).length);
      }

      const min = minSizes;
      const max = temp.map((d) => col.maxHeight * d);

      minHeights.push(min);
      maxHeights.push(max);

      totalMax = totalMax > d3.sum(max) ? totalMax : d3.sum(max);//TODO compute properly based on visses!

      index = index + 1;
    }

    //choose minimal block height for each row of multiforms/stratification group
    for (let i = 0; i < this.columns[0].multiformList.length; i++) {
      let minSize = [];
      minHeights.forEach((m) => {
        minSize.push(m[i]);
      });
      let min = Math.max(...minSize);
      minHeights.forEach((m) => {
        m[i] = min;
      });
      totalMin = totalMin + min;
    }

    let totalHeight = height < totalMin ? totalMin : height;

    minHeights = minHeights.map((d, i) => {
      const minScale = d3.scale.linear().domain([0, d3.sum(d)]).range([0, totalHeight]);
      let h = d3.sum(d.map((e) => minScale(e)));
      return d.map((e) => minScale(e));
    });


    maxHeights = maxHeights.map((d, i) => {
      const maxScale = d3.scale.linear().domain([0, d3.sum(d)]).range([0, totalMax]);
      return d.map((e) => maxScale(e));
    });

    if (totalMin > height) {
      return minHeights;
    } else if (totalMax > height) {
      return minHeights;
    } else if (totalMax < height) {
      return maxHeights;
    } else {
      return minHeights;
    }
  }

  private updateAggregationLevelForRow(rowIndex: number, aggregationType:EAggregationType) {
    this.columns.forEach((col) => {
      VisManager.multiformAggregationType.set(col.multiformList[rowIndex].id, aggregationType);
    });
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


export function createColumn(data: IMotherTableType, orientation: EOrientation, $parent: d3.Selection<any>): AnyColumn {
  switch (data.desc.type) {
    case AColumn.DATATYPE.vector:
      const v = <IStringVector|ICategoricalVector|INumericalVector>data;
      switch (v.desc.value.type) {
        case VALUE_TYPE_STRING:
          return new StringColumn(<IStringVector>v, orientation, $parent);
        case VALUE_TYPE_CATEGORICAL:
          return new CategoricalColumn(<ICategoricalVector>v, orientation, $parent);
        case VALUE_TYPE_INT:
        case VALUE_TYPE_REAL:
          return new NumberColumn(<INumericalVector>v, orientation, $parent);
      }
      throw new Error('invalid vector type');

    case AColumn.DATATYPE.matrix:
      const m = <INumericalMatrix>data;
      switch (m.desc.value.type) {
        case VALUE_TYPE_INT:
        case VALUE_TYPE_REAL:
          return new MatrixColumn(<INumericalMatrix>m, orientation, $parent);
      }
      throw new Error('invalid matrix type');

    default:
      throw new Error('invalid data type');
  }
}
