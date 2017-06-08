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
import {list} from 'phovea_core/src/range';
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
  scaleTo,
  updateRangeList,
  makeRangeFromList,
  makeListFromRange,
  checkArraySubset,
  findColumnTie
} from './utils';
import {IAnyVector} from 'phovea_core/src/vector/IVector';
import VisManager from './VisManager';
import {prepareRangeFromList} from '../SortHandler/SortHandler';
import {AnyFilter} from '../filter/AFilter';
import AggSwitcherColumn from './AggSwitcherColumn';
import {EAggregationType} from './VisManager';
import TaggleMultiform from './TaggleMultiform';
import {AGGREGATE} from './MatrixColumn';
import SupportView from '../SupportView';
import RowNumberColumn from './RowNumberColumn';
import Any = jasmine.Any;
import {hash} from 'phovea_core/src/index';

export declare type AnyColumn = AColumn<any, IDataType>;
export declare type IMotherTableType = IStringVector | ICategoricalVector | INumericalVector | INumericalMatrix;

export default class ColumnManager extends EventHandler {

  static readonly EVENT_COLUMN_REMOVED = 'columnRemoved';
  static readonly EVENT_COLUMN_ADDED = 'columnAdded';
  static readonly EVENT_DATA_REMOVED = 'removedData';

  private static readonly HASH_FILTER_DELIMITER = ',';

  private $node: d3.Selection<any>;

  private aggSwitcherCol: AggSwitcherColumn;
  private rowNumberCol: RowNumberColumn;
  readonly columns: AnyColumn[] = [];
  private filtersHierarchy: AnyColumn[] = [];
  private firstColumnRange: Range;
  private _stratifiedRanges: Range[]; // This is the rangelist used for stratification
  private nonStratifiedRange: Range; //This is the flatten Range which is obtained from Sort
  private visManager: VisManager;
  private colsWithRange = new Map();
  private dataPerStratificaiton; //The number of data elements per stratification
  private stratifyColId: string = null; // This is column Name used for stratification
  private _brushedRanges: Range[] = [];
  private brushedItems = [];
  private totalbrushed: number[] = [];
  private _multiformRangeList: Range[];

  private onColumnRemoved = (event: IEvent, data: IDataType) => this.remove(null, data);
  private onSortByColumnHeader = (event: IEvent, sortData) => this.fire(AVectorColumn.EVENT_SORTBY_COLUMN_HEADER, sortData);
  private onSortByFilterHeader = (event: IEvent, sortData) => {
    this.updateSortByIcons(sortData);
    this.fire(AVectorFilter.EVENT_SORTBY_FILTER_ICON, sortData);
  }
  private onLockChange = (event: IEvent) => this.relayout();
  private onVisChange = (event: IEvent) => this.relayout();
  private onMatrixToVector = (event: IEvent, data: IDataType, aggfunction, col) => this.fire(MatrixColumn.EVENT_CONVERT_TO_VECTOR, data, aggfunction, col);
  private onVectorToMatrix = (event: IEvent, data: IDataType) => this.fire(NumberColumn.EVENT_CONVERT_TO_MATRIX, data);
  private onWidthChanged = (event: IEvent) => this.setWidthToURLHash();
  private stratifyMe = (event: IEvent, colid) => {
    this.stratifyColId = colid.data.desc.id;
    this.stratifyAndRelayout();
  }

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

    this.aggSwitcherCol = new AggSwitcherColumn(null, EOrientation.Vertical, this.$node);
  }

  private attachListener() {
    on(AFilter.EVENT_REMOVE_ME, this.remove.bind(this));

    this.aggSwitcherCol.on(AggSwitcherColumn.EVENT_GROUP_AGG_CHANGED, async (evt: any, index: number, value: EAggregationType, allGroups: EAggregationType[]) => {
      this.updateRangeList(this.brushedItems);
      await this.stratifyColumns();
      this.relayout();
    });
  }

  get length() {
    return this.columns.length;
  }

  get stratifiedRanges(): Range[] {
    return this._stratifiedRanges;
  }

  updateSortByIcons(sortData: { col: AnyColumn, sortMethod: string }) {
    const col = this.filtersHierarchy.filter((d) => d.data.desc.id === sortData.col.data.desc.id);
    if (col.length === 0) {
      return;
    }
    col[0].sortCriteria = sortData.sortMethod;
    this.updateColumns();
    return col[0];
  }


  destroy() {
    // delete all columns, can't remove myself, since I'm using the parent
    this.$parent.selectAll('.column').remove();
  }

  private setWidthToURLHash() {
    hash.setProp('colWidths',
      this.filtersHierarchy
        .map((d) => d.width.toFixed())
        .join(ColumnManager.HASH_FILTER_DELIMITER)
    );
  }

  private initWidthFromURLHash(column: AnyColumn) {
    if (hash.has('colWidths')) {
      const widths = hash.getProp('colWidths')
        .split(ColumnManager.HASH_FILTER_DELIMITER);

      const width = parseFloat(widths[this.filtersHierarchy.indexOf(column)]);
      column.setFixedWidth(width);
    }
  }

  /**
   * Adding a new column from given data
   * Called when adding a new filter from dropdown or from hash
   *
   * @param data
   * @returns {Promise<AnyColumn>}
   */
  async push(data: IMotherTableType) {
    const col = createColumn(data, this.orientation, this.$node);
    if (this.firstColumnRange === undefined) {
      this.firstColumnRange = await data.ids();
    }
    col.on(AColumn.EVENT_REMOVE_ME, this.onColumnRemoved);
    col.on(AVectorColumn.EVENT_SORTBY_COLUMN_HEADER, this.onSortByColumnHeader);
    col.on(AColumn.EVENT_COLUMN_LOCK_CHANGED, this.onLockChange);
    col.on(CategoricalColumn.EVENT_STRATIFYME, this.stratifyMe);
    col.on(AColumn.VISUALIZATION_SWITCHED, this.onVisChange);
    col.on(AVectorFilter.EVENT_SORTBY_FILTER_ICON, this.onSortByFilterHeader);
    col.on(MatrixColumn.EVENT_CONVERT_TO_VECTOR, this.onMatrixToVector);
    col.on(NumberColumn.EVENT_CONVERT_TO_MATRIX, this.onVectorToMatrix);
    col.on(AColumn.EVENT_WIDTH_CHANGED, this.onWidthChanged);

    this.columns.push(col);

    // add column to hierarchy if it isn't a matrix and already added
    const id = this.filtersHierarchy.filter((c) => c.data.desc.id === col.data.desc.id);
    if (col.data.desc.type !== AColumn.DATATYPE.matrix && id.length === 0) {
      this.filtersHierarchy.push(col);
    }

    this.initWidthFromURLHash(col);

    this.fire(ColumnManager.EVENT_COLUMN_ADDED, col);

    return col;
  }

  remove(evt: any, data: IDataType) {
    const col = this.columns.find((d) => d.data === data);
    //IF column is already removed
    if (col === undefined) {
      return;
    }

    //Special case for the removing the parent dom of the projected vector from matrix.
    const parentNode = col.$node.node().parentNode.parentNode.parentNode;
    const checkParent = col.$node.node().parentNode.childNodes.length;
    col.$node.remove();
    this.columns.splice(this.columns.indexOf(col), 1);
    // no columns of attribute available --> delete from filter hierarchy for correct sorting
    if (this.columns.filter((d) => d.data.desc.id === col.data.desc.id).length === 0) {
      this.filtersHierarchy.splice(this.filtersHierarchy.indexOf(col), 1);
    }
    if (checkParent < 2) {
      parentNode.parentNode.removeChild(parentNode);
    }
    col.off(AColumn.EVENT_REMOVE_ME, this.onColumnRemoved);
    col.off(AVectorColumn.EVENT_SORTBY_COLUMN_HEADER, this.onSortByColumnHeader);
    col.off(AColumn.EVENT_COLUMN_LOCK_CHANGED, this.onLockChange);
    col.off(AColumn.VISUALIZATION_SWITCHED, this.onVisChange);
    col.off(MatrixColumn.EVENT_CONVERT_TO_VECTOR, this.onMatrixToVector);
    col.off(NumberColumn.EVENT_CONVERT_TO_MATRIX, this.onVectorToMatrix);
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


  convertMatrixToVector(col, aggfunction) {
    const flattenedData: any = col.map((c) => {
      return c.reduce((row: number[]) => aggregatorFunction(aggfunction, row));
    });
    return flattenedData;
  }

  updateTableView(flattenedMatrix: IAnyVector, col: AnyColumn) {
    const projectedcolumn = this.columns.find((c) => c.dataView === flattenedMatrix);
    if (projectedcolumn === undefined) {
      return;
    }
    const columnNode = col.$node;
    columnNode.select('aside').selectAll('ol').remove();
    const aggNode = (columnNode.select('header.columnHeader').selectAll('.fa.fa-exchange').node());
    if (aggNode === null) {
      this.addChangeIconMatrix(columnNode, col);
    }

    const selection = <HTMLElement>columnNode.select('main').selectAll('ol').node();
    const matrixDOM = this.getMatrixDOM(columnNode, selection);
    matrixDOM.node().appendChild(projectedcolumn.$node.node());
    projectedcolumn.$node.select('aside').remove();
    columnNode.style('width', null);
    columnNode.style('min-width', null);
    const childCount = (columnNode.selectAll('main').selectAll('ol').node().childNodes.length);
    if (childCount > 1) {
      columnNode.select('header.columnHeader')
        .classed('matrix', false)
        .select('.labelName')
        .classed('matrixLabel', false)
        .classed('matrixLabelExtended', true);

    } else {
      columnNode.select('header.columnHeader')
        .classed('matrix', true)
        .select('.labelName')
        .classed('matrixLabel', true);
    }
    const h = columnNode.select('header.columnHeader').node();
    columnNode.select('header.columnHeader').select('.taggle-axis').classed('extended', true);
    columnNode.select('aside').node().appendChild(h);
    const index = this.columns.indexOf(col);
    if (index === -1) {
      return;
    }
    this.columns.splice(index, 1); // Remove matrix column
    this.relayout();

  }

  private addChangeIconMatrix(columnNode: d3.Selection<any>, col: AnyColumn) {
    columnNode.select('header.columnHeader').selectAll('.onHoverToolbar').selectAll('*').remove();
    const aggIcon = columnNode.select('header.columnHeader').selectAll('.onHoverToolbar').insert('a', ':first-child')
      .attr('title', 'Aggregated Me')
      .html(`<i class="fa fa-exchange" aria-hidden="true"></i><span class="sr-only">Aggregate Me</span>`);
    columnNode.select('main').selectAll('.multiformList').remove();
    aggIcon.on('click', (d) => {
      const numberColNodes = columnNode.selectAll('ol').selectAll('li');
      const numberCols = numberColNodes[0].map((node) => this.columns.find((d) => d.$node.node() === node));
      this.fire(SupportView.EVENT_DATASETS_ADDED, col, numberCols);

    });

  }

  private getMatrixDOM(columnNode: d3.Selection<any>, selection: HTMLElement) {
    let matrixDOM;
    if (selection === null) {
      matrixDOM = columnNode.select('main').append('ol').classed('matrixTables', true);
    } else {
      matrixDOM = columnNode.select('main').select('ol');
    }

    return matrixDOM;
  }

  removeMatrixCol(col: AnyColumn, numberCols: AnyColumn[]) {
    numberCols.forEach((d) => this.remove(null, d.data));
    col.$node.remove();
  }

  updateRangeList(brushedIndices: number[][]) {
    const newRange = updateRangeList(this._stratifiedRanges, brushedIndices);
    this.filtersHierarchy.forEach((col) => {
      this.colsWithRange.set(col.data.desc.id, newRange);
    });
    this._multiformRangeList = newRange;
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
    this.filtersHierarchy = filterList.map((d) => this.columns.filter((c) => c.data.desc.id === d.data.desc.id)[0]);
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
    const oldRanges: Map<number, Range> = new Map<number, Range>();
    if (this._stratifiedRanges) {
      this._stratifiedRanges.forEach((r, index) => {
        oldRanges.set(index, r);
      });
    }

    this.stratifyColumnsByMe();
    this.updateStratifiedRanges();
    if (this.totalbrushed.length > 0) {
      this.updateRangeList(this.brushedItems);
    }

    await this.stratifyColumns();
    this.updateAggModePerGroupAfterNewStrat(oldRanges);
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


  }

  private updateAggModePerGroupAfterNewStrat(oldRanges: Map<number, Range>) {
    const newAggModePergroup = [];

    this._stratifiedRanges.forEach((newR, newId) => {
      const isSuccesor = Array.from(oldRanges.keys()).some((l, oldId) => {
        const newRange = newR.dims[0].asList();
        const originalRange = oldRanges.get(l).dims[0].asList();
        if (newRange.toString() === originalRange.toString() || checkArraySubset(originalRange, newRange) || checkArraySubset(newRange, originalRange)) {
          if (VisManager.modePerGroup[oldId] !== undefined) {
            newAggModePergroup[newId] = VisManager.modePerGroup[oldId];
          } else {
            newAggModePergroup[newId] = EAggregationType.UNAGGREGATED; //AUTOMATIC
          }

          return true;
        }
      });
      if (!isSuccesor) {
        newAggModePergroup[newId] = EAggregationType.UNAGGREGATED; //AUTOMATIC
      }
    });

    VisManager.modePerGroup = newAggModePergroup;
  }

  private updateStratifiedRanges() {

    //Return nothing if there is no stratification column
    if (this.stratifyColId === null) {
      return;
    }

    const cols = this.filtersHierarchy;
    const datas = this.dataPerStratificaiton.get(this.stratifyColId);
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
   * @returns {Promise<[TaggleMultiform[][],TaggleMultiform[][],TaggleMultiform[]]>}
   */
  private stratifyColumns() {
    let brushedRanges = [];

    const r = this._multiformRangeList;
    if (VisManager.modePerGroup.length === this._stratifiedRanges.length && this._brushedRanges.length > 0) {
      this._stratifiedRanges.forEach((sr, i) => {
        r.some((br) => {
          const stratRange = sr.dims[0].asList();
          const brushedRange = br.dims[0].asList();
          const isSubrange = checkArraySubset(stratRange, brushedRange);
          if (isSubrange) {
            if (VisManager.modePerGroup[i] === EAggregationType.AGGREGATED) {
              brushedRanges.push(sr);
              return true;
            } else {
              brushedRanges.push(br);
            }
          }
        });
      });
    } else if (r === undefined) {

      brushedRanges = [this.nonStratifiedRange];
    } else {
      brushedRanges = r;
    }
    this._multiformRangeList = brushedRanges;
    const vectorCols = this.columns.filter((col) => col.data.desc.type === AColumn.DATATYPE.vector);
    const vectorUpdatePromise = Promise.all(vectorCols.map((col) => col.updateMultiForms(this._multiformRangeList, this._stratifiedRanges, this._brushedRanges)));

    // update matrix column with last sorted range
    const matrixCols = this.columns.filter((col) => col.data.desc.type === AColumn.DATATYPE.matrix);
    const matrixUpdatePromise = Promise.all(matrixCols.map((col) => col.updateMultiForms(this._multiformRangeList, this._stratifiedRanges, this._brushedRanges)));

    // update aggregation switcher column
    this.aggSwitcherCol.updateMultiForms(this.stratifiedRanges);

    //update the stratifyIcon
    this.updateStratifyIcon(findColumnTie(this.filtersHierarchy));

    this.updateStratifyColor(this.stratifyColId);


    return Promise.all([vectorUpdatePromise, matrixUpdatePromise]);
  }

  private updateStratifyColor(stratifyColid: string) {

    // Reject if number columns or matrix are added first
    if (stratifyColid === null) {
      return;
    }
    const col = this.columns.find((d) => d.data.desc.id === stratifyColid);
    (<CategoricalColumn>col).stratifyByMe(true);

  }

  private updateStratifyIcon(columnIndexForTie: number) {
    //Categorical Columns after the numerical or string
    this.filtersHierarchy.filter((d, i) => i > columnIndexForTie)
      .filter((col) => col.data.desc.value.type === VALUE_TYPE_CATEGORICAL)
      .forEach((col) => (<CategoricalColumn>col).showStratIcon(false));

    //Categorical Columns before the numerical or string
    this.filtersHierarchy.filter((d, i) => i < columnIndexForTie)
      .filter((col) => col.data.desc.value.type === VALUE_TYPE_CATEGORICAL)
      .forEach((col) => (<CategoricalColumn>col).showStratIcon(true));
  }


  private stratifyColumnsByMe() {
    const cols = this.filtersHierarchy;
    const categoricalCol = cols.filter((c) => c.data.desc.value.type === VALUE_TYPE_CATEGORICAL);

    // If there is zero number of categorical column then the stratification is null
    if (categoricalCol.length === 0) {
      this.stratifyColId = null;
      this._multiformRangeList = [this.nonStratifiedRange];
      return;
    }

    const checkColumnTie = findColumnTie(cols); // Find the index of numerical column or String
    // If there is either  number or string or matrix in the first sort hierarchy the stratification is null
    if (checkColumnTie === 0) {
      this.stratifyColId = null;
      this._multiformRangeList = [this.nonStratifiedRange];
      return;
    }

    // If there is categorical column above the numerical or string and the stratification is null then set first categorical column as stratification
    if (categoricalCol.length > 0 && this.stratifyColId === null) {
      this.stratifyColId = categoricalCol[0].data.desc.id;
      return;
    }

    //If there are both categorical and numerical column
    //This is to check when stratified column is moved below the numerical column
    //If current stratified column is moved below the numerical column
    // then the stratificaiton is reset to the first categorical column above the numerical column

    const sid = cols.filter((c) => c.data.desc.id === this.stratifyColId);
    const id = cols.indexOf(sid[0]);
    if (checkColumnTie > 0 && categoricalCol.length > 0 && id > checkColumnTie) {
      this.stratifyColId = categoricalCol[0].data.desc.id;
      return;

    }


  }

  async relayout() {
    await resolveIn(10);
    this.relayoutColStrats();
    // this.findGroupId();
    this.correctGapBetweenMultiform();
    const header = 47;//TODO solve programatically
    const height = Math.min(...this.columns.map((c) => c.$node.property('clientHeight') - header));
    const rowHeight = await this.calcColumnHeight(height);
    const colWidths = distributeColWidths(this.columns, this.$parent.property('clientWidth'));

    const colHeight = this._stratifiedRanges.map((d, i) => {
      return this.multiformsInGroup(i)
        .map((m) => rowHeight[m])
        .reduce((a, b) => a + b, 0);
    });

    let counter = 1;
    const groupLength = this._stratifiedRanges.map((d, i) => {
      const length = d.dim(0).asList().length;
      return Array(length).fill(0).map((d, i) => {
        return counter++;
      });
    });
    if (this.columns.length > 0) {
      this.aggSwitcherCol.updateSwitcherBlocks(colHeight);
      this.rowNumberCol.updateNumberedBlocks(colHeight, groupLength);
    }

    this.columns.forEach((col, i) => {
      col.width = colWidths[i];
      col.multiformList.forEach((multiform, index) => {
        this.visManager.assignVis(multiform);
        scaleTo(multiform, colWidths[i], rowHeight[index], col.orientation);
      });
    });

    this.setWidthToURLHash();
  }

  private multiformsInGroup(groupIndex: number) {
    const multiformList = [];
    this._multiformRangeList.forEach((r, index) => {
      const m = this._stratifiedRanges
        .map((s) => s.intersect(r).dim(0).length);
      const a = m.filter((d) => d > 0);
      const sd = m.indexOf(a[0]);
      if (groupIndex === sd) {
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

  private async calcColumnHeight(height: number) {
    let minHeights = [];
    let maxHeights = [];
    let index = 0;
    let totalMin = 0;
    let totalMax = 0;
    //switch all visses that can be switched to unaggregated and test if they can be shown as unaggregated
    /****************************************************************************************/
    for (let i = 0; i < VisManager.modePerGroup.length; i++) {
      const mode = VisManager.modePerGroup[i] === EAggregationType.AUTOMATIC ? EAggregationType.UNAGGREGATED : VisManager.modePerGroup[i];
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
      const size = this._multiformRangeList.length;
      //choose minimal block height for each row of multiforms/stratification group
      for (let i = 0; i < size; i++) {
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
    for (let i = 0; i < VisManager.modePerGroup.length; i++) {
      if (VisManager.modePerGroup[i] === EAggregationType.AUTOMATIC) {
        const mode = aggregationNeeded && !this.checkIfGroupBrushed(i) ? EAggregationType.AGGREGATED : EAggregationType.UNAGGREGATED;
        this.updateAggregationLevelForRow(i, mode);
      } else {
        this.updateAggregationLevelForRow(i, VisManager.modePerGroup[i]);
      }
    }
    //copute height requiremmts per column
    for (const col of this.columns) {
      const type = col.data.desc.type;
      let range = this._multiformRangeList;
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
    let totalMinBrushed = 0;
    let totalMaxBrushed = 0;
    const brushedMultiforms = this.brushedMultiforms();
    //choose minimal and maximal block height for each row of multiforms/stratification group
    const size = VisManager.modePerGroup.length;
    for (let i = 0; i < size; i++) {
      this.multiformsInGroup(i).forEach((ind) => {
        const minSize = [];
        minHeights.forEach((m) => {
          minSize.push(m[ind]);
        });
        let min = Math.max(...minSize);
        if (VisManager.modePerGroup[i] === EAggregationType.AGGREGATED || (VisManager.modePerGroup[i] === EAggregationType.AUTOMATIC && aggregationNeeded && !this.checkIfGroupBrushed(i))) {
          min = 72;
          totalAggreg = totalAggreg + min;
        } else if (brushedMultiforms.indexOf(ind) !== -1) {
          totalMinBrushed = totalMinBrushed + min;
        }
        minHeights.forEach((m) => {
          m[ind] = min;
        });
        let maxBrush = 0;
        maxHeights.forEach((m) => {
          if (VisManager.modePerGroup[i] === EAggregationType.AGGREGATED || (VisManager.modePerGroup[i] === EAggregationType.AUTOMATIC && aggregationNeeded && !this.checkIfGroupBrushed(i))) {
            m[ind] = min;
          } else if (brushedMultiforms.indexOf(ind) !== -1) {
            maxBrush = m[ind];
          }
        });
        totalMaxBrushed = totalMaxBrushed + maxBrush;
        totalMin = totalMin + min;
      });
    }

    let totalMinUnaggregatedHeight = totalMin - totalAggreg;
    let spaceForUnaggregated = (height - totalAggreg) > totalMinUnaggregatedHeight ? (height - totalAggreg) : totalMinUnaggregatedHeight;

    const minScale = d3.scale.linear().domain([0, totalMinUnaggregatedHeight]).range([0, spaceForUnaggregated]);
    const brushed = minScale(totalMinBrushed);
    if (brushed > totalMaxBrushed) {
      totalMinUnaggregatedHeight = totalMin - totalAggreg - totalMinBrushed;
      spaceForUnaggregated = height - totalAggreg - totalMaxBrushed;
    }

    minHeights = minHeights.map((d, i) => {
      const minScale = d3.scale.linear().domain([0, totalMinUnaggregatedHeight]).range([0, spaceForUnaggregated]);
      return d.map((e, j) => {
        return minScale(e) > maxHeights[i][j] || minScale(e) === 0 ? maxHeights[i][j] : minScale(e);
      });
    });

    minHeights = minHeights[0];
    maxHeights = maxHeights[0];

    return minHeights;
  }

  private brushedMultiforms() {
    const brushedMultiforms: number[] = [];
    this.columns.forEach((col) => {
      col.multiformList.forEach((m, i) => {
        if (m.brushed && brushedMultiforms.indexOf(i) === -1) {
          brushedMultiforms.push(i);
        }
      });
    });
    return brushedMultiforms;
  }

  private checkIfGroupBrushed(rowIndex: number) {
    let isBrushed = false;
    this.columns.forEach((col) => {
      this.multiformsInGroup(rowIndex).forEach((m) => {
        isBrushed = col.multiformList[m].brushed || isBrushed ? true : false;
      });
    });
    return isBrushed;
  }


  private updateAggregationLevelForRow(rowIndex: number, aggregationType: EAggregationType) {
    this.aggSwitcherCol.setAggregationType(rowIndex, aggregationType);
    this.columns.forEach((col) => {
      this.multiformsInGroup(rowIndex).forEach((i) => {
        VisManager.multiformAggregationType.set(col.multiformList[i].id, aggregationType);
      });
    });
  }


  private correctGapBetweenMultiform() {
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

  addRowNumberColumn() {
    this.rowNumberCol = new RowNumberColumn(null, EOrientation.Vertical, this.$node);
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
export function distributeColWidths(columns: { lockedWidth: number, minWidth: number, maxWidth: number }[], containerWidth: number): number[] {
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

export function createColumn(data: IMotherTableType, orientation: EOrientation, $parent: d3.Selection<any>, matrixCol?): AnyColumn {
  switch (data.desc.type) {
    case AColumn.DATATYPE.vector:
      const v = <IStringVector | ICategoricalVector | INumericalVector>data;
      switch (v.desc.value.type) {
        case VALUE_TYPE_STRING:
          return new StringColumn(<IStringVector>v, orientation, $parent);
        case VALUE_TYPE_CATEGORICAL:
          return new CategoricalColumn(<ICategoricalVector>v, orientation, $parent);
        case VALUE_TYPE_INT:
        case VALUE_TYPE_REAL:
          return new NumberColumn(<INumericalVector>v, orientation, $parent, matrixCol);
      }
      throw new Error('invalid vector type');

    case AColumn.DATATYPE.matrix:
      const m = <INumericalMatrix>data;
      switch (m.desc.value.type) {
        case VALUE_TYPE_INT:
        case VALUE_TYPE_REAL:
          return new MatrixColumn(<INumericalMatrix>m, orientation, $parent, matrixCol);
      }
      throw new Error('invalid matrix type');

    default:
      throw new Error('invalid data type');
  }
}


enum EDataValueType {
  Categorical,
  Matrix,
  Numerical,
  String,
  Stratification
}

export function dataValueType(data: IDataType): EDataValueType {
  switch (data.desc.type) {
    case AColumn.DATATYPE.vector:
      const v = <IStringVector | ICategoricalVector | INumericalVector>data;
      switch (v.desc.value.type) {
        case VALUE_TYPE_STRING:
          return EDataValueType.String;
        case VALUE_TYPE_CATEGORICAL:
          return EDataValueType.Categorical;
        case VALUE_TYPE_INT:
        case VALUE_TYPE_REAL:
          return EDataValueType.Numerical;
      }
      throw new Error('invalid vector type');

    case AColumn.DATATYPE.matrix:
      const m = <INumericalMatrix>data;
      switch (m.desc.value.type) {
        case VALUE_TYPE_INT:
        case VALUE_TYPE_REAL:
          return EDataValueType.Matrix;
      }
      throw new Error('invalid matrix type');

    case AColumn.DATATYPE.stratification:
      return EDataValueType.Stratification;

    default:
      throw new Error('invalid data type');
  }
}

export function dataValueTypeCSSClass(valueType: EDataValueType) {
  switch (valueType) {
    case EDataValueType.Categorical:
    case EDataValueType.Stratification: // no icon available => same as categorical
      return 'fa fa-fw fa-bars';
    case EDataValueType.Matrix:
      return 'fa fa-fw fa-th';
    case EDataValueType.Numerical:
      return 'fa fa-fw fa-signal fa-rotate-270 fa-flip-vertical';
    case EDataValueType.String:
      return 'fa fa-fw fa-align-center';
    default:
      return '';
  }
}

export function aggregatorFunction(aggType: string, arr: number[]) {
  switch (aggType) {
    case AGGREGATE.min:
      return Math.round(d3.min(arr));
    case AGGREGATE.max:
      return Math.round(d3.max(arr));
    case AGGREGATE.mean:
      return Math.round(d3.mean(arr));
    case AGGREGATE.median:
      return Math.round(d3.median(arr));
    case AGGREGATE.q1:
      return Math.round(d3.quantile(arr, 0.25));
    case AGGREGATE.q3:
      return Math.round(d3.quantile(arr, 0.75));
    default:
      return '';
  }
}
