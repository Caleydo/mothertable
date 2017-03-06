import {INumericalMatrix} from 'phovea_core/src/matrix';
import {ICategoricalVector, INumericalVector} from 'phovea_core/src/vector';
import {
  VALUE_TYPE_STRING, VALUE_TYPE_CATEGORICAL, VALUE_TYPE_INT, VALUE_TYPE_REAL,
  IDataType
} from 'phovea_core/src/datatype';
import Range1D from 'phovea_core/src/range/Range1D';
import Range from 'phovea_core/src/range/Range';
import {IStringVector, AVectorColumn} from './AVectorColumn';
import AColumn, {EOrientation} from './AColumn';
import CategoricalColumn from './CategoricalColumn';
import StringColumn from './StringColumn';
import NumberColumn from './NumberColumn';
import MatrixColumn from './MatrixColumn';
import {IEvent, EventHandler} from 'phovea_core/src/event';
import {resolveIn} from 'phovea_core/src';
import {listAll, IDType} from 'phovea_core/src/idtype';
import SortEventHandler, {filterCat} from '../SortEventHandler/SortEventHandler';
import AVectorFilter from '../filter/AVectorFilter';
import {on} from 'phovea_core/src/event';
import List from 'phovea_vis/src/list';
import AFilter from '../filter/AFilter';
import {insertArrayAt, reArrangeRangeList} from './utils';
import * as $ from 'jquery';
import 'jquery-ui/ui/widgets/sortable';


/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

export declare type AnyColumn = AColumn<any, IDataType>;
export declare type IMotherTableType = IStringVector|ICategoricalVector|INumericalVector|INumericalMatrix;

export default class ColumnManager extends EventHandler {
  static readonly EVENT_COLUMN_REMOVED = 'removed';
  static readonly EVENT_DATA_REMOVED = 'removedData';
  static readonly EVENT_COLUMN_ADDED = 'added';

  readonly columns: AnyColumn[] = [];
  private columnsHierarchy: AnyColumn[] = [];
  private rangeNow: Range;
  private rangeList = [];
  private draggedIndices;


  private onColumnRemoved = (event: IEvent) => this.remove(<AnyColumn>event.currentTarget);

  constructor(public readonly idType: IDType, public readonly orientation: EOrientation, public readonly node: HTMLElement) {
    super();

    const colList = document.createElement('ol'); // Holder for column list
    colList.classList.add('columnList');
    node.appendChild(colList);
    this.node.classList.add('column-manager');
    this.drag();
    on(AVectorFilter.EVENT_SORTBY_FILTER_ICON, this.sortByFilterIcon.bind(this));
    on(List.EVENT_STRING_DRAG, this.stringColumnOnDrag.bind(this));

  }

  get length() {
    return this.columns.length;
  }

  sortByFilterIcon(evt: any, sortData: {sortMethod: string, col: AFilter<string,IMotherTableType>}) {
    const col = this.columnsHierarchy.filter((d) => d.data.desc.id === sortData.col.data.desc.id);
    col[0].sortCriteria = sortData.sortMethod;
    this.updateSortHierarchy(this.columnsHierarchy);
  }

  async stringColumnOnDrag(evt: any, dragData) {
    const indices = await this.getDraggingIndices(dragData);


    this.updateRangeList(indices);
  }

  async updateRangeList(reorderRange: number[]) {
    const draggedStringIndices = reorderRange[0];
    this.draggedIndices = draggedStringIndices;
    console.log(this.draggedIndices)
    const allRangesIndices = reorderRange[1];
    const reorderRangeIndices = reArrangeRangeList(draggedStringIndices, allRangesIndices);
    const rangeElements = reorderRangeIndices.map((d) => this.makeRangeFromList(d));
    const listElements = this.rangeList.map((d) => this.makeListfromRange(d));
    const indexInRangeList = this.dragIndexInRangeList(listElements, reorderRangeIndices);
    const rangeArr = this.rangeList;
    rangeArr.splice(indexInRangeList, 1);
    insertArrayAt(rangeArr, indexInRangeList, rangeElements);
    rangeArr.map((d) => console.log(d.dim(0).asList()));
    rangeArr.map((d) => this.update(d));
    this.rangeList = rangeArr;

  }

// Create the range object from list of indexes

  makeRangeFromList(list: number[]) {
    const r = new Range();
    r.dim(0).pushList(list);
    return r;
  }

  // Give me the range in the form of list
  makeListfromRange(range: Range) {

    return (range.dim(0).asList());

  }

  /**
   *
   * @param col this is the column where dragging is performed
   * @param stringList array of strings which are being dragged
   * @returns {Promise<[Array,T[]|Array|number[]|any]>}
   * const arr = ['a','b','c',d','e','f']
   * const rangeIndices = [3,4,6,8,10,11] => Actual indices in data
   * const string = ['b','c','d'] => Array of string being dragged
   * Now it will return [[1,2,3],rangeIndices]
   *
   */

  // To get the indexes of the string dragging selection in that area
  async getDraggingIndices(dragData) {
    const col = dragData.col;
    const stringList = dragData.stringList;
    const draggedStringIndices = [];
    const columnData = col;
    const allRangeElement = await columnData.ids();
    const allRangesList = allRangeElement.dim(0).asList();

    for (const f of stringList) {
      const u: any = await columnData.filter(filterCat.bind(this, f));
      const id = await u.ids();
      if (id.size()[0] >= 1) {
        const asList = id.dim(0).asList()[0];
        draggedStringIndices.push(asList);
        //   console.log(f, await coldata.data(), id.dim(0).asList());

      }

    }


    return [draggedStringIndices, allRangesList];
  }

  /**
   * To find out the index of dragging range object in list of range
   * @param rangeList this is the complete list of all range object in the form of asList()
   * @param firsElement This is the first element of dragging array
   * @returns {any} Index of the string dragging in whole range list
   * const rangeList = [[1,2,3,4],[6,7,8],[9]]
   * const draggingIndexes = [7,8]
   * const checkExist = [-1,1,-1] => Filter only real value which is the index of dragging
   * so it will return 1 since 7 exist in second array.
   *
   */
  dragIndexInRangeList(rangeList, firsElement) {
    let findMyIndex;
    if (firsElement.length < 2) {
      findMyIndex = rangeList.map((d, i) => d.indexOf(firsElement[0][0]));
    } else {
      findMyIndex = rangeList.map((d, i) => d.indexOf(firsElement[1][0]));
    }
    const filterRealValue = findMyIndex.filter((d) => d !== -1);
    const index = findMyIndex.indexOf(filterRealValue[0]);

    return index;
  }


  destroy() {
    // delete all columns, can't remove myself, since I'm using the parent
    const items = <HTMLElement[]>Array.from(this.node.querySelectorAll('.column'));
    items.forEach((d) => d.remove());
  }

  async push(data: IMotherTableType) {
    if (data.idtypes[0] !== this.idType) {
      throw new Error('invalid idtype');
    }
    const col = createColumn(data, this.orientation, this.node);

    if (this.rangeNow === undefined) {

      this.rangeNow = await data.ids();

    }
    await col.update((this.rangeNow));

    col.on(AColumn.EVENT_REMOVE_ME, this.onColumnRemoved);
    col.on(AVectorColumn.EVENT_SORTBY_COLUMN_HEADER, this.updatePrimarySortByCol.bind(this));
    col.on(AColumn.EVENT_COLUMN_LOCK_CHANGED, this.onLockChange.bind(this));

    this.columns.push(col);
    this.columnsHierarchy = this.columns;
    this.updateSort(null);
    const managerWidth = this.node.clientWidth;
    const panel = this.currentWidth(this.columns);
    this.fire(ColumnManager.EVENT_COLUMN_ADDED, col);
    return this.relayout();

  }

  currentWidth(columns) {
    let currentPanelWidth: number = 0;
    columns.forEach((col, index) => {
      //console.log("column no."+ index + "width: " + col.node.clientWidth);
      currentPanelWidth = col.node.clientWidth + currentPanelWidth;
    });
    return currentPanelWidth;
  }


  remove(col: AnyColumn) {
    this.columns.splice(this.columns.indexOf(col), 1);
    col.node.remove();
    col.off(AColumn.EVENT_REMOVE_ME, this.onColumnRemoved);
    col.off(AVectorColumn.EVENT_SORTBY_COLUMN_HEADER, this.updatePrimarySortByCol.bind(this));
    col.off(AColumn.EVENT_COLUMN_LOCK_CHANGED, this.onLockChange.bind(this));
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
    this.node.insertBefore(col.node, this.node.childNodes[index]);

    this.columns.splice(old, 1);
    if (old < index) {
      index -= 1; //shifted because of deletion
    }
    this.columns.splice(index, 0, col);
    this.relayout();
  }

  private drag() {

    $('.columnList', this.node).sortable({handle: '.columnHeader', axis: 'x'});

  }

  updatePrimarySortByCol(evt: any, sortData) {
    this.fire(AVectorColumn.EVENT_SORTBY_COLUMN_HEADER, sortData);
  }


  async updateSort(evt: any) {
    const cols = this.columnsHierarchy.filter((d) => d.data.desc.type === 'vector');
    const s = new SortEventHandler(cols);  // The sort object is created on the fly and destroyed after it exits this method
    const r = await s.sortByMe();
    if ((await r).length < 1) {
      return this.update(r[0]);

    }
    this.rangeList = r;
    r.map((d) => this.update(d));
  }

  // async mergeRanges(r: Promise<Range[]>) {
  //   const ranges = await r;
  //
  //   ranges.map((d) => this.update(d));
  //   const mergedRange = ranges.reduce((currentVal, nextValue) => {
  //     const r = new Range();
  //     r.dim(0).pushList(currentVal.dim(0).asList().concat(nextValue.dim(0).asList()));
  //     return r;
  //   });
  //   //
  //   //
  //   //   //const mergedRange: any = ranges.reduce((a, b) => a.concat(b));
  //   console.log(mergedRange.dim(0).asList());
  //   //   //   this.update(mergedRange);
  // }


  async filterData(idRange: Range) {
    for (const col of this.columns) {
      col.rangeView = await idRange;
      col.dataView = await col.data.idView(idRange);

    }
    this.updateSort(null);

  }

  /**
   * prepare column data same as sort hierarchy
   * @param filterList
   */

  updateSortHierarchy(filterList: AnyColumn[]) {
    this.columnsHierarchy = [];
    filterList.forEach((d) => {
      const index = this.columns.map(function (e) {
        return e.data.desc.id;
      }).indexOf(d.data.desc.id);
      this.columnsHierarchy.push(this.columns[index]);
    });

    this.updateSort(null);
  }

  onLockChange(event: any, lock: any) {
    //console.log(lock);
    this.relayout();
  }

  async update(idRange: Range) {
    this.rangeNow = idRange;
    await Promise.all(this.columns.map((col) => {
      if (col instanceof MatrixColumn) {
        col.updateRows(idRange);
      }

      col.update(idRange);
    }));

    return this.relayout();
  }

  async relayout() {
    await resolveIn(10);


    const height = Math.min(...this.columns.map((c) => c.node.clientHeight - (<HTMLElement>c.node.querySelector('header')).clientHeight));
    // compute margin
    const verticalMargin = this.columns.reduce((prev, c) => {
      const act = c.getVerticalMargin();
      return {top: Math.max(prev.top, act.top), bottom: Math.max(prev.bottom, act.bottom)};
    }, {top: 0, bottom: 0});

    this.columns.forEach((col) => {
      const margin = col.getVerticalMargin();
      //console.log(margin,verticalMargin)
      col.node.style.marginTop = (verticalMargin.top - margin.top) + 'px';
      col.node.style.marginBottom = (verticalMargin.bottom - margin.bottom) + 'px';
      col.layout(col.body.clientWidth, height);
    });
  }
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
