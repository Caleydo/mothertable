import AColumn, {EOrientation} from './AColumn';
import Range1D from 'phovea_core/src/range/Range1D';
import {INumericalMatrix} from 'phovea_core/src/matrix';
import {MultiForm, IMultiFormOptions} from 'phovea_core/src/multiform';
import {IDataType} from 'phovea_core/src/datatype';
import Range from 'phovea_core/src/range/Range';
import {list as rlist} from 'phovea_core/src/range';
import {scaleTo} from './utils';
import {IEvent} from 'phovea_core/src/event';
import {createColumn, AnyColumn, IMotherTableType} from './ColumnManager';
/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

export default class MatrixColumn extends AColumn<number, INumericalMatrix> {
  static readonly EVENT_COLUMN_REMOVED = 'removed';
  static readonly EVENT_DATA_REMOVED = 'removedData';
  static readonly EVENT_COLUMN_ADDED = 'added';

  readonly node: HTMLElement;

  minimumWidth: number = 150;
  preferredWidth: number = 300;

  private multiform: MultiForm;
  private rowRange: Range;
  private colRange: Range;
  dataView: IDataType;
  private matrixID: number;

  readonly columns: AnyColumn[] = [];
  private onColumnRemoved = (event: IEvent) => this.remove(<AnyColumn>event.currentTarget);

  constructor(data: INumericalMatrix, orientation: EOrientation, columnParent: HTMLElement) {
    super(data, orientation);
    this.dataView = data;
    this.calculateDefaultRange();
    this.node = this.build(columnParent);

  }

  protected multiFormParams(): IMultiFormOptions {
    return {
      initialVis: 'phovea-vis-heatmap'
    };
  }

  protected buildBody(body: HTMLElement) {
    this.multiform = new MultiForm(this.dataView, body, this.multiFormParams());
  }

  protected buildToolbar(toolbar: HTMLElement) {
    toolbar.insertAdjacentHTML('afterbegin', `<div class="vislist"></div>`);
    if (this.multiform) {
      const vislist = <HTMLElement>toolbar.querySelector('div.vislist');
      this.multiform.addIconVisChooser(vislist);
    }
    super.buildToolbar(toolbar);
  }


  private replaceMultiForm(data: IDataType, body: HTMLElement) {
    const m = new MultiForm(data, body, this.multiFormParams());
    const vislist = <HTMLElement>this.toolbar.querySelector('div.vislist');
    vislist.innerHTML = ''; // clear old
    this.multiform.addIconVisChooser(vislist);
    return m;
  }

  layout(width: number, height: number) {
    scaleTo(this.multiform, width, height, this.orientation);

    this.columns.forEach((col) => {
      const margin = col.getVerticalMargin();
      col.layout(width, height);
    });
  }

  async relayout() {
    //  await resolveIn(10);

    const height = Math.min(this.node.clientHeight - (<HTMLElement>this.node.querySelector('header')).clientHeight);
    // compute margin
    const verticalMargin = this.getVerticalMargin();
    const margin = this.getVerticalMargin();
    this.node.style.marginTop = (verticalMargin.top - margin.top) + 'px';
    this.node.style.marginBottom = (verticalMargin.bottom - margin.bottom) + 'px';
    this.layout(this.body.clientWidth, height);
  }

  getVerticalMargin() {
    // TODO if other columns are added
    return {top: 0, bottom: 0};
  }

  // update(idRange: Range1D) {
  //   this.multiform.destroy();
  //   this.data.idView(rlist(idRange)).then((view) => {
  //     this.multiform = this.replaceMultiForm(view, this.body);
  //   });
  // }


  async calculateDefaultRange() {
    const indices = await this.data.ids();
    if (this.rowRange === undefined) {

      this.rowRange = rlist(indices.dim(0));
    }

    if (this.colRange === undefined) {
      this.colRange = rlist(indices.dim(1));
    }
    return ([this.rowRange, this.colRange]);
  }

  updateRows(idRange: Range) {
    this.rowRange = idRange;
    this.updateMatrix(this.rowRange, this.colRange);
  }

  async updateMatrixCol(idRange: Range) {
    this.colRange = idRange;
    this.updateMatrix(this.rowRange, this.colRange);

  }


  async updateMatrix(rowRange, colRange) {
    if (colRange === undefined) {
      colRange = (await this.calculateDefaultRange())[1];
    }
    let rowView = await this.data.idView(rowRange);
    rowView = (<INumericalMatrix>rowView).t;
    let colView = await rowView.idView(colRange);
    colView = (<INumericalMatrix>colView).t;
    this.dataView = colView;
    this.multiform.destroy();
    this.multiform = this.replaceMultiForm(colView, this.body);

    this.relayout();
  }


  async update(idRange: Range) {
    // this.multiform.destroy();
    // const view = await (<any>this.data).idView(idRange);
    //this.multiform = this.replaceMultiForm(view, this.body);
  }

  push(data: IMotherTableType) {
    if (data.idtypes[0] !== this.data.coltype) {
      throw new Error('invalid idtype');
    }

    const col = createColumn(data, this.orientation, this.node);
    col.on(AColumn.EVENT_REMOVE_ME, this.onColumnRemoved);
    this.columns.push(col);
    this.fire(MatrixColumn.EVENT_COLUMN_ADDED, col);
    console.log(this.columns)
    this.relayout();
  }

  remove(col: AnyColumn) {
    this.columns.splice(this.columns.indexOf(col), 1);
    col.node.remove();
    col.off(AColumn.EVENT_REMOVE_ME, this.onColumnRemoved);
    this.fire(MatrixColumn.EVENT_COLUMN_REMOVED, col);
    this.fire(MatrixColumn.EVENT_DATA_REMOVED, col.data);
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


}
