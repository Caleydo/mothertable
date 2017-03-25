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
import {resolveIn, mod} from 'phovea_core/src';
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
import {
  scaleTo, updateRangeList, makeRangeFromList, makeListFromRange, makeArrayBetweenNumbers, checkArraySubset
} from './utils';
import {IAnyVector} from 'phovea_core/src/vector/IVector';
import VisManager from './VisManager';
import {prepareRangeFromList} from '../SortHandler/SortHandler';
import {AnyFilter} from '../filter/AFilter';
import AggSwitcherColumn from './AggSwitcherColumn';
import {EAggregationType} from './VisManager';
import {List} from 'phovea_vis/src/list';

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
  private _stratifiedRanges: Range[]; // This is the rangelist used for stratification
  private nonStratifiedRange: Range; //This is the flatten Range which is obtained from Sort
  private visManager: VisManager;
  private colsWithRange = new Map();
  private dataPerStratificaiton; //The number of data elements per stratification
  private stratifyColid: string; // This is column Name used for stratification
  private _brushedRanges: Range[] = [];
  private brushedItems = [];
  private totalbrushed: number[] = [];
  private _multiformRangeList;
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
    on(List.EVENT_BRUSHING, this.updateBrushing.bind(this));
    on(List.EVENT_BRUSH_CLEAR, this.clearBrush.bind(this));



    this.aggSwitcherCol.on(AggSwitcherColumn.EVENT_GROUP_AGG_CHANGED, (evt: any, index: number, value: EAggregationType, allGroups: EAggregationType[]) => {
      this.relayout();
      console.log(index, value, allGroups);
    });
  }

  get length() {
    return this.columns.length;
  }

  get stratifiedRanges(): Range[] {
    return this._stratifiedRanges;
  }

  get multiformRangeList() {
    return this._multiformRangeList;
  }

  get brushedRanges(): Range[] {
    return this._brushedRanges;
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

  clearBrush(evt: any, brushIndices: any[]) {
    this.brushedItems = [];
    this.totalbrushed = [];
    this._brushedRanges = [];
  }

  async updateBrushing(evt: any, brushIndices: any[], multiformData: IAnyVector) {

    const a = await this.getBrushIndices(brushIndices, multiformData);
    this.brushedItems.push(a);
    this.totalbrushed = this.totalbrushed.concat(brushIndices);
    //console.log(this.brushedItems, a)
    this._brushedRanges.push(makeRangeFromList(a));
    this.stratifyAndRelayout();

  }

  async updateRangeList(brushedIndices: number[][]) {
    const newRange = updateRangeList(this._stratifiedRanges, brushedIndices);
    //   console.log(newRange)
    // this.brushedRange = makeRangeFromList(brushedStringIndices);
    this.filtersHierarchy.forEach((col) => {
      this.colsWithRange.set(col.data.desc.id, newRange);
    });
    this._multiformRangeList = newRange;


  }


  async getBrushIndices(stringList: number[], multiformData: IAnyVector) {
    const m = (await multiformData.ids()).dim(0).asList();
    return m.slice(stringList[0], stringList[1] + 1);
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

    let oldRanges: Map<number, Range> = new Map<number, Range>();
    if(this._stratifiedRanges) {
      this._stratifiedRanges.forEach((r, index) => {
        oldRanges.set(index, r);
      });
    }

    await this.sortColumns();
    await this.stratifyAndRelayout();

    this.updateAggModePerGroupAfterNewStrat(oldRanges);
  }

  async stratifyAndRelayout() {
    await this.updateStratifyID(this.stratifyColid);
    if (this.totalbrushed.length === 0) {
      await this.stratifyColumns();
      this.relayout();
      return;
    }

    await this.updateRangeList(this.brushedItems);
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
      this._stratifiedRanges = [this.firstColumnRange];
      return;
    }

    // The sort object is created on the fly and destroyed after it exits this method
    const s = new SortHandler();
    const r = await s.sortColumns(cols);
    this.nonStratifiedRange = r.combined;
    this._stratifiedRanges = [r.combined];
    this.dataPerStratificaiton = r.stratified;
    cols.forEach((col) => {
      this.colsWithRange.set(col.data.desc.id, [this.nonStratifiedRange]);
    });

    const categoricalCol = cols.filter((c) => c.data.desc.value.type === VALUE_TYPE_CATEGORICAL);
    if (categoricalCol.length > 0 && this.stratifyColid === undefined) {
      this.stratifyColid = categoricalCol[0].data.desc.id;
    }


  }

  private updateAggModePerGroupAfterNewStrat(oldRanges){
    let newAggModePergroup = [];
    this._stratifiedRanges.forEach((newR, newId) => {
      let isSuccesor = Array.from(oldRanges.keys()).some((l, oldId) => {
          let newRange = newR.dims[0].asList();
          let originalRange = oldRanges.get(l).dims[0].asList();
          if (newRange.toString() === originalRange.toString() || checkArraySubset(originalRange, newRange) || checkArraySubset(newRange, originalRange)) {
            if(VisManager.modePerGroup[oldId] != undefined){
              newAggModePergroup[newId] = VisManager.modePerGroup[oldId];
            } else {
              newAggModePergroup[newId] = EAggregationType.AUTOMATIC;
            }

            return true;
          }
      });
      if(!isSuccesor){
        newAggModePergroup[newId] = EAggregationType.AUTOMATIC;
      }
    });
    VisManager.modePerGroup = newAggModePergroup;

  }

  private async updateStratifyID(colid) {
    if (colid === undefined) {
      return;
    }

    this.stratifyColid = colid;
    const cols = this.filtersHierarchy;
    const datas = this.dataPerStratificaiton.get(colid);
    const prepareRange = prepareRangeFromList(makeListFromRange(this.nonStratifiedRange), [datas]);
    this._stratifiedRanges = prepareRange[0].map((d) => makeRangeFromList(d));
    if (this.totalbrushed.length === 0) {
      cols.forEach((col) => {
        this.colsWithRange.set(col.data.desc.id, this._stratifiedRanges);
      });

      this._multiformRangeList = this._stratifiedRanges;
    }

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
      col.updateMultiForms(r, this._stratifiedRanges, this._brushedRanges);
    });

    // update matrix column with last sorted range
    const matrixCols = this.columns.filter((col) => col.data.desc.type === AColumn.DATATYPE.matrix);
    matrixCols.map((col) => col.updateMultiForms(this._multiformRangeList, this._stratifiedRanges, this._brushedRanges));

    // update aggregation switcher column
    this.aggSwitcherCol.updateMultiForms(this._stratifiedRanges);
  }

  async relayout() {
    await resolveIn(10);
    this.relayoutColStrats();
    // this.setGroupFlag();
    this.correctGapBetwnMultiform();
    const header = 47;//TODO solve programatically
    const height = Math.min(...this.columns.map((c) => c.$node.property('clientHeight') - header));
    const rowHeight = await this.calColHeight(height);
    const colWidths = distributeColWidths(this.columns, this.$parent.property('clientWidth'));

    //  console.log(rowHeight)
    if (this.columns.length > 0) {
      this.aggSwitcherCol.updateSwitcherBlocks(
        this._stratifiedRanges.map((d, i) => {
          let height = 0;
          this.multiformsInGroup(i).forEach((m) =>{
            height = height + rowHeight[m];
          });
          return height;
        })
      );
    }

    this.columns.forEach((col, i) => {
      col.$node.style('width', colWidths[i] + 'px');
      console.log(col.multiformList);
      col.multiformList.forEach((multiform, index) => {
        this.visManager.assignVis(multiform);
        scaleTo(multiform, colWidths[i], rowHeight[index], col.orientation);
      });
    });
  }

  private multiformsInGroup(groupIndex: number) {
    let multiformList = [];
    this._multiformRangeList.forEach((r, index) => {
      const m = this._stratifiedRanges
        .map((s) => s.intersect(r).size()[0]);
      const a = m.filter((d) => d > 0);
      const sd = m.indexOf(a[0]);
      if(groupIndex === sd){
        multiformList.push(index);
      }
    });
  return multiformList;
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
    let minHeights = [];
    let maxHeights = [];
    let index = 0;
    let totalMin = 0;
    let totalMax = 0;
    //switch all visses that can be switched to unaggregated and test if they can be shown as unaggregated
    /****************************************************************************************/
    for (let i = 0; i < this.columns[0].multiformList.length; i++) {
      let mode = VisManager.modePerGroup[i] === EAggregationType.AUTOMATIC ? EAggregationType.UNAGGREGATED : VisManager.modePerGroup[i];

      this.updateAggregationLevelForRow(i, mode);
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

    if (!aggregationNeeded) {
      //choose minimal block height for each row of multiforms/stratification group
      for (let i = 0; i < this.columns[0].multiformList.length; i++) {
        const minSize = [];
        minHeights.forEach((m) => {
          minSize.push(m[i]);
        });
        const min = Math.max(...minSize);
        minHeights.forEach((m) => {
          m[i] = min;
        });
        totalMin = totalMin + min;
      }
      if (totalMin > height) {
        aggregationNeeded = true;
      }
    }

    /*************************************************************************/

    totalMin = 0;
    minHeights = [];

    //set the propper aggregation level
    for (let i = 0; i < this.columns[0].multiformList.length; i++) {
      if (VisManager.modePerGroup[i] === EAggregationType.AUTOMATIC) {
        let mode = aggregationNeeded ? EAggregationType.AGGREGATED : EAggregationType.UNAGGREGATED;
        this.updateAggregationLevelForRow(i, mode);
      } else {
        this.updateAggregationLevelForRow(i, VisManager.modePerGroup[i]);
      }
    }
    //copute height requiremmts per column
    for (const col of this.columns) {
      const type = col.data.desc.type;
      let range = this.colsWithRange.get(col.data.desc.id);
      const temp = [];

      if (range === undefined) {
        range = this._stratifiedRanges;
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

    let totalAggreg = 0;
    //choose minimal and maximal block height for each row of multiforms/stratification group
    for (let i = 0; i < this.columns[0].multiformList.length; i++) {
      let minSize = [];
      minHeights.forEach((m) => {
        minSize.push(m[i]);
      });
      let min = Math.max(...minSize);
      if (VisManager.modePerGroup[i] === EAggregationType.AGGREGATED || (VisManager.modePerGroup[i] === EAggregationType.AUTOMATIC && aggregationNeeded)) {
        min = 60;
        totalAggreg = totalAggreg + min;
      }
      minHeights.forEach((m) => {
        m[i] = min;
      });
      maxHeights.forEach((m) => {
        if (VisManager.modePerGroup[i] === EAggregationType.AGGREGATED || (VisManager.modePerGroup[i] === EAggregationType.AUTOMATIC && aggregationNeeded)) {
          m[i] = min;
        }
      });
      totalMin = totalMin + min;
    }

    let totalMinUnaggregatedHeight = totalMin - totalAggreg;
    let spaceForUnaggregated = (height - totalAggreg) > totalMinUnaggregatedHeight ? (height - totalAggreg) : totalMinUnaggregatedHeight;

    minHeights = minHeights.map((d, i) => {
      const minScale = d3.scale.linear().domain([0, totalMinUnaggregatedHeight]).range([0, spaceForUnaggregated]);
      return d.map((e, j) => {
        return minScale(e) > maxHeights[i][j] || minScale(e) === 0 ? maxHeights[i][j] : minScale(e);
      });
    });

    console.log(this._brushedRanges)
    minHeights = minHeights[0];
    maxHeights = maxHeights[0];


    return minHeights;

  }

  private updateAggregationLevelForRow(rowIndex: number, aggregationType: EAggregationType) {
    this.columns.forEach((col) => {
      this.multiformsInGroup(rowIndex).forEach((m) => {
         VisManager.multiformAggregationType.set(col.multiformList[m].id, aggregationType);
       });
    });
  }



  private correctGapBetwnMultiform() {
    this.columns.forEach((col, i) => {
      col.multiformList.forEach((multiform, index) => {
        if (index + 1 < col.multiformList.length) {
          const nextM = (<any>col).multiformList[index + 1].groupId;
          const now = (<any>col).multiformList[index].groupId;
          if (nextM === now) {
            d3.select(multiform.node).select('.content').classed('nonstratification', true);
          } else {
            d3.select(multiform.node).select('.content').classed('stratification', true);
            return;
          }
        }
      });
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
