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
import VisManager from './VisManager';

export default class MatrixColumn extends AColumn<number, INumericalMatrix> {
  minWidth: number = 150;
  maxWidth: number = 300;
  minHeight: number = 2;
  maxHeight: number = 10;

  private rowRange: Range[] = [];
  private colRange: Range;
  dataView: IDataType;
  multiformList = [];

  private $colStrat:d3.Selection<any>;

  readonly columns: AnyColumn[] = [];

  constructor(data: INumericalMatrix, orientation: EOrientation, columnParent: HTMLElement) {
    super(data, orientation);
    this.dataView = data;
    this.calculateDefaultRange();
    this.$node = this.build(columnParent);

  }

  protected build(parent: HTMLElement) {
    this.$node = super.build(parent);

    this.$colStrat = this.$node.select('aside');

    return this.$node;
  }

  protected multiFormParams(): IMultiFormOptions {
    return {
      initialVis: VisManager.getDefaultVis(this.data.desc.type, this.data.desc.value.type),
      'phovea-vis-heatmap': {
        color: NUMERICAL_COLOR_MAP
      }
    };
  }

  getVerticalMargin() {
    // TODO if other columns are added
    return {top: 0, bottom: 0};
  }


  async updateMatrixCol(idRange: Range) {
    this.colRange = idRange;
    this.updateMultiForms(this.rowRange, this.colRange);

  }


  async updateMultiForms(idRanges: Range[], colRange?) {
    this.rowRange = idRanges;
    this.body.selectAll('.multiformList').remove();
    this.multiformList = [];

    if (colRange === undefined) {
      colRange = (await this.calculateDefaultRange());
    }
    for (const r of idRanges) {
      const multiformDivs = this.body.append('div').classed('multiformList', true);
      let rowView = await this.data.idView(r);
      rowView = (<INumericalMatrix>rowView).t;
      let colView = await rowView.idView(colRange);
      colView = (<INumericalMatrix>colView).t;
      const m = new MultiForm(colView, <HTMLElement>multiformDivs.node(), this.multiFormParams());

      this.multiformList.push(m);
    }

  }

  async calculateDefaultRange() {
    const indices = await this.data.ids();
    if (this.colRange === undefined) {
      this.colRange = rlist(indices.dim(1));
    }
    return this.colRange;
  }


}
