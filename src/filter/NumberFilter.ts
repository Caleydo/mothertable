/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

import {AVectorFilter} from './AVectorFilter';
import {INumericalVector} from 'phovea_core/src/vector';
import Range from 'phovea_core/src/range/Range';
import * as d3 from 'd3';
import DensityPlot from './DensityPlot';


export default class NumberFilter extends AVectorFilter<number, INumericalVector> {

  readonly $node: d3.Selection<any>;
  private filterRange: number[];

  constructor(data: INumericalVector, $parent: d3.Selection<any>) {
    super(data);
    this.$node = this.build($parent);
    this.filterRange = this.data.desc.value.range;
  }

  protected build($parent: d3.Selection<any>) {
    const $node = super.build($parent);
    this.generateLabel($node);

    new DensityPlot(this.data, $node.select('main'), this, this.generateTooltip($node));
    return $node;
  }

  set numericalFilterRange(value: number[]) {
    this.filterRange = value;
  }

  public fireFilterChanged() {
    this.triggerFilterChanged();
  }

  async filter(current: Range) {
    const dataRange = this.data.desc.value.range;

    let viewBuilder: Promise<INumericalVector>;
    //check if no filter set
    if (Math.round(this.filterRange[0]) === dataRange[0] && Math.round(this.filterRange[1]) === dataRange[1]) {
      viewBuilder = Promise.resolve(this.data);
    } else {
      viewBuilder = this.data.filter((d) => d >= this.filterRange[0] && d <= this.filterRange[1]);
    }
    return viewBuilder.then((view) => {
      this.activeFilter = view.length !== this.data.length;
      return view.ids();
    }).then((filteredRange) => current.intersect(filteredRange));
  }
}
