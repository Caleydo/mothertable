/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

import AColumn, {EOrientation} from './AColumn';
import {INumericalMatrix} from 'phovea_core/src/matrix';
import {MultiForm, IMultiFormOptions} from 'phovea_core/src/multiform';
import {IDataType} from 'phovea_core/src/datatype';
import Range from 'phovea_core/src/range/Range';
import {list as rlist} from 'phovea_core/src/range';
import {scaleTo, NUMERICAL_COLOR_MAP} from './utils';
import {IEvent} from 'phovea_core/src/event';
import {createColumn, AnyColumn, IMotherTableType} from './ColumnManager';
import * as d3 from 'd3';

export default class MatrixColumn extends AColumn<number, INumericalMatrix> {
  static readonly EVENT_COLUMN_REMOVED = 'removed';
  static readonly EVENT_DATA_REMOVED = 'removedData';
  static readonly EVENT_COLUMN_ADDED = 'added';

  minWidth: number = 150;
  maxWidth: number = 300;
  minHeight: number = 2;
  maxHeight: number = 10;

  private multiform: MultiForm;
  private rowRange: Range[] = [];
  private colRange: Range;
  dataView: IDataType;
  multiformList = [];

  readonly columns: AnyColumn[] = [];
  private onColumnRemoved = (event: IEvent) => this.remove(<AnyColumn>event.currentTarget);

  constructor(data: INumericalMatrix, orientation: EOrientation, columnParent: HTMLElement) {
    super(data, orientation);
    this.dataView = data;
    this.calculateDefaultRange();
    this.$node = this.build(columnParent);

  }

  protected multiFormParams(): IMultiFormOptions {
    return {
      initialVis: 'phovea-vis-heatmap',
      'phovea-vis-heatmap': {
        color: NUMERICAL_COLOR_MAP
      }
    };
  }

  protected buildBody($body: d3.Selection<any>) {
    //   this.multiform = new MultiForm(this.dataView, <HTMLElement>$body.node(), this.multiFormParams());
  }

  protected buildToolbar($toolbar: d3.Selection<any>) {
    // if (this.multiform) {
    //   const $visList = $toolbar.append('div').classed('vislist', true);
    //   this.multiform.addIconVisChooser(<HTMLElement>$visList.node());
    // }

    super.buildToolbar($toolbar);
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

    const height = Math.min(this.$node.property('clientHeight') - this.$node.select('header').property('clientHeight'));
    // compute margin
    const verticalMargin = this.getVerticalMargin();
    const margin = this.getVerticalMargin();

    this.$node.style('margin-top', (verticalMargin.top - margin.top) + 'px');
    this.$node.style('margin-bottom', (verticalMargin.bottom - margin.bottom) + 'px');

    this.layout(this.body.property('clientWidth'), height);
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
    if (this.colRange === undefined) {
      this.colRange = rlist(indices.dim(1));
    }
    return this.colRange;
  }


  async updateMatrixCol(idRange: Range) {
    this.colRange = idRange;
    this.updateMultiForms(this.rowRange, this.colRange);

  }


  async updateMultiForms(idRanges: Range[], colRange?) {
    this.rowRange = idRanges;
    console.log(colRange,)
    this.body.selectAll('.multiformList').remove();
    this.multiformList = [];

    if (colRange === undefined) {
      colRange = (await this.calculateDefaultRange());
    }
    for (const r of idRanges) {
      const li = this.body.append('li').classed('multiformList', true);
      let rowView = await this.data.idView(r);
      rowView = (<INumericalMatrix>rowView).t;
      let colView = await rowView.idView(colRange);
      colView = (<INumericalMatrix>colView).t;
      const m = new MultiForm(colView, <HTMLElement>li.node(), this.multiFormParams());

      this.multiformList.push(m);
    }


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

    const col = createColumn(data, this.orientation, <HTMLElement>this.$node.node());
    col.on(AColumn.EVENT_REMOVE_ME, this.onColumnRemoved);
    this.columns.push(col);
    this.fire(MatrixColumn.EVENT_COLUMN_ADDED, col);
    this.relayout();
  }

  remove(col: AnyColumn) {
    this.columns.splice(this.columns.indexOf(col), 1);
    col.$node.remove();
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

    // move the dom element, too
    this.$node.node().insertBefore(col.$node.node(), this.$node.node().childNodes[index]);

    this.columns.splice(old, 1);
    if (old < index) {
      index -= 1; //shifted because of deletion
    }
    this.columns.splice(index, 0, col);
    this.relayout();
  }


}
