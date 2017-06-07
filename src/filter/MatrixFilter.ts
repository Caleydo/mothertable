/**
 * Created by bikramkawan on 04/02/2017.
 */

import {INumericalMatrix} from 'phovea_core/src/matrix';
import * as d3 from 'd3';
import AFilter from './AFilter';
import {NUMERICAL_COLOR_MAP} from '../column/utils';
import DensityPlot from './DensityPlot';

export default class MatrixFilter extends AFilter<number, INumericalMatrix> {

  readonly $node: d3.Selection<any>;
  private _filterDim: {width: number, height: number};

  constructor(data: INumericalMatrix, $parent: d3.Selection<any>) {
    super(data);

    this.$node = this.build($parent);
    this.activeFilter = false;
  }

  protected build($parent: d3.Selection<any>) {
    const $li = $parent.append('li')
      .classed('filter', true)
      .classed('nodrag', true);

    const $header = $li.append('header');
    $li.append('main');

    const $toolbar = $header.append('div').classed('toolbar', true);
    this.addTrashIcon($toolbar);
    this.generateLabel($li);
    new DensityPlot(this.data, $li.select('main'), null, this.generateTooltip($li));
    return $li;
  }
}
