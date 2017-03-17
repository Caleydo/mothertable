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

  private rowRanges: Range[] = [];
  private colRange: Range;
  dataView: IDataType;
  multiformList = [];

  private $colStrat:d3.Selection<any>;

  readonly columns: AnyColumn[] = [];

  constructor(data: INumericalMatrix, orientation: EOrientation, $columnParent: d3.Selection<any>) {
    super(data, orientation);
    this.dataView = data;
    this.calculateDefaultRange();
    this.$node = this.build($columnParent);

  }

  protected build($parent: d3.Selection<any>) {
    this.$node = super.build($parent);

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

  async updateMultiForms(rowRanges:Range[], colRange?:Range) {
    this.body.selectAll('.multiformList').remove();
    this.multiformList = [];

    if (!rowRanges) {
      rowRanges = this.rowRanges;
    }
    this.rowRanges = rowRanges;

    if (!colRange) {
      colRange = (await this.calculateDefaultRange());
    }

    for (const r of rowRanges) {
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
    if (this.colRange === undefined) {
      const indices = await this.data.ids();
      this.colRange = rlist(indices.dim(1));
    }
    return this.colRange;
  }

}
