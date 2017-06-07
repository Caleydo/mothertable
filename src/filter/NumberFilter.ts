/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

import {AVectorFilter} from './AVectorFilter';
import {INumericalVector} from 'phovea_core/src/vector';
import {Range1D} from 'phovea_core/src/range';
import * as d3 from 'd3';
import {NUMERICAL_COLOR_MAP} from '../column/utils';
import DensityPlot from './DensityPlot';


export default class NumberFilter extends AVectorFilter<number, INumericalVector> {

  readonly $node: d3.Selection<any>;
  private _filterDim: { width: number, height: number };
  private _numericalFilterRange: number[];
  private _toolTip: d3.Selection<SVGElement>;
  private _SVG: d3.Selection<SVGElement>;

  constructor(data: INumericalVector, $parent: d3.Selection<any>) {
    super(data);
    this.$node = this.build($parent);
    this._numericalFilterRange = this.data.desc.value.range;
  }

  protected build($parent: d3.Selection<any>) {
    const $node = super.build($parent);
    this.generateLabel($node);

    new DensityPlot(this.data, $node.select('main'), this, this.generateTooltip($node));
    return $node;
  }

  set numericalFilterRange(value: number[]) {
    this._numericalFilterRange = value;
  }

  public fireFilterChanged() {
    this.triggerFilterChanged();
  }

  async filter(current: Range1D) {
    const dataRange = this.data.desc.value.range;
    let filteredRange = await <any>this.data.ids();
    if (Math.round(this._numericalFilterRange[0]) === dataRange[0] && Math.round(this._numericalFilterRange[1]) === dataRange[1]) {

      filteredRange = await this.data.ids();
    } else {
      const vectorView = await(<any>this.data).filter(numericalFilter.bind(this, this._numericalFilterRange));
      filteredRange = await vectorView.ids();
    }
    const rangeIntersected = current.intersect(filteredRange);
    const fullRange = (await this.data.ids()).size();
    const vectorRange = filteredRange.size();
    this.activeFilter = this.checkFilterApplied(fullRange[0], vectorRange[0]);
    return rangeIntersected;
  }
}

function numericalFilter(numRange: number[], value: number) {
  if (value >= numRange[0] && value <= numRange[1]) {
    return value;
  } else {
    return;
  }
}
